import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { validateRelease } from '../scripts/lib/release-validation.mjs';

const skillNames = [
  'wenqu-library',
  'wenqu-write',
  'wenqu-review',
  'wenqu-image',
  'wenqu-translate',
  'wenqu-publish',
];

function writeJson(filePath, value) {
  mkdirSync(join(filePath, '..'), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function createFixture(options = {}) {
  const root = mkdtempSync(join(tmpdir(), 'wenqu-release-check-'));
  const version = '0.1.8';
  const skills = options.declaredSkills ?? skillNames.map((name) => `./${name}`);

  writeFileSync(join(root, 'VERSION'), `${version}\n`);
  writeFileSync(join(root, 'CHANGELOG.md'), `## ${version} - Test release\n`);
  writeJson(join(root, '.claude-plugin', 'plugin.json'), {
    name: 'wenqu-skills',
    version,
    description: 'Test plugin',
    skills,
  });

  const marketplace = {
    name: 'wenqu-skills',
    owner: { name: 'gogoingai' },
    plugins: [
      {
        name: 'wenqu-skills',
        source: './',
        version: options.marketVersion ?? version,
        description: 'Test plugin',
      },
    ],
  };
  writeJson(join(root, '.claude-plugin', 'marketplace.json'), marketplace);
  writeJson(join(root, '.codebuddy-plugin', 'marketplace.json'), marketplace);

  for (const name of skillNames) {
    if (name === options.missingSkill) continue;
    const metadata = options.omitWorkBuddyField === name
      ? ''
      : options.emptyWorkBuddyField === name
        ? 'summary:\n'
        : 'summary: Test summary\n';
    const openClawMetadata = options.omitOpenClawHomepage === name
      ? ''
      : 'metadata:\n  openclaw:\n    homepage: https://github.com/gogoingai/wenqu-skills/tree/master/' + name + '\n';
    mkdirSync(join(root, name), { recursive: true });
    const slug = options.slugOverrides?.[name] ?? name;
    writeFileSync(
      join(root, name, 'SKILL.md'),
      `---\nname: ${name}\ndescription: Test skill\nslug: ${slug}\ndisplayName: Test\nversion: 0.1.9\n${metadata}license: MIT\n${openClawMetadata}---\n`,
    );
  }

  for (const name of options.extraSkills ?? []) {
    mkdirSync(join(root, name), { recursive: true });
    writeFileSync(
      join(root, name, 'SKILL.md'),
      `---\nname: ${name}\ndescription: Extra skill\nslug: ${name}\ndisplayName: Extra\nversion: 0.1.9\nsummary: Extra skill\nlicense: MIT\n---\n`,
    );
  }
  if (options.skillHubUnsupportedFile) {
    writeFileSync(join(root, options.skillHubUnsupportedFile), 'test image asset');
  }

  for (const assetPath of options.imageAssets ?? []) {
    const path = join(root, 'wenqu-image-assets', 'styles', assetPath);
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, 'test image asset');
  }
  if (options.imageReferences) {
    const referencePath = join(root, 'wenqu-image', 'references', 'image-references.md');
    mkdirSync(join(referencePath, '..'), { recursive: true });
    writeFileSync(referencePath, options.imageReferences);
  }

  return {
    root,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

test('accepts a complete, version-aligned release fixture', () => {
  const fixture = createFixture();
  try {
    const report = validateRelease(fixture.root);
    assert.deepEqual(report.diagnostics.filter(({ severity }) => severity === 'error'), []);
  } finally {
    fixture.cleanup();
  }
});

test('reports a marketplace version that differs from the plugin release version', () => {
  const fixture = createFixture({ marketVersion: '0.1.7' });
  try {
    const report = validateRelease(fixture.root);
    assert.ok(report.diagnostics.some(({ code }) => code === 'MARKET_VERSION_MISMATCH'));
  } finally {
    fixture.cleanup();
  }
});

test('reports a skill declared by the plugin but absent from the package', () => {
  const fixture = createFixture({ missingSkill: 'wenqu-publish' });
  try {
    const report = validateRelease(fixture.root);
    assert.ok(report.diagnostics.some(({ code }) => code === 'DECLARED_SKILL_MISSING'));
  } finally {
    fixture.cleanup();
  }
});

test('reports a missing WorkBuddy metadata field', () => {
  const fixture = createFixture({ omitWorkBuddyField: 'wenqu-review' });
  try {
    const report = validateRelease(fixture.root);
    assert.ok(report.diagnostics.some(({ code }) => code === 'WORKBUDDY_METADATA_MISSING'));
  } finally {
    fixture.cleanup();
  }
});

test('reports an empty WorkBuddy metadata field', () => {
  const fixture = createFixture({ emptyWorkBuddyField: 'wenqu-review' });
  try {
    const report = validateRelease(fixture.root);
    assert.ok(report.diagnostics.some(({ code }) => code === 'WORKBUDDY_METADATA_EMPTY'));
  } finally {
    fixture.cleanup();
  }
});

test('rejects a declared skill path that escapes the repository', () => {
  const fixture = createFixture({ declaredSkills: ['./wenqu-library', './../outside'] });
  try {
    const report = validateRelease(fixture.root);
    assert.ok(report.diagnostics.some(({ code }) => code === 'DECLARED_SKILL_PATH_INVALID'));
  } finally {
    fixture.cleanup();
  }
});

test('reports a style image reference whose target is absent', () => {
  const fixture = createFixture({
    imageReferences: 'https://raw.githubusercontent.com/example/repo/main/wenqu-image-assets/styles/handdrawn/missing.png\n',
  });
  try {
    const report = validateRelease(fixture.root);
    assert.ok(report.diagnostics.some(({ code }) => code === 'IMAGE_REFERENCE_MISSING'));
  } finally {
    fixture.cleanup();
  }
});

test('reports a style image asset that has no reference', () => {
  const fixture = createFixture({ imageAssets: ['handdrawn/orphan.png'] });
  try {
    const report = validateRelease(fixture.root);
    assert.ok(report.diagnostics.some(({ code }) => code === 'IMAGE_ASSET_UNREFERENCED'));
  } finally {
    fixture.cleanup();
  }
});

test('reports a root skill omitted from the plugin package', () => {
  const fixture = createFixture({ extraSkills: ['wenqu-new'] });
  try {
    const report = validateRelease(fixture.root);
    assert.ok(report.diagnostics.some(({ code }) => code === 'PLUGIN_SKILL_UNDECLARED'));
  } finally {
    fixture.cleanup();
  }
});

test('reports an image file that SkillHub will not accept inside a skill', () => {
  const fixture = createFixture({ skillHubUnsupportedFile: 'wenqu-image/preview.png' });
  try {
    const report = validateRelease(fixture.root);
    assert.ok(report.diagnostics.some(({ code }) => code === 'SKILLHUB_UNSUPPORTED_FILE'));
  } finally {
    fixture.cleanup();
  }
});

test('reports duplicate SkillHub slugs', () => {
  const fixture = createFixture({ slugOverrides: { 'wenqu-review': 'wenqu-write' } });
  try {
    const report = validateRelease(fixture.root);
    assert.ok(report.diagnostics.some(({ code }) => code === 'SKILLHUB_SLUG_DUPLICATE'));
  } finally {
    fixture.cleanup();
  }
});

test('reports a skill without an OpenClaw homepage', () => {
  const fixture = createFixture({ omitOpenClawHomepage: 'wenqu-publish' });
  try {
    const report = validateRelease(fixture.root);
    assert.ok(report.diagnostics.some(({ code }) => code === 'OPENCLAW_HOMEPAGE_MISSING'));
  } finally {
    fixture.cleanup();
  }
});
