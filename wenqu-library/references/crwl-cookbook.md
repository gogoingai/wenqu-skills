# crwl 命令手册（实测验证）

Crawl4AI 的 CLI 工具 `crwl` 的实用命令参考。本手册所有命令都在 macOS 上实际跑通过（2026-07-25，crawl4ai v0.9.2），产物行为以实测为准——上游 README 的描述与实际行为有出入时，以本文为准。

## 安装

```bash
# 推荐：uv 隔离安装，不污染项目环境
uv tool install crawl4ai

# 或 pip
pip install -U crawl4ai
```

首次使用安装浏览器引擎（约 300MB）并自检：

```bash
crawl4ai-setup
crawl4ai-doctor
```

已知坑：

- **uv 安装的 crwl 在 `~/.local/bin/`**，该目录可能不在 PATH 里。`command -v crwl` 找不到时先试 `~/.local/bin/crwl`，或把目录加进 PATH
- **Playwright 浏览器版本要和 crawl4ai 要求的匹配**。机器上装过其他 Playwright 项目不代表能用——版本不符会报 "Executable doesn't exist"，按提示跑 `python -m playwright install chromium`（uv 安装时用 `uv tool run --from crawl4ai python -m playwright install chromium`）
- 升级 crawl4ai 版本后浏览器可能要重装匹配版本

## 单页抓取

```bash
crwl <url> -o markdown -O <输出文件路径>
```

- `-o markdown` 输出正文 markdown；`markdown-fit` 是过滤后的精简版；`json` 输出结构化结果；`all` 输出全部
- 不加 `-O` 直接打到 stdout
- 产物实测：标题、正文、链接都在，导航栏等噪音较少

## 整站 / 文档站抓取（deep-crawl）

```bash
crwl <url> --deep-crawl bfs --max-pages <N> -o markdown -O <输出文件路径>
```

- 策略：`bfs`（广度优先，默认）、`dfs`、`best-first`
- **`--max-pages` 必须显式限制**，否则整站可能抓出几百页
- **产物实测（重要）**：是**合并的单个 markdown 文件**，页面之间用 `======` + `# <url>` 分隔，不是上游 README 说的"目录 + index.json + 每页一个文件"。整理时按分隔符拆着读
- 产物落到本篇素材目录的 `docs/` 下

## 微信公众号

默认抓取会被反爬拦截——返回 177 字节左右的"环境异常"验证页，不是正文。必须伪装微信内置浏览器 UA 并等待正文容器渲染：

```bash
crwl <url> \
  -b "user_agent=Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML like Gecko) Mobile/15E148 MicroMessenger/8.0.43 NetType/WIFI Language/zh_CN" \
  -c "wait_for=css:#js_content,delay_before_return_html=2.0" \
  -o markdown -O <输出文件路径>
```

实测要点：

- **UA 字符串里不能含逗号**：crwl 的 `-b`/`-c` 参数按逗号拆分 key=value，UA 里有逗号会直接报 `Invalid key=value pair`。上面这条 UA 已把标准 UA 里的逗号去掉，实测可用
- `#js_content` 是公众号正文的固定容器 id，`wait_for` 等它出现再抓
- `delay_before_return_html=2.0` 给正文留出渲染时间
- 实测产物：标题、作者、公众号名、发布时间、正文、图片链接都在（约 18KB/篇）
- 图片是 mmbiz.qpic.cn 的外链，微信有防盗链，markdown 里直接引用在其他平台可能裂图；需要图片时另行下载（ Referer 头要带 `https://mp.weixin.qq.com/`）

## 结果判断与失败处理

| 现象 | 判断 | 处理 |
|------|------|------|
| 产物只有一两百字节，含"环境异常"/"验证" | 反爬拦截 | 公众号换 UA 方案；其他站点试 `-p` profile 或换来源 |
| 报 "Executable doesn't exist" / playwright install | 浏览器未装或版本不匹配 | 跑 `python -m playwright install chromium` |
| 超时 | 站点慢或需登录 | 重试一次；仍失败登记「抓取失败：超时」 |
| 内容需要登录/付费 | 页面提示登录 | 试 `-p <profile>`（需先 `crwl profiles` 建登录态 profile）；不行则告知用户换来源或手动提供 |
| 产物是乱码/大量脚本残留 | 页面渲染异常 | 换 `markdown-fit` 重抓一次；仍异常按失败登记 |

**所有失败都在 index.md 登记 URL + 原因，不静默跳过。**

## 其他有用参数（速查）

```bash
crwl <url> -c "css_selector=article,scan_full_page=true"   # 只抓指定容器 + 滚动加载全页
crwl <url> -c "cache_mode=bypass"                          # 绕过缓存强制重抓
crwl <url> -b "headless=false"                             # 有头模式（调试反爬时用）
crwl <url> -p <profile>                                    # 用浏览器 profile（登录态）
crwl config set DEFAULT_LLM_PROVIDER openai/gpt-4o        # 配置 LLM（-q/-j 提取用）
```

LLM 相关（`-q` 提问、`-j` 结构化提取）需要先 `crwl config set` 配好 provider 和 token，素材收集流程默认不用——提炼摘要由 agent 自己做，不依赖外部 LLM 配置。
