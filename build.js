/**
 * Regenerates policy-reviews-data.js from the <meta name="bng-policy"> tag on
 * each page in policy-reviews/.
 *
 * Adding a policy review is then just two steps:
 *   1. create policy-reviews/<slug>.html with the tag in its <head>
 *   2. run:  node build.js
 *
 * The generated file is loaded by warriors.js (for the "Submit Your View"
 * dropdown) and by submissions.html (for the policy filter). Pages without the
 * tag - the hub page, archived reviews - are ignored automatically.
 *
 * No dependencies. Run with: node build.js
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'policy-reviews');
const OUT_FILE = path.join(__dirname, 'policy-reviews-data.js');

// content="key | Label | optional sort order"
const TAG_RE = /<meta\s+name=["']bng-policy["']\s+content=["']([^"']+)["']\s*\/?>/i;

function parseEntry(content) {
    const parts = content.split('|').map((p) => p.trim());
    const key = parts[0] || '';
    const label = parts[1] || '';
    if (!key || !label) return null;
    return {
        key,
        label,
        order: parts[2] !== undefined && parts[2] !== '' ? Number(parts[2]) : null,
        file: null
    };
}

function main() {
    if (!fs.existsSync(SRC_DIR)) {
        console.error('No policy-reviews directory at ' + SRC_DIR);
        process.exit(1);
    }

    const files = fs
        .readdirSync(SRC_DIR)
        .filter((f) => f.toLowerCase().endsWith('.html'))
        .sort();

    const entries = [];
    const problems = [];

    files.forEach((file) => {
        const html = fs.readFileSync(path.join(SRC_DIR, file), 'utf8');
        const match = html.match(TAG_RE);
        if (!match) return; // not a tagged review page - silently skipped

        const entry = parseEntry(match[1]);
        if (!entry) {
            problems.push(`${file}: tag found but "key | Label" is incomplete`);
            return;
        }
        entry.file = file;
        entries.push(entry);
    });

    if (!entries.length) {
        console.error('No pages found with a <meta name="bng-policy"> tag.');
        process.exit(1);
    }

    // Stable ordering: explicit order first, then alphabetical by key.
    entries.sort((a, b) => {
        const ao = a.order === null ? Number.MAX_SAFE_INTEGER : a.order;
        const bo = b.order === null ? Number.MAX_SAFE_INTEGER : b.order;
        if (ao !== bo) return ao - bo;
        return a.key.localeCompare(b.key);
    });

    const seen = new Map();
    entries.forEach((e) => {
        if (seen.has(e.key)) {
            problems.push(
                `duplicate key "${e.key}" in ${e.file} and ${seen.get(e.key)}`
            );
        }
        seen.set(e.key, e.file);
    });

    if (problems.length) {
        console.error('Build failed:');
        problems.forEach((p) => console.error('  - ' + p));
        process.exit(1);
    }

    // The tag lives inside an HTML attribute, so entities are already escaped
    // there. Decode them so the JS string holds a real "&" and the dropdown
    // text isn't mangled - then re-escape for JS with JSON.stringify.
    const decodeEntities = (s) =>
        s
            .replace(/&amp;/gi, '&')
            .replace(/&lt;/gi, '<')
            .replace(/&gt;/gi, '>')
            .replace(/&quot;/gi, '"')
            .replace(/&#39;/gi, "'");

    const body = entries
        .map((e) => {
            const key = JSON.stringify(decodeEntities(e.key));
            const label = JSON.stringify(decodeEntities(e.label));
            return `        { key: ${key}, label: ${label} }`;
        })
        .join(',\n');

    const out = `/**
 * GENERATED FILE - do not edit by hand.
 * Rebuild with:  node build.js
 * Source: the <meta name="bng-policy"> tag on each page in policy-reviews/.
 */
window.BNG_POLICIES = [
${body}
];
`;

    fs.writeFileSync(OUT_FILE, out, 'utf8');

    console.log('Wrote policy-reviews-data.js with ' + entries.length + ' policies:');
    entries.forEach((e) => console.log(`  ${e.key}  <- ${e.file}`));
}

main();
