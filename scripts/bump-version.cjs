const fs = require('fs');
const path = require('path');

const readJson = (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
};

const writeJson = (filePath, data) => {
  const content = `${JSON.stringify(data, null, 2)}\n`;
  fs.writeFileSync(filePath, content, 'utf8');
};

const bumpPatch = (version) => {
  const parts = String(version).split('.');
  if (parts.length !== 3 || parts.some(p => Number.isNaN(Number(p)))) {
    return version;
  }
  const [major, minor, patch] = parts.map(Number);
  return `${major}.${minor}.${patch + 1}`;
};

const root = path.resolve(__dirname, '..');
const pkgPath = path.join(root, 'package.json');
const lockPath = path.join(root, 'package-lock.json');

const pkg = readJson(pkgPath);
const nextVersion = bumpPatch(pkg.version);
if (nextVersion === pkg.version) {
  console.warn('Version not bumped: invalid semver format.');
  process.exit(0);
}

pkg.version = nextVersion;
writeJson(pkgPath, pkg);

if (fs.existsSync(lockPath)) {
  const lock = readJson(lockPath);
  lock.version = nextVersion;
  if (lock.packages && lock.packages['']) {
    lock.packages[''].version = nextVersion;
  }
  writeJson(lockPath, lock);
}

console.log(`Version bumped to ${nextVersion}`);
