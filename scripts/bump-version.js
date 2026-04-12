const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJsonRaw = fs.readFileSync(packageJsonPath, 'utf8');
const packageJson = JSON.parse(packageJsonRaw);
const current = packageJson.version;

if (typeof current !== 'string') {
  throw new Error('Version must be a string in package.json');
}

const parts = current.split('.').map(Number);
if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n) || n < 0)) {
  throw new Error('Version must be x.y.z');
}

let [major, minor, patch] = parts;
if (patch >= 9) {
  minor += 1;
  patch = 0;
} else {
  patch += 1;
}

const next = [major, minor, patch].join('.');
execSync(`npm version ${next} --no-git-tag-version`, { stdio: 'inherit' });
