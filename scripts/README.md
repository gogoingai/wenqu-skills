# Platform-native release checks

Run `skills-eval check .` before every release. It owns Wenqu's static
repository checks and configured security scanning; this directory only keeps
the checks that must call a platform-native CLI.

When Claude Code and WorkBuddy are installed on the machine, also run their
native manifest validators:

```bash
npm run release:check:runtime
```

To package every declared skill with SkillHub's own dry-run validator, first
install and log in to the SkillHub CLI, then run:

```bash
npm run release:check:skillhub
```

This is still a preflight: it runs `skillhub publish <skill> --dry-run` and
never performs a formal publication. If the CLI is not on `PATH`, set
`SKILLHUB_BIN` to its executable path.

`npm run release:check:runtime` invokes Claude Code and WorkBuddy's native
manifest validators when installed. `npm run release:check:skillhub` invokes
SkillHub's per-Skill publish dry-run. Neither command replaces Skills Eval.
