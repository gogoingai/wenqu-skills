export const providers = ["codex", "openai", "dashscope", "seedream"] as const;

export type Provider = (typeof providers)[number];

export type ProviderSettings = {
  model?: string;
  baseUrl?: string;
};

export type GlobalImageConfig = {
  defaults?: {
    provider?: Provider;
    model?: string;
    aspectRatio?: string;
  };
  providers?: Partial<Record<Exclude<Provider, "codex">, ProviderSettings>>;
};

export type ArticleImageConfig = {
  provider?: Provider;
  model?: string;
  aspectRatio?: string;
};

export type GenerationOptions = {
  provider?: Provider;
  model?: string;
  aspectRatio?: string;
  outputPath?: string;
  references?: string[];
  baseUrl?: string;
};

export type ResolvedGeneration = {
  provider: Provider;
  model: string;
  prompt: string;
  outputPath: string;
  aspectRatio: string;
  references: string[];
  baseUrl?: string;
};

export type HttpRequest = {
  url: string;
  method: "POST";
  headers: Record<string, string>;
  body: string | FormData;
};

export type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export type EnvironmentReport = {
  runtime: { bun: boolean; codex: boolean; picgo: boolean };
  providers: Record<Provider, { configured: boolean; credential: string | null }>;
};
