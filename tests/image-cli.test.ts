import { expect, test } from "bun:test";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  buildHttpRequest,
  checkEnvironment,
  generateRemoteImage,
  loadEnvFile,
  resolveGeneration,
  runCli,
  validateGeneration,
} from "../wenqu-image/scripts/image-cli/main.ts";
import { publishImage } from "../wenqu-image/scripts/image-cli/publish.ts";

test("ships one isolated adapter module for each supported provider", async () => {
  const adapters = await Promise.all([
    import("../wenqu-image/scripts/image-cli/providers/codex.ts"),
    import("../wenqu-image/scripts/image-cli/providers/openai.ts"),
    import("../wenqu-image/scripts/image-cli/providers/dashscope.ts"),
    import("../wenqu-image/scripts/image-cli/providers/seedream.ts"),
  ]);

  expect(adapters.every((adapter) => typeof adapter.generate === "function")).toBe(true);
});

test("direct TypeScript CLI help exits successfully", async () => {
  expect(await runCli(["--help"], { HOME: "/tmp" })).toBe(0);
});

test("command options override article and global image configuration", () => {
  const resolved = resolveGeneration({
    prompt: "draw a release flow",
    cli: { provider: "openai", model: "gpt-image-1", aspectRatio: "1:1", outputPath: "/tmp/output.png" },
    article: { provider: "seedream", model: "doubao-seedream-5-0-260128", aspectRatio: "4:3" },
    global: {
      defaults: { provider: "dashscope", model: "qwen-image-2.0-pro", aspectRatio: "16:9" },
      providers: { openai: { baseUrl: "https://gateway.example/v1" } },
    },
    environment: { OPENAI_API_KEY: "test-key" },
  });

  expect(resolved.provider).toBe("openai");
  expect(resolved.model).toBe("gpt-image-1");
  expect(resolved.aspectRatio).toBe("1:1");
  expect(resolved.baseUrl).toBe("https://gateway.example/v1");
});

test("switching provider does not inherit another provider's global default model", () => {
  const resolved = resolveGeneration({
    prompt: "draw a release flow",
    cli: { provider: "openai", outputPath: "/tmp/output.png" },
    global: {
      defaults: { provider: "dashscope", model: "qwen-image-2.0-pro", aspectRatio: "16:9" },
    },
    environment: { OPENAI_API_KEY: "test-key" },
  });

  expect(resolved.provider).toBe("openai");
  expect(resolved.model).toBe("gpt-image-1");
});

test("local image env file never overwrites a process environment secret", () => {
  const root = mkdtempSync(join(tmpdir(), "wenqu-image-env-"));
  try {
    const envFile = join(root, ".env");
    writeFileSync(envFile, "OPENAI_API_KEY=file-key\nDASHSCOPE_API_KEY=dashscope-key\n");
    const environment: Record<string, string | undefined> = { OPENAI_API_KEY: "process-key" };

    const loaded = loadEnvFile(envFile, environment);

    expect(environment.OPENAI_API_KEY).toBe("process-key");
    expect(environment.DASHSCOPE_API_KEY).toBe("dashscope-key");
    expect(loaded).toEqual(["DASHSCOPE_API_KEY"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rejects reference images for a Qwen text-only model before a paid request", () => {
  expect(() => validateGeneration({
    provider: "dashscope",
    model: "qwen-image-2.0-pro",
    prompt: "draw a system diagram",
    outputPath: "/tmp/output.png",
    aspectRatio: "16:9",
    references: ["/tmp/reference.png"],
  })).toThrow("does not support reference images");
});

test("builds an OpenAI image request using the configured base URL", () => {
  const request = buildHttpRequest({
    provider: "openai",
    model: "gpt-image-1",
    prompt: "a clean architecture diagram",
    outputPath: "/tmp/output.png",
    aspectRatio: "16:9",
    references: [],
    baseUrl: "https://gateway.example/v1/",
  }, { OPENAI_API_KEY: "test-key" });

  expect(request.url).toBe("https://gateway.example/v1/images/generations");
  expect(request.headers.Authorization).toBe("Bearer test-key");
  expect(JSON.parse(request.body as string)).toMatchObject({
    model: "gpt-image-1",
    prompt: "a clean architecture diagram",
    size: "1536x1024",
  });
});

test("retries a transient remote API failure and writes the returned image bytes", async () => {
  const calls: string[] = [];
  const image = await generateRemoteImage({
    provider: "openai",
    model: "gpt-image-1",
    prompt: "a clean architecture diagram",
    outputPath: "/tmp/output.png",
    aspectRatio: "1:1",
    references: [],
    baseUrl: "https://api.openai.com/v1",
  }, { OPENAI_API_KEY: "test-key" }, async (url) => {
    calls.push(String(url));
    if (calls.length === 1) return new Response("try again", { status: 503 });
    return Response.json({ data: [{ b64_json: "AQID" }] });
  }, { retries: 2, retryDelayMs: 0 });

  expect(calls).toHaveLength(2);
  expect([...image]).toEqual([1, 2, 3]);
});

test("environment checks report configured providers without leaking their secrets", () => {
  const report = checkEnvironment({
    environment: { ARK_API_KEY: "super-secret", DASHSCOPE_API_KEY: "another-secret" },
    executables: { bun: true, codex: false, picgo: true },
  });

  expect(report.providers.dashscope.configured).toBe(true);
  expect(report.providers.seedream.configured).toBe(true);
  expect(JSON.stringify(report)).not.toContain("super-secret");
  expect(JSON.stringify(report)).not.toContain("another-secret");
});

test("CLI publication uses configured PicGo and returns only its HTTPS image URL", async () => {
  const root = mkdtempSync(join(tmpdir(), "wenqu-image-picgo-"));
  try {
    const bin = join(root, "bin");
    const home = join(root, "home");
    const image = join(root, "diagram.png");
    mkdirSync(bin, { recursive: true });
    mkdirSync(join(home, ".picgo"), { recursive: true });
    writeFileSync(image, "image-bytes");
    writeFileSync(join(home, ".picgo", "config.json"), JSON.stringify({ picBed: { uploader: "mock" } }));
    const picgo = join(bin, "picgo");
    writeFileSync(picgo, "#!/bin/sh\nprintf '%s\\n' 'https://cdn.example.test/diagram.png'\n");
    chmodSync(picgo, 0o755);

    const result = await publishImage(image, { HOME: home, PATH: bin });

    expect(result).toEqual({ url: "https://cdn.example.test/diagram.png", publishError: null });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
