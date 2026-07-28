import { extname } from "node:path";

import type { Fetcher, HttpRequest, ResolvedGeneration } from "../types.ts";
import { parseRatio, requireSecret, send, trimUrl } from "./shared.ts";

function supportsReferences(model: string): boolean {
  return /^wan2\.7-image(?:-pro)?(?:-|$)/.test(model);
}

function size(aspectRatio: string): string {
  const ratio = parseRatio(aspectRatio);
  const targetPixels = 1280 * 1280;
  return `${Math.max(16, Math.round(Math.sqrt(targetPixels * ratio) / 16) * 16)}*${Math.max(16, Math.round(Math.sqrt(targetPixels / ratio) / 16) * 16)}`;
}

function mimeType(path: string): string {
  const extension = extname(path).toLowerCase();
  return extension === ".jpg" || extension === ".jpeg" ? "image/jpeg" : extension === ".webp" ? "image/webp" : "image/png";
}

async function imageContent(reference: string): Promise<string> {
  if (/^https?:\/\//i.test(reference)) return reference;
  const bytes = new Uint8Array(await Bun.file(reference).arrayBuffer());
  return `data:${mimeType(reference)};base64,${Buffer.from(bytes).toString("base64")}`;
}

export function validate(request: ResolvedGeneration): void {
  parseRatio(request.aspectRatio);
  if (request.references.length > 0 && !supportsReferences(request.model)) {
    throw new Error(`DashScope model ${request.model} does not support reference images; use a wan2.7 image model.`);
  }
}

function makeRequest(request: ResolvedGeneration, environment: Record<string, string | undefined>, content: Array<Record<string, string>>): HttpRequest {
  validate(request);
  const apiKey = requireSecret(environment, "DASHSCOPE_API_KEY");
  return {
    url: `${trimUrl(request.baseUrl!)}/api/v1/services/aigc/multimodal-generation/generation`, method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: request.model, input: { messages: [{ role: "user", content }] }, parameters: { size: size(request.aspectRatio), watermark: false, n: 1 } }),
  };
}

export function buildRequest(request: ResolvedGeneration, environment: Record<string, string | undefined>): HttpRequest {
  if (request.references.some((reference) => !/^https?:\/\//i.test(reference))) {
    throw new Error("DashScope local reference files require the asynchronous renderer.");
  }
  return makeRequest(request, environment, [...request.references.map((image) => ({ image })), { text: request.prompt }]);
}

async function buildRequestWithFiles(request: ResolvedGeneration, environment: Record<string, string | undefined>): Promise<HttpRequest> {
  const content: Array<Record<string, string>> = [];
  for (const reference of request.references) content.push({ image: await imageContent(reference) });
  content.push({ text: request.prompt });
  return makeRequest(request, environment, content);
}

export async function generate(request: ResolvedGeneration, environment: Record<string, string | undefined>, fetcher?: Fetcher, options?: { retries?: number; retryDelayMs?: number }): Promise<Uint8Array> {
  return send("dashscope", await buildRequestWithFiles(request, environment), fetcher, options);
}
