/**
 * Nav clickability regression check.
 *
 * Markup presence isn't enough: the policy mega menus are CSS :hover driven and
 * the mobile panels are JS toggled, so a card can look correct in the source and
 * still be unclickable on a real device. This drives each page with jsdom and
 * asserts that:
 *
 *   - every hub card is a real anchor with a resolvable href
 *   - the mobile accordion actually reveals its panel on tap and hides on back
 *   - every link inside a revealed panel has a non-empty href
 *   - the desktop mega menus list the five policies in the agreed order
 *   - the Saving Nairobi National Park entry is present and external
 *
 * Run: node tests/nav.test.js
 */

const fs = require('fs');
const path = require('path');
let JSDOM;
try {
    ({ JSDOM, VirtualConsole } = require('jsdom'));
} catch (e) {
    console.log('SKIP: jsdom not installed. Run: npm i jsdom');
    process.exit(0);
}

const root = path.join(__dirname, '..');

// The five policies in the order they must appear in every dropdown.
const EXPECTED_POLICIES = [
    'roads-amendment-bill-2024.html',
    'public-participation-bill.html',
    'civic-education-2026.html',
    'forests-at-a-crossroads-2025.html',
    'wildlife-conservation-bill.html'
];

const NNP_URL = 'https://savennp.org/speak-up';

const pages = [];
(function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.name === '.git' || e.name === 'node_modules' || e.name === 'tests' || e.name === 'dist') continue;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) walk(full);
        else if (e.name.endsWith('.html')) pages.push(path.relative(root, full));
    }
})(root);

let fail = 0;
const bad = (m) => { console.log('  FAIL ' + m); fail++; };

// Resolve a page-relative href against the file, ignoring external links.
function resolves(rel, href) {
    if (/^(https?:|mailto:|tel:|#|data:|\/\/|javascript:)/i.test(href)) return null;
    const target = path.resolve(path.dirname(path.join(root, rel)), href.split(/[?#]/)[0]);
    return fs.existsSync(target);
}

function load(rel) {
    const html = fs.readFileSync(path.join(root, rel), 'utf8');
    const virtualConsole = new VirtualConsole();
    // The pages call gsap/ScrollTrigger for scroll animations. They are stubbed
    // below, but a missing stub method still surfaces as an uncaught error and
    // jsdom prints a full stack for each. Swallow them: this test asserts nav
    // behaviour, and an animation stub gap is not a nav failure.
    virtualConsole.on('jsdomError', () => {});
    const dom = new JSDOM(html, {
        runScripts: 'dangerously',
        url: 'https://bonganagava.com/',
        pretendToBeVisual: true,
        virtualConsole,
        beforeParse(w) {
            const noop = () => {};
            w.tailwind = { config: {} };
            w.gsap = {
                set: noop,
                to: noop,
                from: noop,
                fromTo: noop,
                timeline: () => ({ to: noop, from: noop, fromTo: noop, set: noop, add: noop }),
                utils: { toArray: () => [] }
            };
            w.ScrollTrigger = { create: () => ({ kill: noop }), refresh: noop, getAll: () => [] };
            w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
            w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
            w.matchMedia = () => ({
                matches: false,
                addListener: noop,
                removeListener: noop,
                addEventListener: noop,
                removeEventListener: noop
            });
            w.fetch = () => Promise.reject(new Error('offline'));
        }
    });
    return dom;
}

console.log('Checking nav clickability across ' + pages.length + ' pages:\n');

for (const rel of pages) {
    const dom = load(rel);
    const d = dom.window.document;
    const notes = [];

    // --- Hub cards: every tile must be a real, resolvable link ---------------
    // Scoped to the card grid itself, not `main .grid` - warriors.js injects the
    // <main> wrapper at runtime and this test doesn't run that script, so a
    // `main`-based selector would silently match nothing.
    const hub = d.querySelector('.grid.grid-cols-1');
    if (hub && /policy-reviews[\\/]index/.test(rel)) {
        const tiles = [...hub.children].filter((t) => !t.classList.contains('col-span-full'));
        const links = tiles.filter((t) => t.tagName === 'A' && t.getAttribute('href'));
        if (links.length !== 5) bad(`${rel}: expected 5 clickable cards, found ${links.length}`);
        for (const a of links) {
            const href = a.getAttribute('href');
            if (resolves(rel, href) === false) bad(`${rel}: card href does not resolve: ${href}`);
        }
        // A dead tile is a <div>, not an <a>. Guard against one creeping back in.
        const deadTiles = tiles.filter((t) => t.tagName !== 'A');
        if (deadTiles.length) bad(`${rel}: ${deadTiles.length} card(s) are not links`);
        notes.push(`hubCards=${links.length}/${tiles.length}`);
    }

    // --- Desktop mega menus: order must match -------------------------------
    const policyMega = d.querySelector('.policy-mega');
    if (policyMega) {
        const hrefs = [...policyMega.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
        const basenames = hrefs.map((h) => h.split('/').pop());
        if (basenames.length !== EXPECTED_POLICIES.length) {
            bad(`${rel}: policy mega has ${basenames.length} items, expected ${EXPECTED_POLICIES.length}`);
        } else {
            for (let i = 0; i < EXPECTED_POLICIES.length; i++) {
                if (basenames[i] !== EXPECTED_POLICIES[i]) {
                    bad(`${rel}: policy mega position ${i + 1} is ${basenames[i]}, expected ${EXPECTED_POLICIES[i]}`);
                }
            }
        }
        for (const h of hrefs) if (resolves(rel, h) === false) bad(`${rel}: policy mega href broken: ${h}`);
        notes.push(`mega=${basenames.length}`);
    }

    // --- Blog mega: posts only. Campaigns live in their own menu now. --------
    const blogMega = d.querySelector('.blog-mega');
    if (blogMega) {
        const hrefs = [...blogMega.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
        if (hrefs.length !== 2) bad(`${rel}: blog mega has ${hrefs.length} items, expected 2 posts`);
        if (hrefs.includes(NNP_URL)) bad(`${rel}: Saving Nairobi National Park is still in the blog menu`);
        for (const h of hrefs) if (resolves(rel, h) === false) bad(`${rel}: blog mega href broken: ${h}`);
        notes.push(`blogMega=${hrefs.length}`);
    }

    // --- Campaigns mega: the external link, and the draft page stays unlinked.
    const campMega = d.querySelector('.campaigns-mega');
    if (campMega) {
        const nnp = campMega.querySelector(`a[href="${NNP_URL}"]`);
        if (!nnp) bad(`${rel}: campaigns mega missing Saving Nairobi National Park link`);
        else {
            if (nnp.getAttribute('target') !== '_blank') bad(`${rel}: NNP link missing target=_blank`);
            const rel2 = nnp.getAttribute('rel') || '';
            if (!/noopener/.test(rel2)) bad(`${rel}: NNP link missing rel=noopener`);
        }
        notes.push('campMega=nnp-ok');

        // campaigns.html is an unpublished draft: disallowed in robots.txt and
        // absent from sitemap.xml. The menu must not offer a route to it.
        if (/campaigns\.html/.test(campMega.innerHTML)) bad(`${rel}: campaigns menu links to the unpublished campaigns.html`);
        const trigger = campMega.parentElement && campMega.parentElement.querySelector(':scope > button');
        if (!trigger) bad(`${rel}: campaigns trigger is not a button (it must not navigate)`);
    }

    // --- Mobile panels: accordion must actually toggle -----------------------
    // 404.html is a bare error page with no nav, so there is nothing to assert.
    const MOBILE_PANELS = {
        'macc-policy': { title: 'Policy Reviews', expected: EXPECTED_POLICIES.length },
        'macc-resources': { title: 'Resources', expected: 2 },
        'macc-blog': { title: 'Blog', expected: 2 },
        'macc-campaigns': { title: 'Campaigns', expected: 1 }
    };

    const hasNav = d.querySelector('.mobile-acc-btn') !== null;
    if (hasNav && Object.keys(MOBILE_PANELS).some((id) => !d.getElementById(id))) {
        bad(`${rel}: this page has a mobile nav but is missing a panel`);
    }

    for (const id of Object.keys(MOBILE_PANELS)) {
        const meta = MOBILE_PANELS[id];
        const btn = d.querySelector(`.mobile-acc-btn[aria-controls="${id}"]`);
        const panel = d.getElementById(id);
        if (!hasNav) break;
        if (!btn || !panel) {
            bad(`${rel}: ${id} or its toggle button is missing`);
            continue;
        }

        const startHidden = panel.classList.contains('hidden');
        btn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
        const opened = !panel.classList.contains('hidden');
        if (startHidden && !opened) bad(`${rel}: tapping ${id} did not reveal the panel`);

        const back = panel.querySelector('.mnav-back');
        if (back) {
            back.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
            if (!panel.classList.contains('hidden')) bad(`${rel}: back button did not hide ${id}`);
        }

        const hrefs = [...panel.querySelectorAll('a')].map((a) => a.getAttribute('href') || '');
        if (hrefs.some((h) => !h.trim())) bad(`${rel}: ${id} contains a link with no href`);
        for (const h of hrefs) if (h && resolves(rel, h) === false) bad(`${rel}: ${id} href broken: ${h}`);
        if (id === 'macc-campaigns' && hrefs.includes(NNP_URL) === false) bad(`${rel}: ${id} missing the campaign link`);

        if (hrefs.length !== meta.expected) bad(`${rel}: ${id} has ${hrefs.length} links, expected ${meta.expected}`);
        notes.push(`${id}=${hrefs.length}`);
    }

    if (notes.length) console.log('  ok   ' + rel.padEnd(46) + notes.join('  '));
}

console.log('\n' + (fail === 0 ? 'NAV OK - every entry is a working link' : fail + ' NAV PROBLEM(S)'));
process.exit(fail === 0 ? 0 : 1);
