#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

import { formatReport, validateRelease } from './lib/release-validation.mjs';

const root = process.cwd();
const runRuntime = process.argv.includes('--runtime');
const runSkillHub = process.argv.includes('--skillhub');
const report = validateRelease(root);
const initialDiagnosticCount = report.diagnostics.length;
console.log(formatReport(report));

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
      report.diagnostics.push({
        severity: 'error',
        code: 'RUNTIME_VALIDATOR_FAILED',
        message: `${command} ${args.join(' ')} failed`,
      });
    }
    if (command !== 'claude') break;
  }
}

if (runSkillHub && !report.diagnostics.some(({ severity }) => severity === 'error')) {
  const command = process.env.SKILLHUB_BIN || 'skillhub';
  for (const skillDirectory of report.skillDirectories ?? []) {
    const result = spawnSync(command, ['publish', skillDirectory, '--dry-run'], { cwd: root, encoding: 'utf8' });
    if (result.error?.code === 'ENOENT') {
      report.diagnostics.push({
        severity: 'error',
        code: 'SKILLHUB_CLI_MISSING',
        message: 'SkillHub CLI was not found. Install it or set SKILLHUB_BIN before running --skillhub.',
      });
      break;
    }
    process.stdout.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
    if (result.status !== 0) {
      report.diagnostics.push({
        severity: 'error',
        code: 'SKILLHUB_DRY_RUN_FAILED',
        message: `${command} publish ${skillDirectory} --dry-run failed`,
      });
    }
  }
}

const runtimeDiagnostics = report.diagnostics.slice(initialDiagnosticCount);
if (runtimeDiagnostics.length > 0) {
  console.error(formatReport({ diagnostics: runtimeDiagnostics }));
}

process.exitCode = report.diagnostics.some(({ severity }) => severity === 'error') ? 1 : 0;
