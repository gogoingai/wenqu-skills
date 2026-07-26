# Release checks

Run the repository-level release check before publishing a Wenqu Skills update:

```bash
npm run release:check
```

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

The static check verifies that:

- `VERSION`, the Claude plugin manifest, and the shared Claude/WorkBuddy
  marketplace manifest use the same package version;
- every skill listed by `.claude-plugin/plugin.json` exists and stays inside the
  repository;
- each declared skill includes the required Claude and WorkBuddy frontmatter;
- WorkBuddy metadata is non-empty, and its per-skill `version` is valid SemVer;
- SkillHub slugs are valid and unique, and an image is never bundled inside a
  declared skill directory;
- every declared skill has a valid HTTPS `metadata.openclaw.homepage`;
- every root `wenqu-*/SKILL.md` is declared by the plugin package;
- every `wenqu-image-assets/styles/` image is referenced by a Wenqu Image document
  or script, and every explicit asset reference resolves to a local image;
- `CHANGELOG.md` contains an entry for the package version.

Per-skill WorkBuddy versions are intentionally only checked for valid SemVer.
They may have an independent release cadence from the plugin package version.

These checks never create a tag, publish a package, commit, or push changes.
