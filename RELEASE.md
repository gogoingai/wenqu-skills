# Wenqu Skills 发布手册

**所有技能发布相关改动（包括版本、changelog、清单和 Skill 内容）必须先通过 PR 合入 `master`，不得直接推送 `master`。** 正式发布由 GitHub Actions 自动完成：推送与 `VERSION` 一致的 `v*` 标签即触发 ClawHub 与 SkillHub 发布，无需人工执行发布命令。

## 版本模型

仓库有两条独立版本轨道：

| 轨道 | 用途 | 必须保持一致的文件 |
|---|---|---|
| 插件包版本 | Claude Code / WorkBuddy 市场安装的 `wenqu-skills` 整包；ClawHub 的 `@gogoingai/wenqu-skills` 插件包也跟随此版本 | `VERSION`、`package.json`、`openclaw.plugin.json`、`.claude-plugin/plugin.json`、`.claude-plugin/marketplace.json` |
| 单技能版本 | SkillHub 与 ClawHub 上单个技能的发布版本 | 对应 `wenqu-*/SKILL.md` 的 `version` |

单技能版本必须是合法 SemVer，但不必等于插件包版本。例如，插件包可以保持 `0.1.8`，而已独立发布到 SkillHub 的技能可以是 `0.1.9`。

每个 `SKILL.md` 同时保留 Claude 需要的 `name`、`description`，以及 WorkBuddy / SkillHub 使用的 `slug`、`displayName`、`version`、`summary`、`license`。`slug` 是稳定且全仓唯一的 kebab-case 标识；更新 SkillHub 技能时不得改它。**ClawHub 不读 frontmatter 的 `version`/`displayName`（发布时用 `--version`/`--name` 显式传），`slug` 默认取文件夹名**；保留这些字段不冲突。所有技能还要提供 `metadata.openclaw.homepage`，指向其 GitHub 技能目录，供 OpenClaw 的 Skills UI 显示来源链接。

## 发布前关卡

1. 在功能分支说明本次变更，并更新 `CHANGELOG.md` 的对应版本条目。
2. 首次使用时安装 Skills Eval；随后运行完整静态、安全与平台原生审查：

   ```bash
   pipx install "skills-eval>=0.2.0,<0.3"
   skills-eval check . \
     --external-target claude-plugin \
     --external-target workbuddy \
     --external-target clawhub \
     --external-target skillhub
   ```

   该命令会执行原生校验：Claude Code 与 WorkBuddy 的本地清单校验、ClawHub `package validate`，以及 SkillHub 的远端 `--dry-run`。SkillHub dry-run 需要本机已 `skillhub login`；未登录时可先只跑前三个本地目标，PR 检查会用配置的 token 自动补跑 SkillHub。它不会发布 Skill 或插件包；报告的“外部发布校验”会明确列出本次实际执行的目标。

   若 CLI 不在 `PATH`，可设置 `CODEBUDDY_BIN`、`SKILLHUB_BIN` 或 `CLAWHUB_BIN` 指向对应可执行文件。

3. 创建 PR。GitHub Actions 会运行通用格式、安全检查，以及 Claude Code、WorkBuddy、ClawHub 的免登录原生校验和 SkillHub 的远端 `--dry-run`（用仓库 `SKILLHUB_TOKEN` secret 登录），并在 PR 中更新一条审查评论。SkillHub dry-run 命中限频（429）时由 skills-eval 自动重试（60s/120s，最多 3 次）。确认检查通过、报告无待处理项并获得合并授权后，才合入 `master`。

Skills Eval 会预先拦截：市场版本不一致、新技能漏入插件清单、缺失或重复 slug，以及技能目录中的图片文件、风格图片的失效或空引用；同时执行已配置的安全扫描。

## 正式发布（自动）

1. PR 合入 `master` 后，在最新的 `master` 上打与 `VERSION` 一致的标签并推送：

   ```bash
   git tag v$(cat VERSION)
   git push origin v$(cat VERSION)
   ```

2. 标签推送触发 `.github/workflows/publish.yml`：
   - 校验标签与 `VERSION` 一致（不一致立即失败）；
   - 调用 `gogoingai/skills-eval/publish@v0.2.1`，先自动完成平台登录、SkillHub 远端 dry-run 与完整 `skills-eval check` 防御性审查，再发布全部技能到 ClawHub 与 SkillHub，并发布 ClawHub 插件包 `@gogoingai/wenqu-skills`；
   - 发布日志作为 artifact 存档，限频（429）自动等待重试。

3. 发布凭证保存在仓库 Secrets（`CLAWHUB_TOKEN`、`SKILLHUB_TOKEN`），只能由账号持有人在 GitHub 设置中配置和轮换，不得写进仓库、脚本或日志。工作流使用 `release` environment；当前未配置审批人即打标即发，需要人工闸门时在 GitHub environment 设置中添加 required reviewers 即可，无需改动工作流。

4. 远端 `master` 更新后，Claude Code 与 WorkBuddy 市场均可读取新的清单；在干净环境或测试配置中重新安装验证。

5. 使用 `npx skills update` 更新本机通过 GitHub 安装的技能快照；它不是 symlink，不能替代推送后的远端验证。

### 手动后备与部分发布

自动工作流之外，可在 Actions 页面手动触发 `Publish` 工作流（`workflow_dispatch`），指定 targets、技能子集、changelog 或 dry-run 预检。本机已登录平台 CLI 时，也可以直接执行：

```bash
pipx run --spec "skills-eval>=0.2.0,<0.3" skills-eval publish . --changelog "本次变更说明"
```

先 `--dry-run` 预检再正式发；`--target` 与 `--skill` 可缩小范围，`--skills-only` / `--plugin-only` 控制 ClawHub 插件包维度。本机发布同样先过登录校验与防御性审查（`--skip-check` 仅限紧急情况）。

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

发布后以 SkillHub 页面显示的版本、审核状态和下载内容为准；平台可能仍有审核或限频，因此不要把“命令成功返回”误写为“已公开上架”。

### ClawHub

[clawhub.ai](https://clawhub.ai)（OpenClaw 生态市场），与 SkillHub 是独立注册表。本仓以 org publisher `@gogoingai` 发布。发布后进入 `pending.publication` 审核状态，`clawhub.ai/dashboard` 可见、Moderate 标记为 CLEAN 后公开；**发布到 ClawHub 即按 MIT-0**（frontmatter `license` 被忽略，仓库本体仍是 MIT）。同样不要把“命令成功返回”误写为“已公开上架”。
