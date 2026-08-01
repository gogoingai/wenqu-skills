# 技能开发手册

维护 wenqu-library / wenqu-write / wenqu-image / wenqu-review / wenqu-translate / wenqu-publish 这套技能时，遵循以下原则。发布步骤、渠道差异与验证命令见 [RELEASE.md](RELEASE.md)。

## 1. 经验归档：先判断通用 vs 特定

会话中遇到反复出现的模式（用户多次纠正同类问题），先判断它该归档到哪里：

- **通用规则**（任何文章都适用）-> 进 skill 的 `style-guide.md` / `anti-patterns.md`
  例：「避免抽象量词堆砌描述具体机制」——任何技术文章都适用
- **特定偏好**（这篇文章的术语取舍、写法习惯）-> 进文章自己的 `references/preferences.md`
  例：「查询统一改用户问题」——其他文章讲检索系统时「查询」是正常用词，不该升级到通用

**判断方法**：这条规则换个文章、换个系统，还成立吗？成立 -> 通用；不成立（依赖这篇文章的具体语境）-> 特定。

## 2. 归档流程

1. 识别会话中反复出现的模式（用户多次纠正同类问题）
2. 提炼成规则（抽象出问题类型，不绑死具体词）
3. 判断通用性（按上面标准）
4. 通用 -> 写到对应 skill 文件（`style-guide` 加「怎么做」、`anti-patterns` 加「不要做什么」）
5. 特定 -> 写到文章 `preferences.md`，跟着这篇文章走

## 3. 各 skill 文件分工

按经验类型对号入座：

| 经验类型 | 归档到 |
|---|---|
| 通用写作措辞、结构、格式（怎么做） | `wenqu-write/references/writing/style-guide.md` |
| 通用写作禁止事项（不要做什么） | `wenqu-write/references/writing/anti-patterns.md` |
| 规划阶段（问卷、骨架、changelog） | `wenqu-write/references/planning/*.md` |
| 配图画法、踩坑、风格、生成流程 | `wenqu-image/references/`（pitfalls / styles / templates / gen-workflow） |
| 审查标准（R0~R6 各类检查） | `wenqu-review/references/r0-r6*.md` |
| 翻译规范 | `wenqu-translate/references/translation-guide.md` |
| 发布流程（标题、简介、封面、自动发布） | `wenqu-publish/references/*.md` |
| 文章特定偏好（术语取舍、写法习惯） | 文章 `wenqu-skills/{文件名}/references/preferences.md` |
| 跨技能变更记录 | 仓库根 `CHANGELOG.md` |
| 维护原则（本文件） | 仓库根 `DEVELOPMENT.md` |

## 4. 开发、PR 与发布边界

本地修改完成后，先保留在工作区供审阅；**所有技能、元数据、图片资源和发布配置的变更都必须通过 PR 合入 `master`，不得直接推送 `master`。** 不要因为技能文件已改完，就自动提交、推送或发布。

标准顺序是：创建功能分支 -> 本地运行对应检查 -> 提交并创建 PR -> 查看 PR 中的 Skills Eval 评论与必需检查 -> 获得合并授权后合入 `master`。平台正式发布是合并后的独立动作，仍需明确授权并按 [RELEASE.md](RELEASE.md) 执行。

`npx skills add` 拉取的是独立快照（不是 symlink），因此远端发布成功后才需要更新本机已安装快照：

```bash
npx skills update             # 同步到本地技能目录（~/.agents/skills/）
```

## 5. 版本号规范

版本号 0.MINOR.PATCH，MAJOR 长期保持 0（技能仍在早期迭代）：

- **MINOR**：大变动才涨（改名、新品牌、不兼容变更、新增技能**完整流程**或独立流程步骤）。当前 0.1.*；以后除非大变动，不改 0.1
- **PATCH**：完善现有规则（加规则条目、补例子、改措辞、修 bug）、新增技能**骨架**（流程未完整），不改变流程结构。0.1.0 -> 0.1.1 -> 0.1.2…

加规则条目（anti-patterns 加禁止项、style-guide 加节、R5 加检查项）是 PATCH，不是 MINOR——这是完善现有规范，没有新增流程。新增技能先建骨架时也是 PATCH，等流程完整后再涨 MINOR。攒一批改动一起发，不每次小改都涨版本。

## 6. 变更影响矩阵

| 改动 | 必须同步 | 必跑检查 |
|---|---|---|
| 新增或删除技能 | 对应 `SKILL.md`、`.claude-plugin/plugin.json` 的 `skills[]`、README 技能列表 | `skills-eval check .` |
| 修改技能流程或元数据 | 对应 `SKILL.md`、必要的 `references/`、单技能版本（如发布到 SkillHub） | `skills-eval check .` |
| 新增、迁移风格图片 | `wenqu-image-assets/styles/`、至少一处说明或命令引用 | `skills-eval check .` |
| 修改插件、市场 | `VERSION`、`.claude-plugin/plugin.json`、共享的 `.claude-plugin/marketplace.json` | `skills-eval check . --external-target claude-plugin --external-target workbuddy --external-target clawhub` |
| 修改 ClawHub 插件包配置 | `openclaw.plugin.json`、`.clawhubignore` | `skills-eval check . --external-target clawhub`（仅本地包校验，无需登录） |
| 发布到 SkillHub / ClawHub | 变更技能的版本和 changelog 说明；ClawHub 不读 frontmatter 版本，发布时显式传 `--version` | `skills-eval check . --external`；再运行对应的正式发布脚本或其 `--dry-run` |

`scripts/README.md` 记录每项自动检查的精确范围；`RELEASE.md` 记录 PR 合入后有副作用操作的顺序与人工验证步骤。
