---
name: wenqu-image
description: 为文章生成 AI 配图（架构图、流程图、技术示意图等），涵盖从"画图提示"写作规范到调用 gpt-image-2 实际生成、质检、上传、写入文章的完整流程。适用于任何需要配图的写作场景，不限于技术文章。触发关键词：画个架构图、画流程图、生成配图、生成图片、把图画出来、渲染一下、帮我生图。也可被其他写作类技能通过 Skill 工具在"配图阶段"调用。
---

# 文章配图 Skill

## 与调用方的接口约定

其他写作技能（如 wenqu-write）在正文里为图片预留位置时，用两种标记之一：

| 标记 | 含义 | 谁来写 |
| --- | --- | --- |
| `> 🖼️ 待配图：[一句话描述这张图要表达的核心内容]` | 占位标记，只知道这里需要一张图，还没想好具体画法 | 调用方（写作阶段） |
| \`\`\`（代码块）第一行 `# 画图提示：[描述]` | 完整画图提示，规范已写全，可以直接生成 | 本技能，或调用方已自行写好 |

本技能被调用时，**先把占位标记转换成完整画图提示，再进入生成流程**——两步不能合并，写法未确认前不要直接生成。

**完整画图提示必须带风格 YAML frontmatter**，格式是 `# 画图提示` 代码块内、提示正文之前加一段 YAML，风格信息、实际用过的参考图路径、历次生成的版本记录都写进提示本身，不能只存在对话记忆里——不然下次改图/复现时既解析不出用的是哪个风格，也找不到当初参考的是哪张图，更看不到之前生成过哪些版本：

```
​```
---
style: 单色马克笔   # 对应风格库表里的风格名；无风格关键词时写"默认极简PPT"
ref: assets/styles/mono-marker/example-2.png   # 实际用过的参考图；只允许技能内稳定相对路径或 HTTPS CDN URL，临时本地路径不得写入；本轮没用 --ref 时保持原值不动，从未用过才省略
versions:   # 历次生成的版本记录；每项必须是 HTTPS CDN URL，含质检不通过/用户否决版本，编号递增，不删除、不覆盖
  v1: https://cdn.example.com/article-img-1111aaaa2222bbbb.png   # 简要说明
---
# 画图提示：[图片标题]
# ...（提示正文，四条核心原则见下方）
​```
```

转换占位标记、或用户直接给风格关键词时，都按这个格式写；`references/styles/*.md` 里该风格追加的专属描述句，直接拼进提示正文，不要另起一段脱离 YAML 之外的"风格说明"，避免以后只读提示正文时丢失风格上下文。**每次实际调用 `gpt-image-2-gen.sh --ref` 后**，把这次真正生效的稳定参考来源回填进 `ref:` 字段：技能内风格资产用相对路径，已采用图片用 HTTPS CDN URL；命令中临时使用的 `/tmp` 文件不得回填。`ref` 记的是“这次生成实际参考了什么”，不是“这个风格理论上可以参考什么”；**没用 `--ref` 的这一轮，不要动 `ref:` 字段**，保留上一次的记录。**只有上传成功、拿到 HTTPS CDN URL 的版本才可写入 `versions`**；正文的 `![]()` 只指向当前采用的那一版，其余版本仅留存在 `versions` 里供回看对比，具体写入规则见 `references/gen-workflow.md` 第四步。

> **工具等价说明**：文中"`Skill` 工具"是 Claude Code 的跨技能调用机制名。其他 agent 没有对应机制时，调用方应直接 Read 本技能的 `SKILL.md` 和 `references/` 文件内联执行。文中"`AskUserQuestion` 工具"是 Claude Code 的结构化多选提问机制，本技能里凡是"让用户从几个选项里选一个"的确认点（生成结果确认、多次失败后的处理方式、转换方案确认、内容变更后是否重画等，详见 `references/gen-workflow.md`）都必须用它提问，不得只输出 A/B/C 文本等用户手打回复。没有该工具的 agent 上退化为编号文本问答：把选项列成 A/B/C，请用户直接回复字母或文字。

---

## 触发识别

**讨论不触发生图：** 用户说“看看图”“讨论怎么画”“评价图片”“先给画图方案”或“这张图哪里不对”时，只分析现图或给出增量修改方案，不生成、上传或写入文章。只有用户明确说“生成”“画”“重画”“插入”“上传并替换”时，才进入实际流程；增量调整只改用户点名的内容，确需整体重画时先说明原因。

| 场景 | 入口 |
|------|------|
| 用户直接说"画个XX图"、"生成配图"，给出内容描述 | 直接进入「写画图提示」 |
| 文章里已有 `> 🖼️ 待配图` 占位标记 | 先转换成完整画图提示，见 `references/gen-workflow.md` 第二步 |
| 用户说"生成图片"、"渲染一下"、"把图画出来" | → 查 `references/gen-workflow.md`，完整生成流程 |
| 用户提到"手绘风格""Excalidraw""马克笔风格""水彩涂鸦""奶油描边""思维导图风""彩色铅笔""排线阴影""技术PPT风格"等风格关键词 | → 直接跳对应的 `references/styles/*.md`（见下方风格库表） |

---

## 写画图提示

核心原则（4 条，展开说明见 `references/core-principles.md`）：
1. 描述视觉物体，不指定显示文字——prompt 触发元素，不指定渲染细节
2. 不写 px/尺寸/颜色值/字号——生图模型自行决定渲染细节
3. 图类型、节点标签、箭头语义、关键数据、视觉层次是该写的内容
4. 禁止任何画图 DSL（Mermaid、draw.io、Graphviz、PlantUML）——只输出 `# 画图提示` 代码块

**动笔前先查本篇偏好库**（`references/preferences.md`「配图偏好」表，路径与读取方式见下方「用户反馈与偏好持久化」）——有没有已记录的默认风格、配色规则等，有则直接应用，不重复问用户。

先判断该画哪类图 → `references/diagram-type-selector.md`（图类型快速选表 + 该画哪类架构图），再去对应的图型模板文件取 prompt 骨架：

| 图型模板文件 | 覆盖的图类型 |
| --- | --- |
| `references/templates/architecture.md` | 横向多层架构图、树形层次检索路径图 |
| `references/templates/flow.md` | 竖向三阶段流程、竖向分支流程、横向阶段列流程、两层流程（主流程+展开细节） |
| `references/templates/comparison.md` | 并排方案对比、并行双路流程、左右结果对比 |
| `references/templates/data-viz.md` | 横向条形图、公式+分级卡片、时间演化折线图、金字塔分层图 |

风格库（手绘插画 / Excalidraw / 单色马克笔 / 技术PPT 四选一，不混用）：

| 风格 | 文档 | 参考图目录 |
| --- | --- | --- |
| 手绘插画 | `references/styles/handdrawn.md` | `assets/styles/handdrawn/` |
| Excalidraw（白板斜线填充） | `references/styles/excalidraw.md` | `assets/styles/excalidraw/` |
| 单色马克笔（波浪线注释） | `references/styles/mono-marker.md` | `assets/styles/mono-marker/` |
| 水彩涂鸦（星星火花装饰） | `references/styles/doodle-watercolor.md` | `assets/styles/doodle-watercolor/` |
| 奶油描边（黑色粗描边思维导图） | `references/styles/cream-outline.md` | `assets/styles/cream-outline/` |
| 彩色铅笔质感（编号徽章+排线阴影） | `references/styles/pencil-sketch.md` | `assets/styles/pencil-sketch/` |
| 技术PPT（机器人吉祥物） | `references/styles/techppt.md` | `assets/styles/techppt/` |
| （无风格关键词/默认） | 极简专业 PPT 风格，直接在图型模板结尾加「风格：白色背景，高级技术 PPT 配图，极简专业，文字标注全部用中文。」 | — |

其他参考文档：

| 文档 | 内容 |
| --- | --- |
| `references/pitfalls.md` | 常见踩坑教训（跨风格通用） |
| `references/design-principles.md` | 设计四大原则与配色审美 |
| `references/diagram-examples.md` | 完整示例 |

---

## 生成图片

→ 查 `references/gen-workflow.md`（环境检测 → 列出画图点并补全占位标记 → 逐张生成/质检/确认 → 写入文章 → 联动提醒）

逐张生成、逐张确认，不批量、不跳过用户；`gen.sh` 必须串行执行。

**单图采用标准：** 一张图只承担 1～2 个关键关系；图中文字、节点、箭头与正文术语一致，最终采用 URL 是 `versions` 中的 HTTPS 版本。满足这些条件后才可标记为“已采用”；若调用方文章存在 `references/status.md`，同步图片状态与待复查原因。

---

## 依赖

- **codex CLI**（唯一的外部工具依赖，需要 ChatGPT Plus/Pro 订阅并 `codex login`）：驱动 GPT Image 2 实际生图
- 生图脚本：`scripts/gpt-image-2-gen.sh` + `scripts/extract_image.py`——已随本技能一起分发（vendored，MIT，见 `scripts/THIRD_PARTY_NOTICES.md`），**不需要单独安装 gpt-image-2 skill**
- 图床：`picgo`（需已配置 uploader）
- 风格参考图库：`assets/styles/`（`handdrawn/` 手绘插画、`excalidraw/` 白板斜线填充、`mono-marker/` 单色马克笔、`doodle-watercolor/` 水彩涂鸦、`cream-outline/` 奶油描边思维导图、`pencil-sketch/` 彩色铅笔质感、`techppt/` 技术PPT风格，配合 `--ref` 使用，对应文档见 `references/styles/`）

---

## 用户反馈与偏好持久化

不再向用户提议修改本技能仓库的文档（`references/pitfalls.md`、`references/styles/*.md`、`references/templates/*.md` 等），遇到新画图踩坑或用户给出的持久化偏好，改为记进**调用方文章自己的**存储目录：`{项目根目录}/wenqu-skills/{文件名}/references/preferences.md`「配图偏好」表（表结构见 wenqu-write 的 `references/planning/questionnaire.md`「写入 preferences.md」一节）。

**判定标准**：这条反馈下次给这篇文章画图还用得上吗？
- 是（默认风格、配色规则、某类结构反复出现的踩坑修法、用户明确要求"以后都这样画"）→ 当场追加一行进 `references/preferences.md`「配图偏好」表，格式：`| ID | 内容 | 来源 | 状态 |`
- 否（这次改这张图的临时要求，比如"这条箭头改成红色"）→ 不持久化，正常执行即可

**每次画图前先查这份文件**：有已记录的默认风格/配色/常见修法，直接应用，不重复问用户；生成结果反复触发同一个踩坑时，把修复策略当场写成一条偏好记录，而不是只在当次会话里口头记住。

被独立文章调用（无 wenqu-write 提供的存储路径）时，若找不到调用方上下文，询问用户"这次的画图偏好要记到哪篇文章的存储目录"，或按当前工作目录 + 输出文件名推定。
