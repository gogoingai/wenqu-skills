# skills

一套写作辅助技能集合，主要面向 Claude Code，也可通过 `npx skills` 装到其他 agent。

| 技能 | 作用 |
| --- | --- |
| [`wenqu-write`](wenqu-write/) | 中文技术文章写作主流程：规划（问卷+骨架）、逐节写作，调用其他三个技能完成翻译、配图和审查 |
| [`wenqu-translate`](wenqu-translate/) | 英文材料翻译成中文：分析→翻译→自查方法论，翻译完成后当场触发 wenqu-review 的 R2 |
| [`wenqu-image`](wenqu-image/) | 为文章生成 AI 配图：画图提示写作规范 + 生图/质检/上传流程（生图脚本已 vendored，只需 codex CLI） |
| [`wenqu-review`](wenqu-review/) | 审查中文技术文章：真实性核查、连贯性、英文术语、翻译腔、AI 写作痕迹、结构自检 |
| [`wenqu-publish`](wenqu-publish/) | 生成发布版：清洗画图提示/项目标识，生成标题候选、简介、封面图，产出到独立发布目录，为后续自动发布留扩展点 |

## 安装

用 [`npx skills`](https://github.com/vercel-labs/skills)（通用技能安装器，不限 Claude Code）一条命令装完：

```bash
npx skills add gogoingai/wenqu-skills --all -g
```

- `--all` = `--skill '*' --agent '*' -y`（装全部技能、装到检测到的所有 agent、跳过确认）
- `-g` = 装到用户全局目录（`~/.agents/skills/` + 各 agent 的技能目录），不加则装到当前项目

> 如果安装时看到 `eve`/`promptscript does not support global skill installation` 报错，可以忽略——`npx skills` 工具内置的 agent 里只有这两个不支持全局安装（工具自身的限制，与本仓库无关），其余 agent（包括 Claude Code）不受影响，照常装成功。

**`wenqu-image` 唯一的外部依赖是 `codex` CLI**（驱动 GPT Image 2 实际生图，需要 ChatGPT Plus/Pro 订阅并 `codex login`）——生图脚本本身已经 vendor 进仓库（`wenqu-image/scripts/gpt-image-2-gen.sh`，MIT 协议，见该目录下 `THIRD_PARTY_NOTICES.md`），不需要单独装 gpt-image-2 skill。

**`wenqu-translate` 日常场景零依赖，重活场景可选依赖 `baoyu-translate`**：翻译单篇文章素材不需要装任何东西；要翻译长文档（超过约 4000 词）、多篇文章、或需要分块并行翻译时，建议另装更完整的翻译工具：

```bash
npx skills add jimliu/baoyu-skills --skill baoyu-translate -g
```

**开发这几个技能时的注意事项**：`npx skills add` 会把技能内容拉取一份独立快照放到 `~/.agents/skills/<name>`，**不是** symlink 回这个 git 仓库。所以改完 `wenqu-write` / `wenqu-image` / `wenqu-review` / `wenqu-translate` 里的任何文件后，要：

```bash
git push                      # 先推到 GitHub
npx skills update             # 再拉取最新版本同步到本地技能目录
```

只改本仓库文件、不 push、不 update，改动不会在 Claude Code 里生效。

## 开发约定

**跨技能引用一律用 `~/.agents/skills/<name>/...`，禁止写 `~/.claude/skills/<name>/...`。** `~/.agents/skills/` 是 `npx skills` 每次安装都会建的 canonical 位置；`~/.claude/skills/` 只是装了 Claude Code 时才会有的派生 symlink，其他 agent 上不存在。写 `.claude` 路径会导致装到非 Claude agent 时找不到文件。

技能内容里出现的 `AskUserQuestion`、`TaskCreate`、`Skill` 工具是 Claude Code 专属工具名，其他 agent 没有时按各 SKILL.md 顶部的"工具等价说明"退化执行，不强行假设所有 agent 都有这些工具。

版本记录见 [CHANGELOG.md](CHANGELOG.md)。
