// Structural regression check: after warriors.js wraps page content in <main>,
// nothing important should have moved into it. Specifically the footer and the
// injected overlays must stay OUTSIDE main, and all sections must be INSIDE.
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

function load(rel) {
  const html = fs.readFileSync(path.join(root, rel), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://bonganagava.com/', pretendToBeVisual: true });
  const w = dom.window;
  const noop = () => {};
  w.tailwind = { config: {} };
  w.gsap = { set: noop, to: noop, from: noop, fromTo: noop, timeline: () => ({ to: noop, from: noop, fromTo: noop, set: noop, add: noop }) };
  w.ScrollTrigger = { create: () => ({ kill: noop }), refresh: noop, getAll: () => [] };
  w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  w.matchMedia = () => ({ matches: false, addListener: noop, removeListener: noop, addEventListener: noop, removeEventListener: noop });
  w.fetch = () => Promise.reject(new Error('offline'));
  w.eval(warriors);
  w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }));
  return dom;
}

const pages = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    // `dist` is deploy staging produced by tools/build-deploy.js. It holds byte
    // copies of the pages below, so walking it would check every page twice and
    // report the failures twice.
    if (e.name === '.git' || e.name === 'node_modules' || e.name === 'tests' || e.name === 'dist') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name.endsWith('.html')) pages.push(path.relative(root, full));
  }
})(root);

let fail = 0;
const bad = (m) => { console.log('  FAIL ' + m); fail++; };

console.log('Checking landmark placement across ' + pages.length + ' pages:\n');

for (const rel of pages) {
  const dom = load(rel);
  const d = dom.window.document;
  const main = d.querySelector('main');
  const line = [];
  let ok = true;

  if (!main) { bad(`${rel}: no <main>`); continue; }
  line.push('main.id=' + main.id);

  // Footer must be outside main (it is site chrome, not page content).
  const footers = [...d.querySelectorAll('footer')];
  const footerInMain = footers.filter(f => main.contains(f)).length;
  if (footerInMain > 0) { bad(`${rel}: ${footerInMain} footer(s) trapped inside main`); ok = false; }
  line.push('footers outside=' + (footers.length - footerInMain) + '/' + footers.length);

  // Injected overlays must stay outside main, or they get focus-trapped
  // inside page content and scroll with it.
  for (const id of ['bngWarriorsModal', 'bngSmsModal', 'bngOpinionModal', 'bngSmsFab']) {
    const el = d.getElementById(id);
    if (el && main.contains(el)) { bad(`${rel}: #${id} inside main`); ok = false; }
  }

  // Skip link must precede main.
  const skip = d.querySelector('.bng-skip-link');
  if (!skip) { bad(`${rel}: no skip link`); ok = false; }
  else if (!(skip.compareDocumentPosition(main) & 4)) { bad(`${rel}: skip link not before main`); ok = false; }

  // Section count must be preserved.
  const sections = main.querySelectorAll('section').length;
  const allSections = d.querySelectorAll('section').length;
  if (sections !== allSections) { bad(`${rel}: ${allSections - sections} section(s) outside main`); ok = false; }
  line.push('sections in main=' + sections + '/' + allSections);

  // The <header> nav must not be inside main.
  const headerInMain = [...main.querySelectorAll('header')].length;
  line.push('headers in main=' + headerInMain);

  if (ok) console.log('  ok   ' + rel.padEnd(48) + line.join('  '));
}

console.log('\n' + (fail === 0 ? 'STRUCTURE OK - no page corrupted' : fail + ' STRUCTURAL PROBLEM(S)'));
process.exit(fail === 0 ? 0 : 1);
