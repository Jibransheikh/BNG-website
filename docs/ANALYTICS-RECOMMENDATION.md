# Analytics Recommendation

**Prepared:** 30 September 2026

You said A or B — no tracking, or privacy-friendly only. Since you are already on
Cloudflare, B has an obvious answer that costs nothing and contradicts almost
nothing about your positioning.

---

## The recommendation

**Cloudflare Web Analytics.** Free on your existing plan, one script tag, and it
is the least invasive option that still tells you whether anyone uses the site.

Why it fits specifically here:

- **No cookies.** Nothing is stored on the visitor's device.
- **No cross-site tracking.** Your visitors arrive from Facebook, WhatsApp links,
  SMS shortcode replies, and Google. A tracker that follows them around is worse
  than one that only counts pageviews.
- **IP addresses are truncated** before storage, and no visitor-level profile is
  built. You get aggregate counts, not identities.
- **No consent banner needed**, because there is nothing to consent to. That
  keeps your forms frictionless — important, because every extra step on the
  opinion form costs you submissions.
- **It is not a third party in your data flow.** Cloudflare already proxies your
  traffic, so you are not adding a new processor and a new DPA to document.

## What you get, honestly

Pageviews, unique visitors, referrer sources, country, and basic performance
data. That is enough to answer the questions that matter to you:

- Is the SMS shortcode actually driving people to the site? (compare the landing
  pages)
- Which policy reviews get read versus the PP Bill?
- Are the "movement" photos and carousel pulling people down the page?
- Is Nairobi County your audience, or is this national?

## What you will not get

No funnels, no cohorts, no session replay, no ad attribution. If you later need
"how many people who read the wildlife bill then submitted a view", you will need
something more. That is a reasonable later decision, and worth revisiting once
submission volume justifies it.

---

## Alternatives, briefly

**Plausible Cloud** (or self-hosted) — same privacy posture, nicer interface,
better funnel support. Costs ~$9/month for a hobby plan. Worth it if the
Cloudflare interface proves too sparse, but not a priority.

**Umami** — self-hosted, open source, free, good reporting. Adds a service you
have to run and secure. Given you are a small team, that is real ongoing cost.

**GA4** — would give you the most, and costs you the most. It is cookie-based,
cross-site trackable, and on a site that collects citizens' names, phone numbers,
and political opinions on environmental bills, it is a poor trade for a civic
participation tool. **Not recommended** unless the argument for it changes.

---

## One caution

Analytics will tell you a lot about the pages you published and almost nothing
about the people you failed to reach. For a platform whose goal is broadening
youth participation in environmental policy, the useful questions are things
pageview data cannot answer: which counties are absent, which age groups are not
submitting, which SMS numbers bounce.

Cloudflare will show you that traffic from Kenya's rural counties is low compared
to Nairobi. Turning that into a participation strategy is a different kind of
work, and no analytics tool substitutes for it.

---

## Implementation

One tag in each page `<head>`. When you are ready, I would rather add it once in
a shared place than paste it into 16 files — which is another argument for the
shared-template work in `STACK-RECOMMENDATION.md`.

Until then, the correct state of the site is no analytics at all, which is
defensible and should not be treated as a gap.
