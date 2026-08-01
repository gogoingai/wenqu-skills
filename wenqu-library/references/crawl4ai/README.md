# Crawl4AI / crwl：浏览器检索恢复与下载增强模块

`crwl` 是 Wenqu 的可选浏览器能力：优先把已选 URL 抓取为 Markdown，特别处理动态页面、文档站和公众号；当某个直连搜索引擎失败且存在专用食谱时，它也可在受限条件下恢复该引擎的浏览器检索。

## 在文库中的职责

- agent 原生搜索始终产生基础候选，`open-websearch search` 再做补充；`crwl` 不能替代两者。
- 仅当已定义食谱的直连引擎失败或无候选时，执行一次浏览器检索恢复；候选记录为 `crwl-serp:{engine}`，再与其他渠道统一去重。
- 下载优先 `crwl`；不可用、健康检查失败或单页失败时，自动改用 agent 原生下载并登记原因。
- 摘要、事实判断、去重和索引仍由 agent 完成；不使用 Crawl4AI 的 LLM Q&A 来替代这些步骤。

## 模块内容

- [CLI 与配置](cli.md)：命令、输出、配置、deep crawl、profiles 与不使用的能力。
- [检索恢复](search-recovery.md)：十个 `open-websearch` 引擎的分流、已定义的浏览器食谱与 URL 还原规则。
- [站点食谱](site-recipes.md)：普通网页、文档站、公众号与失败分流。

安装、浏览器设置和 doctor 的授权流程由 `collection-playbook.md` 统一控制。agent 获授权后自行完成，不要求用户进入终端。
