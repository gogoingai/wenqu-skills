---
name: wenqu-publish
description: 把 wenqu-write 写完的草稿文章清洗成可对外发布的最终版：删除画图提示代码块和项目生成标识，生成吸引眼球的标题候选、约100字简介、一张封面图，产出到独立的发布目录。适用于文章定稿后准备对外发布的场景。触发关键词：发布这篇文章、生成发布版、准备发布、导出发布版。也是后续接入自动发布能力（公众号、掘金等平台）的落点。
---

# 文章发布 Skill

## 工具等价说明（非 Claude Code 环境）

本文档里的 `AskUserQuestion`、`Skill` 是 Claude Code 的工具名。没有这些工具的 agent 上执行本技能时：

- `AskUserQuestion`（结构化多选提问）→ 改成编号文本问答：把选项列成 A/B/C，请用户直接回复字母或文字
- `Skill` 工具（调用 wenqu-image 生成封面）→ 没有跨技能调用机制就直接 Read `wenqu-image` 的 `SKILL.md` 和 `references/` 文件，照着内联执行

---

## 触发识别

| 用户信号 | 说明 |
|---------|------|
| "发布这篇文章"、"生成发布版"、"准备发布"、"导出发布版" | 进入「发布流程」 |

被调用前提：文章通常已经通过 `wenqu-write` 走过完整写作流程（有对应的 `wenqu-skills/{文件名}/` 存储）。若没有该存储（用户直接拿一篇现成 Markdown 要求发布），走「降级模式」（见 `references/workflow.md`）。

---

## 发布流程

→ 查 `references/workflow.md`（完整步骤：定位存储 → 就绪检查 → 清洗正文 → 标题 → 简介 → 封面图 → 写入产物 → 记版本）

核心动作概览：
1. 读取本篇 `wenqu-skills/{文件名}/references/changelog.md` 确定当前草稿版本号
2. 检查全文是否还有未处理的配图占位/未生成的画图提示，用 `AskUserQuestion` 确认是否要先补齐
3. 清洗正文：去掉项目生成标识引用块、去掉所有 `# 画图提示` 代码块（只保留图片本身）
4. 用 `AskUserQuestion` 确认标题（→ `references/title-summary.md`）
5. 用 `AskUserQuestion` 确认约100字简介（→ `references/title-summary.md`）
6. 用 `Skill` 工具调用 **wenqu-image** 生成封面图（→ `references/cover-prompt.md` 的专属规范，不同于文中说明图）
7. 产出写入 `{项目根目录}/wenqu-skills/{文件名}/publish/v{N}/`，不覆盖历史发布版本
8. 在 `references/changelog.md` 追加一行发布记录

---

## 依赖

- **wenqu-write** 的存储结构（`wenqu-skills/{文件名}/`）——非必需但强烈推荐，缺失时降级为仅清洗当前文件
- **wenqu-image**（可选但推荐）：生成封面图；未安装时跳过封面，仅产出清洗后的正文+标题+简介，并告知用户手动配图

---

## 自动发布扩展点

当前版本只落本地文件，不做任何网络推送。`references/auto-publish.md` 是预留的扩展说明文档，记录了未来接入公众号/掘金/个人博客等平台自动发布时的接口约定和考虑点，目前是占位文档。
