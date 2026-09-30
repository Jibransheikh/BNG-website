# Stack Recommendation

**Prepared:** 30 September 2026

You asked me to weigh in rather than pick for you. Here is the reasoning, then a
recommendation.

---

## The question, restated

Three options were on the table:

| | Change | Effort | Ongoing cost |
|---|---|---|---|
| **A** | Config and content only | ~1 day | none |
| **B** | Compile Tailwind, split `warriors.js` | ~2-3 days | ~1 build step |
| **C** | Move to a static site generator | ~1-2 weeks | template discipline |

---

## What actually costs you time today

Ranked by how often they will bite, not by how bad they look:

1. **Nav and footer are duplicated across 16 files.** Roughly 4-5 KB of markup
   per page, copied. Changing a footer link means 16 edits, and any missed edit
   is an inconsistency that ships. This is the single largest source of
   recurring toil.

2. **Tailwind runs from the Play CDN.** `cdn.tailwindcss.com` is the JIT
   *development* build. It ships a JavaScript CSS compiler to every visitor,
   reads the DOM at runtime, and logs a production warning. It also means a
   Tailwind CDN outage degrades your site to unstyled content.

3. **`warriors.js` is 68 KB on every page** and builds three multi-field modals
   that most pages use one of. It is not *wrong*, but it is not tailored.

4. **No content model.** A policy review is a hand-authored HTML file. Listing
   them, filtering them, and generating the submission dropdown all rely on
   conventions (`<meta name="bng-policy">`) that a human has to remember.

Note that `build.js` already points at #4 — it reads those meta tags to generate
the policy list. That instinct is right; it is just applied to one narrow case.

---

## Honest assessment of each option

### A. Config and content only
Fastest, zero risk to your workflow. Gets you headers, caching, image weight, SEO,
and accessibility. **But it leaves all four costs above in place.** If you add
two policy reviews a quarter, you will hand-author two more large HTML files,
each with its own nav copy, and the duplication compounds.

Choose this if you publish rarely and the site is essentially finished.

### B. Compile Tailwind, split `warriors.js`
Real gains for modest effort:
- **FOUC disappears.** Styles arrive in the initial paint.
- **CDN dependency drops** for your CSS, so a Tailwind outage cannot unstyle you.
- **CSP tightens.** The Play CDN forces `unsafe-eval` into your script policy.
  A compiled stylesheet lets you drop that, which materially improves the
  security posture of a site handling citizen submissions.
- `warriors.js` can be split so `privacy.html` does not download the Warriors
  wizard.

Costs: a `package.json` build step and a content scan for Tailwind classes.
Because Tailwind purges unused classes, any class built dynamically in JS needs
a safelist. Your `warriors.js` builds large HTML template strings with Tailwind
classes — **that is exactly the case that breaks silently.** A safelist entry is
required, and this is the main technical risk in option B.

### C. Static site generator (Eleventy or Astro)
Solves #1 and #4 properly: nav and footer become one source, a policy review
becomes a template plus front matter, the submission dropdown becomes a build
step, and per-page JS bundles come free.

Costs, honestly:
- **Migration is the whole cost.** 16 hand-authored pages, each with bespoke
  inline `<style>` blocks and custom JS (the 3D carousel, two custom lightboxes,
  the DataTables opinions page, the copy-on-hover comments). These need to be
  ported, not converted. Budget a week of real work, and expect surprises.
- **You are changing the tool you edit the site with.** For a small team or a
  single maintainer, that is a real ongoing cost, not a one-off.
- Astro would give the most (zero-JS by default, islands only where needed);
  Eleventy is the gentler migration and keeps Nunjucks + your existing HTML
  largely intact.

Choose this if you expect to keep publishing regularly, or if someone else will
maintain it and template discipline matters more than hand control.

---

## Recommendation

**Do B now. Revisit C in six months.**

Reasoning:

- You are hosting on Cloudflare and may move to Hostinger. Both are static hosts.
  Nothing about your deployment constrains this choice, so there is no forcing
  function to act now — which means the honest question is whether the ongoing
  toil justifies a migration today.
- The immediate defects (headers, caching, 4.95 MB of images, no 404, a passed
  deadline advertised in social previews, missing sitemap entries) are fixed or
  fixable without touching the stack. Those were the expensive ones.
- B captures most of the performance and security benefit for roughly a quarter
  of the migration risk. Critically, it is what unblocks a **tighter CSP**, which
  matters more than raw speed for a site that publishes citizens' names and
  phone numbers.
- C's real payoff is #1 and #4. You get those benefits only if the migration
  completes cleanly. A half-finished migration is worse than no migration.

**If you tell me you expect to add more than about one policy review a month, or
that someone other than you will maintain the site, skip B and go straight to
C.** That is the signal that the duplication cost has overtaken the migration
cost, and at that point B is wasted effort.

---

## One thing worth doing regardless of which you pick

`build.js` already demonstrates that you can drive page behaviour from a single
source. Consider extending that idea rather than migrating:

- a `site.json` (nav, footer, contact details, socials)
- a template step that stamps it into each page
- keep the policy `<meta>` convention, and add a `deadline` and `status` field
  next to it

That gets you most of C's #1 benefit with none of the migration cost, and it
fixes the deadline problem structurally instead of by hand. It is a smaller
version of C that keeps your current authoring model intact.

The deadline problem is a good illustration. The PP Bill page advertised
"comments due 28 September" in its `description`, `og:description`, and
`twitter:description` — so every social share carried it, and it was wrong the
moment it was written. There is no amount of careful editing that reliably fixes
a date repeated in four metadata fields across eight pages. A `deadline` field
read from one place fixes the class of bug, not the instance.

---

## What I would not do

- **Do not** migrate to a framework *because* of the performance numbers in this
  review. The images and caching were the performance problem; they are fixed.
- **Do not** rewrite the 3D carousel or the custom lightboxes during a stack
  migration. Port them as-is. They work, they are distinctive, and they are
  exactly the kind of code that generates surprises when rewritten.
- **Do not** touch the Google Sheets pipeline as part of a frontend migration.
  It is a separate concern with separate risk. See `PRIVACY-AUDIT.md` §6.
