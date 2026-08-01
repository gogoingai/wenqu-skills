# crwl CLI、配置与使用边界

## 文库默认下载面

```bash
crwl <url> -o markdown -O <输出文件>
crwl <url> -o markdown-fit -O <输出文件>       # 噪音或脚本残留时的一次重试
crwl <url> --deep-crawl bfs --max-pages <N> -o markdown -O <输出文件>
```

`crwl <url>` 是 `crwl crawl <url>` 的简写。`-o` 支持 `all`、`json`、`markdown`/`md`、`markdown-fit`/`md-fit`；文库默认使用 Markdown。开启整站抓取的参数是 `--deep-crawl`，其 `--max-pages` 必须显式设置，结果是一个以 `======` 和 URL 分隔的合并文件。

## 两种配置方式

配置文件参数是 `-B`（浏览器）与 `-C`（抓取器）；它们适合复用复杂配置，内联参数只适合单页小改动。

| 目的 | CLI | 何时使用 |
| --- | --- | --- |
| 浏览器配置文件 | `-B <YAML/JSON>` | UA、headers、固定浏览器参数；公众号搜狗入口使用它注入 Referer |
| 抓取配置文件 | `-C <YAML/JSON>` | 可复用的等待、缓存、滚动和页面策略 |
| 浏览器内联覆盖 | `-b "key=value,..."` | 单页、无逗号的简单参数 |
| 抓取内联覆盖 | `-c "key=value,..."` | `wait_for`、`delay_before_return_html`、`css_selector`、`scan_full_page` |

`-b` 与 `-c` 均按逗号切分参数，因此 UA 不能含逗号；复杂 headers 必须使用 `-B` 配置文件。文库默认绕过缓存抓新内容；动态长页可加 `scan_full_page=true`，必要时增加 `delay_before_return_html`。

## 可用但默认不启用的能力

- `-e`/`-s`（CSS/XPath 结构化提取）：只在浏览器检索恢复的站点食谱中提取标题与链接；不得用它代替正文判断、摘要或索引。
- `-j`、`-q`：需要 LLM 配置；文库默认不用，仍由 agent 读正文、写摘要和索引。
- `profiles`：管理登录态；`-p <profile>` 可用于用户已授权的登录内容。文库不创建登录态、不绕过登录或付费墙。
- `browser`、`cdp`、`config set`：管理常驻浏览器、调试端口或全局配置；文库不为普通素材收集启动或改写这些状态。

## 安装与健康条件

用户授权后，agent 优先运行 `uv tool install --upgrade crawl4ai`；无 uv 时使用 `python3 -m pip install --user -U crawl4ai`，随后运行 `crawl4ai-setup` 和 `crawl4ai-doctor`。只有 doctor 成功并能抓取公开页面，才把 `crwl` 作为本轮下载器；否则自动改用原生下载。
