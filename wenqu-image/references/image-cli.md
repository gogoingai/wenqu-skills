# 多模型图片 CLI

本文档只在配置或直接运行图片生成时读取。文章级提示词、质检和写入规则仍以 `gen-workflow.md` 为准。

## 配置位置与优先级

命令参数 > 文章配置 > 全局配置 > Agent 原生问答。密钥不参与文章级覆盖。

```text
~/.gogoingai/wenqu-skills/image/
├── .env          # 密钥；chmod 600
└── config.json   # 全局默认值和 API Base URL

{项目根目录}/wenqu-skills/{文章文件名}/config/image.json
                 # 本篇 provider、模型、画幅
```

全局 `config.json` 示例：

```json
{
  "defaults": {
    "provider": "dashscope",
    "model": "qwen-image-2.0-pro",
    "aspectRatio": "16:9"
  },
  "providers": {
    "openai": { "baseUrl": "https://api.openai.com/v1" },
    "dashscope": { "baseUrl": "https://dashscope.aliyuncs.com" },
    "seedream": { "baseUrl": "https://ark.cn-beijing.volces.com/api/v3" }
  }
}
```

文章 `config/image.json` 示例：

```json
{
  "provider": "seedream",
  "model": "doubao-seedream-5-0-260128",
  "aspectRatio": "16:9"
}
```

文章配置禁止 `baseUrl`、`providers` 和任何凭据字段。Codex 不接受 Wenqu 的地址或 profile 定制，始终使用当前本机 Codex 登录配置。

`.env` 示例（只在本机保存，不提交、不贴进对话）：

```bash
OPENAI_API_KEY=...
DASHSCOPE_API_KEY=...
ARK_API_KEY=...
```

若 `.env` 对组或其他用户可读，CLI 会拒绝加载并提示执行 `chmod 600 ~/.gogoingai/wenqu-skills/image/.env`。进程环境变量优先于 `.env`，不会被文件内值覆盖。

## 命令

```bash
# 检查可用后端，JSON 不包含密钥
bun ~/.agents/skills/wenqu-image/scripts/image-cli/main.ts --check --json

# 直接生成；未指定时读取全局配置
bun ~/.agents/skills/wenqu-image/scripts/image-cli/main.ts \
  --prompt "一张中文技术架构示意图" --out /tmp/diagram.png

# 显式选择后端，命令参数优先级最高
bun ~/.agents/skills/wenqu-image/scripts/image-cli/main.ts \
  --provider dashscope --model qwen-image-2.0-pro --ar 16:9 \
  --prompt "一张中文技术架构示意图" --out /tmp/diagram.png --upload

# 文章流程传入本篇配置；结果输出便于 Agent 解析
bun ~/.agents/skills/wenqu-image/scripts/image-cli/main.ts \
  --article-config "{项目根目录}/wenqu-skills/{文件名}/config/image.json" \
  --prompt-file /tmp/prompt.md --out /tmp/article-img.png --json
```

`--upload` 由图片 CLI 直接调用 PicGo。PicGo 已安装且已配置时返回 HTTPS URL；失败时仅返回本地输出和 `publishError`，不得把本地路径写入文章。运行环境没有 Bun 时，可把命令开头的 `bun` 替换成 `npx -y bun`。

## 后端能力

| provider | 默认模型 | 凭据 | 参考图 |
| --- | --- | --- | --- |
| `codex` | `codex-image-gen` | 已登录的 `codex` CLI | 支持，沿用现有 Codex 路径 |
| `openai` | `gpt-image-1` | `OPENAI_API_KEY` | 仅 GPT Image 模型 |
| `dashscope` | `qwen-image-2.0-pro` | `DASHSCOPE_API_KEY` | Qwen 默认模型不支持；仅 `wan2.7-image*` 可用 |
| `seedream` | `doubao-seedream-5-0-260128` | `ARK_API_KEY` | Seedream 5.0 / 4.5 / 4.0 支持 |

> Codex 后端没有控制尺寸的参数；`--ar` 通过在指令里提示比例让 agent 传给生图工具，属 best-effort--比例通常正确，精确像素可能略有偏差。其他后端把尺寸写进 HTTP 请求，硬保证。

模型或账号权限发生变化时，使用 `--model` 显式指定可用模型；CLI 不会静默把失败请求切换到另一个付费后端。
