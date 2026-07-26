#!/usr/bin/env bash
# 批量发布 wenqu 技能到 SkillHub (skillhub.cn)。
#
# 自动处理：登录态检查 -> dry-run 预检 -> 串行发布 -> 限频(429)自动等待重试 -> 汇总。
#
# 前置（用户做一次，脚本做不了）：
#   1. 安装 CLI:  curl -fsSL https://skillhub.cn/install/install.sh | bash -s -- --cli-only
#   2. 登录:      skillhub login --key <skh_xxx> --host https://api.skillhub.cn
#                 （需先在 skillhub.cn 注册 + 实名认证 + 创建 API Token）
#
# 用法:
#   scripts/publish-skillhub.sh                         # 发布全部 6 个技能，changelog 默认"发布"
#   scripts/publish-skillhub.sh --changelog "0.2.0 修复画图"   # 指定 changelog
#   scripts/publish-skillhub.sh --dry-run-only          # 只预检，不真正发布
#   scripts/publish-skillhub.sh --skip-dry-run wenqu-library wenqu-write   # 跳过预检，只发指定技能
#
# 退出码: 0 全部成功；1 至少一个失败；2 前置未满足（未登录/CLI 缺失）；3 参数错误

set -euo pipefail

SKILLHUB="${SKILLHUB_BIN:-$HOME/.local/bin/skillhub}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEFAULT_SKILLS=(wenqu-library wenqu-write wenqu-review wenqu-image wenqu-translate wenqu-publish)

CHANGELOG="发布"
SKIP_DRY_RUN=0
DRY_RUN_ONLY=0
SKILLS=()

usage() { sed -n '2,17p' "$0" | sed 's/^# \{0,1\}//'; exit 0; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --changelog)      CHANGELOG="$2"; shift 2 ;;
    --skip-dry-run)   SKIP_DRY_RUN=1; shift ;;
    --dry-run-only)   DRY_RUN_ONLY=1; shift ;;
    -h|--help)        usage ;;
    --)               shift; while [[ $# -gt 0 ]]; do SKILLS+=("$1"); shift; done ;;
    -*)               echo "未知参数: $1" >&2; exit 3 ;;
    *)                SKILLS+=("$1"); shift ;;
  esac
done
[[ ${#SKILLS[@]} -eq 0 ]] && SKILLS=("${DEFAULT_SKILLS[@]}")

# --- 前置检查 ---
if [[ ! -x "$SKILLHUB" ]]; then
  echo "✗ skillhub CLI 未找到 ($SKILLHUB)。安装: curl -fsSL https://skillhub.cn/install/install.sh | bash -s -- --cli-only" >&2
  exit 2
fi
if ! whoami_out=$("$SKILLHUB" auth whoami 2>&1); then
  echo "✗ 未登录 skillhub。执行: $SKILLHUB login --key <token> --host https://api.skillhub.cn" >&2
  exit 2
fi
echo "登录态: $(echo "$whoami_out" | grep -E 'handle|userId' | tr '\n' ' ')"
echo "将${DRY_RUN_ONLY:+仅预检}发布 ${#SKILLS[@]} 个技能: ${SKILLS[*]}"
echo "changelog: $CHANGELOG"
echo "------------------------------------------------"

# --- 单技能 dry-run ---
dryrun_one() {
  local skill="$1"
  local out
  if out=$("$SKILLHUB" publish "$REPO_ROOT/$skill" --dry-run 2>&1); then
    echo "✓ dry-run: $out" | head -1
    return 0
  else
    echo "✗ dry-run $skill: $(echo "$out" | tail -1)" >&2
    return 1
  fi
}

# --- 单技能发布（含限频重试）---
publish_one() {
  local skill="$1"
  local out attempt
  for attempt in 1 2 3 4; do
    if out=$("$SKILLHUB" publish "$REPO_ROOT/$skill" --changelog "$CHANGELOG" 2>&1); then
      local skill_id
      skill_id=$(echo "$out" | grep -oE 'skillId=[0-9]+' | head -1 | cut -d= -f2)
      echo "✓ $skill -> skillId=${skill_id:-?}"
      return 0
    fi
    if echo "$out" | grep -qE '发布频率过高|429|请求过于频繁'; then
      echo "  ⏳ $skill 限频，等 75s 重试 ($attempt/4)..." >&2
      sleep 75
      continue
    fi
    echo "✗ $skill 失败: $(echo "$out" | tail -2 | tr '\n' ' ')" >&2
    return 1
  done
  echo "✗ $skill 重试 4 次仍限频" >&2
  return 1
}

# --- 主循环 ---
declare -a OK=() FAIL=()
for skill in "${SKILLS[@]}"; do
  if [[ ! -f "$REPO_ROOT/$skill/SKILL.md" ]]; then
    echo "✗ $skill: SKILL.md 不存在，跳过" >&2
    FAIL+=("$skill(no-skill-md)"); continue
  fi
  if [[ $SKIP_DRY_RUN -eq 0 ]]; then
    if ! dryrun_one "$skill"; then
      FAIL+=("$skill(dry-run)"); continue
    fi
  fi
  if [[ $DRY_RUN_ONLY -eq 1 ]]; then
    OK+=("$skill(dry-run-ok)"); continue
  fi
  if publish_one "$skill"; then
    OK+=("$skill")
  else
    FAIL+=("$skill")
  fi
done

# --- 汇总 ---
echo "================================================"
echo "成功: ${#OK[@]} / ${#SKILLS[@]}${OK[*]:+  -> }${OK[*]}"
[[ ${#FAIL[@]} -gt 0 ]] && { echo "失败: ${#FAIL[@]}  -> ${FAIL[*]}"; exit 1; }
exit 0
