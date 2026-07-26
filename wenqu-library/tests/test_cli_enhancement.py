"""Regression checks for the optional CLI enhancement contract."""

from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[2]
LIBRARY = ROOT / "wenqu-library"


def read(relative_path: str) -> str:
    return (LIBRARY / relative_path).read_text(encoding="utf-8")


class CliEnhancementContractTests(unittest.TestCase):
    def test_native_search_is_required_before_optional_cli_search(self) -> None:
        skill = read("SKILL.md")
        playbook = read("references/collection-playbook.md")
        search_section = playbook[playbook.index("## 第 2 步：搜索与候选合并") :]

        self.assertIn("agent 自带的联网搜索工具", skill)
        self.assertIn("原生搜索", search_section)
        self.assertIn("open-websearch", search_section)
        self.assertLess(search_section.index("agent 自带的联网搜索工具"), search_section.index("open-websearch"))

    def test_search_sources_are_merged_and_deduplicated_before_download(self) -> None:
        playbook = read("references/collection-playbook.md")

        self.assertIn("统一去重", playbook)
        self.assertIn("检索渠道", playbook)
        self.assertIn("下载", playbook[playbook.index("统一去重") :])

    def test_optional_clis_have_agent_owned_install_and_fallback_paths(self) -> None:
        skill = read("SKILL.md")
        playbook = read("references/collection-playbook.md")

        for text in (skill, playbook):
            self.assertIn("用户明确授权", text)
            self.assertIn("agent 自带", text)
        self.assertIn("npm install -g open-websearch", playbook)
        self.assertIn("uv tool install", playbook)
        self.assertIn("crawl4ai-doctor", playbook)

    def test_cookbooks_cover_cli_only_search_and_src11_wechat_capture(self) -> None:
        search = read("references/open-websearch/cli.md")
        crawl = read("references/crawl4ai/site-recipes.md")

        self.assertIn("open-websearch search", search)
        self.assertIn("--json", search)
        self.assertIn("不启动 daemon", search)
        self.assertIn("src=11", crawl)
        self.assertIn("Referer", crawl)
        self.assertIn("#js_content", crawl)

    def test_crwl_access_failures_degrade_without_bypassing_controls(self) -> None:
        crawl = read("references/crawl4ai/site-recipes.md")

        self.assertIn("已确认 URL", crawl)
        self.assertIn("agent 原生下载", crawl)
        self.assertIn("不绕过", crawl)

    def test_browser_search_recovery_is_recipe_scoped_and_wechat_is_in_session(self) -> None:
        recovery = read("references/crawl4ai/search-recovery.md")
        recipe = read("references/crawl4ai/site-recipes.md")

        for engine in ("`baidu`", "`bing`", "`brave`", "`sogou`"):
            self.assertIn(engine, recovery)
        self.assertIn("不统一食谱", recovery)
        self.assertIn("crwl-serp:{engine}", recovery)
        self.assertIn("不另开浏览器恢复", recovery)
        self.assertIn("同会话", recipe)
        self.assertIn("精确匹配", recipe)
        self.assertIn("不重放搜狗跳转链接", recipe)
        self.assertIn("js_code_before_wait", recipe)
        self.assertIn("#js_content", recipe)
        self.assertFalse((LIBRARY / "references/crawl4ai/wechat-discovery.yml").exists())

    def test_wenqu_write_delegation_preserves_search_channels(self) -> None:
        write_skill = (ROOT / "wenqu-write" / "SKILL.md").read_text(encoding="utf-8")
        questionnaire = (ROOT / "wenqu-write" / "references/planning/questionnaire.md").read_text(
            encoding="utf-8"
        )

        self.assertIn("agent 原生搜索为主", write_skill)
        self.assertIn("检索渠道", write_skill)
        self.assertIn("检索渠道", questionnaire)

    def test_external_cli_tools_have_complete_separate_reference_modules(self) -> None:
        search_dir = LIBRARY / "references" / "open-websearch"
        crawl_dir = LIBRARY / "references" / "crawl4ai"

        for path in (
            search_dir / "README.md",
            search_dir / "cli.md",
            search_dir / "engines.md",
            search_dir / "setup.md",
            crawl_dir / "README.md",
            crawl_dir / "cli.md",
            crawl_dir / "search-recovery.md",
            crawl_dir / "site-recipes.md",
        ):
            self.assertTrue(path.exists(), f"missing tool reference: {path}")

        engines = (search_dir / "engines.md").read_text(encoding="utf-8")
        for engine in (
            "baidu",
            "bing",
            "linuxdo",
            "csdn",
            "duckduckgo",
            "exa",
            "brave",
            "juejin",
            "startpage",
            "sogou",
        ):
            self.assertIn(f"`{engine}`", engines)

        cli = (search_dir / "cli.md").read_text(encoding="utf-8")
        self.assertIn("partialFailures", cli)
        self.assertIn("分摊", cli)
        self.assertIn("不启动 daemon", cli)

        self.assertIn("`sogou`", engines)
        self.assertIn("论文", engines)
        self.assertIn("arXiv", engines)
        self.assertIn("学术专用引擎", engines)
        self.assertIn("实际返回", engines)
        self.assertIn("有结果的引擎", cli)
        self.assertIn("stderr", cli)

        crawl = (crawl_dir / "cli.md").read_text(encoding="utf-8")
        self.assertIn("`-B`", crawl)
        self.assertIn("`-C`", crawl)
        self.assertIn("`--deep-crawl`", crawl)
        self.assertIn("profiles", crawl)

    def test_skill_does_not_preserve_one_off_network_observations(self) -> None:
        search_files = (
            read("references/open-websearch/README.md"),
            read("references/open-websearch/cli.md"),
            read("references/open-websearch/engines.md"),
            read("references/open-websearch/setup.md"),
        )
        write_skill = (ROOT / "wenqu-write" / "SKILL.md").read_text(encoding="utf-8")

        for text in search_files:
            self.assertNotIn("2026-07-26 实测", text)
            self.assertNotIn("Request failed with status code", text)
            self.assertNotIn("本地已验证", text)
        self.assertNotIn("已验证可用的 `open-websearch`", write_skill)


if __name__ == "__main__":
    unittest.main()
