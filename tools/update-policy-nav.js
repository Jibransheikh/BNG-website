/**
 * Rewrites the Policy Review and Blog dropdowns across every page that has them.
 *
 * The mega menus are duplicated by hand in 17 HTML files, so editing one page
 * leaves the other 16 stale. This script rebuilds both dropdowns from a single
 * definition so nav order and targets can't drift apart.
 *
 * Blocks are located by their container markup rather than by line number:
 *   desktop policy mega : <div class="policy-mega" ..> up to the resources dropdown
 *   desktop blog mega   : <div class="blog-mega" ..> up to the contact link
 *   mobile policy panel : <div id="macc-policy" ..> up to <div id="macc-resources"
 *   mobile blog panel   : <div id="macc-blog" ..> up to </nav>
 *
 * Links are written relative to each page's own folder, so a page at the repo
 * root gets "policy-reviews/x.html" and one inside policy-reviews/ gets "x.html".
 *
 * Run: node tools/update-policy-nav.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const CHEVRON =
    '<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>';

const EXTERNAL_LINK = 'https://savennp.org/speak-up';

// The five policy reviews, in the order they should appear everywhere.
// `href` is resolved against the page folder at write time, so pages in
// different directories each get a correct relative path.
const POLICIES = [
    {
        slug: 'policy-reviews/roads-amendment-bill-2024.html',
        dot: 'bg-brandGreen',
        kind: 'Bill',
        year: '2024',
        megaTitle: 'Roads (Amendment) Bill',
        mobileTitle: 'Roads (Amendment) Bill &middot; 2024'
    },
    {
        slug: 'policy-reviews/public-participation-bill.html',
        dot: 'bg-brandAccent',
        kind: 'Bill',
        year: '2024 &amp; 2025',
        megaTitle: 'Public Participation Bill',
        mobileTitle: 'Public Participation Bill'
    },
    {
        slug: 'policy-reviews/civic-education-2026.html',
        dot: 'bg-brandAccent',
        kind: 'Policy',
        year: '2026',
        megaTitle: 'Civic Education, Citizen Engagement &amp; Public Participation',
        mobileTitle: 'Civic Education &middot; 2026'
    },
    {
        // No dedicated review page exists yet - this bill is covered by the
        // blog analysis, so the nav entry points there rather than at a
        // placeholder that went nowhere.
        slug: 'blogs/forests-at-a-crossroads-2025.html',
        dot: 'bg-brandAccent',
        kind: 'Bill',
        year: '2025',
        megaTitle: 'Forest Conservation &amp; Management (Amendment) Bill',
        mobileTitle: 'Forest Conservation Bill &middot; 2025'
    },
    {
        slug: 'policy-reviews/wildlife-conservation-bill.html',
        dot: 'bg-brandAccent',
        kind: 'Bill',
        year: '2025',
        megaTitle: 'The Wildlife Conservation &amp; Management Bill, 2025',
        mobileTitle: 'Wildlife Conservation Bill &middot; 2025'
    }
];

// Blog dropdown entries. `external: true` gets target=_blank plus rel=noopener.
const BLOGS = [
    {
        slug: 'blogs/forests-at-a-crossroads-2025.html',
        kind: 'Policy Analysis',
        year: '2025',
        megaTitle: 'Forests at a Crossroads: Power, Institutions &amp; Forests',
        mobileTitle: 'Forests at a Crossroads &middot; 2025'
    },
    {
        slug: 'blogs/exploring-the-public-participation-bill-2025.html',
        kind: 'Policy Analysis',
        year: '2025',
        megaTitle: 'Exploring the Public Participation Bill 2025',
        mobileTitle: 'Public Participation Bill &middot; 2025'
    },
    {
        slug: EXTERNAL_LINK,
        external: true,
        kind: 'Campaign',
        year: 'Nairobi National Park',
        megaTitle: 'Saving Nairobi National Park',
        mobileTitle: 'Saving Nairobi National Park'
    }
];

function collectPages() {
    const pages = [];
    (function walk(dir) {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            if (e.name === '.git' || e.name === 'node_modules' || e.name === 'dist') continue;
            const full = path.join(dir, e.name);
            if (e.isDirectory()) walk(full);
            else if (e.name.endsWith('.html')) pages.push(full);
        }
    })(ROOT);
    return pages;
}

// Rewrite a repo-relative slug so it resolves from the page's own folder.
// "policy-reviews/x.html" becomes "../policy-reviews/x.html" for a page in blogs/.
function relativize(slug, pageFile) {
    if (/^https?:/i.test(slug)) return slug;
    const fromParts = path.relative(path.dirname(pageFile), ROOT).split(path.sep).filter(Boolean);
    const toParts = slug.split('/');
    let i = 0;
    while (i < fromParts.length && i < toParts.length - 1 && fromParts[i] === toParts[i]) i++;
    const up = fromParts.length - i;
    return '../'.repeat(up) + toParts.slice(i).join('/');
}

function megaItems(items, pageFile) {
    return items
        .map((it) => {
            const href = relativize(it.slug, pageFile);
            const dot = it.external ? 'bg-brandRed' : it.dot;
            const attrs = it.external
                ? ` target="_blank" rel="noopener noreferrer"`
                : '';
            const note = it.external
                ? `\n                                        <span class="block text-[10px] font-bold text-brandRed uppercase tracking-wider mt-1">Open on savennp.org</span>`
                : '';
            return `<a href="${href}"${attrs} class="flex gap-3 px-5 py-4 hover:bg-gray-50 transition-colors group">
    <span class="mt-0.5 w-1.5 h-1.5 rounded-full ${dot} flex-shrink-0"></span>
    <div>
        <span class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">${it.kind} &middot; ${it.year}</span>
        <span class="block text-sm font-bold text-brandDark group-hover:text-brandGreen transition-colors">${it.megaTitle}</span>${note}
    </div>
</a>`;
        })
        .join('\n<div class="h-px bg-gray-100"></div>\n');
}

function mobileItems(items, pageFile) {
    return items
        .map((it) => {
            const href = relativize(it.slug, pageFile);
            const attrs = it.external ? ` target="_blank" rel="noopener noreferrer"` : '';
            // py-3 + min-h-[44px] keeps each row a full Android tap target. With
            // py-2 and text-xs these came out around 32px, which is under the
            // 44px guideline and easy to miss on a phone.
            return `<a href="${href}"${attrs} class="flex items-center min-h-[44px] block text-xs font-bold text-gray-500 hover:text-brandGreen hover:bg-gray-50 transition-colors uppercase tracking-wider py-3 pl-4 rounded-lg">${it.mobileTitle}</a>`;
        })
        .join('\n');
}

function megaBlock(items, pageFile) {
    return `<div class="bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden">
${megaItems(items, pageFile)}
                            </div>`;
}

function panelBlock(title, items, pageFile) {
    return `<button type="button" class="mnav-back flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-brandGreen py-2 px-1 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>Back to menu</button><h4 class="mt-2 mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">${title}</h4><div class="space-y-1">${mobileItems(items, pageFile)}</div>`;
}

const RULES = [
    {
        name: 'desktop policy mega',
        // Everything from the policy-mega wrapper up to (not including) the
        // resources dropdown wrapper.
        re: /<div class="policy-mega[\s\S]*?(?=<div class="relative resources-dropdown">)/,
        build: (p) => `<div class="policy-mega hidden absolute left-1/2 -translate-x-1/2 top-full pt-4 w-80">
                            ${megaBlock(POLICIES, p)}
                        </div>
                    </div>

                    `
    },
    {
        name: 'desktop blog mega',
        re: /<div class="blog-mega[\s\S]*?(?=<a href="[^"]*contact\.html")/,
        build: (p) => `<div class="blog-mega hidden absolute left-1/2 -translate-x-1/2 top-full pt-4 w-80">
                            ${megaBlock(BLOGS, p)}
                        </div>
                    </div>
                    `
    },
    {
        name: 'mobile policy panel',
        re: /<div id="macc-policy"[\s\S]*?(?=<div id="macc-resources")/,
        build: (p) => `<div id="macc-policy" class="mobile-nav-panel hidden">${panelBlock('Policy Reviews', POLICIES, p)}</div>
                `
    },
    {
        name: 'mobile blog panel',
        re: /<div id="macc-blog"[\s\S]*?(?=<\/nav>)/,
        build: (p) => `<div id="macc-blog" class="mobile-nav-panel hidden">${panelBlock('Blog', BLOGS, p)}</div>
                `
    }
];

function main() {
    const pages = collectPages();
    let changed = 0;
    const report = [];

    for (const file of pages) {
        const original = fs.readFileSync(file, 'utf8');
        let html = original;
        const applied = [];

        for (const rule of RULES) {
            const before = html;
            html = html.replace(rule.re, rule.build(file));
            if (html !== before) applied.push(rule.name);
        }

        if (html !== original) {
            fs.writeFileSync(file, html, 'utf8');
            changed++;
            report.push(`  ${path.relative(ROOT, file).padEnd(50)} ${applied.length}/4 blocks`);
        }
    }

    console.log(`Scanned ${pages.length} pages, rewrote nav on ${changed}:`);
    report.forEach((r) => console.log(r));
}

main();
