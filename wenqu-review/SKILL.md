---
name: wenqu-review
description: 审查中文技术文章质量：真实性核查（对照源码）、连贯性、英文术语规范、翻译腔、AI 写作痕迹、结构自检。适用于任何中文技术文章，不限定必须是 wenqu-write 写出来的。触发关键词：审查、检查一下、看看有没有问题、review、整体看看。也可被其他写作类技能通过 Skill 工具调用，或直接被内联引用（见下方"两种被使用的方式"）。
---

# 文章审查 Skill

## 两种被使用的方式

审查在一篇文章的生命周期里会被高频小跑（每改一节可能就要过一遍语言审查），也会被单独整体触发，两种场景对"要不要走完整一轮 Skill 调用"的要求不一样：

| 场景 | 方式 |
| --- | --- |
| 用户直接说"审查这篇文章"、"看看有没有问题" | 独立触发，走完整流程（见下方「审查流程」） |
| 其他写作技能（如 wenqu-write）在写作/修改过程中反复用到 R5/R1/R2/R3 | **不要每次都用 `Skill` 工具发起一轮新调用**——直接用 Read 工具读取本技能 `references/` 下对应的规则文件（如 `r1-english.md`），内联执行检查，把结果并入调用方自己的流程里 |

> **工具等价说明**："`Skill` 工具"是 Claude Code 的跨技能调用机制名。其他 agent 没有对应机制时，按上表第二种方式处理——直接 Read 本技能文件内联执行。

---

## 审查流程

→ 查 `references/index.md`（核心规则、执行顺序、报告格式）

| 步骤 | 文件 | 内容 |
|------|------|------|
| R0 | `references/r0-factcheck.md` | 来源、真实性与评测叙事核查（对照源码，揪编造/写错/错配的内容） |
| R5 | `references/r5-coherence.md` | 连贯性 + 清晰度 |
| R1 | `references/r1-english.md` | 英文术语检查（依赖 `references/language/glossary.md`） |
| R2 | `references/r2-translation.md` | 翻译腔审查 |
| R3 | `references/r3-ai-patterns.md` | 模式化与空泛表达（依赖 `references/language/humanizer-zh.md`） |
| R4 | `references/r4-structure.md` | 结构自检（默认跳过，用户要求"完整审查"时才跑） |
| R6 | `references/r6-style-and-narrative-fit.md` | 文体与叙事契合（默认跳过，用户要求"完整审查"时跑） |
| R7 | `references/r7-change-closure.md` | 变更闭环与全篇一致性（完整审查或实质改动收尾时跑） |

默认自动模式：触发时 R0→R5→R1→R2→R3 一次性跑完，发现问题直接修，全部完成后一次性汇报。用户说"手动审查"时才切换为每步等确认。

用户说"完整审查"、"提交前检查"或"这轮都改完了吗"时，按 R0→R5→R1→R2→R3→R4→R6→R7 执行。R7 必须放在其余问题修复之后，检查这些修改是否在全文、图文和交叉引用中完成闭环。

---

## 依赖

- `references/language/glossary.md`、`references/language/humanizer-zh.md`：本技能自带的术语表和 AI 写作模式库，独立可用
- 若同时安装了 wenqu-translate：R2 和它的翻译方法论共享同一套欧化语言判断标准，被它当场调用；没装 wenqu-translate 不影响 R2 独立运行
- 若同时安装了 wenqu-write：R4 会交叉参考它的写作禁止事项清单，增强判断依据，但不是硬依赖——没装也能正常审查
- 若同时安装了 wenqu-write：R6 优先读取文章存储中的读者画像、背景、范围锁定等上下文，判断当前文章的题材与写作目标；上下文不足时不得擅自把某种文体判错。
- 若同时安装了 wenqu-write：R7 优先读取本轮确认过的改动清单及文章存储中的 `references/change-impact.md`；两者都不存在时才以当前 `git diff` 为线索，并明确说明覆盖范围受限。
- 若同时安装了 wenqu-write：R0 读取 `materials/index.md` 的来源类型、冲突裁决与评测设计；R4 读取 `skeleton.md` 与 `status.md` 判断是否偏离确认范围；相关文件缺失时明确说明检查边界，不得假装已核对。

---

## 用户反馈与偏好持久化

不再向用户提议修改本技能仓库的 `references/rN-*.md`，遇到新的审查踩坑或用户给出的持久化审查偏好（术语取舍、翻译腔判定尺度、结构自检侧重……），改为记进**被审查文章自己的**存储目录：`{项目根目录}/wenqu-skills/{文件名}/references/preferences.md`「审查偏好」表（表结构见 wenqu-write 的 `references/planning/questionnaire.md`「写入 preferences.md」一节）。

**判定标准**：这条反馈下次审查同一篇文章还用得上吗？
- 是（用户明确说"以后不要把 X 当翻译腔""这类写法我们允许"）→ 当场追加一行进 `references/preferences.md`「审查偏好」表
- 否（这次这一句的临时修改意见）→ 不持久化

**每次审查前先查这份文件**（若调用方是 wenqu-write/wenqu-translate，通常已加载；独立触发审查时自己检查该文章的 `wenqu-skills/{文件名}/references/preferences.md` 是否存在），有已记录的偏好按其执行，不重复误判、不重复问用户。
