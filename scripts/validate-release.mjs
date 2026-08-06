import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourceRoot = path.join(root, 'src', 'aimp-platform');
const requiredModules = [
  'workspace',
  'task-center',
  'knowledge-base',
  'prompt-engineering',
  'agent-management',
  'agent-testing',
  'agent-orchestration',
  'dynamic-plan',
  'incident-center',
  'platform-management',
];

for (const moduleName of requiredModules) {
  const modulePath = path.join(sourceRoot, 'modules', moduleName);
  if (!fs.existsSync(modulePath)) {
    throw new Error(`Required published module is missing: ${moduleName}`);
  }
}

const forbiddenPaths = [
  path.join(sourceRoot, 'modules', 'tools'),
  path.join(root, '.axhub'),
  path.join(root, '.agents'),
  path.join(root, 'MEMORY.md'),
];

for (const forbiddenPath of forbiddenPaths) {
  if (fs.existsSync(forbiddenPath)) {
    throw new Error(`Forbidden release path exists: ${path.relative(root, forbiddenPath)}`);
  }
}

const sensitivePattern = /Users\/chenshao|127\.0\.0\.1:51720|BEGIN (RSA|OPENSSH|EC) PRIVATE KEY/;
const scan = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) scan(entryPath);
    if (entry.isFile() && sensitivePattern.test(fs.readFileSync(entryPath, 'utf8'))) {
      throw new Error(`Local or sensitive content found: ${path.relative(root, entryPath)}`);
    }
  }
};

scan(path.join(root, 'src'));
console.log('AIMP release allowlist validation passed.');
