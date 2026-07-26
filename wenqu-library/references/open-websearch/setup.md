# open-websearch 安装、验证与降级

## 检测与授权

agent 先检查全局 `open-websearch` 是否可调用。缺失时说明“用于补充搜索候选，不替代原生搜索”，取得用户明确授权后由 agent 自行执行：

```bash
npm install -g open-websearch
open-websearch --help
open-websearch search "<本次主题>" --limit 1 --json
```

最后一条验证 CLI 能返回可解析 JSON；安装成功本身不算可用。用户无需复制命令、配置 PATH 或排障。

## 失败处理

- npm 下载失败、命令未进入 PATH 或 smoke check 失败：记录原因，本轮只使用 agent 原生搜索。
- 受限网络下安装失败：先判断 npm registry/proxy 问题；不改全局 npm 配置、不安装浏览器、不启动 daemon，除非用户针对这些变更再次授权。
- 搜索运行时单引擎失败：保留其它结果与 `partialFailures`；CLI 整体失败则跳过补充搜索。

普通 Wenqu 搜索不安装 Playwright。只有用户明确要求 Bing 浏览器模式，且已有基础 CLI 后，才单独说明所需浏览器依赖并取得新的授权。
