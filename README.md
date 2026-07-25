# 文曲（Wenqu Skills）

> 一套面向 AI 时代的文章创作技能集，取意于文曲星。

文曲取意于文曲星（中国传统星宿，主文运），遵循中国传统文章创作路径--从博观积累、谋篇布局，到属文成篇、推敲润色，最终完成文章发布。

文曲并非简单的文本生成工具，而是一套覆盖文章生产全流程的 AI 写作体系。它帮助创作者从素材沉淀开始，逐步完成选题构思、内容创作、质量优化与最终发布，让 AI 成为写作过程中的协作者。

## 创作流程

```
博观积累 -> 谋篇布局 -> 属文成篇 -> 推敲润色 -> 图文完善 -> 文章发布
```

对应技能：

- 博观积累 -> `wenqu-library`
- 谋篇布局 / 属文成篇 -> `wenqu-write`
- 推敲润色 -> `wenqu-review`
- 图文完善 -> `wenqu-image`
- 跨语言传播 -> `wenqu-translate`
- 文章发布 -> `wenqu-publish`

## 技能组成

### 📚 wenqu-library（文库）

负责文章创作前的素材积累。

- 收集技术资料、案例、观点与灵感
- 整理零散信息，形成可复用素材
- 沉淀个人知识资产
- 为后续文章创作提供内容基础

### ✍️ wenqu-write（创作）

负责从主题构思到文章成稿。

- 分析写作目标与读者定位
- 设计文章结构与章节规划
- 生成和完善文章正文
- 根据反馈持续优化内容

### 🔍 wenqu-review（审校）

负责文章质量提升。

- 检查文章结构合理性
- 发现逻辑问题与表达不足
- 优化内容完整性与专业性
- 提供修改建议

### 🎨 wenqu-image（配图）

负责文章视觉表达。

- 分析文章内容，规划配图需求
- 生成文章插图与示意图
- 保持文章视觉风格统一

### 🌏 wenqu-translate（翻译）

负责文章跨语言传播。

- 多语言内容转换
- 保持技术语义准确
- 适配不同语言表达习惯

### 📖 wenqu-publish（发布）

负责文章发布准备。

- 内容格式整理
- 发布前质量检查
- 输出适配不同平台的文章版本

## 设计理念

中国传统文章创作讲究：

> 博观而约取，厚积而薄发。

文章并非一蹴而就，而是在长期积累、反复推敲中形成。

文曲希望将这一创作过程融入 AI，通过多个专业化技能协同，让文章创作从一次性的内容生成，变成可积累、可优化、可持续演进的创作体系。

## 安装

用 [`npx skills`](https://github.com/vercel-labs/skills)（通用技能安装器，不限 Claude Code）一条命令装完：

```bash
npx skills add gogoingai/wenqu-skills --all -g
```

- `--all` = `--skill '*' --agent '*' -y`（装全部技能、装到检测到的所有 agent、跳过确认）
- `-g` = 装到用户全局目录（`~/.agents/skills/` + 各 agent 的技能目录），不加则装到当前项目

> 如果安装时看到 `eve`/`promptscript does not support global skill installation` 报错，可以忽略--`npx skills` 工具内置的 agent 里只有这两个不支持全局安装（工具自身的限制，与本仓库无关），其余 agent（包括 Claude Code）不受影响，照常装成功。

**`wenqu-image` 唯一的外部依赖是 `codex` CLI**（驱动 GPT Image 2 实际生图，需要 ChatGPT Plus/Pro 订阅并 `codex login`）--生图脚本本身已经 vendor 进仓库（`wenqu-image/scripts/gpt-image-2-gen.sh`，MIT 协议，见该目录下 `THIRD_PARTY_NOTICES.md`），不需要单独装 gpt-image-2 skill。

**`wenqu-translate` 日常场景零依赖，重活场景可选依赖 `baoyu-translate`**：翻译单篇文章素材不需要装任何东西；要翻译长文档（超过约 4000 词）、多篇文章、或需要分块并行翻译时，建议另装更完整的翻译工具：

```bash
npx skills add jimliu/baoyu-skills --skill baoyu-translate -g
```

## 开发

维护本技能集时，遵循 [`DEVELOPMENT.md`](DEVELOPMENT.md) 的开发原则（经验沉淀判断、文件分工、版本号规范、改完同步）。

`npx skills add` 拉取的是独立快照（不是 symlink），改完技能文件后必须：

```bash
git push                      # 推到远端
npx skills update             # 再拉取最新版本同步到本地技能目录
```

变更记录见 [CHANGELOG.md](CHANGELOG.md)。
