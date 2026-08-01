# crwl 站点食谱与失败分流

## 普通文章

```bash
crwl <url> -o markdown -O {materials}/articles/<域名>/<slug>.md
```

失败或正文噪音严重时，用 `-o markdown-fit` 重试一次；仍失败则 agent 原生下载。每个 URL 串行抓取，成功和失败都立即登记来源、检索渠道、下载方式与原因。

## 访问失败与降级

`crwl` 处理的是已确认 URL 的下载，不承担全网搜索。先按对应站点食谱抓取；出现验证页、空正文、登录、付费墙或访问限制时，记录原因并改用 agent 原生下载或公开替代来源，不反复请求，也不绕过访问控制。

## 文档站

```bash
crwl <url> --deep-crawl bfs --max-pages <N> \
  -o markdown -O {materials}/docs/<站点>.md
```

`N` 由收集清单确定，不能省略。合并产物按 `======` 分隔页面；超出范围、需要登录或抓取失败的页面不静默跳过。

## 微信公众号

普通 `mp.weixin.qq.com` 页面使用无逗号的 MicroMessenger UA，并等待正文容器：

```bash
crwl <文章 URL> \
  -b "user_agent=Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML like Gecko) Mobile/15E148 MicroMessenger/8.0.43 NetType/WIFI Language/zh_CN" \
  -c "wait_for=css:#js_content,delay_before_return_html=2.0" \
  -o markdown -O <输出文件>
```

搜狗发现的 `src=11` 入口还需 Referer。agent 在本轮临时目录创建下列 JSON，抓完删除：

```json
{"user_agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML like Gecko) Mobile/15E148 MicroMessenger/8.0.43 NetType/WIFI Language/zh_CN","headers":{"Referer":"https://weixin.sogou.com/"}}
```

```bash
crwl <含 src=11 的 URL> -B <临时浏览器配置.json> \
  -c "wait_for=css:#js_content,delay_before_return_html=2.0" \
  -o markdown -O <输出文件>
```

### 搜狗微信：按已确认标题在同一会话中进入正文

只在 agent 已从原生搜索或其他候选中确认**文章标题**（必要时还有公众号名）后使用本同会话发现路径。查询词应包含该标题；不要先把搜狗微信结果链接保存下来、再另开 `crwl` 访问，更不能默认点击结果页第一条。

agent 在本轮临时目录生成 `-C` 配置，用 `js_code_before_wait` 完成下列动作：

1. 在当前搜狗微信页取 `h3 a[href*="/link?"]` 的文章标题链接。
2. 用本次已确认的标题做规范化精确匹配；有且仅有一个匹配时，在当前页面跳转。
3. 等待 `#js_content`，再导出 Markdown；临时配置用完即删除。

如果标题没有匹配项或出现多个匹配项，停止该路径并记录“无法在当前会话精确定位”，不要猜测、按排名点击或为规避广告而加入固定关键词规则。完成后确认产物确为正文，并记录最终的原始 `mp.weixin.qq.com` URL 与渠道 `crwl-serp:sogou-weixin`。没有正文、最终 URL 无法确认、出现验证或访问控制时，记录失败，回到原生搜索或公开替代来源；不重放搜狗跳转链接、不绕过验证。

## 失败分类

| 现象 | 处理 |
| --- | --- |
| 环境异常、验证页、正文极短 | 按公众号 UA 与 Referer 食谱重试一次，仍失败则改用原生下载并记录反爬 |
| 浏览器可执行文件不存在 | agent 运行 setup 与 doctor；仍失败则改用原生下载 |
| 超时、乱码或脚本残留 | 一次 `markdown-fit` 或合理等待重试；仍失败则改用原生下载 |
| 登录、付费墙或访问控制 | 记录该限制，寻找公开替代来源；不绕过 |
