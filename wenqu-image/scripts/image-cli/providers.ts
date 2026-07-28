import type { Fetcher, HttpRequest, ResolvedGeneration } from "./types.ts";
import * as dashscope from "./providers/dashscope.ts";
import * as openai from "./providers/openai.ts";
import * as seedream from "./providers/seedream.ts";
import { parseRatio } from "./providers/shared.ts";

export function validateGeneration(request: ResolvedGeneration): void {
  if (request.provider === "codex") {
    parseRatio(request.aspectRatio);
    return;
  }
  if (request.provider === "openai") return openai.validate(request);
  if (request.provider === "dashscope") return dashscope.validate(request);
  return seedream.validate(request);
}

export function buildHttpRequest(
  request: ResolvedGeneration,
  environment: Record<string, string | undefined>,
): HttpRequest {
  if (request.provider === "codex") throw new Error("Codex generation is not an HTTP provider.");
  if (request.provider === "openai") return openai.buildRequest(request, environment);
  if (request.provider === "dashscope") return dashscope.buildRequest(request, environment);
  return seedream.buildRequest(request, environment);
}

export async function generateRemoteImage(
  request: ResolvedGeneration,
  environment: Record<string, string | undefined>,
  fetcher: Fetcher = fetch,
  options: { retries?: number; retryDelayMs?: number } = {},
): Promise<Uint8Array> {
  if (request.provider === "codex") throw new Error("Use the Codex renderer for the codex provider.");
  if (request.provider === "openai") return openai.generate(request, environment, fetcher, options);
  if (request.provider === "dashscope") return dashscope.generate(request, environment, fetcher, options);
  return seedream.generate(request, environment, fetcher, options);
}

export function outputExtension(request: ResolvedGeneration): string {
  return request.provider === "seedream" && !request.model.startsWith("doubao-seedream-5-0") ? ".jpg" : ".png";
}
