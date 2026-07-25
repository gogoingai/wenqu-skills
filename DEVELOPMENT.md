# 技能开发原则

维护 article-write / article-image / article-review / article-translate / article-publish 这套技能时，遵循以下原则。

## 1. 经验沉淀：先判断通用 vs 特定

会话中遇到反复出现的模式（用户多次纠正同类问题），先判断它该沉淀到哪里：

- **通用规则**（任何文章都适用）-> 进 skill 的 `style-guide.md` / `anti-patterns.md`
  例：「避免抽象量词堆砌描述具体机制」--任何技术文章都适用
- **特定偏好**（这篇文章的术语取舍/写法习惯）-> 进文章自己的 `references/preferences.md`
  例：「查询统一改用户问题」--其他文章讲检索系统时「查询」是正常用词，不该升级到通用

**判断方法**：这条规则换个文章、换个系统，还成立吗？成立 -> 通用；不成立（依赖这篇文章的具体语境）-> 特定。

## 2. 沉淀流程

1. 识别会话中反复出现的模式（用户多次纠正同类问题）
2. 提炼成规则（抽象出问题类型，不绑死具体词）
3. 判断通用性（按上面标准）
4. 通用 -> 写到对应 skill 文件（`style-guide` 加「怎么做」、`anti-patterns` 加「不要做什么」）
5. 特定 -> 写到文章 `preferences.md`，跟着这篇文章走

## 3. 各 skill 文件分工

按经验类型对号入座：

| 经验类型 | 沉淀到 |
|---|---|
| 通用写作措辞/结构/格式（怎么做） | `article-write/references/writing/style-guide.md` |
| 通用写作禁止事项（不要做什么） | `article-write/references/writing/anti-patterns.md` |
| 规划阶段（问卷/骨架/changelog） | `article-write/references/planning/*.md` |
| 配图画法/踩坑/风格/生成流程 | `article-image/references/`（pitfalls / styles / templates / gen-workflow） |
| 审查标准（R0~R6 各类检查） | `article-review/references/r0-r6*.md` |
| 翻译规范 | `article-translate/references/translation-guide.md` |
| 发布流程（标题/简介/封面/自动发布） | `article-publish/references/*.md` |
| 文章特定偏好（术语取舍/写法习惯） | 文章 `.article-skills/{文件名}/references/preferences.md` |
| 跨技能变更记录 | 仓库根 `CHANGELOG.md` |
| 维护原则（本文件） | 仓库根 `DEVELOPMENT.md` |

## 4. 改完同步

`npx skills add` 拉取的是独立快照（不是 symlink），改完 skill 文件后必须：

```bash
git push                      # 推到远端
npx skills update             # 同步到本地技能目录（~/.agents/skills/）
```

## 5. 版本号规范

遵循语义化版本 MAJOR.MINOR.PATCH：

- **MAJOR**：不兼容变更（改 SKILL.md 流程/接口导致旧用法失效，或大重构）
- **MINOR**：新增技能，或现有技能新增独立流程步骤（如 article-write 加新 Step）
- **PATCH**：完善现有规则（加规则条目、补例子、改措辞、修 bug），不改变流程结构

加规则条目（anti-patterns 加禁止项、style-guide 加节、R5 加检查项）是 PATCH，不是 MINOR--这是完善现有规范，没新增流程。攒一批改动一起发，不每次小改都涨版本。
