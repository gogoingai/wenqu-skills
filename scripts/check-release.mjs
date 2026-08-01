#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = process.cwd();
const runRuntime = process.argv.includes('--runtime');
const runSkillHub = process.argv.includes('--skillhub');
let failed = false;

if (!runRuntime && !runSkillHub) {
  console.error('请选择 --runtime 或 --skillhub；静态检查请运行 skills-eval check .');
  process.exit(3);
}

if (runRuntime) {
  const validators = [
    { command: 'claude', args: ['plugin', 'validate', '.'] },
    ...[
      process.env.CODEBUDDY_BIN,
      'codebuddy',
      '/Applications/WorkBuddy.app/Contents/Resources/app.asar.unpacked/cli/bin/codebuddy',
    ]
      .filter(Boolean)
      .filter((command, index, commands) => commands.indexOf(command) === index)
      .map((command) => ({ command, args: ['plugin', 'validate', '.claude-plugin/marketplace.json'] })),
  ];

  for (const { command, args } of validators) {
    if (command.startsWith('/') && !existsSync(command)) continue;
    const result = spawnSync(command, args, { cwd: root, encoding: 'utf8' });
    if (result.error?.code === 'ENOENT') continue;
    process.stdout.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
    if (result.status !== 0) {
      console.error(`✗ ${command} ${args.join(' ')} failed`);
      failed = true;
    }
    if (command !== 'claude') break;
  }
}

if (runSkillHub) {
  let skillDirectories;
  try {
    const manifest = JSON.parse(readFileSync(resolve(root, '.claude-plugin', 'plugin.json'), 'utf8'));
    if (!Array.isArray(manifest.skills)) throw new Error('skills must be an array');
    skillDirectories = manifest.skills.map((skillPath) => resolve(root, skillPath));
  } catch (error) {
    console.error(`✗ 无法读取已声明的 Skill：${error.message}`);
    process.exit(1);
  }
  const command = process.env.SKILLHUB_BIN || 'skillhub';
  for (const skillDirectory of skillDirectories) {
    const result = spawnSync(command, ['publish', skillDirectory, '--dry-run'], { cwd: root, encoding: 'utf8' });
    if (result.error?.code === 'ENOENT') {
      console.error('✗ SkillHub CLI 未找到。安装它或设置 SKILLHUB_BIN 后重试。');
      failed = true;
      break;
    }
    process.stdout.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
    if (result.status !== 0) {
      console.error(`✗ ${command} publish ${skillDirectory} --dry-run failed`);
      failed = true;
    }
  }
}

process.exitCode = failed ? 1 : 0;
