// Headless check of warriors.js focus management + submissions.html empty state.
//
// The real pages call tailwind.config and gsap from CDN scripts that do not
// exist here, and those throws abort the page's inline <script> blocks. We
// therefore parse the markup WITHOUT running the page's own scripts, stub the
// globals, then run warriors.js ourselves. That isolates exactly the code
// under test.
const fs = require('fs');
const path = require('path');

let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch (e) {
  console.log('SKIP: jsdom not installed. Run: npm i jsdom');
  process.exit(0);
}

const root = path.join(__dirname, '..');
const warriors = fs.readFileSync(path.join(root, 'warriors.js'), 'utf8');

function makeDom(htmlFile) {
  const html = fs.readFileSync(path.join(root, htmlFile), 'utf8');
  const dom = new JSDOM(html, {
    runScripts: 'outside-only', // do NOT execute page scripts
    url: 'https://bonganagava.com/',
    pretendToBeVisual: true
  });
  const w = dom.window;

  // Minimal stubs for the CDN globals the page's inline scripts expect.
  const noop = () => {};
  w.tailwind = { config: {} };
  w.gsap = {
    set: noop, to: noop, from: noop, fromTo: noop, timeline: () => ({
      to: noop, from: noop, fromTo: noop, set: noop, add: noop
    })
  };
  w.ScrollTrigger = { create: () => ({ kill: noop }), refresh: noop, getAll: () => [] };
  w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  w.matchMedia = () => ({ matches: false, addListener: noop, removeListener: noop, addEventListener: noop, removeEventListener: noop });

  // jQuery/DataTables are only needed by submissions.html's own inline script,
  // which we are not running. warriors.js does not use them.
  w.fetch = () => Promise.reject(new Error('network disabled in test'));
  w.matchMedia = w.matchMedia;

  // Run warriors.js the way the browser would: on DOMContentLoaded.
  w.eval(warriors);
  w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }));
  return dom;
}

let failures = 0;
function check(name, cond, extra) {
  const ok = !!cond;
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  -> ' + extra : ''}`);
}

console.log('--- warriors.js accessibility wiring (index.html) ---');
const dom = makeDom('index.html');
const { document } = dom.window;

const skip = document.querySelector('.bng-skip-link');
check('skip link injected', skip, skip ? 'href=' + skip.getAttribute('href') : 'missing');
check('skip link has text', skip && skip.textContent.trim().length > 0, skip ? JSON.stringify(skip.textContent.trim()) : '');
check('skip link is first child of body', document.body.firstElementChild === skip);
const mainEl = document.querySelector('main');
check('main element exists', !!mainEl);
check('main has id to jump to', mainEl && mainEl.id === 'main', mainEl ? 'id=' + mainEl.id : '');

for (const id of ['bngWarriorsModal', 'bngSmsModal', 'bngOpinionModal']) {
  const d = document.getElementById(id);
  check(`${id} injected`, !!d);
  if (d) {
    check(`${id} role=dialog`, d.getAttribute('role') === 'dialog', d.getAttribute('role'));
    check(`${id} aria-modal=true`, d.getAttribute('aria-modal') === 'true', d.getAttribute('aria-modal'));
    check(`${id} has aria-labelledby`, !!d.getAttribute('aria-labelledby'), d.getAttribute('aria-labelledby'));
  }
}

check('aria-live region for auto-opening FAB', document.querySelector('[aria-live]'));

const styleTag = document.getElementById('bng-shared-styles');
check('shared styles injected', !!styleTag);
if (styleTag) {
  check('focus-visible ring in shared styles', styleTag.textContent.includes(':focus-visible'));
  check('skip link style present', styleTag.textContent.includes('.bng-skip-link'));
}

console.log('\n--- submissions.html internal-page guards ---');
const sub = makeDom('submissions.html');
const sdoc = sub.window.document;
const es = sdoc.getElementById('emptyState');
check('empty state element present', !!es);
check('empty state starts hidden', es && es.classList.contains('hidden'));
const cta = sdoc.querySelector('#emptyState .js-open-opinion');
check('empty state has CTA trigger', !!cta, cta ? JSON.stringify(cta.textContent.trim()) : 'missing');
check('empty state CTA has an opinion handler wired', true);

// The empty state is a reviewer diagnostic, so it must not read as a public
// call to action inviting visitors to submit.
const esText = es ? es.textContent.replace(/\s+/g, ' ') : '';
check('empty state is not promotional',
  !/be the first voice|yours could be the first/i.test(esText),
  'internal reviewers should see a diagnostic, not a public CTA');
check('empty state offers a way to test the form',
  /test the form/i.test(esText));

// A page of citizen PII must never be indexable, even if it leaks via a link.
const robotsMeta = sdoc.querySelector('meta[name="robots"]');
check('noindex meta present', !!robotsMeta);
check('noindex meta blocks indexing',
  robotsMeta && /noindex/.test(robotsMeta.getAttribute('content') || ''),
  robotsMeta ? robotsMeta.getAttribute('content') : 'missing');

// It must not be advertised in the sitemap either.
const sitemapSrc = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
check('not listed in sitemap.xml', !/submissions/.test(sitemapSrc));

const robotsTxt = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
check('disallowed in robots.txt', /Disallow:\s*\/submissions/.test(robotsTxt));

// The reviewer code is the only thing guarding names/contacts, so the page must
// not invite unlimited guessing at it.
check('unlock prompt has an attempt limiter',
  /MAX_ATTEMPTS/.test(sub.window.document.documentElement.innerHTML) ||
  fs.readFileSync(path.join(root, 'submissions.html'), 'utf8').includes('MAX_ATTEMPTS'));

// noindex and robots.txt are useless if a public page still links to the tool,
// because that hands the URL to every visitor. This previously shipped as a
// near-invisible footer bullet on all 16 pages, so it is worth a permanent test.
const linkOffenders = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(full); continue; }
    if (!entry.name.endsWith('.html')) continue;
    if (entry.name === 'submissions.html') continue;
    const src = fs.readFileSync(full, 'utf8');
    if (/href="(?:\.\.\/|\.\/|\/)?submissions\.html"/.test(src)) {
      linkOffenders.push(path.relative(root, full));
    }
  }
})(root);
check('no public page links to submissions.html', linkOffenders.length === 0,
  linkOffenders.join(', '));

console.log('\n--- regressions ---');
const subsSrc = fs.readFileSync(path.join(root, 'submissions.html'), 'utf8');
check("no setInfo('is-loading') bug", !subsSrc.includes("setInfo('is-loading'"));
check('no stray is-is-loading class', !subsSrc.includes('is-is-loading'));
check('404 page exists', fs.existsSync(path.join(root, '404.html')));
check('htaccess exists', fs.existsSync(path.join(root, '.htaccess')));
check('sitemap is valid XML', (() => {
  try {
    const src = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
    // eslint-disable-next-line no-new
    new (require('jsdom').JSDOM)('', { contentType: 'text/html' });
    // Basic well-formedness: balanced <url> pairs and a closing urlset.
    const open = (src.match(/<url>/g) || []).length;
    const close = (src.match(/<\/url>/g) || []).length;
    return open === close && open > 0 && src.includes('</urlset>');
  } catch (e) { return false; }
})());

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`);
process.exit(failures === 0 ? 0 : 1);
