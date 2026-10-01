// Stages the deployable site into dist/ for Cloudflare Workers static assets.
//
// Why this exists: pointing `assets.directory` at the repo root makes Wrangler
// upload everything in the working directory. In CI that pulls in node_modules,
// and the Cloudflare Workers Static Assets limit is 25 MiB per file. Wrangler's
// own workerd binary is over 90 MiB, so the deploy fails on a single file long
// before anything is served. Wrangler has no `assets.exclude` field (its config
// schema sets additionalProperties:false), so an allowlist is the only reliable
// way to keep the upload clean.
//
// The rule is simple: copy the site in, never out. Anything not named here is
// not deployed, so adding a devDependency or a scratch file can never break the
// deploy. Running `node build.js` first is deliberate -- policy-reviews-data.js
// is generated from the <meta name="bng-policy"> tags, and the Cloudflare build
// container starts from a fresh checkout with no generated file in it.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// Directories copied wholesale. All must be site content only.
const ASSET_DIRS = ['assets', 'blogs', 'policy-reviews', 'resources'];

// Individual files copied to the dist root.
const ASSET_FILES = [
    'index.html',
    '404.html',
    'blog.html',
    'campaigns.html',
    'contact.html',
    'privacy.html',
    'submissions.html',
    'warriors.js',
    'policy-reviews-data.js',
    'robots.txt',
    'sitemap.xml',
    // Cloudflare parses these and does not serve them as content.
    '_headers',
    '_redirects',
];

function copyDir(from, to) {
    fs.mkdirSync(to, { recursive: true });
    let count = 0;
    for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
        const src = path.join(from, entry.name);
        const dest = path.join(to, entry.name);
        if (entry.isDirectory()) {
            count += copyDir(src, dest);
        } else if (entry.isFile()) {
            fs.copyFileSync(src, dest);
            count++;
        }
    }
    return count;
}

function human(bytes) {
    return bytes >= 1024 * 1024
        ? (bytes / 1024 / 1024).toFixed(1) + ' MiB'
        : Math.round(bytes / 1024) + ' KB';
}

console.log('Generating policy-reviews-data.js...');
execFileSync(process.execPath, [path.join(ROOT, 'build.js')], { stdio: 'inherit' });

// Wipe first so a deleted source file cannot survive in a stale dist/.
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

const problems = [];
let copied = 0;

for (const dir of ASSET_DIRS) {
    const src = path.join(ROOT, dir);
    if (!fs.existsSync(src)) {
        problems.push(`missing asset directory: ${dir}/`);
        continue;
    }
    copied += copyDir(src, path.join(DIST, dir));
    console.log(`  ${dir}/`);
}

for (const file of ASSET_FILES) {
    const src = path.join(ROOT, file);
    if (!fs.existsSync(src)) {
        // _headers and _redirects are generated below if absent, so only warn.
        problems.push(`missing asset file: ${file}`);
        continue;
    }
    fs.copyFileSync(src, path.join(DIST, file));
    copied++;
}

// Fail loudly rather than deploying a site missing a page. This catches a
// renamed or deleted source file at build time instead of in production.
if (problems.length) {
    console.error('\nStaging failed, missing from dist/:');
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
}

console.log(`\n  robots.txt`);
console.log(`  sitemap.xml`);
console.log(`\nStaged ${copied} files into dist/`);

// Report the total and the largest files: the deploy fails if any single file
// exceeds 25 MiB, so this is the number worth checking after adding assets.
let total = 0;
const files = [];
(function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else {
            const size = fs.statSync(full).size;
            total += size;
            files.push({ path: path.relative(DIST, full), size });
        }
    }
})(DIST);

const LIMIT = 25 * 1024 * 1024;
const tooBig = files.filter((f) => f.size > LIMIT);

console.log(`Total ${human(total)} across ${files.length} files`);
console.log('Largest:');
for (const f of files.sort((a, b) => b.size - a.size).slice(0, 5)) {
    console.log(`  ${human(f.size).padStart(9)}  ${f.path}`);
}

if (tooBig.length) {
    console.error('\nOver the 25 MiB Workers asset limit:');
    for (const f of tooBig) console.error(`  ${human(f.size)}  ${f.path}`);
    process.exit(1);
}

console.log('\nAll files within the 25 MiB limit.');