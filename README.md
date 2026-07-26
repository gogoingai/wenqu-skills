# 文曲（Wenqu Skills）

> 一套面向 AI Agent 的文章创作技能集合。

![文曲 Logo](docs/logo.png)

文曲取意于文曲星，遵循中国传统文章创作路径，从博观积累、谋篇布局，到属文成篇、推敲润色，最终完成文章发布。

文曲将传统文章创作方法与现代 Agent 能力结合，通过多个专业化技能协同，帮助创作者完成从素材积累、内容构思、文章撰写，到质量优化、图文完善和发布输出的完整流程。

## 创作流程

```text
博观积累 -> 谋篇布局 -> 属文成篇 -> 推敲润色 -> 校勘审定 -> 丹青绘意 -> 译笔传意 -> 刊行成章
```

不同技能覆盖其中多个阶段，共同完成从素材积累到文章发布的完整创作流程。

## 技能组成

| 技能 | 创作阶段 | 作用 |
| --- | --- | --- |
| [`wenqu-library`](wenqu-library/) | 博观积累 | 素材收集与整理：按"规划、搜索、下载、整理"四步收集素材，以 agent 原生搜索为主、可选 CLI 补充候选，支持 crwl 网页抓取（含微信公众号），沉淀技术资料、案例、观点和参考内容，为文章创作提供可复用素材 |
| [`wenqu-write`](wenqu-write/) | 谋篇布局、属文成篇 | 中文技术文章创作主流程：完成需求理解、选题分析、文章规划、结构设计、逐节写作和内容完善，并协调其他技能完成翻译、配图和审查 |
| [`wenqu-review`](wenqu-review/) | 推敲润色、校勘审定 | 文章质量优化：检查技术事实、逻辑结构、表达方式、英文术语、翻译腔和 AI 写作痕迹，并提供修改建议 |
| [`wenqu-image`](wenqu-image/) | 丹青绘意 | 文章视觉设计：规划配图需求，生成图片提示词，完成 AI 生图、质量检查和上传流程 |
| [`wenqu-translate`](wenqu-translate/) | 译笔传意 | 跨语言内容转换：分析原文结构和技术语义，将英文材料转换为符合中文表达习惯的内容 |
| [`wenqu-publish`](wenqu-publish/) | 刊行成章 | 发布版本整理：清理创作痕迹，生成标题、简介、封面等发布素材，输出最终发布版本 |

## 设计理念

中国传统文章创作讲究：

> 博观而约取，厚积而薄发。

文章并非一次生成，而是在长期积累、反复推敲和持续完善中形成。

文曲希望将这一创作过程融入 AI Agent，让文章创作从一次性的内容生成，变成可积累、可优化、可持续演进的创作体系。

## 安装

使用 [`npx skills`](https://github.com/vercel-labs/skills) 安装：

```bash
npx skills add gogoingai/wenqu-skills --all -g
```

参数说明：

- `--all`：安装全部技能，并安装到检测到的 Agent
- `-g`：安装到用户全局目录

> 如果安装时看到 `eve`/`promptscript does not support global skill installation` 报错，可以忽略--`npx skills` 工具内置的 agent 里只有这两个不支持全局安装（工具自身的限制，与本仓库无关），其余 agent（包括 Claude Code）不受影响，照常装成功。

### Claude Code 插件市场

文曲也作为一个完整插件发布到 Claude Code 插件市场。先添加文曲市场，再安装唯一的 `wenqu-skills` 插件；它包含文库、写作、审查、配图、翻译与发布全部六个技能：

```text
/plugin marketplace add gogoingai/wenqu-skills
/plugin install wenqu-skills@wenqu-skills
/reload-plugins
```

`/reload-plugins` 用于让当前 Claude Code 会话立即加载刚安装的技能；新开会话时无需重复执行。

市场或插件有新版本时，依次更新：

```text
/plugin marketplace update wenqu-skills
/plugin update wenqu-skills@wenqu-skills
/reload-plugins
```

### 通过 Prompt 安装

不想一次装全部、而是让 Agent 按当前任务挑相关技能安装时，把下面这段话直接粘贴给 Agent（Claude Code 等）即可，Agent 会自行运行安装命令并选用相关技能：

> Use the skills in "https://github.com/gogoingai/wenqu-skills" that are relevant to the current task. Run `npx skills add "https://github.com/gogoingai/wenqu-skills"` and select the relevant skills, then follow their instructions.

## 外部依赖

### wenqu-image

`wenqu-image` 需要 `codex` CLI 用于驱动图片生成流程。

完成安装并登录：

```bash
codex login
```

即可使用图片生成能力。

### wenqu-library

`wenqu-library` 每次都先运行 agent 自带的联网搜索；可选的全局 CLI 套件只负责补充搜索和增强下载：

- `open-websearch`：补充多引擎搜索候选，不替代原生搜索；
- `crwl`（Crawl4AI）：优先下载动态页面与微信公众号；对已定义食谱的直连搜索失败可作浏览器检索恢复，不可用时自动回退 agent 自带能力。

技能检测到缺失项时，会说明安装内容与浏览器运行环境，并请求一次授权；授权后由 agent 自行安装、设置和验证。用户无需复制命令、配置 PATH 或排障。

完整的引擎选择、CLI 参数和站点抓取策略见 [`wenqu-library/references/`](wenqu-library/references/) 下的 [`open-websearch/`](wenqu-library/references/open-websearch/) 与 [`crawl4ai/`](wenqu-library/references/crawl4ai/) 两个独立模块。

无需预先安装或配置 PATH；检测到缺失项后，agent 会在获得授权后完成安装、浏览器运行环境设置与健康检查。
