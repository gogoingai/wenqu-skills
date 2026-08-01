# 发布脚本

发布前的静态、安全和平台原生校验统一由 Skills Eval 执行：

```bash
skills-eval check . --external
```

它会运行 Claude Code、WorkBuddy、SkillHub dry-run 与 ClawHub package validate
中已启用的项目，但不会正式发布。缺少客户端、登录态或网络不可用时，报告会在“外部发布校验”中单独说明。

本目录只保留有副作用的正式发布脚本：`publish-skillhub.sh` 与
`publish-clawhub.mjs`。它们的具体发布参数与 dry-run 用法见脚本头部注释和
仓库根目录的 [RELEASE.md](../RELEASE.md)。
