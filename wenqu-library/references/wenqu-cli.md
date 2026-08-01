# Wenqu CLI：搜索与下载增强

本技能只通过 `wenqu` 调用受管运行时；不要安装或调用第二套搜索/抓取 CLI、daemon 或 MCP。

## 环境与浏览器

每次本技能需要调用 `wenqu` 时，先说明将联网更新 Wenqu CLI 并请求一次明确授权；获授权后，优先用 `pipx` 隔离安装并更新到最新版：

```bash
pipx install --force wenqu-cli
```

若 `pipx` 不存在，才回退到当前 Python：

```bash
python3 -m pip install --user --upgrade wenqu-cli
export PATH="$(python3 -m site --user-base)/bin:$PATH"
```

随后运行只读检查：

```bash
wenqu doctor --json
```

`wenqu-cli` 包含 Python 和 Crawl4AI 依赖。若报告 Chromium 缺失，先运行下列预览；只有用户明确授权下载浏览器后，才执行不带 `--dry-run` 的命令：

```bash
wenqu setup library --dry-run --json
wenqu setup library
```

## 搜索

```bash
wenqu library search "<关键词>" --engines baidu,juejin,csdn --limit 9 --json
```

可选引擎是 `baidu`、`bing`、`linuxdo`、`csdn`、`duckduckgo`、`exa`、`brave`、`juejin` 与 `sogou`（也接受 `sougou` 和 `搜狗`）。`--limit` 是合并后的总上限；不要为了凑数默认全选。Startpage 已不属于 Wenqu CLI 的渠道。

每个结果都有 `engine` 与 `channel`。索引记录为 `wenqu-cli:{engine}`；若 `channel` 不是 `direct`，追加该值，例如 `wenqu-cli:csdn:delegate:duckduckgo` 或 `wenqu-cli:baidu:browser`。`partialFailures`、`skippedEngines` 与空结果都不能阻塞其余候选；Exa 没有 `EXA_API_KEY` 时会在请求前写入 `skippedEngines`。

百度、必应、Brave、搜狗直连失败或空结果时，CLI 默认使用 Crawl4AI 做一次浏览器回退。传 `--no-browser-fallback` 可关闭它。LinuxDo 与 CSDN 由公开搜索索引委托发现；掘金走公开接口。所有候选都必须在合并、去重与分级后再下载。

搜索只提供候选。公众号的搜狗结果也只能作为候选：先确认最终的原始 `mp.weixin.qq.com` URL，再下载；不能重放包装跳转链接、猜测标题匹配或绕过验证。

## 下载

```bash
# 单页
wenqu library fetch <url> --out {materials}/articles/<域名>/<slug>.md --json

# 限量同源抓取；N 必须在收集清单中明确
wenqu library fetch <url> --max-pages <N> --out {materials}/docs/<站点>.md --json

# 已确认的公开微信公众号文章
wenqu library fetch <mp.weixin.qq.com URL> \
  --out {materials}/articles/mp.weixin.qq.com/<slug>.md --json
```

微信公众号直达时，CLI 自动使用移动端微信 UA、Referer，并等待 `#js_content`。遇到验证、登录、付费墙、空正文或访问限制时，记录失败并改用 agent 原生下载或公开替代来源；不得反复请求或绕过访问控制。
