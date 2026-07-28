import type { Fetcher, HttpRequest } from "../types.ts";

export type RetryOptions = { retries?: number; retryDelayMs?: number };

export function trimUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

export function parseRatio(aspectRatio: string): number {
  const match = aspectRatio.match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
  if (!match || Number(match[1]) <= 0 || Number(match[2]) <= 0) throw new Error(`Invalid aspect ratio: ${aspectRatio}`);
  return Number(match[1]) / Number(match[2]);
}

export function requireSecret(environment: Record<string, string | undefined>, key: string): string {
  const value = environment[key];
  if (!value) throw new Error(`${key} is required. Configure it in ~/.gogoingai/wenqu-skills/image/.env.`);
  return value;
}

function retryable(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

export async function readImageResponse(response: Response, fetcher: Fetcher): Promise<Uint8Array> {
  const result = await response.json() as {
    data?: Array<{ b64_json?: string; url?: string }>;
    output?: { result_image?: string; choices?: Array<{ message?: { content?: Array<{ image?: string }> } }> };
  };
  const data = result.data?.[0];
  const dashscopeImage = result.output?.result_image ?? result.output?.choices?.[0]?.message?.content?.find((item) => item.image)?.image;
  const encoded = data?.b64_json ?? (dashscopeImage && !dashscopeImage.startsWith("http") ? dashscopeImage : undefined);
  if (encoded) return Uint8Array.from(Buffer.from(encoded, "base64"));
  const url = data?.url ?? dashscopeImage;
  if (!url) throw new Error("Image provider response did not contain image data.");
  const imageResponse = await fetcher(url);
  if (!imageResponse.ok) throw new Error(`Failed to download generated image (${imageResponse.status}).`);
  return new Uint8Array(await imageResponse.arrayBuffer());
}

export async function send(
  provider: string,
  request: HttpRequest,
  fetcher: Fetcher = fetch,
  options: RetryOptions = {},
): Promise<Uint8Array> {
  const retries = options.retries ?? 3;
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await fetcher(request.url, { method: request.method, headers: request.headers, body: request.body });
      if (response.ok) return readImageResponse(response, fetcher);
      const error = new Error(`${provider} API error (${response.status}): ${await response.text()}`);
      if (!retryable(response.status) || attempt === retries) throw error;
      lastError = error;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt === retries) throw lastError;
    }
    const delay = options.retryDelayMs ?? 500 * attempt;
    if (delay > 0) await Bun.sleep(delay);
  }
  throw lastError ?? new Error(`${provider} image generation failed.`);
}
