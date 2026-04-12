const fs = require('node:fs');
const path = require('node:path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const appVersionPath = path.join(__dirname, '..', 'src', 'app', 'app-version.ts');

const packageJsonRaw = fs.readFileSync(packageJsonPath, 'utf8');
const packageJson = JSON.parse(packageJsonRaw);
const version = packageJson.version || 'dev';

fs.writeFileSync(appVersionPath, `export const APP_VERSION = '${version}';\n`);
