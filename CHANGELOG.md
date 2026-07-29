# Changelog

本文件记录仓库里所有技能的重大变更，按发布时间倒序排列。

## 0.1.14 - 写作素材安全边界与 Codex 图片比例支持

- `wenqu-write` 移除不再维护的 Claude Memory 完整文章样例；为画像快照、外部素材和后续会话加载补充敏感数据、提示注入与按需读取边界。
- `wenqu-image` 的 Codex 后端将 `--ar` 传给内置渲染脚本，以比例与建议尺寸提示生图工具；文档明确该后端为 best-effort，不能保证精确像素尺寸。
- 插件包更新为 `0.1.14`；`wenqu-write` 与 `wenqu-image` 单技能版本更新为 `0.1.13`。

## 0.1.13 - ClawHub 插件包重新发布

- 因 ClawHub 中的 `0.1.12` release 停留在不可见的扫描中间态，使用新版本重新提交完整插件包。

## 0.1.12 - wenqu-image 多模型 CLI

- `wenqu-image` 新增随技能分发的 TypeScript/Bun CLI：保留 Codex 登录路径，并接入 OpenAI GPT Image、通义万相和豆包 Seedream；Bun 缺失时以 `npx -y bun` 运行。
- 新增全局非敏感图片配置、仅本机的 `.env` 密钥文件和文章级 `config/image.json` 覆盖；支持 provider、模型、画幅、可选 API Base URL、参考图能力校验、JSON 状态输出和安全重试。
- 更新 Agent 原生问答规则、逐张确认工作流、provider/model 溯源记录、中英文 README 与离线 CLI/adapter 回归测试。
- 新增 ClawHub（OpenClaw 生态）发布渠道：`openclaw.plugin.json` + `.clawhubignore` + `scripts/publish-clawhub.mjs`，RELEASE.md 与 DEVELOPMENT.md 补充对应流程与变更矩阵。

## 0.1.11 - 跨运行时分发与发布工程化

- WorkBuddy 直接复用 `.claude-plugin/marketplace.json`，不再维护重复的专用市场清单；并与仓库根 `VERSION`、Claude Code 插件统一为 `0.1.11`。
- 六个技能补充 WorkBuddy / SkillHub 元数据与 OpenClaw 主页链接；描述改为中文主描述，保留英文触发词，并将适用范围扩展为通用中文内容创作。
- README 默认使用英文，新增 `README.zh-CN.md`；两份文档均说明完整工作流安装、Claude Code 与 WorkBuddy 市场安装方式，并提供 WorkBuddy 添加市场和安装的图文步骤。
- 增加发布校验、图片引用校验、SkillHub dry-run 入口和 GitHub Actions 静态发布检查；风格图片迁至仓库根按需引用，避免随技能包分发。

## 0.1.8 - Claude Code 插件市场接入

- 新增 `.claude-plugin/plugin.json` 与 `.claude-plugin/marketplace.json`：将现有六个 `wenqu-*` 技能作为同一个 `wenqu-skills` 插件发布，无需移动现有目录。
- README 补充 Claude Code 市场的添加、安装、更新与 `/reload-plugins` 加载方式。
- 版本号更新为 0.1.8（PATCH，新增插件分发入口）。

## 0.1.7 - 文库原生搜索主导与可选 CLI 增强

- `wenqu-library` 明确 agent 原生联网搜索为每轮必跑主通道；`open-websearch` 仅以全局 CLI 方式补充多引擎候选，双路结果统一去重、分级后再下载，并在素材索引保留检索渠道。
- `open-websearch` 与 Crawl4AI 的 `crwl` 作为可选增强项统一检测：agent 说明用途并取得一次授权后，自行全局安装、设置浏览器和健康验证；用户拒绝、安装或验证失败时，自动回退 agent 原生搜索或下载，不要求用户执行命令或排障。
- `wenqu-write` 同步文库委派规则与素材索引模板：联网收集时必须交给“原生搜索主导”的文库流程，网页素材保留检索渠道。
- 外部工具资料改为独立模块目录：`open-websearch/` 完整记录十个搜索引擎、CLI 参数、JSON 协议与安装边界；`crawl4ai/` 记录 `crwl` 命令面、配置、下载策略、按引擎的浏览器检索恢复，以及公众号 `src=11`（MicroMessenger UA、搜狗 Referer、`#js_content` 等待）抓取路径。
- 新增可重复运行的文库 CLI 契约校验，覆盖搜索优先级、合并去重、安装降级和公众号抓取规则。
- 版本号更新为 0.1.7（PATCH，完善既有文库流程与可选依赖能力）。

## 0.1.5 - 图片生成说明与脚本注释修订

- `wenqu-image` 的环境检测说明与实际脚本对齐：检查的是 Codex CLI、随技能分发的内置生图脚本和 PicGo，不需要单独安装 `gpt-image-2` skill。
- 修正 PicGo GUI 配置说明：检测脚本会尝试同步当前 GUI 配置；同步失败时再提示手动配置。
- 生图脚本去掉对特定 Codex CLI 版本的历史绑定说明，改为版本无关的会话提取机制描述。
- 版本号 0.1.4 -> 0.1.5（PATCH，修复文档与注释不一致）。

## 0.1.4 - 长文分章修改与系统实现介绍写法

- `wenqu-write` 增加已有长文的分章修改入口：每次只处理已确认章节，重读当前正文与直接相关素材，保护用户同步编辑。
- 新增按需加载的系统实现介绍写法，面向自研系统、架构设计与工程实践文章，强调问题、设计选择、核心机制和模块协作，不扩充通用风格指南。
- `wenqu-image` 明确讨论图片与实际生图的边界，避免仅因评价或规划图片而触发生成、上传或写回。
- 版本号 0.1.3 -> 0.1.4（PATCH，小范围补充长文协作执行护栏）。

## 0.1.3 - 素材收集四步流程；单篇素材库改为 materials/ 目录

- `wenqu-library`「收集」升级为四步流程：规划（收集清单，唯一确认点）→ 搜索（联网搜索出候选 URL，不再确认）→ 下载（crwl 抓取，未安装则主动提议帮用户安装，拒绝或失败才降级自带抓取）→ 整理（落文件 + 登记索引 + 回收全局文库）
- `wenqu-library` 新增 `references/collection-playbook.md`（四步执行细则：清单格式、搜索策略、边抓边登记、回收标准）和 `references/crwl-cookbook.md`（crwl 命令手册：单页/deep-crawl/微信公众号，含实测产物结构与失败处理）
- 单篇素材库从 `references/materials.md` 单文件改为 `references/materials/` 目录：按内容类型分目录（`local/`、`articles/`、`papers/`、`docs/`），`index.md` 统一索引（来源 URL 必填、用途二分、标签检索）
- crwl 抓取能力接入：单页/deep-crawl 整站/微信公众号（UA 伪装 + 等待正文渲染），失败登记不静默跳过；README 外部依赖加 crawl4ai
- `wenqu-write` Step 2 接入四步收集流程；旧格式 `materials.md` 自动迁移到 `materials/index.md`
- `wenqu-review` R0、`wenqu-write` planning 各文件对 `materials.md` 的引用同步改为 `materials/index.md`
- 版本号 0.1.2 -> 0.1.3（PATCH，完善文库收集流程与素材存储结构）

## 0.1.2 - 新增 wenqu-library；补强写作、审查与配图闭环

- 新增 `wenqu-library` 技能：文章创作前的素材积累，跨文章可复用的个人知识库（`~/.gogoingai/wenqu-skills/library/`）
- `wenqu-write` Step 2 加引用：动笔收集前先查文库，避免重复收集
- 重写 README：文曲星主题，6 技能组成（文库/创作/审校/配图/翻译/发布），创作流程对应技能
- `wenqu-write` 增加内容来源与评测叙事、指令优先级、修改授权分级、文章状态和反向验收；骨架可检查正文偏离与章节完成条件
- `wenqu-review` 的 R0 / R4 / R7 分别补充来源与评测边界、骨架—正文偏离、状态与验收闭环检查
- `wenqu-image` 增加单图采用标准，并在文章状态存在时同步图片的采用／待复查状态
- 版本号 0.1.1 -> 0.1.2（PATCH，新增文库技能骨架并完善既有流程）

## 0.1.1 - 仓库名/技能名全面改名 article-* -> wenqu-*（版本号重置到 0.x）

- 技能目录/技能名：article-image/publish/review/translate/write -> wenqu-image/publish/review/translate/write
- 文档引用（258+处）：article-* -> wenqu-*
- 文章存储目录（项目级，不隐藏）：.article-skills/ -> wenqu-skills/
- 全局画像：~/.gogoingai/article-write/ -> ~/.gogoingai/wenqu-skills/
- planning 文件：article-profile.md -> wenqu-profile.md
- 图片 URL 前缀 article-img：保留不改
- 版本号重置：3.10.1 -> 0.1.0（改名是大变动，MINOR 涨到 0.1；MAJOR 长期 0，见 DEVELOPMENT.md 第 5 节）

## 0.0.19 - 仓库名 article-skills -> wenqu-skills

- remote origin 改为 https://github.com/gogoingai/wenqu-skills.git
- README / SKILL / workflow / questionnaire / article-translate 里的仓库引用（`gogoingai/article-skills`、`[article-skills]`）改为 wenqu-skills
- 存储目录 `.article-skills/` 不变（文章存储目录，与仓库名无关）

## 0.0.18 - 系统化升级：新增 R7 变更闭环审查 + 规划文件；重写 R3/R5；发布机制调整

- **新增 article-review R7（变更闭环与全篇一致性）**：五类遗留检查（术语/逻辑/结构/内容载体/图文），配合 change-impact.md 记录改动影响
- **新增 article-write/references/planning/ 四个文件**：article-profile（写作画像/设计决策图/章节职责卡）、change-impact（变更影响记录）、materials-governance（素材冲突裁决）、terms（文章级术语表）
- **重写 R3**（模式化与空泛表达）：不机械搜触发词，只查形式是否掩盖信息不足
- **重写 R5**（连贯性、清晰度与理解路径）：加读者基准，不机械要求通俗化/代码快照；保留措辞直白检查节
- **article-write SKILL.md** 加 change-impact/terms/article-profile/materials-governance 引用 + 写作画像/设计决策图/素材裁决 Step
- **article-publish workflow 第七步**：发布版正文保留原标题层级不降级，文章名/简介/封面放 meta.md
- article-image/review/write 多处调整（r0/r4/r6/index/questionnaire/skeleton/gen-workflow/gen-image.sh 等）
- 版本号 3.9.2 -> 3.10.0（MINOR，新增 R7 审查模块 + 规划文件）

## 0.0.17 - 补充 3 条通用经验（措辞打磨交互、加粗承担结构、论文腔与主体）

继续从文章 preferences.md 和专项审查报告沉淀：

- **article-write `SKILL.md` 修改流程加 1 条**：措辞打磨时，用户说某处“不好”“怪”，先讨论问题所在并给出候选表述，待用户明确确认后再改正文，不直接替换
- **article-write `style-guide.md` 节奏控制加 1 条**：正文不能只靠连续段落堆叙述，适当用加粗承担结构提示（突出关键结论、设计取舍、图表后的引导句）
- **article-review `r3-ai-patterns.md` 加 2 条**：论文腔自称（本文系统/对照方案/上述/如下）、主体缺失（“系统采用 X”看不到“我们为什么这么选”）

## 0.0.16 - 新增技能开发原则；article-write 加措辞打磨规范/修改流程交互/changelog 管理；article-review R5 加措辞直白检查

基于《AI记忆系统与梦境》文章一次长会话的经验沉淀：大量时间花在措辞打磨，提炼出通用的「直白优先」规则和交互规范。特定偏好（如「查询->用户问题」）不升级到通用，留在文章自己的 `preferences.md`。

- **新增仓库根 `DEVELOPMENT.md`**：技能开发原则--经验沉淀的通用 vs 特定判断标准、沉淀流程、各 skill 文件分工（按经验类型对号入座）、改完同步（`git push` + `npx skills update`）
- **article-write `style-guide.md` 新增「措辞：直白优先」节**：7 条通用规则（避免抽象量词堆砌/术语化/拟人/语法拧巴/同义重复/标签不符/自行概括），每条配真实例子
- **article-write `anti-patterns.md` 加 7 条禁止条目**：对应措辞打磨 7 条
- **article-write `SKILL.md`「修改」流程加 3 条**：给方案引述完整句子不只给行号、改一处前 grep 全篇找同类、表格/总结优先用正文表述
- **article-write `planning/changelog.md`「记录规则」加 4 条**：追加前读末尾确认编号、条数多了移 history（约 15~20 条）、编号冲突处理、history 按天归档（`changelog-history-YYYY-MM-DD.md`）
- **article-review `r5-coherence.md` 新增「三、措辞直白检查」节**：7 条检查项 + 信号表补措辞信号

## 0.0.15 - article-write 新增文章标识/版本记录/待办清单；新增 article-publish 发布技能；article-image 确认环节改用 AskUserQuestion

用户发现两个问题：① `.article-skills/{文件名}/` 按文件名分桶存储，文章一旦被用户重命名，存储目录和文章的映射就断了，下次加载会误判成"从没写过"；② 技能里很多"给用户看一眼再确认"的环节（画完图、连续小修改遇到待定项）只是输出文本，没有真正走结构化确认，容易被用户划水略过。另外，写完的草稿一直带着画图提示代码块、项目内部标识等创作期标记，没有一个"生成干净发布版"的收尾步骤。

- **article-write 新增文章标识**：新建存储时生成 `aid-` + 8 位随机十六进制 ID，同时写入 SKILL.md 顶部和文章正文 H1 下方的引用块。加载时若按当前文件名找不到存储目录，改为扫文章开头的 ID 反查 `.article-skills/*/SKILL.md`，命中则判定为重命名，`AskUserQuestion` 询问是否同步改存储目录名（默认推荐同步）
- **article-write 新增版本记录**：`references/planning/changelog.md` 定义"草稿/事件/发布"三类版本表，落盘到每篇文章的 `references/changelog.md`；Step 4 首次定稿记 v1，"修改"流程每轮改完记 vN+1，语言审查小修改不单独占版本号
- **article-write 新增待办清单**：SKILL.md 新增『待办清单』一节，用 Markdown checkbox 记录跨会话未完结事项（骨架自检标注的待核实、用户说稍后补的素材），和会话级的 `TaskCreate` 任务列表分工不同——待办是持久化的，跨会话可查
- **新增 `article-publish` 技能**：清洗草稿正文（去掉画图提示代码块、项目生成标识），生成标题候选/约100字简介/封面图（复用 article-image 单独定义的封面画图规范），产出到 `.article-skills/{文件名}/publish/v{N}/`，同时预留 `references/auto-publish.md` 作为未来接自动发布平台的扩展点，当前只落本地文件不做任何网络推送
- **article-image 确认环节全面改用 `AskUserQuestion`**：生成结果确认（含图片 `preview`）、3 次修复失败后的处理方式、内容变更重画提醒、画图提示被人工改动的冲突确认，此前都是纯文本展示选项等用户手打回复，现在统一走结构化提问，图片直接放进选项 preview 供并排对比

## 0.0.14 - article-write 新增"背景深挖"通用判定能力

用户拿一篇已发布过的公众号文章要求改写成新文时，之前的 context.md 只记了"素材来源是旧文，避免查重"这一句话，没深挖旧文什么时候发的、同不同渠道、有没有 deadline——结果骨架设计出来后，用户指出"背景写得不够详细，骨架容易出问题"。

一开始按这个具体场景加了一组固定问题（素材发布状态/时间约束/应急预案三选项模板），用户纠正："我想做成通用的判定能力"——不能因为这次是"改写避免查重"就写死一套选项，换个场景（内部资料对外发布、竞品发了类似内容因此要调整角度）问题内容全变了。

- **`references/planning/questionnaire.md` 新增 A0 节**：不是固定问题模板，而是一套判定原则——用户主动说出的背景信息（"这个之前发过""公司要求""这块素材我后面给你"……）背后通常有没说出口的动机/硬约束/未决风险，只记下来不等于问清楚了。列出 4 类识别信号，深挖时现场根据具体内容生成 1~3 个针对性问题，用"动机/硬约束/未决风险"三个方向做检查清单，不套用固定选项
- **未决风险要求现在问清楚，不能拖到执行阶段自己拍板**：比如素材不完整、deadline 逼近時怎么办，能现在问清楚的现在问，不要留到真遇到时才发现只能自己做主
- `SKILL.md` Step 1 新增第 4 步引用这个判定能力；`context.md` 模板新增 `## 背景` 字段（仅深挖出实质内容时才写，无固定表格列）

## 0.0.13 - article-image 四套老风格模板回溯简化为极简 prompt 写法

上一版新增 `pencil-sketch` 风格时发现：带 `--ref` 生成时 prompt 描述得越详细，`--ref` 图像本身的权重被稀释得越厉害，容易跑偏（见 `pitfalls.md` 踩坑 9）。当时结论是"新风格用极简写法，已验证的老风格模板不回溯改"——但用户追问"实验通过了为什么不直接把老模板也改了"，判断是对的：既然极简写法已证明足够，留着冗长模板只是历史包袱，没有理由不统一。

- 抽测 `mono-marker`、`excalidraw`、`handdrawn`、`techppt` 四套老风格（各选一个模板对比生成），极简 prompt 效果和原有详细模板一样稳定，没有变差
- 四套风格文档的"Prompt 模板片段"全部回溯简化：去掉逐条复述的线条/填充/字体/配色描述，只保留"参考图风格 + 内容描述"
- `core-principles.md` 新增"带 --ref 时优先轻描述"作为默认写法；`pitfalls.md` 踩坑 9 更新为跨风格统一结论，不再区分新老风格

## 0.0.12 - article-write 单篇 context/skeleton 存储位置改为项目根目录

原先本篇 context/skeleton 存在 `$HOME/.gogoingai/article-write/{项目目录名}/`（项目目录名 = `basename $(pwd)`）。这个方案在一个仓库里装着多篇互不相关文章时（比如一个笔记仓库存了几十篇不同主题的稿子）会出问题：所有文章共用同一个"项目目录名"分桶，context/skeleton 互相覆盖串味，写作历史区分不开。

- 存储位置迁移到**项目根目录**下的 `.article-write/` 子目录（`git rev-parse --show-toplevel`，非 git 仓库则用当前工作目录），类似 Claude Code 把 `.claude/` 放项目根目录的做法
- 分桶粒度从"项目目录名"改成"**文章文件名**"：`{项目根目录}/.article-write/{文件名}.context.md` / `.skeleton.md`，同一项目下的不同文章不再互相覆盖
- 从0到1流程 Step 1 新增一步：动笔前必须先确定"这篇文章打算叫什么文件名、存哪个目录"，才能定下 context 路径
- 新增提示：项目是 git 仓库且未在 `.gitignore` 排除 `.article-write/` 时，写入前应询问用户是否要加这条规则（草稿类本地状态，默认不擅自改 `.gitignore`）
- `SKILL.md`、`references/planning/questionnaire.md` 中所有旧路径引用同步更新；全局画像路径（`$HOME/.gogoingai/article-write/profile.md`）不变

## 0.0.11 - article-image 新增彩色铅笔质感风格

用户展示了一套英文技术教程配图（llama.cpp 本地部署教程的四步流程图、笔记本插画构图、GGUF 模型名拆解图），确认风格喜欢后翻译成中文逐张验证，收入第七套风格库：

- **新增 `pencil-sketch` 风格**：4 张参考图（横向四步编号流程、长条拆解+编号卡片、竖向判断分支流程、竖向三层架构），文档见 `references/styles/pencil-sketch.md`
- 核心特征：奶油纸感背景 + 彩色铅笔/蜡笔晕染图标（边缘带斜线排线阴影）+ 圆形编号徽章 + 虚线分隔 + 手写标题+同色系下划线 + 可爱吉祥物点缀，和已有的奶油描边风格（黑色粗描边、线条工整无阴影）、水彩涂鸦风格（无排线阴影、有装饰性星星火花）都能明确区分开
- 应用踩坑 9 的教训，全程用"参考图风格 + 内容"的极简 prompt 生成，四张验证图（含翻译原图、全新内容的分层架构）第一次生成就高度还原，没有再出现过度描述覆盖 `--ref` 的问题
- `SKILL.md` 风格库表格、触发关键词、依赖清单同步加入这套风格的入口

## 0.0.10 - article-image 新增奶油描边风格，pitfalls 补充"--ref 时勿过度描述"教训

用户展示了另一张风格样例图（奶油色卡片+黑色粗描边+扁平图标+红蓝弧形箭头，思维导图布局，但原图本身是别的 AI 生成的、有拼写错误不能直接进库），确认喜欢后逐张生成验证，收入第六套风格库：

- **新增 `cream-outline` 风格**：4 张参考图（横向三阶段流程、思维导图辐射布局、竖向三层架构、竖向判断分支流程），文档见 `references/styles/cream-outline.md`
- 过程中先后踩了两个坑：①第一版验证图 prompt 把参考图里的每个视觉细节都写成文字描述，导致生成结果和参考图风格明显偏离（`--ref` 权重被文字描述稀释）；改成"参考图风格 + 内容"这种极简 prompt 后风格立刚复现。②标题字号容易被模型放大到占满画面，需要在 prompt 里显式强调"字号适中偏小、单行居中"
- 踩坑①是跨风格通用问题，写进 `references/pitfalls.md` 踩坑 9："有 --ref 时 prompt 描述过细，会把参考图的风格覆盖掉"——新风格没有历史模板可抄时尤其容易踩到；已验证过的老风格模板不受影响，不做回溯修改
- `SKILL.md` 风格库表格、触发关键词、依赖清单同步加入这套风格的入口

## 0.0.9 - article-image 新增水彩涂鸦风格

用户展示了一张风格样例图（水彩晕染质感图标 + 星星/螺旋线/火花等装饰涂鸦 + 彩色波浪箭头，暖色背景），确认喜欢后用 `--ref` 逐张生成验证，收入第五套风格库：

- **新增 `doodle-watercolor` 风格**：4 张参考图（原图中文翻译白底锚点图、横向三阶段流程、竖向三层架构、竖向判断分支流程），文档见 `references/styles/doodle-watercolor.md`
- 参考图背景改用纯白（用户原图是暖米色，明确要求库里统一用白底）
- 过程中定位到两个可复现的生图踩坑，写进该风格文档的"踩坑记录"一节：①箭头容易同图混用波浪/直线两种画法、且颜色乱跳，需要 prompt 里显式要求"全图箭头统一风格+颜色统一一到两种色系"；②判断分支的"是/否"文字标签在专门修复箭头问题的那一轮容易被模型顺带删掉，需要同一句 prompt 里把"箭头风格统一"和"是否标签必须保留"两个要求都写全，只强调一个会导致另一个跑丢
- `SKILL.md` 风格库表格、依赖清单同步加入这套风格的入口

## 0.0.8 - 骨架自检新增章节顺序依赖检查

`article-write` Step 3.4 骨架质量自检加一项：检查每节用到的概念/术语是否都已在前面章节出现过。在骨架阶段发现顺序问题成本很低（调整章节顺序即可），拖到正文写作阶段才发现要么破坏行文插入解释，要么回头改前面章节，成本高得多。这条是独立判断"对写文章这件事本身有没有用"后加的，不是照抄参考工具的清单条目。

## 0.0.7 - article-image 新增两套手绘风格，拆分 diagram-style.md 对齐 agentskills.io 规范

新增两套风格参考库（用户提供 Excalidraw 白板截图和马克笔手绘截图作为风格锚点，逐张用 gpt-image-2 生成验证后收入库）：

- **`excalidraw` 风格**：斜线交叉排线填充 + 潦草描边 + 手写字体，工程草图感，无插画图标——与已有的可爱插画风手绘风格明确区分开。7 张参考图覆盖线性流程、嵌套分组、高密度分层架构、时序图、分支决策、对比图、时间演化图。
- **`mono-marker` 风格**：全图单一主色调 + 奶油色背景 + 波浪线引出旁注，视觉上像马克笔手绘。4 张参考图覆盖分组流程、判断分支合并、分层架构、左右对比。过程中定位到一个可复现的生图踩坑并写进 `references/pitfalls.md`：并列分支之间容易被模型误画出多余连接线，必须同时声明"间距拉大"和"禁止连接"两句，只写一句仍会复发。

**`references/diagram-style.md`（原 1166 行）整体拆分**，对齐 agentskills.io 规范里的三条硬性要求（SKILL.md body 建议 <500 行；reference 文件应聚焦单一关注点、按需加载；文件引用尽量控制在一跳之内，避免链式嵌套）：

- 4 套风格库单独成文件：`references/styles/{handdrawn,excalidraw,mono-marker,techppt}.md`
- 13 种图类型模板按结构相似性分 4 组：`references/templates/{architecture,flow,comparison,data-viz}.md`
- 其余按关注点拆分：`core-principles.md`（核心原则+禁用泳道图+节点标签规则）、`pitfalls.md`（常见踩坑）、`design-principles.md`（设计四大原则与配色）、`diagram-type-selector.md`（该画哪类图选型指南）
- 删除原 `diagram-style.md`，`SKILL.md` 精简到 93 行，直接扁平链接到以上所有文件
- 拆分后同步修正了所有文件内部残留的旧编号标题（如"一、核心原则""3.1 横向多层架构图"）和跨文件引用——这些编号在原来的单文件语境下才有意义，直接照搬到独立文件里毫无意义

## 0.0.6 - 新增 article-translate，第四个技能

之前 `article-write` 里有一份从外部 `baoyu-translate` 技能整段拷贝但已经损坏（引用不存在的脚本路径）的 `baoyu-translate.md`，且没有任何流程真正调用它。按"用户会不会脱离主流程单独触发"的标准判断，翻译本身够格独立成第四个技能：

- **新增 `article-translate`**：`references/translation-guide.md` 是自包含的翻译方法论（分析领域/语气/术语 → 翻译 → 自查），学习自 baoyu-translate 的核心原则和 refined 模式的分析步骤，专注单篇文章量级的翻译质量。分块翻译、多模式切换、EXTEND.md 配置等工程基础设施**不重新实现**——评估过全量 vendor 进来的维护成本（baoyu-translate 还在活跃更新，vendor 一份等于冻结在某个版本，且引入 bun/npm 运行时依赖）不划算，改为明确的"重活升级路径"：源文档超过约 4000 词、要精翻多篇、需要分块并行翻译时，建议用户另装 `jimliu/baoyu-skills` 的 baoyu-translate（可选依赖，不影响本技能覆盖的日常场景）
- **注解密度跟着读者画像走**：不引入 baoyu-translate 的 style/audience 独立预设枚举（避免和 article-write 已有的读者画像系统打架），改为直接复用读者画像里的技术背景字段决定术语注解密度
- **强制实时审查**：article-translate 翻译完成后当场（不等全文写完）调用 article-review 的 R2 做翻译腔审查，不是可选的收尾步骤——Claude 系模型生成中文容易有翻译腔，尤其是刚读完英文源码/文档之后，翻译者自己很难发现自己写出来的问题
- `article-write` 的 Step 2（获取素材）源材料是英文时，改为用 `Skill` 工具调用 article-translate，不再直接引用（已删除的）`baoyu-translate.md`
- `article-review` 的 R2 交叉引用从 article-write 改指向 article-translate

**同一版本里顺带解决的另一个外部依赖**：`article-image` 之前依赖单独安装的 `gpt-image-2` skill 才能真正生成图片。`gen.sh`/`extract_image.py` 本身很小、无隐藏依赖，且 gpt-image-2 声明 MIT 协议，直接 vendor 进 `article-image/scripts/`（新增 `gpt-image-2-gen.sh`、`extract_image.py`、`THIRD_PARTY_NOTICES.md`），不再需要单独安装该 skill。唯一剩下的外部依赖是 `codex` CLI 本身——这是真正意义上"没法吸收"的第三方工具，不是可以复制内容进来的技能。

## 0.0.5 - 跨技能引用改用 ~/.agents/skills，声明 Claude 专属工具的等价退化

`npx skills` 把技能装到 72+ 种 agent，但仓库里所有跨技能引用（`--ref` 图片路径、Read 规则文件路径、`gen.sh` 查找逻辑）之前写的都是 `~/.claude/skills/...`——这个路径只在装了 Claude Code 时才存在，装到其他 agent 时找不到文件。

- 全部改成 `~/.agents/skills/<name>/...`——这是 `npx skills` 每次安装都保证会建的 canonical 位置，不依赖具体装了哪个 agent
- `gen-image.sh` 的 `find_gen_sh()` 简化为只查 `~/.agents/skills/gpt-image-2/...`，去掉不再需要的 `.claude`/`.config` 候选路径
- 三个 SKILL.md 各加一段"工具等价说明"：`AskUserQuestion`/`TaskCreate`/`Skill` 是 Claude Code 专属工具名，装到没有这些工具的 agent 上时按声明的等价方式退化（编号文本问答 / TODO 清单 / 直接 Read 内联执行），不假装所有 agent 都有这些工具
- README 新增"开发约定"一节，把"跨技能引用只用 `~/.agents/skills/`"定为硬性规则，防止以后又写回 `.claude`

## 0.0.4 - 安装方式改用 npx skills，移除 setup.sh

改用通用技能安装器 [`npx skills`](https://github.com/vercel-labs/skills)（`npx skills add gogoingai/article-skills --all -g`）作为唯一安装方式，移除仓库自带的 `setup.sh`。

- 好处：一条命令装到 72+ 种 agent（不限 Claude Code），有官方的 `update`/`remove`/`list` 生命周期管理
- 代价：`npx skills add` 把技能内容拉取为独立快照放在 `~/.agents/skills/<name>`，**不再是** symlink 回本仓库——本仓库文件改动后必须 `git push` + `npx skills update` 才会生效，不再是"改完立即生效"
- README 已更新为新的安装说明和开发时的 push+update 提醒

## 0.0.3 - article-write 规划流程对齐 gstack spec 的三个纪律

参考 gstack `spec` 技能的五阶段设计（理解动机→划定边界→技术追问→草稿评审→质量门禁），给 `article-write` 的规划阶段（Step 1~3.5）补齐三处此前缺失的纪律：

- **证据前置**：生成系统专属问卷、问技术类问题之前，必须先用 Grep/Read 扫描定位到具体 `path:line`，禁止凭项目名/README 一句话描述就出题；找不到证据要如实说明，不能假装扫过。
- **范围锁定（新增 Step 1.5 / 问卷 D0）**：骨架前必须问清楚"这次明确不覆盖什么"和"篇幅砍半时保留什么"，写入 `context.md` 的 `## 范围锁定` 字段，防止骨架阶段贪多、写到一半才发现摊子太大。
- **骨架质量自检（新增 Step 3.4）**：骨架经用户确认后、进入任务列表前，自查三要素完整性、关键机制是否有源码依据、是否超出范围锁定、篇幅预算是否合理；发现问题先给用户看，最多来回调整 2 轮，不无限打磨。

## 0.0.2 - 拆分为三个技能

将原本单一的 `zh-tech-intro` 技能（已改名 `article-write`）按"用户会不会脱离主流程单独触发"这个标准拆分为三个协作技能，避免单个技能文件无限膨胀：

- **新增 `article-image`**：迁出全部画图相关内容（画图提示写作规范、gpt-image-2 生成/质检/上传流程、`gen-image.sh` 环境检测脚本、画图完整示例、手绘/技术PPT风格参考库）。可被直接触发（"画个架构图"），也可被其他写作技能通过 `Skill` 工具在配图阶段调用。
- **新增 `article-review`**：迁出全部审查相关内容（R0 真实性核查、R1 英文术语、R2 翻译腔、R3 AI 写作痕迹、R4 结构自检、R5 连贯性，含术语表和 AI 写作模式库）。支持两种使用方式：独立触发时走 `Skill` 工具完整调用；被 `article-write` 写作/修改过程中高频复用时，直接 Read 规则文件内联执行，不发起额外的技能调用。
- **`zh-tech-intro` 改名 `article-write` 并重构为写作主协调技能**：只负责规划（问卷+骨架）和逐节写作，写作阶段配图只插入占位标记 `> 🖼️ 待配图：[描述]`，全文定稿后统一调用 `article-image`；审查逻辑改为调用/内联 `article-review`。命名与 `article-image`/`article-review` 统一为 `article-*` 前缀。个人数据目录 `~/.gogoingai/zh-tech-intro/` 同步改名为 `~/.gogoingai/article-write/`。
- **新增仓库级 `setup.sh`**：为仓库里每个含 `SKILL.md` 的顶层目录创建 `~/.agents/skills/<name>` 和 `~/.claude/skills/<name>` 的 symlink，幂等，支持单独指定技能名。
- **新增仓库级 `VERSION` / `CHANGELOG.md`**：本仓库现在是一个多技能集合，版本号覆盖全部技能整体，不是单个技能各自记版本。

## 0.0.1 - 单技能时代（历史，未逐版本记录）

`zh-tech-intro` 作为唯一技能，内置全部规划、写作、画图、审查逻辑，靠内部的 `references/` 分层做按需加载。详见 2.0.0 之前的 git 历史。
