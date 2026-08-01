# Wenqu Skills 发布手册

本手册只在用户已明确授权发布时使用。检查命令不会提交、推送、打标签或正式发布；正式发布命令必须由人工明确执行。

## 版本模型

仓库有两条独立版本轨道：

| 轨道 | 用途 | 必须保持一致的文件 |
|---|---|---|
| 插件包版本 | Claude Code / WorkBuddy 市场安装的 `wenqu-skills` 整包；ClawHub 的 `@gogoingai/wenqu-skills` 插件包也跟随此版本 | `VERSION`、`package.json`、`openclaw.plugin.json`、`.claude-plugin/plugin.json`、`.claude-plugin/marketplace.json` |
| 单技能版本 | SkillHub 与 ClawHub 上单个技能的发布版本 | 对应 `wenqu-*/SKILL.md` 的 `version` |

单技能版本必须是合法 SemVer，但不必等于插件包版本。例如，插件包可以保持 `0.1.8`，而已独立发布到 SkillHub 的技能可以是 `0.1.9`。

每个 `SKILL.md` 同时保留 Claude 需要的 `name`、`description`，以及 WorkBuddy / SkillHub 使用的 `slug`、`displayName`、`version`、`summary`、`license`。`slug` 是稳定且全仓唯一的 kebab-case 标识；更新 SkillHub 技能时不得改它。**ClawHub 不读 frontmatter 的 `version`/`displayName`（发布时用 `--version`/`--name` 显式传），`slug` 默认取文件夹名**；保留这些字段不冲突。所有技能还要提供 `metadata.openclaw.homepage`，指向其 GitHub 技能目录，供 OpenClaw 的 Skills UI 显示来源链接。

## 发布前关卡

1. 说明本次变更，并更新 `CHANGELOG.md` 的对应版本条目。
2. 首次使用时安装 Skills Eval；随后运行完整静态、安全与平台原生审查：

   ```bash
   pipx install "skills-eval>=0.1.11,<0.2"
   skills-eval check . \
     --external-target claude-plugin \
     --external-target workbuddy \
     --external-target clawhub
   ```

   该命令会执行不依赖平台登录态的原生校验：Claude Code 与 WorkBuddy 的本地清单校验，以及 ClawHub `package validate`。它不会发布 Skill 或插件包；报告的“外部发布校验”会明确列出本次实际执行的目标。

   若 CLI 不在 `PATH`，可设置 `CODEBUDDY_BIN`、`SKILLHUB_BIN` 或 `CLAWHUB_BIN` 指向对应可执行文件。

3. GitHub Actions 在 PR 和 `master` 推送时会自动运行通用格式、安全检查，以及 Claude Code、WorkBuddy、ClawHub 的免登录原生校验，并在 PR 中更新一条审查评论。SkillHub 的远端 `--dry-run` 不在 PR 运行，仍在发布前的受控环境完成。

Skills Eval 会预先拦截：市场版本不一致、新技能漏入插件清单、缺失或重复 slug，以及技能目录中的图片文件、风格图片的失效或空引用；同时执行已配置的安全扫描。

## 正式发布顺序

1. 获得发布授权后，提交并推送通过检查的变更。
2. 远端仓库更新后，Claude Code 与 WorkBuddy 市场均可读取新的清单；在干净环境或测试配置中重新安装验证。
3. 仅对本次需要发布的 SkillHub 技能，显式执行：

   ```bash
   skillhub publish <skill目录> --changelog "本次变更说明"
   ```

   SkillHub 的 API Token 只能由账号持有人配置和使用，不能写进仓库、脚本或日志。
4. 仅对本次需要发布的 ClawHub 技能或插件包，执行 `node scripts/publish-clawhub.mjs --changelog "本次变更说明"`（先 `--dry-run` 预检）。脚本会再次运行基础 `skills-eval check .`，作为实际发布前的防御性检查。插件包以目录形式直接打包发布，不会在仓库生成或提交压缩包。ClawHub 的 token 同样只能由账号持有人配置和使用，不能写进仓库、脚本或日志。
5. 使用 `npx skills update` 更新本机通过 GitHub 安装的技能快照；它不是 symlink，不能替代推送后的远端验证。

## 渠道验收

### Claude Code

```text
/plugin marketplace add gogoingai/wenqu-skills
/plugin install wenqu-skills@wenqu-skills
/reload-plugins
```

确认六个 `/wenqu-*` 命令均可见。

### WorkBuddy

在“专家·技能·连接器”的“市场”页添加源 `gogoingai/wenqu-skills`，安装 `wenqu-skills` 后重载或重启客户端。WorkBuddy 可直接读取 `.claude-plugin/marketplace.json`，无需维护第二份专用市场清单；本机原生校验仍通过其内置 CodeBuddy 引擎的 `codebuddy plugin validate` 执行。

### SkillHub

先确认 dry-run 成功，再执行单技能正式发布。发布后以 SkillHub 页面显示的版本、审核状态和下载内容为准；平台可能仍有审核或限频，因此不要把“命令成功返回”误写为“已公开上架”。

### ClawHub

[clawhub.ai](https://clawhub.ai)（OpenClaw 生态市场），与 SkillHub 是独立注册表。本仓以 org publisher `@gogoingai` 发布（CLI：`npm i -g clawhub`、`clawhub login`，需 Node >=22）。发布用 `node scripts/publish-clawhub.mjs`（含 release 校验、限频重试、脏工作区警告；`--dry-run` 预检；底层命令与坑见脚本头部注释）。插件包发布需 `openclaw.plugin.json`、`.clawhubignore`（已建，勿删）。

先 `--dry-run` 预检再正式发。发布后进入 `pending.publication` 审核状态，`clawhub.ai/dashboard` 可见、Moderate 标记为 CLEAN 后公开；**发布到 ClawHub 即按 MIT-0**（frontmatter `license` 被忽略，仓库本体仍是 MIT）。同样不要把“命令成功返回”误写为“已公开上架”。
