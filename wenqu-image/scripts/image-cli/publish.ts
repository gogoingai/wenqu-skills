import { existsSync, readFileSync } from "node:fs";
import { delimiter, join } from "node:path";

export type PublicationResult = {
  url: string | null;
  publishError: string | null;
};

function configuredPicGo(homeDirectory: string): boolean {
  const configPath = join(homeDirectory, ".picgo", "config.json");
  if (!existsSync(configPath)) return false;
  try {
    const config = JSON.parse(readFileSync(configPath, "utf8")) as { picBed?: { uploader?: unknown } };
    return typeof config.picBed?.uploader === "string" && Boolean(config.picBed.uploader.trim());
  } catch {
    return false;
  }
}

function executableFromPath(pathValue: string | undefined): string | undefined {
  if (!pathValue) return undefined;
  for (const directory of pathValue.split(delimiter)) {
    const candidate = join(directory, "picgo");
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

export function findPicGo(environment: Record<string, string | undefined>): string | undefined {
  const home = environment.HOME ?? process.env.HOME;
  if (!home) return undefined;
  const candidates = [
    join(home, "bin", "picgo-typora"),
    executableFromPath(environment.PATH ?? process.env.PATH),
    join(home, "Library", "pnpm", "picgo"),
  ];
  return candidates.find((candidate): candidate is string => Boolean(candidate && existsSync(candidate)));
}

function firstHttpsUrl(value: string): string | undefined {
  return value.split(/\r?\n/).map((line) => line.trim()).find((line) => /^https:\/\//.test(line));
}

export async function publishImage(
  outputPath: string,
  environment: Record<string, string | undefined> = process.env,
): Promise<PublicationResult> {
  const home = environment.HOME ?? process.env.HOME;
  const picgo = findPicGo(environment);
  if (!picgo) return { url: null, publishError: "picgo is unavailable; install and configure PicGo before publishing" };
  if (!home || !configuredPicGo(home)) {
    return { url: null, publishError: "picgo is not configured; run picgo set uploader before publishing" };
  }

  const process = Bun.spawn([picgo, "upload", outputPath], { stdout: "pipe", stderr: "pipe" });
  const [exitCode, stdout] = await Promise.all([process.exited, new Response(process.stdout).text()]);
  const url = firstHttpsUrl(stdout);
  if (exitCode !== 0 || !url) return { url: null, publishError: "picgo upload failed" };
  return { url, publishError: null };
}
