import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, isAbsolute, relative, resolve } from 'node:path';

const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const WORKBUDDY_FIELDS = ['slug', 'displayName', 'version', 'summary', 'license'];
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);
const REFERENCE_TEXT_EXTENSIONS = new Set(['.md', '.sh']);
const IMAGE_ASSET_REFERENCE = /wenqu-image-assets\/styles\/([A-Za-z0-9._/-]+\.(?:png|jpe?g|webp|gif|svg))/gi;
const SKILLHUB_SLUG = /^[a-z0-9](?:[a-z0-9-]{0,126}[a-z0-9])$/;

function error(diagnostics, code, message, path) {
  diagnostics.push({ severity: 'error', code, message, path });
}

function readText(filePath, diagnostics, code) {
  try {
    return readFileSync(filePath, 'utf8');
  } catch {
    error(diagnostics, code, `Missing required file: ${filePath}`, filePath);
    return null;
  }
}

function readJson(filePath, diagnostics) {
  const text = readText(filePath, diagnostics, 'JSON_FILE_MISSING');
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch {
    error(diagnostics, 'JSON_INVALID', `Invalid JSON: ${filePath}`, filePath);
    return null;
  }
}

function frontmatterFields(text) {
  const match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return new Map();
  return new Map(
    [...match[1].matchAll(/^([A-Za-z][A-Za-z0-9_-]*):(?:[ \t]*(.*))?$/gm)]
      .map(([, key, value = '']) => [key, value]),
  );
}

function isInside(root, candidate) {
  const pathRelative = relative(root, candidate);
  return pathRelative !== '' && !pathRelative.startsWith('..') && !isAbsolute(pathRelative);
}

function isEmptyFrontmatterValue(value) {
  return !value.trim() || /^(['"])\1$/.test(value.trim());
}

function unquote(value) {
  return value?.trim().replace(/^['"]|['"]$/g, '') ?? '';
}

function openClawHomepage(text) {
  return unquote(text.match(/^metadata:\s*\n  openclaw:\s*\n    homepage:\s*(.+)$/m)?.[1]);
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function listFiles(directory, extensions) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(path, extensions));
    } else if (extensions.has(extname(entry.name).toLowerCase())) {
      files.push(path);
    }
  }
  return files;
}

function validateImageReferences(root, diagnostics) {
  const assetRoot = resolve(root, 'wenqu-image-assets', 'styles');
  const referenceText = listFiles(resolve(root, 'wenqu-image'), REFERENCE_TEXT_EXTENSIONS)
    .map((path) => readFileSync(path, 'utf8'))
    .join('\n');
  if (!existsSync(assetRoot) && !referenceText) return;

  const assets = listFiles(assetRoot, IMAGE_EXTENSIONS);

  const referencedAssets = new Set();
  for (const match of referenceText.matchAll(IMAGE_ASSET_REFERENCE)) {
    const assetPath = match[1];
    const resolvedAsset = resolve(assetRoot, assetPath);
    if (!isInside(assetRoot, resolvedAsset) || !existsSync(resolvedAsset)) {
      error(
        diagnostics,
        'IMAGE_REFERENCE_MISSING',
        `Image reference has no matching asset: wenqu-image-assets/styles/${assetPath}`,
        assetRoot,
      );
      continue;
    }
    referencedAssets.add(relative(assetRoot, resolvedAsset));
  }

  const basenameCounts = new Map();
  for (const asset of assets) {
    const name = asset.split('/').at(-1);
    basenameCounts.set(name, (basenameCounts.get(name) ?? 0) + 1);
  }
  for (const asset of assets) {
    const assetPath = relative(assetRoot, asset).split('\\').join('/');
    const basename = assetPath.split('/').at(-1);
    const mentionedByPath = referenceText.includes(assetPath);
    const mentionedByUniqueFilename = basenameCounts.get(basename) === 1 && referenceText.includes(basename);
    if (!referencedAssets.has(assetPath) && !mentionedByPath && !mentionedByUniqueFilename) {
      error(
        diagnostics,
        'IMAGE_ASSET_UNREFERENCED',
        `Image asset is not referenced by wenqu-image documentation or scripts: ${assetPath}`,
        asset,
      );
    }
  }
}

function validateMarketplace({ root, diagnostics, version, pluginName, path }) {
  const marketplace = readJson(path, diagnostics);
  if (marketplace === null) return;

  if (marketplace.name !== pluginName) {
    error(diagnostics, 'MARKET_NAME_MISMATCH', `${path} must use marketplace name ${pluginName}`, path);
  }

  const plugin = marketplace.plugins?.find(({ name }) => name === pluginName);
  if (!plugin) {
    error(diagnostics, 'MARKET_PLUGIN_MISSING', `${path} must declare plugin ${pluginName}`, path);
    return;
  }
  if (plugin.source !== './') {
    error(diagnostics, 'MARKET_SOURCE_INVALID', `${path} must use plugin source ./`, path);
  }
  if (plugin.version !== version) {
    error(
      diagnostics,
      'MARKET_VERSION_MISMATCH',
      `${path} declares ${plugin.version ?? 'no version'}; expected ${version}`,
      path,
    );
  }
  if (!plugin.description) {
    error(diagnostics, 'MARKET_DESCRIPTION_MISSING', `${path} must describe ${pluginName}`, path);
  }
}

export function validateRelease(rootDirectory) {
  const root = resolve(rootDirectory);
  const diagnostics = [];
  const versionPath = resolve(root, 'VERSION');
  const version = readText(versionPath, diagnostics, 'VERSION_MISSING')?.trim();

  if (!version || !SEMVER.test(version)) {
    error(diagnostics, 'VERSION_INVALID', `VERSION must contain a semantic version, got ${version ?? 'none'}`, versionPath);
  }

  const changelogPath = resolve(root, 'CHANGELOG.md');
  const changelog = readText(changelogPath, diagnostics, 'CHANGELOG_MISSING');
  if (version && changelog && !changelog.includes(`## ${version}`)) {
    error(diagnostics, 'CHANGELOG_VERSION_MISSING', `CHANGELOG.md has no entry for ${version}`, changelogPath);
  }

  const pluginPath = resolve(root, '.claude-plugin', 'plugin.json');
  const plugin = readJson(pluginPath, diagnostics);
  if (!plugin || !version) return { diagnostics };

  if (!plugin.name) {
    error(diagnostics, 'PLUGIN_NAME_MISSING', 'plugin.json must declare name', pluginPath);
  }
  if (plugin.version !== version) {
    error(diagnostics, 'PLUGIN_VERSION_MISMATCH', `plugin.json declares ${plugin.version ?? 'no version'}; expected ${version}`, pluginPath);
  }
  if (!Array.isArray(plugin.skills) || plugin.skills.length === 0) {
    error(diagnostics, 'PLUGIN_SKILLS_MISSING', 'plugin.json must declare at least one skill directory', pluginPath);
  }

  const pluginName = plugin.name ?? 'wenqu-skills';
  validateMarketplace({
    root,
    diagnostics,
    version,
    pluginName,
    path: resolve(root, '.claude-plugin', 'marketplace.json'),
  });

  const seen = new Set();
  const skillDirectories = [];
  const slugs = new Map();
  for (const skillPath of plugin.skills ?? []) {
    if (typeof skillPath !== 'string' || !skillPath.startsWith('./')) {
      error(diagnostics, 'DECLARED_SKILL_PATH_INVALID', `Invalid skill path: ${skillPath}`, pluginPath);
      continue;
    }
    if (seen.has(skillPath)) {
      error(diagnostics, 'DECLARED_SKILL_DUPLICATE', `Duplicate skill path: ${skillPath}`, pluginPath);
      continue;
    }
    seen.add(skillPath);

    const skillDirectory = resolve(root, skillPath);
    if (!isInside(root, skillDirectory)) {
      error(diagnostics, 'DECLARED_SKILL_PATH_INVALID', `Skill path escapes repository: ${skillPath}`, pluginPath);
      continue;
    }

    const skillFile = resolve(skillDirectory, 'SKILL.md');
    const skill = readText(skillFile, diagnostics, 'DECLARED_SKILL_MISSING');
    if (skill === null) continue;
    skillDirectories.push(skillDirectory);

    const fields = frontmatterFields(skill);
    for (const field of WORKBUDDY_FIELDS) {
      if (!fields.has(field)) {
        error(diagnostics, 'WORKBUDDY_METADATA_MISSING', `${skillFile} is missing ${field}`, skillFile);
      } else if (isEmptyFrontmatterValue(fields.get(field))) {
        error(diagnostics, 'WORKBUDDY_METADATA_EMPTY', `${skillFile} has empty ${field}`, skillFile);
      }
    }
    if (!fields.has('name') || !fields.has('description')) {
      error(diagnostics, 'SKILL_METADATA_MISSING', `${skillFile} must declare name and description`, skillFile);
    }

    const skillVersion = unquote(fields.get('version'));
    if (skillVersion && !SEMVER.test(skillVersion)) {
      error(diagnostics, 'WORKBUDDY_VERSION_INVALID', `${skillFile} has invalid version ${skillVersion}`, skillFile);
    }

    const slug = unquote(fields.get('slug'));
    if (slug && !SKILLHUB_SLUG.test(slug)) {
      error(diagnostics, 'SKILLHUB_SLUG_INVALID', `${skillFile} has invalid slug ${slug}`, skillFile);
    }
    if (slug) {
      const existing = slugs.get(slug);
      if (existing) {
        error(
          diagnostics,
          'SKILLHUB_SLUG_DUPLICATE',
          `${skillFile} reuses slug ${slug} already declared by ${existing}`,
          skillFile,
        );
      } else {
        slugs.set(slug, skillFile);
      }
    }

    const homepage = openClawHomepage(skill);
    if (!homepage) {
      error(diagnostics, 'OPENCLAW_HOMEPAGE_MISSING', `${skillFile} is missing metadata.openclaw.homepage`, skillFile);
    } else if (!isHttpsUrl(homepage)) {
      error(diagnostics, 'OPENCLAW_HOMEPAGE_INVALID', `${skillFile} has invalid OpenClaw homepage ${homepage}`, skillFile);
    }

    for (const unsupportedFile of listFiles(skillDirectory, IMAGE_EXTENSIONS)) {
      error(
        diagnostics,
        'SKILLHUB_UNSUPPORTED_FILE',
        `SkillHub does not accept image files inside a skill package: ${unsupportedFile}`,
        unsupportedFile,
      );
    }
  }

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith('wenqu-')) continue;
    const skillDirectory = resolve(root, entry.name);
    if (!existsSync(resolve(skillDirectory, 'SKILL.md'))) continue;
    const declaredPath = `./${entry.name}`;
    if (!seen.has(declaredPath)) {
      error(
        diagnostics,
        'PLUGIN_SKILL_UNDECLARED',
        `${entry.name}/SKILL.md exists but ${declaredPath} is absent from plugin.json skills`,
        skillDirectory,
      );
    }
  }

  validateImageReferences(root, diagnostics);

  return { diagnostics, skillDirectories };
}

export function formatReport(report) {
  if (report.diagnostics.length === 0) return 'Release checks passed.';
  return report.diagnostics
    .map(({ severity, code, message }) => `${severity.toUpperCase()} ${code}: ${message}`)
    .join('\n');
}
