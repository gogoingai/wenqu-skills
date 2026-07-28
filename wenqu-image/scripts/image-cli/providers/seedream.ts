import { extname } from "node:path";

import type { Fetcher, HttpRequest, ResolvedGeneration } from "../types.ts";
import { parseRatio, requireSecret, send, trimUrl } from "./shared.ts";

function supportsReferences(model: string): boolean {
  return /^doubao-seedream-(?:5-0|4-5|4-0)-/.test(model);
}

function mimeType(path: string): string {
  const extension = extname(path).toLowerCase();
  return extension === ".jpg" || extension === ".jpeg" ? "image/jpeg" : extension === ".webp" ? "image/webp" : "image/png";
}

async function imageInput(reference: string): Promise<string> {
  if (/^https?:\/\//i.test(reference)) return reference;
  const bytes = new Uint8Array(await Bun.file(reference).arrayBuffer());
  return `data:${mimeType(reference)};base64,${Buffer.from(bytes).toString("base64")}`;
}

export function validate(request: ResolvedGeneration): void {
  parseRatio(request.aspectRatio);
  if (request.references.length > 0 && !supportsReferences(request.model)) {
    throw new Error(`Seedream model ${request.model} does not support reference images.`);
  }
}

function makeRequest(request: ResolvedGeneration, environment: Record<string, string | undefined>, references: string[]): HttpRequest {
  validate(request);
  const apiKey = requireSecret(environment, "ARK_API_KEY");
  return {
    url: `${trimUrl(request.baseUrl!)}/images/generations`, method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: request.model, prompt: request.prompt, size: "2K", response_format: "url", watermark: false, ...(references.length > 0 ? { image: references } : {}) }),
  };
}

export function buildRequest(request: ResolvedGeneration, environment: Record<string, string | undefined>): HttpRequest {
  if (request.references.some((reference) => !/^https?:\/\//i.test(reference))) {
    throw new Error("Seedream local reference files require the asynchronous renderer.");
  }
  return makeRequest(request, environment, request.references);
}

async function buildRequestWithFiles(request: ResolvedGeneration, environment: Record<string, string | undefined>): Promise<HttpRequest> {
  return makeRequest(request, environment, await Promise.all(request.references.map(imageInput)));
}

export async function generate(request: ResolvedGeneration, environment: Record<string, string | undefined>, fetcher?: Fetcher, options?: { retries?: number; retryDelayMs?: number }): Promise<Uint8Array> {
  return send("seedream", await buildRequestWithFiles(request, environment), fetcher, options);
}
