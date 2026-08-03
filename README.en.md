# Wenqu Skills

[English](README.en.md) | [简体中文](README.md)

> A complete article-creation workflow for AI agents.

![Wenqu logo](assets/logo.png)

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
| [`wenqu-library`](wenqu-library/) | Research | Plans, searches, downloads, and indexes reusable source material for articles, reports, tutorials, project introductions, and explainers. Native agent search is the primary path; `wenqu library` supplements candidates and captures web pages, including WeChat articles. |
| [`wenqu-write`](wenqu-write/) | Plan and draft | Coordinates requirements, topic analysis, planning, structure, section-by-section writing, translation, illustrations, and review for Chinese content. |
| [`wenqu-review`](wenqu-review/) | Refine and review | Checks factual claims, structure, wording, English terminology, translationese, and AI-writing traces, then provides actionable revisions. |
| [`wenqu-image`](wenqu-image/) | Illustrate | Plans visuals for content, writes image prompts, generates images, performs quality checks, and uploads adopted images. |
| [`wenqu-translate`](wenqu-translate/) | Translate | Converts English materials into natural Chinese while preserving structure and meaning. |
| [`wenqu-publish`](wenqu-publish/) | Publish | Removes authoring traces and prepares a clean release version with title options, summary, and cover material. |

## Install the complete workflow

> Recommended: try Wenqu via [WorkBuddy](#workbuddy) -- the hy3 model is free, and you can claim 100 credits daily.

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

Update installed skills:

```bash
npx skills update -g
```

### WorkBuddy

WorkBuddy ships with a built-in **SkillHub** catalog for installing individual Wenqu skills. The hy3 model is currently free on WorkBuddy, and you can claim 100 credits daily -- a good way to try the full Wenqu workflow at no cost.

<!-- The bundled Wenqu suite (wenqu-skills plugin package) install path is hidden for now. To restore, remove this comment and switch the intro above back to "two installation paths".
#### Marketplace (GitHub source)

Use this route to install the complete workflow directly from this repository.

1. Open **Expert · Skills · Connectors**, select **Skills**, then choose the
   **Marketplace** tab and click **+**.

   ![Open WorkBuddy Marketplace](assets/workbuddy/marketplace-01-open.png)

2. Enter the repository source and submit it:

   ```text
   gogoingai/wenqu-skills
   ```

   ![Add the Wenqu Skills marketplace source](assets/workbuddy/marketplace-02-add-source.png)

3. Select the resulting `wenqu-skills` marketplace and click **+** on **Wenqu Skills** to begin installation.

   ![Choose Wenqu Skills from the WorkBuddy marketplace](assets/workbuddy/marketplace-03-install.png)

4. Wait until the plugin appears under **My Installed**, then reload or restart WorkBuddy so the skills appear.
-->

Open **Expert · Skills · Connectors**, select the **SkillHub** tab, search for
`wenqu`, and click **+** on each skill you want. WorkBuddy shows six individual
Wenqu skills: Library, Write, Review, Image, Translate, and Publish.

![Search for Wenqu skills in WorkBuddy SkillHub](assets/workbuddy/skillhub-01-search-wenqu.png)

Each SkillHub skill has its own catalog version and review status; it is not the
same package as the GitHub Marketplace plugin.

### Qwen Work

[Qwen Work](https://qwenwork.cn/) now supports Wenqu skills, with its skill directory at `~/.qwenworkcn/skills/`. Send the prompt below in Qwen Work to automatically clone the repository and install all six Wenqu skills:

```text
Please clone the repository from https://github.com/gogoingai/wenqu-skills and install the following six skills from the repository root into ~/.qwenworkcn/skills/: wenqu-library, wenqu-write, wenqu-review, wenqu-image, wenqu-translate, wenqu-publish. Keep each skill's SKILL.md, references, and other auxiliary files intact. After installation, list all successfully recognized Wenqu skills.
```

![Install result in Qwen Work after running the prompt](assets/qwen-work/install-01-result.png)

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

1. In the sidebar, open **Plugins**. Choose **Create** -> **Add plugin marketplace**.

   ![Open Add plugin marketplace in Codex](assets/codex/plugin-marketplace-01-add.png)

2. Enter the repository source below. Leave **Git ref** and **Sparse path** empty,
   then add the marketplace.

   ```text
   gogoingai/wenqu-skills
   ```

3. Open the **Personal** tab, find **Wenqu Skills**, and click **Install**.

   ![Install Wenqu Skills from the Codex personal marketplace](assets/codex/plugin-marketplace-02-install.png)

Start a new Codex task after installation so it loads the plugin skills.

### SkillHub website or agent install

[SkillHub](https://skillhub.cn) also supports agent-driven installation. To ask
an agent to install all six skills through SkillHub, paste:

> Follow [https://skillhub.cn/install/skillhub.md](https://skillhub.cn/install/skillhub.md) to install wenqu-library, wenqu-write, wenqu-review, wenqu-image, wenqu-translate, and wenqu-publish.

### ClawHub (OpenClaw)

[ClawHub](https://clawhub.ai) is the skill and plugin marketplace for the OpenClaw
ecosystem. Wenqu is at <https://clawhub.ai/gogoingai>. The recommended way is to
install the `wenqu-skills` plugin package, which includes all six skills at once:

```bash
openclaw plugins install clawhub:@gogoingai/wenqu-skills
```

Or install the skills one by one:

```bash
openclaw skills install @gogoingai/wenqu-library
openclaw skills install @gogoingai/wenqu-write
openclaw skills install @gogoingai/wenqu-review
openclaw skills install @gogoingai/wenqu-image
openclaw skills install @gogoingai/wenqu-translate
openclaw skills install @gogoingai/wenqu-publish
```

To update: run `openclaw plugins update --all` for the plugin package, or `openclaw skills update` for individually installed skills.

## Dependency

- [`wenqu-cli`](https://github.com/gogoingai/wenqu-cli): runtime for `wenqu-image` and `wenqu-library`.

### `wenqu-image`

`wenqu-image` supports five image paths: a signed-in Codex CLI, OpenAI GPT Image,
OpenRouter, DashScope Qwen Image, and Volcengine Seedream. Check the local environment after installation:

```bash
wenqu image doctor --json
```

The Codex path requires `codex login`. Store API secrets only in the local
`~/.gogoingai/wenqu-skills/image/credentials.env`; store default model, aspect ratio, and optional
API base URLs in `config.json` in the same directory. An article can override model selection
in `wenqu-skills/{article-file-name}/config/image.json`; it must never contain secrets or endpoints.

```bash
wenqu image generate \
  --provider dashscope --model qwen-image-2.0-pro --ar 16:9 \
  --prompt "A Chinese technical architecture diagram" --out /tmp/diagram --timeout-sec 300 --upload
```

The CLI itself invokes configured PicGo for `--upload`.

### `wenqu-library`

`wenqu-library` always starts with the agent's native web search. The managed
`wenqu library` commands only supplement multi-engine discovery and downloading.
Its Crawl4AI adapter can make one browser fallback for failed Baidu, Bing, Brave,
and Sogou searches; downloads support dynamic pages, bounded same-origin crawls,
and confirmed public WeChat article URLs. Failures fall back to the agent's native
capability.

See [`wenqu-library/references/wenqu-cli.md`](wenqu-library/references/wenqu-cli.md)
for engine selection, CLI parameters, and capture strategies.

## Maintenance and releases

Every change to Skills, manifests, versions, image assets, or release
configuration must be merged into `master` through a pull request; direct
pushes are not allowed. Each pull request runs Skills Eval automatically and
posts its format, security, Claude Code, WorkBuddy, and ClawHub validation
report as a PR comment.

See the [development guide](DEVELOPMENT.md) before making a change. For a
version or marketplace release, follow the [release guide](RELEASE.md) only
after the pull request has been merged.
