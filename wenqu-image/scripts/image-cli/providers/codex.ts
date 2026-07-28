import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

import type { ResolvedGeneration } from "../types.ts";

export function validate(request: ResolvedGeneration): void {
  if (!request.model) throw new Error("Codex image generation requires a model identifier.");
}

export async function generate(request: ResolvedGeneration): Promise<void> {
  validate(request);
  const script = join(dirname(import.meta.path), "..", "..", "gpt-image-2-gen.sh");
  if (!existsSync(script)) throw new Error(`Bundled Codex renderer is missing: ${script}`);
  if (!Bun.which("codex")) throw new Error("codex CLI is required for the codex provider. Run codex login first.");
  const args = ["bash", script, "--prompt", request.prompt, "--out", request.outputPath];
  for (const reference of request.references) args.push("--ref", reference);
  const process = Bun.spawn(args, { stdout: "inherit", stderr: "inherit" });
  const exitCode = await process.exited;
  if (exitCode !== 0) throw new Error(`Codex image renderer exited with status ${exitCode}.`);
  if (!existsSync(request.outputPath)) throw new Error("Codex image renderer did not create the requested output file.");
}
