# open-websearch：搜索补充模块

这是 Wenqu 的候选发现增强，不是网页下载器，也不替代 agent 原生搜索。

## 在文库中的职责

1. 每组关键词先由 agent 原生搜索，形成基础候选。
2. `open-websearch search` 用同一关键词补充候选；合并、去重和分级后才下载。
3. 网页下载统一交给 `crwl` 或 agent 原生下载；Wenqu 不调用本工具的 `fetch-*`、MCP 或 daemon 能力，以免两套下载链路混用。

## 能力与加载顺序

- [CLI 与结果协议](cli.md)：准确命令、参数、JSON、部分失败与运行模型。
- [引擎选择](engines.md)：全部十个引擎、各类素材的选择组合。
- [安装与验证](setup.md)：授权后由 agent 自行全局安装、验证和降级。

`open-websearch` 也提供 `serve`、`status`、`fetch-web`、`fetch-github-readme`、`fetch-csdn`、`fetch-juejin`、`fetch-linuxdo` 等 CLI 能力；它们不是 Wenqu 文库的执行路径。文库仅使用一次性的 `search`，不启动 daemon、不使用 `--spawn`、不配置 MCP。
