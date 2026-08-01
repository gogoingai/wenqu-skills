# 发布脚本

这两个脚本只能在发布改动已通过 PR 合入 `master`、且获得正式发布授权后运行；它们不替代 PR 审查。

日常 PR 的静态、安全和免登录原生校验统一由 Skills Eval 执行：

```bash
skills-eval check . \
  --external-target claude-plugin \
  --external-target workbuddy \
  --external-target clawhub
```

它会运行 Claude Code、WorkBuddy 与 ClawHub package validate，不会正式发布。
报告的“外部发布校验”会列出本次实际执行的目标。

SkillHub 的远端 dry-run 仍只在有平台登录态的发布前环境执行：

```bash
skills-eval check . --external
```

本目录只保留有副作用的正式发布脚本：`publish-skillhub.sh` 与
`publish-clawhub.mjs`。它们的具体发布参数与 dry-run 用法见脚本头部注释和
仓库根目录的 [RELEASE.md](../RELEASE.md)。
