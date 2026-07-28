#!/usr/bin/env node
// 批量发布 wenqu 技能 + 插件包到 ClawHub (clawhub.ai)。
//
// 自动：登录态检查 -> release 校验 -> 逐个 skill publish（读 SKILL.md 的 slug/displayName/version）
//      -> package publish（插件包 @gogoingai/wenqu-skills）-> 限频重试 -> 汇总。
//      幂等：内容未变更的技能/插件秒级 no-op 成功，不重新触发审核。
//
// 前置（用户做一次）：
//   1. 装 CLI:  npm i -g clawhub   (需 Node >=22)
//   2. 登录:    clawhub login --token clh_xxx
//   3. publisher gogoingai 已创建并拥有（脚本用 --owner gogoingai 把技能/插件发到 org）。
//      旧技能若在 @justis-xu 下，用 `clawhub transfer request <skill> gogoingai --yes` 转移。
//
// 用法:
//   node scripts/publish-clawhub.mjs                          # 发全部技能 + 插件包
//   node scripts/publish-clawhub.mjs --dry-run                # 只预检（clawhub --dry-run）
//   node scripts/publish-clawhub.mjs --changelog "0.2.0 ..."  # 指定 changelog
//   node scripts/publish-clawhub.mjs --skills-only            # 只发技能
//   node scripts/publish-clawhub.mjs --plugin-only            # 只发插件包
//   node scripts/publish-clawhub.mjs wenqu-library            # 只发指定技能（不影响插件包）
//
// 退出码: 0 全部成功；1 至少一个失败或 release 校验未过；2 前置未满足；3 参数错误
//
// 标准流程：先 git commit + push（干净状态），再跑本脚本。从脏工作区发会导致 provenance
// 不一致（记录的 commit 不含未提交改动）。脚本会对脏工作区发警告。

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { validateRelease, formatReport } from './lib/release-validation.mjs';

const root = process.cwd();
const CLAWHUB = process.env.CLAWHUB_BIN || 'clawhub';
const OWNER = 'gogoingai';
const PLUGIN_NAME = '@gogoingai/wenqu-skills';
const REPO = process.env.CLAWHUB_SOURCE_REPO || 'gogoingai/wenqu-skills';

// --- 参数 ---
const args = process.argv.slice(2);
let dryRun = false;
let skillsOnly = false;
let pluginOnly = false;
let changelog = '发布';
const only = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--dry-run') dryRun = true;
  else if (a === '--changelog') changelog = args[++i];
  else if (a === '--skills-only') skillsOnly = true;
  else if (a === '--plugin-only') pluginOnly = true;
  else if (a === '-h' || a === '--help') {
    console.error('见脚本头部注释');
    process.exit(0);
  } else if (a.startsWith('-')) {
    console.error(`未知参数: ${a}`);
    process.exit(3);
  } else {
    only.push(a);
  }
}

// --- git 状态（provenance + 脏工作区警告）---
function git(args) {
  return spawnSync('git', args, { cwd: root, encoding: 'utf8' }).stdout.trim();
}
const SHA = process.env.GITHUB_SHA || git(['rev-parse', 'HEAD']);
const REF = process.env.GITHUB_REF_NAME || git(['rev-parse', '--abbrev-ref', 'HEAD']);
const dirty = git(['status', '--porcelain']);
if (dirty) {
  console.warn(`⚠️ 工作区不干净。provenance 会指向 ${SHA.slice(0, 8)}，但发布内容含未提交改动。`);
  console.warn('   标准流程：先 git commit + push，再发布。\n');
}

// --- 前置检查：CLI + 登录态 ---
const probe = spawnSync(CLAWHUB, ['whoami'], { encoding: 'utf8' });
if (probe.error?.code === 'ENOENT') {
  console.error(`✗ clawhub CLI 未找到 (${CLAWHUB})。安装: npm i -g clawhub (需 Node >=22)`);
  process.exit(2);
}
if (probe.status !== 0) {
  console.error(`✗ 未登录 clawhub。执行: ${CLAWHUB} login --token clh_xxx`);
  process.exit(2);
}
console.log(`登录态: ${probe.stdout.trim()}`);

// --- release 校验（复用 check-release 的同一套规则）---
const report = validateRelease(root);
console.log(formatReport(report));
if (report.diagnostics.some((d) => d.severity === 'error')) {
  console.error('✗ release 校验未过，终止发布');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function frontmatter(dir) {
  const text = readFileSync(resolve(dir, 'SKILL.md'), 'utf8');
  const m = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  const fm = {};
  if (m) {
    for (const [, k, v = ''] of m[1].matchAll(/^([A-Za-z][A-Za-z0-9_-]*):(?:[ \t]*(.*))?$/gm)) fm[k] = v;
  }
  return fm;
}
const unquote = (v) => (v ?? '').trim().replace(/^['"]|['"]$/g, '');

async function runWithRetry(label, cmdArgs) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const r = spawnSync(CLAWHUB, cmdArgs, { encoding: 'utf8' });
    process.stdout.write(r.stdout ?? '');
    process.stderr.write(r.stderr ?? '');
    if (r.status === 0) {
      console.log(`✓ ${label}`);
      return true;
    }
    const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
    if (/429|rate|frequency|频繁|频率|reset in/i.test(out) && attempt < 4) {
      console.error(`  ⏳ ${label} 限频，等 ${60 * attempt}s 重试 (${attempt}/4)...`);
      await sleep(60_000 * attempt);
      continue;
    }
    console.error(`✗ ${label} 失败 (rc=${r.status})`);
    return false;
  }
  return false;
}

const ok = [];
const fail = [];

// --- 技能 ---
if (!pluginOnly) {
  const skills = (report.skillDirectories ?? []).filter(
    (d) => only.length === 0 || only.some((n) => d.endsWith('/' + n)),
  );
  if (only.length && skills.length !== only.length) {
    const missing = only.filter((n) => !skills.some((d) => d.endsWith('/' + n)));
    console.error(`✗ 未找到技能: ${missing.join(', ')}`);
    process.exit(1);
  }
  console.log(`\n=== 技能 ${dryRun ? '预检' : '发布'} (${skills.length}) ===`);
  for (const dir of skills) {
    const fm = frontmatter(dir);
    const slug = unquote(fm.slug) || dir.split('/').pop();
    const name = unquote(fm.displayName) || slug;
    const version = unquote(fm.version);
    if (!version) {
      console.error(`✗ ${slug}: SKILL.md 缺 version`);
      fail.push(slug);
      continue;
    }
    const cmdArgs = [
      'skill', 'publish', dir,
      '--slug', slug, '--name', name, '--version', version,
      '--owner', OWNER, '--changelog', changelog,
      '--source-repo', REPO, '--source-commit', SHA, '--source-ref', REF, '--source-path', slug,
    ];
    if (dryRun) cmdArgs.push('--dry-run');
    if (await runWithRetry(`${slug}@${version}`, cmdArgs)) ok.push(slug);
    else fail.push(slug);
    await sleep(4000);
  }
}

// --- 插件包 ---
if (!skillsOnly) {
  const pluginVersion = readFileSync(resolve(root, 'VERSION'), 'utf8').trim();
  console.log(`\n=== 插件包 ${dryRun ? '预检' : '发布'} ${PLUGIN_NAME}@${pluginVersion} ===`);
  const v = spawnSync(CLAWHUB, ['package', 'validate', '.'], { encoding: 'utf8' });
  process.stdout.write(v.stdout ?? '');
  process.stderr.write(v.stderr ?? '');
  if (v.status !== 0) {
    console.error('✗ package validate 失败');
    fail.push('plugin');
  } else {
    const cmdArgs = [
      'package', 'publish', '.', '--family', 'bundle-plugin',
      '--name', PLUGIN_NAME, '--version', pluginVersion, '--owner', OWNER, '--changelog', changelog,
    ];
    if (dryRun) cmdArgs.push('--dry-run');
    if (await runWithRetry(`${PLUGIN_NAME}@${pluginVersion}`, cmdArgs)) ok.push('plugin');
    else fail.push('plugin');
  }
}

// --- 汇总 ---
console.log('\n================================================');
console.log(`成功: ${ok.length}${ok.length ? '  -> ' + ok.join(' ') : ''}`);
if (fail.length) {
  console.error(`失败: ${fail.length}  -> ${fail.join(' ')}`);
  process.exit(1);
}
console.log(dryRun ? '预检完成' : '发布完成（审核中，见 clawhub.ai/dashboard）');
