# Wenqu Skills 发布手册

本手册只在用户已明确授权发布时使用。检查命令不会提交、推送、打标签或正式发布；正式发布命令必须由人明确执行。

## 版本模型

仓库有两条独立版本轨道：

| 轨道 | 用途 | 必须保持一致的文件 |
|---|---|---|
| 插件包版本 | Claude Code / WorkBuddy 市场安装的 `wenqu-skills` 整包 | `VERSION`、`.claude-plugin/plugin.json`、`.claude-plugin/marketplace.json`、`.codebuddy-plugin/marketplace.json` |
| 单技能版本 | SkillHub 上单个技能的发布版本 | 对应 `wenqu-*/SKILL.md` 的 `version` |

单技能版本必须是合法 SemVer，但不必等于插件包版本。例如，插件包可以保持 `0.1.8`，而已独立发布到 SkillHub 的技能可以是 `0.1.9`。

每个 `SKILL.md` 同时保留 Claude 需要的 `name`、`description`，以及 WorkBuddy / SkillHub 使用的 `slug`、`displayName`、`version`、`summary`、`license`。`slug` 是稳定且全仓唯一的 kebab-case 标识；更新 SkillHub 技能时不得改它。所有技能还要提供 `metadata.openclaw.homepage`，指向其 GitHub 技能目录，供 OpenClaw 的 Skills UI 显示来源链接。

## 发布前关卡

1. 说明本次变更，并更新 `CHANGELOG.md` 的对应版本条目。
2. 运行仓库级测试和静态检查：

   ```bash
   npm run test:release
   npm run release:check
   ```

3. 本机已安装 Claude Code 与 WorkBuddy 时，运行两端原生清单校验：

   ```bash
   npm run release:check:runtime
   ```

4. 要发布 SkillHub 时，安装并登录 SkillHub CLI 后运行 dry-run：

   ```bash
   npm run release:check:skillhub
   ```

   此命令会逐个执行 `skillhub publish <skill目录> --dry-run`。若 CLI 未安装，会明确报 `SKILLHUB_CLI_MISSING`；可安装 CLI 或用 `SKILLHUB_BIN` 指向可执行文件后重试。

静态检查会预先拦截：市场版本不一致、漏进插件清单的新技能、缺失或重复 slug、技能目录中的图片文件、以及风格图片的失效/空引用。

仓库的 GitHub Actions 会在 PR 和 `master` 推送时自动运行 `npm run test:release` 与 `npm run release:check`。它不运行依赖本机客户端或账号的 Claude、WorkBuddy、SkillHub 关卡。

## 正式发布顺序

1. 获得发布授权后，提交并推送通过检查的变更。
2. 远端仓库更新后，Claude Code 与 WorkBuddy 市场均可读取新的清单；在干净环境或测试配置中重新安装验证。
3. 仅对本次需要发布的 SkillHub 技能，显式执行：

   ```bash
   skillhub publish <skill目录> --changelog "本次变更说明"
   ```

   SkillHub 的 API Token 只能由账号持有人配置和使用，不能写进仓库、脚本或日志。
4. 使用 `npx skills update` 更新本机通过 GitHub 安装的技能快照；它不是 symlink，不能替代推送后的远端验证。

## 渠道验收

### Claude Code

```text
/plugin marketplace add gogoingai/wenqu-skills
/plugin install wenqu-skills@wenqu-skills
/reload-plugins
```

确认六个 `/wenqu-*` 命令均可见。

### WorkBuddy

在“技能”页面添加市场源 `gogoingai/wenqu-skills`，安装 `wenqu-skills` 后重载或重启客户端。WorkBuddy 的界面使用其内置 CodeBuddy 插件引擎，因此本机原生校验通过 `codebuddy plugin validate` 执行。

### SkillHub

先确认 dry-run 成功，再执行单技能正式发布。发布后以 SkillHub 页面显示的版本、审核状态和下载内容为准；平台可能仍有审核或限频，因此不要把“命令成功返回”误写为“已公开上架”。
