# Wenqu Skills

[English](README.md) | [简体中文](README.zh-CN.md)

> A complete article-creation workflow for AI agents.

![Wenqu logo](docs/logo.png)

Inspired by the Chinese literary star Wenqu, Wenqu Skills follows a traditional
path from broad research and planning to drafting, refinement, illustration,
translation, and publication.

Wenqu combines that path with specialized agent skills. Together, they turn
one-off content generation into a reusable, evidence-backed writing workflow.

## Workflow

```text
Research -> Plan -> Draft -> Refine -> Review -> Illustrate -> Translate -> Publish
```

The skills overlap where necessary and work together from source collection to
publish-ready output.

## Included skills

| Skill | Writing stage | What it does |
| --- | --- | --- |
| [`wenqu-library`](wenqu-library/) | Research | Plans, searches, downloads, and indexes reusable source material for articles, reports, tutorials, project introductions, and explainers. Native agent search is the primary path; optional CLIs supplement candidates and `crwl` can capture web pages, including WeChat articles. |
| [`wenqu-write`](wenqu-write/) | Plan and draft | Coordinates requirements, topic analysis, planning, structure, section-by-section writing, translation, illustrations, and review for Chinese content. |
| [`wenqu-review`](wenqu-review/) | Refine and review | Checks factual claims, structure, wording, English terminology, translationese, and AI-writing traces, then provides actionable revisions. |
| [`wenqu-image`](wenqu-image/) | Illustrate | Plans visuals for content, writes image prompts, generates images, performs quality checks, and uploads adopted images. |
| [`wenqu-translate`](wenqu-translate/) | Translate | Converts English materials into natural Chinese while preserving structure and meaning. |
| [`wenqu-publish`](wenqu-publish/) | Publish | Removes authoring traces and prepares a clean release version with title options, summary, and cover material. |

## Install the complete workflow

Wenqu is designed to be installed as one workflow. Install all six skills with
[`npx skills`](https://github.com/vercel-labs/skills):

```bash
npx skills add gogoingai/wenqu-skills --all -g
```

- `--all` installs the complete Wenqu workflow for detected agents.
- `-g` installs it in the user-wide skill directory.

> You may see an `eve` or `promptscript does not support global skill installation`
> warning. It is a limitation of those two agents in the installer, not of this
> repository; the other supported agents, including Claude Code, still install normally.

### Claude Code marketplace

Add the Wenqu marketplace, install the single `wenqu-skills` plugin, and reload
the current session. The plugin contains all six skills.

```text
/plugin marketplace add gogoingai/wenqu-skills
/plugin install wenqu-skills@wenqu-skills
/reload-plugins
```

`/reload-plugins` loads the skills into the current session immediately; new
sessions do not need it again. To update:

```text
/plugin marketplace update wenqu-skills
/plugin update wenqu-skills@wenqu-skills
/reload-plugins
```

### Codex plugin marketplace

Codex directly recognizes this repository's plugin marketplace. It installs the
complete `wenqu-skills` package, containing all six skills.

1. In the sidebar, open **Plugins**. Choose **Create** → **Add plugin marketplace**.

   ![Open Add plugin marketplace in Codex](docs/codex/plugin-marketplace-01-add.png)

2. Enter the repository source below. Leave **Git ref** and **Sparse path** empty,
   then add the marketplace.

   ```text
   gogoingai/wenqu-skills
   ```

3. Open the **Personal** tab, find **Wenqu Skills**, and click **Install**.

   ![Install Wenqu Skills from the Codex personal marketplace](docs/codex/plugin-marketplace-02-install.png)

Start a new Codex task after installation so it loads the plugin skills.

### WorkBuddy installation

WorkBuddy has two installation paths: **Marketplace** adds a GitHub or local
source and installs the complete Wenqu plugin; its built-in **SkillHub** catalog
installs individual skills.

#### Marketplace (GitHub source)

Use this route to install the complete workflow directly from this repository.

1. Open **Expert · Skills · Connectors**, select **Skills**, then choose the
   **Marketplace** tab and click **+**.

   ![Open WorkBuddy Marketplace](docs/workbuddy/marketplace-01-open.png)

2. Enter the repository source and submit it:

   ```text
   gogoingai/wenqu-skills
   ```

   ![Add the Wenqu Skills marketplace source](docs/workbuddy/marketplace-02-add-source.png)

3. Select the resulting `wenqu-skills` marketplace and click **+** on **Wenqu Skills** to begin installation.

   ![Choose Wenqu Skills from the WorkBuddy marketplace](docs/workbuddy/marketplace-03-install.png)

4. Wait until the plugin appears under **My Installed**, then reload or restart WorkBuddy so the skills appear.

#### Built-in SkillHub

This second path does **not** require adding the GitHub Marketplace source.
Open **Expert · Skills · Connectors**, select the **SkillHub** tab, search for
`wenqu`, and click **+** on each skill you want. WorkBuddy shows six individual
Wenqu skills: Library, Write, Review, Image, Translate, and Publish.

![Search for Wenqu skills in WorkBuddy SkillHub](docs/workbuddy/skillhub-01-search-wenqu.png)

Each SkillHub skill has its own catalog version and review status; it is not the
same package as the GitHub Marketplace plugin.

### SkillHub website or agent install

[SkillHub](https://skillhub.cn) also supports agent-driven installation. To ask
an agent to install all six skills through SkillHub, paste:

> Follow https://skillhub.cn/install/skillhub.md to install wenqu-library, wenqu-write, wenqu-review, wenqu-image, wenqu-translate, and wenqu-publish.

## Dependencies

### `wenqu-image`

`wenqu-image` uses the `codex` CLI for image generation. Install it and sign in:

```bash
codex login
```

### `wenqu-library`

`wenqu-library` always starts with the agent's native web search. Optional global
CLIs only supplement search and downloading:

- `open-websearch` adds multi-engine search candidates; it never replaces native search.
- `crwl` (Crawl4AI) captures dynamic pages and WeChat articles. If a known direct
  search recipe fails, it can fall back to browser search; otherwise it falls back
  to the agent's native capability.

When a dependency is missing, the skill explains what will be installed and asks
once for authorization. After approval, the agent installs, configures, and
verifies it; users do not need to manually adjust `PATH` or debug the setup.

See [`wenqu-library/references/open-websearch/`](wenqu-library/references/open-websearch/)
and [`wenqu-library/references/crawl4ai/`](wenqu-library/references/crawl4ai/) for
engine selection, CLI parameters, and site-capture strategies.
