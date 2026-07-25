# wenqu-skills 0.1.2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将七项通用写作经验接入 wenqu-write、wenqu-review 与 wenqu-image，并把仓库版本更新为 0.1.2。

**Architecture:** 写作侧保存来源、授权、状态与验收基准；审查侧验证来源、计划偏离、评测叙事与变更闭环；图片侧把单图完成状态回写到同一篇文章状态。所有文章特定术语、领域案例与阈值仍留在单篇 `preferences.md` 或素材库。

**Tech Stack:** Markdown、YAML frontmatter、Shell 静态检查、Git。

## Global Constraints

- 版本号固定为 `0.1.2`，属于 PATCH；不新增技能或改变现有触发入口。
- 仅使用 `wenqu-*` 名称和 `wenqu-skills/` 存储路径，禁止重新引入 `article-*`、`.article-skills` 或 `file://` 历史地址。
- 不提交、不推送；由用户在审阅完整改动后决定。
- 规则必须是跨文章可复用的判断能力；领域案例、固定模型和阈值不得升级为通用要求。

---

### Task 1: 补齐写作侧的来源、优先级、授权、状态与验收

**Files:**
- Create: `wenqu-write/references/planning/content-provenance.md`
- Create: `wenqu-write/references/planning/article-status.md`
- Modify: `wenqu-write/SKILL.md`
- Modify: `wenqu-write/references/INDEX.md`
- Modify: `wenqu-write/references/planning/questionnaire.md`
- Modify: `wenqu-write/references/planning/skeleton.md`

**Consumes:** 当前的素材库、骨架、变更影响记录与偏好文件。

**Produces:** 可被 R0/R4/R7 读取的来源类型、评测设计、文章状态和完成条件。

- [ ] **Step 1: 添加来源与评测叙事参考**

写明五类来源的证据与表述边界；为评测增加对象、条件、口径、可证明范围与不可外推范围。

- [ ] **Step 2: 添加单篇状态模板**

用“素材／骨架／章节／图片／审查／发布”六类状态记录下一步与待复查项，不复制既有文件内容。

- [ ] **Step 3: 接入主写作流程**

在上下文存储、从 0 到 1、修改和收尾环节接入：指令优先级、修改授权分级、状态更新、骨架—正文偏离检查与反向验收。

- [ ] **Step 4: 更新索引与模板**

让 `INDEX.md`、素材库模板和骨架模板直接指向新增参考文件，避免规则只能从 SKILL.md 深处发现。

- [ ] **Step 5: 验证**

运行：`rg -n 'article-|\.article-skills' wenqu-write || true`

Expected: 无旧命名；所有新增引用路径存在。

### Task 2: 将可信度、偏离和验收接入审查侧

**Files:**
- Modify: `wenqu-review/SKILL.md`
- Modify: `wenqu-review/references/r0-factcheck.md`
- Modify: `wenqu-review/references/r4-structure.md`
- Modify: `wenqu-review/references/r7-change-closure.md`
- Modify: `wenqu-review/references/index.md`

**Consumes:** 写作侧 `materials.md`、`skeleton.md`、`status.md`、`change-impact.md`。

**Produces:** 对来源、评测叙事、骨架偏离和完成标准的审查报告。

- [ ] **Step 1: 扩展 R0**

加入来源类型与评测叙事检查：区分事实、选择、研究、推断和简化场景；核对评测比较条件与结论边界。

- [ ] **Step 2: 扩展 R4**

检查正文是否偏离确认骨架、扩大范围或遗漏承诺内容；用章节验收标准判断一节是否真正完成，而非只检查标题和排版。

- [ ] **Step 3: 扩展 R7**

实质改动收尾时检查状态文件、验收项和图片状态是否同步，防止正文闭环但进度记录过期。

- [ ] **Step 4: 更新入口和索引**

在审查主流程和索引中说明新输入的读取优先级与报告边界；上下文不存在时不能假装完成了计划偏离审查。

- [ ] **Step 5: 验证**

运行：`rg -n '来源类型|评测叙事|骨架.*偏离|验收' wenqu-review`

Expected: R0、R4、R7 和入口说明均有明确职责，且没有重复定义一套互相冲突的标准。

### Task 3: 接入配图完成状态与单图验收

**Files:**
- Modify: `wenqu-image/SKILL.md`
- Modify: `wenqu-image/references/gen-workflow.md`

**Consumes:** wenqu-write 的 `references/status.md` 与既有 HTTPS 图片版本规则。

**Produces:** 已采用图、待上传图、正文变化待复查图的状态更新与单图验收。

- [ ] **Step 1: 定义单图反向验收**

要求一张图只承担 1～2 个关键关系；图中文字、箭头、术语、版本地址与正文一致后才可标记采用。

- [ ] **Step 2: 接入文章状态**

存在文章状态文件时，更新对应图片状态和待复查原因；不存在时不强制创建或猜测文章进度。

- [ ] **Step 3: 验证**

运行：`rg -n 'file://|/tmp/' wenqu-image --glob '*.md' --glob '*.sh' || true`

Expected: 不存在可被持久化到版本历史的本地 URL 降级路径。

### Task 4: 版本记录与整体静态校验

**Files:**
- Modify: `VERSION`
- Modify: `CHANGELOG.md`

**Consumes:** Tasks 1–3 的最终变更。

**Produces:** 可审阅的 0.1.2 工作区与明确的变更说明。

- [ ] **Step 1: 更新版本记录**

将根 `VERSION` 改为 `0.1.2`，在 CHANGELOG 顶部记录七项补强和“不提交、不推送”的执行边界不写入发行说明。

- [ ] **Step 2: 运行静态检查**

运行：

```bash
git diff --check
rg -n 'article-|\.article-skills|file://' --glob '*.md' --glob '*.sh' . || true
for file in wenqu-{write,review,image}/SKILL.md; do sed -n '1,8p' "$file"; done
```

Expected: 无补丁格式错误、无旧命名或本地图片 URL 残留，三个 SKILL.md frontmatter 完整。

- [ ] **Step 3: 汇报未提交改动**

列出修改文件、七项规则的落点和校验结果；不执行 `git commit` 或 `git push`。
