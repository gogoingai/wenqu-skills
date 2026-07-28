import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";

import type {
  ArticleImageConfig,
  GenerationOptions,
  GlobalImageConfig,
  Provider,
  ResolvedGeneration,
} from "./types.ts";
import { providers } from "./types.ts";

const defaultModels: Record<Provider, string> = {
  codex: "codex-image-gen",
  openai: "gpt-image-1",
  dashscope: "qwen-image-2.0-pro",
  seedream: "doubao-seedream-5-0-260128",
};

const defaultBaseUrls: Record<Exclude<Provider, "codex">, string> = {
  openai: "https://api.openai.com/v1",
  dashscope: "https://dashscope.aliyuncs.com",
  seedream: "https://ark.cn-beijing.volces.com/api/v3",
};

function isProvider(value: unknown): value is Provider {
  return typeof value === "string" && (providers as readonly string[]).includes(value);
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function parseJsonObject(filePath: string): Record<string, unknown> {
  const parsed = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Image configuration must be a JSON object: ${filePath}`);
  }
  return parsed as Record<string, unknown>;
}

export function readGlobalConfig(filePath: string): GlobalImageConfig | undefined {
  if (!existsSync(filePath)) return undefined;
  const raw = parseJsonObject(filePath);
  const defaults = raw.defaults && typeof raw.defaults === "object" && !Array.isArray(raw.defaults)
    ? raw.defaults as Record<string, unknown>
    : {};
  const rawProviders = raw.providers && typeof raw.providers === "object" && !Array.isArray(raw.providers)
    ? raw.providers as Record<string, unknown>
    : {};
  const providerSettings: GlobalImageConfig["providers"] = {};
  for (const provider of ["openai", "dashscope", "seedream"] as const) {
    const value = rawProviders[provider];
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const settings = value as Record<string, unknown>;
    providerSettings[provider] = {
      model: asOptionalString(settings.model),
      baseUrl: asOptionalString(settings.baseUrl),
    };
  }
  return {
    defaults: {
      provider: isProvider(defaults.provider) ? defaults.provider : undefined,
      model: asOptionalString(defaults.model),
      aspectRatio: asOptionalString(defaults.aspectRatio),
    },
    providers: providerSettings,
  };
}

export function readArticleConfig(filePath: string): ArticleImageConfig | undefined {
  if (!existsSync(filePath)) return undefined;
  const raw = parseJsonObject(filePath);
  if (raw.baseUrl !== undefined || raw.providers !== undefined || raw.credentials !== undefined) {
    throw new Error(`Article image configuration may not contain endpoints or credentials: ${filePath}`);
  }
  if (raw.provider !== undefined && !isProvider(raw.provider)) {
    throw new Error(`Unknown image provider in article configuration: ${String(raw.provider)}`);
  }
  return {
    provider: raw.provider as Provider | undefined,
    model: asOptionalString(raw.model),
    aspectRatio: asOptionalString(raw.aspectRatio),
  };
}

export function loadEnvFile(filePath: string, environment: Record<string, string | undefined>): string[] {
  if (!existsSync(filePath)) return [];
  const loaded: string[] = [];
  for (const sourceLine of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = sourceLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (!match) throw new Error(`Invalid environment entry in ${filePath}: ${sourceLine}`);
    const [, key, rawValue] = match;
    if (environment[key] !== undefined) continue;
    const value = rawValue.replace(/^(["'])(.*)\1$/, "$2");
    environment[key] = value;
    loaded.push(key);
  }
  return loaded;
}

export function assertPrivateEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return;
  const mode = statSync(filePath).mode & 0o777;
  if ((mode & 0o077) !== 0) {
    throw new Error(`Image secret file must be readable only by its owner (chmod 600): ${filePath}`);
  }
}

export function defaultGlobalDirectory(homeDirectory: string): string {
  return join(homeDirectory, ".gogoingai", "wenqu-skills", "image");
}

export function inferArticleConfigPath(cwd: string, articleStorageDir?: string): string | undefined {
  return articleStorageDir ? join(articleStorageDir, "config", "image.json") : undefined;
}

function inferProvider(environment: Record<string, string | undefined>): Provider | undefined {
  if (environment.DASHSCOPE_API_KEY) return "dashscope";
  if (environment.ARK_API_KEY) return "seedream";
  if (environment.OPENAI_API_KEY) return "openai";
  return undefined;
}

export function resolveGeneration(input: {
  prompt: string;
  cli?: GenerationOptions;
  article?: ArticleImageConfig;
  global?: GlobalImageConfig;
  environment: Record<string, string | undefined>;
}): ResolvedGeneration {
  const cli = input.cli ?? {};
  const global = input.global ?? {};
  const article = input.article ?? {};
  const provider = cli.provider ?? article.provider ?? global.defaults?.provider ?? inferProvider(input.environment);
  if (!provider) {
    throw new Error("No image provider is configured. Set a global default or pass --provider.");
  }
  const providerSettings = provider === "codex" ? undefined : global.providers?.[provider];
  const configuredDefaultModel = global.defaults?.provider === provider ? global.defaults.model : undefined;
  const model = cli.model ?? article.model ?? providerSettings?.model ?? configuredDefaultModel ?? defaultModels[provider];
  const aspectRatio = cli.aspectRatio ?? article.aspectRatio ?? global.defaults?.aspectRatio ?? "1:1";
  const outputPath = cli.outputPath;
  if (!outputPath) throw new Error("Missing --out image output path.");
  const baseUrl = provider === "codex"
    ? undefined
    : cli.baseUrl ?? providerSettings?.baseUrl ?? defaultBaseUrls[provider];
  return {
    provider,
    model,
    prompt: input.prompt,
    outputPath,
    aspectRatio,
    references: cli.references ?? [],
    baseUrl,
  };
}

export function globalConfigPaths(homeDirectory: string): { directory: string; config: string; env: string } {
  const directory = defaultGlobalDirectory(homeDirectory);
  return { directory, config: join(directory, "config.json"), env: join(directory, ".env") };
}

export function ensureParentDirectory(filePath: string): string {
  return dirname(filePath);
}
