import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

import {
  assertPrivateEnvFile,
  globalConfigPaths,
  loadEnvFile,
  readArticleConfig,
  readGlobalConfig,
  resolveGeneration,
} from "./config.ts";
import { buildHttpRequest, generateRemoteImage, outputExtension, validateGeneration } from "./providers.ts";
import { generate as generateCodex } from "./providers/codex.ts";
import { publishImage } from "./publish.ts";
import { providers } from "./types.ts";
import type { EnvironmentReport, GenerationOptions, Provider, ResolvedGeneration } from "./types.ts";

export { loadEnvFile, resolveGeneration } from "./config.ts";
export { buildHttpRequest, generateRemoteImage, validateGeneration } from "./providers.ts";
export { findPicGo, publishImage } from "./publish.ts";

export function checkEnvironment(input: {
  environment: Record<string, string | undefined>;
  executables: { bun: boolean; codex: boolean; picgo: boolean };
}): EnvironmentReport {
  const configured = (credential: string): { configured: boolean; credential: string | null } => ({
    configured: Boolean(input.environment[credential]),
    credential: input.environment[credential] ? credential : null,
  });
  return {
    runtime: input.executables,
    providers: {
      codex: { configured: input.executables.codex, credential: null },
      openai: configured("OPENAI_API_KEY"),
      dashscope: configured("DASHSCOPE_API_KEY"),
      seedream: configured("ARK_API_KEY"),
    },
  };
}

type ParsedArgs = {
  check: boolean;
  json: boolean;
  upload: boolean;
  prompt?: string;
  promptFile?: string;
  articleConfig?: string;
  globalConfig?: string;
  envFile?: string;
  options: GenerationOptions;
};

function usage(): string {
  return [
    "Usage:",
    "  bun image-cli/main.ts --check [--json]",
    "  bun image-cli/main.ts --prompt <text> --out <file> [--provider <provider>] [--model <model>] [--ref <image>] [--ar <ratio>] [--upload]",
    "",
    "Providers: codex, openai, dashscope, seedream",
  ].join("\n");
}

function parseProvider(value: string): Provider {
  if (!(providers as readonly string[]).includes(value)) {
    throw new Error(`Unknown provider: ${value}. Supported providers: ${providers.join(", ")}.`);
  }
  return value as Provider;
}

function requireValue(argv: string[], index: number, option: string): string {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${option}.`);
  return value;
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = { check: false, json: false, upload: false, options: { references: [] } };
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index]!;
    if (option === "--check") parsed.check = true;
    else if (option === "--json") parsed.json = true;
    else if (option === "--upload") parsed.upload = true;
    else if (option === "--prompt" || option === "-p") {
      parsed.prompt = requireValue(argv, index, option); index += 1;
    } else if (option === "--prompt-file") {
      parsed.promptFile = requireValue(argv, index, option); index += 1;
    } else if (option === "--out" || option === "--image") {
      parsed.options.outputPath = requireValue(argv, index, option); index += 1;
    } else if (option === "--provider") {
      parsed.options.provider = parseProvider(requireValue(argv, index, option)); index += 1;
    } else if (option === "--model") {
      parsed.options.model = requireValue(argv, index, option); index += 1;
    } else if (option === "--ref" || option === "--reference") {
      parsed.options.references!.push(requireValue(argv, index, option)); index += 1;
    } else if (option === "--ar") {
      parsed.options.aspectRatio = requireValue(argv, index, option); index += 1;
    } else if (option === "--base-url") {
      parsed.options.baseUrl = requireValue(argv, index, option); index += 1;
    } else if (option === "--article-config") {
      parsed.articleConfig = requireValue(argv, index, option); index += 1;
    } else if (option === "--global-config") {
      parsed.globalConfig = requireValue(argv, index, option); index += 1;
    } else if (option === "--env-file") {
      parsed.envFile = requireValue(argv, index, option); index += 1;
    } else if (option === "--help" || option === "-h") {
      throw new Error(usage());
    } else {
      throw new Error(`Unknown option: ${option}\n\n${usage()}`);
    }
  }
  return parsed;
}

function shellAvailable(name: string): boolean {
  return Bun.which(name) !== null;
}

async function executeGeneration(request: ResolvedGeneration, environment: Record<string, string | undefined>): Promise<void> {
  validateGeneration(request);
  await mkdir(dirname(request.outputPath), { recursive: true });
  if (request.provider === "codex") {
    await generateCodex(request);
    return;
  }
  const bytes = await generateRemoteImage(request, environment);
  const outputPath = request.outputPath.includes(".") ? request.outputPath : `${request.outputPath}${outputExtension(request)}`;
  await Bun.write(outputPath, bytes);
  if (outputPath !== request.outputPath) request.outputPath = outputPath;
}

function output(value: unknown, asJson: boolean): void {
  if (asJson) {
    console.log(JSON.stringify(value));
    return;
  }
  if (typeof value === "string") console.log(value);
  else console.log(JSON.stringify(value, null, 2));
}

export async function runCli(argv: string[], environment: Record<string, string | undefined> = process.env): Promise<number> {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(usage());
    return 0;
  }
  try {
    const parsed = parseArgs(argv);
    const home = environment.HOME ?? process.env.HOME;
    if (!home) throw new Error("HOME is required to locate the global image configuration.");
    const paths = globalConfigPaths(home);
    const envFile = parsed.envFile ?? paths.env;
    assertPrivateEnvFile(envFile);
    loadEnvFile(envFile, environment);
    if (parsed.check) {
      const report = checkEnvironment({
        environment,
        executables: { bun: shellAvailable("bun"), codex: shellAvailable("codex"), picgo: shellAvailable("picgo") },
      });
      output(report, parsed.json);
      return 0;
    }
    const prompt = parsed.prompt ?? (parsed.promptFile ? await Bun.file(parsed.promptFile).text() : undefined);
    if (!prompt?.trim()) throw new Error(`Missing --prompt or --prompt-file.\n\n${usage()}`);
    const global = readGlobalConfig(parsed.globalConfig ?? paths.config);
    const article = parsed.articleConfig ? readArticleConfig(parsed.articleConfig) : undefined;
    const resolved = resolveGeneration({ prompt, cli: parsed.options, article, global, environment });
    await executeGeneration(resolved, environment);
    const publication = parsed.upload ? await publishImage(resolved.outputPath, environment) : { url: null, publishError: null };
    const result = { provider: resolved.provider, model: resolved.model, outputPath: resolved.outputPath, ...publication };
    if (parsed.json) output(result, true);
    else if (publication.url) output(`Using ${result.provider} / ${result.model}\nLOCAL_OUTPUT: ${result.outputPath}\nURL: ${publication.url}`, false);
    else if (publication.publishError) output(`Using ${result.provider} / ${result.model}\nLOCAL_OUTPUT: ${result.outputPath}\nPUBLISH_REQUIRED: ${publication.publishError}`, false);
    else output({ provider: result.provider, model: result.model, outputPath: result.outputPath }, false);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    return 1;
  }
}

if (import.meta.main) {
  process.exitCode = await runCli(process.argv.slice(2));
}
