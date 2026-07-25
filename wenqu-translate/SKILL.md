---
name: wenqu-translate
description: 把英文技术材料（README、论文、源码注释、技术文章）翻译成自然中文，用于写作前的素材准备。专注单篇文章量级的翻译质量；超出这个量级（长文档分块、多种翻译模式）时建议改用更完整的 baoyu-translate 技能。触发关键词：翻译一下、把这段英文翻译成中文、译成中文。也可被 wenqu-write 在 Step 2 获取英文素材时通过 Skill 工具调用。
---

# 英文材料翻译 Skill

## 工具等价说明（非 Claude Code 环境）

`AskUserQuestion`（读者背景确认）、`Skill`（调用 wenqu-review 做 R2 审查）是 Claude Code 工具名。其他 agent 没有时：`AskUserQuestion` 退化为编号文本问答；`Skill` 工具退化为直接 Read `~/.agents/skills/wenqu-review/references/r2-translation.md` 内联执行。

## 触发识别

| 场景 | 入口 |
|------|------|
| 用户直接说"翻译一下"、给一段英文要求译成中文（单篇文章量级） | 独立触发，走下方"翻译流程" |
| wenqu-write Step 2 获取素材时源材料是英文 | 被调用，读者画像已由调用方提供，跳过下方"确认读者背景"这一步 |
| 源文档很长（超过约 4000 词）、要翻译多篇/整本书、需要 quick/normal/refined 多模式切换或分块并行翻译 | **超出本技能范围，改用 baoyu-translate**，见下方"重活升级路径" |

---

## 重活升级路径（超出单篇文章量级时）

本技能只覆盖"给写文章顺手翻译一段素材"这个量级，**不重新实现**长文档分块、多种翻译模式、subagent 并行翻译、跨会话保存的翻译偏好配置这些工程能力——这些活儿交给功能更完整的 **baoyu-translate** 技能（`jimliu/baoyu-skills`，MIT 协议）：

- 独立安装：`npx skills add jimliu/baoyu-skills --skill baoyu-translate -g`
- 判断标准：源文档词数明显超过 4000、或用户主动要求"精翻/refined 模式"这类多步骤审查润色流程、或要翻译的是完整文档/多篇文章而不是写作过程中顺手翻译的一段素材
- 触发方式：有跨技能调用机制就用 `Skill` 工具调用 baoyu-translate；没装的话如实告知用户"这个量级超出本技能范围，建议安装 baoyu-translate"，不要勉强凑合翻译一份质量打折的长文档

---

## 翻译流程

→ 查 `references/translation-guide.md`（完整方法论：分析→组装翻译指令→翻译→自查，核心原则，注解密度规则，常见误译信号）

**独立触发时，先确认读者背景**（决定注解密度）：没有调用方提供读者画像，用 `AskUserQuestion` 问一句"目标读者的技术背景是？"（无背景/初级工程师 / 中级工程师 / 高级工程师），再进入翻译。

**翻译完成后，强制当场跑一遍 R2，不等到全文写完**：用 `Skill` 工具调用 **wenqu-review**，指定只跑 R2（翻译腔审查）；没有跨技能调用机制时直接 Read `~/.agents/skills/wenqu-review/references/r2-translation.md` 内联执行。这一步不可省略——Claude 系模型生成中文时容易出现翻译腔，尤其是刚读完英文源码/文档之后，翻译者自己很难发现自己写出来的翻译腔。

---

## 依赖

- `references/translation-guide.md` 完整自包含，覆盖单篇文章量级的翻译不需要任何外部依赖
- R2 审查依赖 **wenqu-review**（同仓库技能，`npx skills add gogoingai/wenqu-skills --all` 会一起装上）
- 长文档/多模式翻译这类超出本技能范围的重活，**可选依赖 baoyu-translate**（`jimliu/baoyu-skills`）——不装不影响本技能覆盖的日常场景，只在遇到重活时会建议安装

---

## 用户反馈与偏好持久化

不再向用户提议修改本技能仓库的 `references/translation-guide.md`，遇到新的误译模式或用户给出的持久化翻译偏好（专有名词是否保留英文、注解密度、直译信号判定……），改为记进**被翻译文章自己的**存储目录：`{项目根目录}/wenqu-skills/{文件名}/references/preferences.md`「翻译偏好」表（表结构见 wenqu-write 的 `references/planning/questionnaire.md`「写入 preferences.md」一节）。

**判定标准**：这条反馈下次翻译同一篇文章的素材还用得上吗？
- 是（"agent 不要翻译成智能体，保留英文"这类持续适用的取舍）→ 当场追加一行进 `references/preferences.md`「翻译偏好」表
- 否（这次这段话的临时改法）→ 不持久化

**每次翻译前先查这份文件**（被 wenqu-write 调用时通常已加载；独立触发时自己检查该文章的 `wenqu-skills/{文件名}/references/preferences.md` 是否存在），有已记录的偏好按其执行，不重复问用户。
