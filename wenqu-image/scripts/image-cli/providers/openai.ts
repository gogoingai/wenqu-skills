import { basename } from "node:path";

import type { Fetcher, HttpRequest, ResolvedGeneration } from "../types.ts";
import { parseRatio, requireSecret, send, trimUrl } from "./shared.ts";

function imageSize(aspectRatio: string): string {
  const ratio = parseRatio(aspectRatio);
  if (Math.abs(ratio - 1) < 0.1) return "1024x1024";
  return ratio > 1 ? "1536x1024" : "1024x1536";
}

export function validate(request: ResolvedGeneration): void {
  parseRatio(request.aspectRatio);
  if (request.references.length > 0 && !request.model.includes("gpt-image")) {
    throw new Error("OpenAI reference images require a GPT Image model.");
  }
}

export function buildRequest(request: ResolvedGeneration, environment: Record<string, string | undefined>): HttpRequest {
  validate(request);
  const apiKey = requireSecret(environment, "OPENAI_API_KEY");
  const baseUrl = trimUrl(request.baseUrl!);
  if (request.references.length > 0) {
    const body = new FormData();
    body.append("model", request.model);
    body.append("prompt", request.prompt);
    body.append("size", imageSize(request.aspectRatio));
    for (const reference of request.references) body.append("image[]", Bun.file(reference), basename(reference));
    return { url: `${baseUrl}/images/edits`, method: "POST", headers: { Authorization: `Bearer ${apiKey}` }, body };
  }
  return {
    url: `${baseUrl}/images/generations`, method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: request.model, prompt: request.prompt, size: imageSize(request.aspectRatio) }),
  };
}

export async function generate(request: ResolvedGeneration, environment: Record<string, string | undefined>, fetcher?: Fetcher, options?: { retries?: number; retryDelayMs?: number }): Promise<Uint8Array> {
  return send("openai", buildRequest(request, environment), fetcher, options);
}
