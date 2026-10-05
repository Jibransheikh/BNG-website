/**
 * Rewrites the header dropdowns across every page that carries them.
 *
 * The mega menus are duplicated by hand in 17 HTML files, so editing one page
 * leaves the other 16 stale. This script rebuilds them from a single definition
 * so nav order, targets and colours can't drift apart between pages.
 *
 * It manages four dropdowns plus the CSS and the mobile trigger rows:
 *   Policy Review  - the five reviews, also mirrored as cards on the hub page
 *   Resources      - the two guides
 *   Blog           - the two analysis posts
 *   Campaigns      - external campaign links
 *
 * Blocks are located by their container markup rather than by line number:
 *   desktop mega   : <div class="<name>-mega" ..> up to the next top-level link
 *   mobile panel   : <div id="macc-<name>" ..> up to the next panel or </nav>
 *
 * Links are written relative to each page's own folder, so a page at the repo
 * root gets "policy-reviews/x.html" and one inside policy-reviews/ gets "x.html".
 *
 * The Campaigns trigger is a <button>, not an <a>: campaigns.html is an
 * unpublished draft (disallowed in robots.txt, absent from sitemap.xml), so the
 * menu must not link anywhere. A button is also the honest element for a
 * control that only reveals a panel.
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
// `dot` is required on every entry: the bullet colour is rendered into the
// markup, so a missing value would ship a literal "undefined" class.
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
        slug: 'policy-reviews/wildlife-conservation-bill.html',
        dot: 'bg-brandAccent',
        kind: 'Bill',
        year: '2025',
        megaTitle: 'The Wildlife Conservation &amp; Management Bill, 2025',
        mobileTitle: 'Wildlife Conservation Bill &middot; 2025'
    }
];

const RESOURCES = [
    {
        slug: 'resources/law-making-process-guide.html',
        dot: 'bg-brandRed',
        kind: 'Resource Guide',
        year: '2025',
        megaTitle: 'Guide on Participation in the Law Making Process',
        mobileTitle: 'Law Making Process Guide'
    },
    {
        slug: 'resources/environmental-impact-assessment.html',
        dot: 'bg-brandRed',
        kind: 'Resource Guide',
        year: 'EIA',
        megaTitle: 'Environmental Impact Assessment (EIA)',
        mobileTitle: 'EIA Guide'
    }
];

const BLOGS = [
    {
        slug: 'blogs/forests-at-a-crossroads-2025.html',
        dot: 'bg-brandGreen',
        kind: 'Policy Analysis',
        year: '2025',
        megaTitle: 'Forests at a Crossroads: Power, Institutions &amp; Forests',
        mobileTitle: 'Forests at a Crossroads &middot; 2025'
    },
    {
        slug: 'blogs/exploring-the-public-participation-bill-2025.html',
        dot: 'bg-brandGreen',
        kind: 'Policy Analysis',
        year: '2025',
        megaTitle: 'Exploring the Public Participation Bill 2025',
        mobileTitle: 'Public Participation Bill &middot; 2025'
    }
];

// External campaigns. These live under their own menu rather than the blog,
// and each opens in a new tab.
const CAMPAIGNS = [
    {
        slug: EXTERNAL_LINK,
        external: true,
        dot: 'bg-brandRed',
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
function relativize(slug, pageFile) {
    if (/^https?:/i.test(slug)) return slug;
    const fromParts = path.relative(path.dirname(pageFile), ROOT).split(path.sep).filter(Boolean);
    const toParts = slug.split('/');
    let i = 0;
    while (i < fromParts.length && i < toParts.length - 1 && fromParts[i] === toParts[i]) i++;
    return '../'.repeat(fromParts.length - i) + toParts.slice(i).join('/');
}

function megaItems(items, pageFile) {
    return items
        .map((it) => {
            const href = relativize(it.slug, pageFile);
            const attrs = it.external ? ` target="_blank" rel="noopener noreferrer"` : '';
            const note = it.external
                ? `\n                                        <span class="block text-[10px] font-bold text-brandRed uppercase tracking-wider mt-1">Opens on savennp.org</span>`
                : '';
            return `<a href="${href}"${attrs} class="flex gap-3 px-5 py-4 hover:bg-gray-50 transition-colors group">
    <span class="mt-0.5 w-1.5 h-1.5 rounded-full ${it.dot} flex-shrink-0"></span>
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

// Desktop trigger + its panel. Campaigns gets no href: campaigns.html is an
// unpublished draft disallowed in robots.txt, so the menu must not link anywhere.
// A button is the honest element for a control that only reveals a panel.
function desktopDropdown(name, label, href, accent, panel) {
    const head = href
        ? `<a href="${href}" class="text-sm font-bold text-gray-600 hover:text-${accent} transition-colors uppercase tracking-wider flex items-center gap-1">`
        : `<button type="button" class="text-sm font-bold text-gray-600 hover:text-${accent} transition-colors uppercase tracking-wider flex items-center gap-1 bg-transparent border-0 p-0 cursor-pointer">`;
    const tail = href ? '</a>' : '</button>';
    return `<div class="relative ${name}-dropdown">
                        ${head}${label}
                            ${CHEVRON}
                        ${tail}
                        <div class="${name}-mega hidden absolute left-1/2 -translate-x-1/2 top-full pt-4 w-80">
                            ${panel}
                        </div>
                    </div>`;
}

// Mobile top-level row: label + the chevron that reveals the sub-panel.
function mobileRow(label, href, panelId, isButton) {
    const head = isButton
        ? `<span class="block text-sm font-bold text-gray-600 uppercase tracking-wider py-3 px-4 rounded-lg">${label}</span>`
        : `<a href="${href}" class="block text-sm font-bold text-gray-600 hover:text-brandGreen hover:bg-gray-50 transition-colors uppercase tracking-wider py-3 px-4 rounded-lg">${label}</a>`;
    return `<div class="flex items-center justify-between">${head}<button type="button" class="mobile-acc-btn text-gray-400 hover:text-brandGreen transition-colors p-3 flex-shrink-0" aria-expanded="false" aria-controls="${panelId}" aria-label="Toggle ${label} menu"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg></button></div>`;
}

const RULES = [
    {
        name: 'dropdown CSS',
        // Anchored on the blog-dropdown rule, which is the last of the three
        // existing dropdown styles, and carries the campaigns styles with it.
        // The trailing group swallows any campaigns lines written by a previous
        // run, so re-running replaces them instead of stacking copies.
        re: /(\.blog-dropdown:hover > a \{ color: #0f5132; \})(?:\r?\n[ \t]*\.campaigns-dropdown[^\n]*)*/,
        build: (_p, [anchor]) =>
            `${anchor}
        .campaigns-dropdown .campaigns-mega { opacity: 0; visibility: hidden; transform: translate(-50%, -6px); transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s; pointer-events: none; display: block; }
        .campaigns-dropdown:hover .campaigns-mega, .campaigns-dropdown:focus-within .campaigns-mega { opacity: 1; visibility: visible; transform: translate(-50%, 0); pointer-events: auto; }
        .campaigns-dropdown:hover > button { color: #dc2626; }`
    },
    {
        name: 'desktop policy mega',
        re: /<div class="policy-mega[\s\S]*?(?=<div class="relative resources-dropdown">)/,
        build: (p) => `<div class="policy-mega hidden absolute left-1/2 -translate-x-1/2 top-full pt-4 w-80">
                            ${megaBlock(POLICIES, p)}
                        </div>
                    </div>

                    `
    },
    {
        name: 'desktop resources mega',
        re: /<div class="resources-mega[\s\S]*?(?=<div class="relative blog-dropdown">)/,
        build: (p) => `<div class="resources-mega hidden absolute left-1/2 -translate-x-1/2 top-full pt-4 w-80">
                            ${megaBlock(RESOURCES, p)}
                        </div>
                    </div>
                    `
    },
    {
        name: 'desktop blog mega + campaigns dropdown',
        // Blog and Campaigns are adjacent, and Contact follows both, so one rule
        // covers them and keeps their relative order fixed.
        re: /<div class="blog-mega[\s\S]*?(?=<a href="[^"]*contact\.html")/,
        build: (p) => `<div class="blog-mega hidden absolute left-1/2 -translate-x-1/2 top-full pt-4 w-80">
                            ${megaBlock(BLOGS, p)}
                        </div>
                    </div>
                    ${desktopDropdown('campaigns', 'Campaigns', null, 'brandRed', megaBlock(CAMPAIGNS, p))}
                    `
    },
    {
        name: 'mobile policy panel',
        re: /<div id="macc-policy"[\s\S]*?(?=<div id="macc-resources")/,
        build: (p) => `<div id="macc-policy" class="mobile-nav-panel hidden">${panelBlock('Policy Reviews', POLICIES, p)}</div>
                `
    },
    {
        name: 'mobile resources panel',
        re: /<div id="macc-resources"[\s\S]*?(?=<div id="macc-blog")/,
        build: (p) => `<div id="macc-resources" class="mobile-nav-panel hidden">${panelBlock('Resources', RESOURCES, p)}</div>
                `
    },
    {
        name: 'mobile blog + campaigns panels',
        re: /<div id="macc-blog"[\s\S]*?(?=<\/nav>)/,
        build: (p) => `<div id="macc-blog" class="mobile-nav-panel hidden">${panelBlock('Blog', BLOGS, p)}</div>
                <div id="macc-campaigns" class="mobile-nav-panel hidden">${panelBlock('Campaigns', CAMPAIGNS, p)}</div>
                `
    },
    {
        name: 'mobile campaigns trigger row',
        // Sits immediately after the Blog row, before the Contact link. Any rows
        // a previous run appended are consumed here, so the replacement is a
        // no-op on re-runs rather than adding one more row each time.
        re: /(<div class="flex items-center justify-between"><a href="[^"]*blog\.html"[^>]*>Blog<\/a><button[^>]*aria-controls="macc-blog"[\s\S]*?<\/button><\/div>)(?:<div class="flex items-center justify-between"><span[^>]*>Campaigns<\/span><button[^>]*aria-controls="macc-campaigns"[\s\S]*?<\/button><\/div>)*/,
        build: (_p, [blogRow]) => blogRow + mobileRow('Campaigns', null, 'macc-campaigns', true)
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
            // build(pageFile, captures) returns the replacement. Only the mobile
            // campaigns row rule uses captures, to re-emit the Blog row it
            // anchors on; every other rule replaces its whole match.
            // replace() hands the callback (match, ...groups, offset, string),
            // so the groups start at index 1. Including the full match here
            // would make a rule re-emit what it just consumed, and every run
            // would grow the file.
            html = html.replace(rule.re, (...args) => {
                const captures = args.slice(1, -2);
                return rule.build(file, captures);
            });
            if (html !== before) applied.push(rule.name);
        }

        if (html !== original) {
            fs.writeFileSync(file, html, 'utf8');
            changed++;
            report.push(`  ${path.relative(ROOT, file).padEnd(46)} ${applied.length}/${RULES.length} blocks`);
        }
    }

    console.log(`Scanned ${pages.length} pages, rewrote nav on ${changed}:`);
    report.forEach((r) => console.log(r));
}

main();
