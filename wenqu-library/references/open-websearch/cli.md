# open-websearch CLI 与结果协议

## Wenqu 使用的命令

```bash
open-websearch search "<关键词>" --limit <总数> --engines <逗号分隔引擎> --json
```

- `--engine NAME` 可重复指定单个引擎；`--engines a,b` 指定多个引擎，两种写法可组合。
- `--limit N` 是**所有选中引擎共享的总上限**，CLI 会平均分摊给各引擎；三引擎想各取约 3 条，应设 `--limit 9`，不要误设为 3。
- `--search-mode request|auto|playwright` 只影响 Bing：`request` 只请求，`auto` 请求失败才尝试浏览器，`playwright` 强制浏览器。文库默认不传；浏览器不是普通搜索的安装前提。
- `--json` 时 stdout 是 JSON envelope，stderr 可能有运行日志；只解析 stdout。

示例：

```bash
# 中文技术文章补充：总共最多 9 条，三引擎各约 3 条
open-websearch search "<主题> 技术解析" \
  --engines baidu,juejin,csdn --limit 9 --json

# 搜狗中文网页候选；公众号发现另走 crwl 的同会话食谱
open-websearch search "<主题> 公众号" --engine sogou --limit 5 --json
```

## JSON 成功与失败

成功 envelope 形状：

```json
{"status":"ok","data":{"query":"...","engines":["..."],"totalResults":0,"results":[{"title":"...","url":"...","description":"...","source":"...","engine":"..."}],"partialFailures":[]},"error":null}
```

- 每个结果的渠道写为 `open-websearch:{result.engine}`，而不是笼统写 `open-websearch`。
- `partialFailures` 的每项有 `engine`、`code`、`message`。单引擎失败时保留其它引擎结果，并把失败写入本轮记录。
- `status: "error"`、无法解析 JSON、退出失败或 `totalResults: 0` 时不再产生补充候选；agent 原生搜索结果照常进入后续流程。

## 结果处理

不要把 CLI 整体返回成功等同于每个请求的引擎都有可用候选。对本次请求的引擎逐一处理：

1. 有结果的引擎：将每条结果记录为 `open-websearch:{engine}`，再参与统一去重。
2. `partialFailures` 列出的引擎：记录 `code` 与 `message`，不阻塞其它候选。
3. 没有结果且没有失败记录的引擎：记为“本次无候选”，不作能力判断，也不阻塞收集。

stdout 只解析 JSON；stderr 作为执行日志保留。素材台账只写实际进入候选池的来源，执行记录另存失败与无候选信息。

## 运行模型与边界

一次性 `search` 会尝试复用已存在的本地 daemon，未找到时可直接执行；Wenqu **不启动 daemon**、不传 `--spawn`、不写 daemon/MCP 配置。`--daemon-url` 会强制指定 daemon 且禁用直接执行，不适合文库默认路径。

所有结果先按规范化 URL 合并；不得移除签名参数，也不得破坏微信公众号 `src=11` 入口。搜索结果只是候选，最终事实必须来自下载后的原文。
