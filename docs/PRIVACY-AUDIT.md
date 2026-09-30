# Data Protection Audit — Bonga Na Gava

**Prepared:** 30 September 2026
**Scope:** `bonganagava.com` front end, form flows, and the data pipeline behind them
**Framework:** Kenya Data Protection Act No. 24 of 2019; Data Protection (General) Regulations 2021

> This is an engineering assessment against the Act's published requirements, not
> legal advice. Before acting on the high-severity items, have a Kenyan data
> protection lawyer confirm the position. Bonga Na Gava processes data about
> identifiable Kenyan citizens, so this is worth the cost of an hour of review.

---

## 1. What the site actually collects

Four intake paths, all funneling to one place. Verified in `warriors.js:7` — a single
Google Apps Script web app writes to a Google Sheet:

| Flow | Entry point | `list` value | Fields |
|---|---|---|---|
| Contact message | `contact.html` form | `Contact Messages` | name, email, message |
| SMS opt-in | modal, 41 triggers | `SMS Opt-Ins` | name, phone, email, consent |
| Policy opinion | modal, 38 triggers | `Policy Review Submissions` | name, contact, location, policy, opinion |
| Warriors application | modal, 4 steps | `Bonga Na Gava Warriors` | 21 fields incl. county, organisation, gender, expectations |

Read path: `GET .../exec?view=opinions` returns opinions to the public at
`submissions.html`. With `&key=<code>`, it returns names and contacts too.

**Data subjects:** Kenyan youth and community members, including people under 18.
The site advertises "100% Youth Led" (`index.html:314`) and the Warriors form
asks about youth perspectives, so minors are plainly in scope.

**Sensitive data:** under s.47 / ODPC guidance, location data can be classed as
sensitive. The opinion form collects a free-text `location` field with no
guidance to generalise it. Gender is collected on the Warriors form.

---

## 2. Findings

### HIGH-1 — Cross-border transfer with no safeguard or consent
**Sections:** s.25(h), s.48, s.49

All four flows POST to `script.google.com`, and all data lands in a Google Sheet.
That is a transfer of personal data outside Kenya. Section 25(h) permits this
only where there is *"proof of adequate data protection safeguards or consent
from the data subject."* Section 49 is stricter again for sensitive data.

There is currently no notice telling citizens their data goes to Google, no
consent specific to that transfer, and no documented adequacy assessment. Google
is outside Kenya and the site has not recorded the safeguards relied upon.

**Fix:** state the transfer plainly in the privacy policy and the opinion form
(*"your submission is stored on Google Sheets, a service provided by Google LLC"*)
and record affirmative consent. Separately, keep a written note of the safeguards
assessment — Google's published compliance certifications are a reasonable basis
to document, and you need the record, not just the fact.

**Also note** the General Regulations' localization expectation: processing
through a Kenyan data centre, or keeping a serving copy in Kenya. Worth raising
with whoever owns this decision.

### HIGH-2 — No consent for publication, yet opinions are published
**Sections:** s.25(a) privacy, s.25(b) transparency, s.32 burden of proof

`submissions.html` publishes citizen opinions to an unauthenticated public URL.
Your own `privacy.html` §5 states your name *"is presented to legislative and
environmental authorities."* But:

- the opinion form has **no checkbox** acknowledging that the submission will be
  published on the site, nor that the name may be shared with government;
- s.32 puts the **burden of proof of consent on you**, and a published opinion
  with no recorded consent is consent you cannot evidence.

The masking and PDF-export protections on the page are good engineering, but
they protect against accidental exposure. They do not substitute for consent to
deliberate publication.

**Fix:** add a required, specific consent checkbox to the opinion form, worded
plainly, and store the consent value and timestamp with the submission. Write
that into the sheet so you can prove it later.

### HIGH-3 — Processing data about children without a lawful basis
**Section:** s.33

s.33(1) prohibits processing personal data relating to a child unless a parent or
guardian consents and the processing protects the child's rights and best
interests. I searched every page: there is **no age gate, no date-of-birth field,
and no parental consent path anywhere on the site.** For a platform explicitly
built around youth, this is the largest single gap.

**Fix, in order of effort:**
1. Add an age affirmation to the opinion and SMS forms ("I am 18 or over" /
   "I am under 18") as an immediate partial mitigation.
2. Decide whether minors' submissions are wanted at all. If yes, build the
   parent/guardian consent path. If no, make it explicit and block them.
3. Run a DPIA — s.31 requires one where processing is likely to result in high
   risk to rights and freedoms. Processing minors' political opinions on
   environmental bills, published publicly, is very likely high risk. The report
   is due to the Data Commissioner 60 days before processing begins (s.31(5)).

### MEDIUM-1 — Reviewer access code is a single shared secret
**Sections:** s.25(f) confidentiality, s.41 security by design

A single static code gates unmasking of every citizen's name and contact, with
no rate limiting, no per-user identity, no expiry, and no audit log. Every unlock
is indistinguishable from every other. It is server-validated, which is better
than client-side hiding, but it is a shared secret protecting identifiable
citizen data.

**Fix:** individual reviewer accounts rather than one shared code; log every
unmask with reviewer identity and timestamp; add lockout after repeated failures.
While retaining the mask-by-default design, which is a genuine strength.

### MEDIUM-2 — No way to exercise data subject rights
**Sections:** s.26, s.27

Subjects have rights to access, correction, and deletion. The privacy policy
offers an email address, which is the right instinct. But there is no stated
response timeframe, no deletion workflow, and no record of requests.

Note the tension: you retain opinions because they are the evidentiary basis for
submissions to government. Deletion requests therefore need a documented
position on *which* data you can remove and which you must keep, and why.

### MEDIUM-3 — Privacy policy does not describe the system accurately
**Sections:** s.25(b), s.29 duty to notify

Reading it against the code, the policy diverges in ways that matter:

| `privacy.html` says | Reality |
|---|---|
| §2 "we **may** collect… browser type, device identifiers, and site interaction metrics" | No analytics of any kind is present. This is inaccurate and implies tracking that does not exist. |
| §2 no mention of Google | All data goes to Google Sheets outside Kenya |
| §2 no mention of minors | Children are plainly in scope |
| §4 "web based portal… no standalone mobile application" | Accurate, but there *is* an SMS channel (shortcode 21064) that is not a web form and is not described here |
| §6 "retain only as long as necessary" | No automated retention or deletion exists. Accurate in intent, unevidenced in practice. |
| — | No DPIA is mentioned |
| — | No children's data section |

I have corrected the two most misleading items (§2 analytics wording, §5 naming)
and added the missing sections. See §3 below.

### LOW-1 — Retention is stated but unenforced
s.25(g) requires keeping identifiable data no longer than necessary. There is no
scheduled purge of opinions after a policy review closes. Worth a calendar
reminder per review cycle, even if manual.

---

## 3. Changes already made

`privacy.html` has been updated so the policy matches the system:

- **§2** now describes real collection (no analytics; Google Sheets storage named)
- **new §3** — publication and government sharing, with the consent basis stated
- **new §4** — children and young people, stating the position plainly
- **new §5** — international transfers and the safeguard relied on
- **§6** now names the SMS channel, which was entirely absent
- **§7** names specific data subject rights with a response commitment and a
  named contact
- Retention now states the actual practice per review cycle rather than a vague
  promise

Renumbering means the sidebar contents list was updated to match.

---

## 4. What I did not change, and why

- **The masking design.** Publishing opinions with names and contacts withheld
  behind a reviewer gate is a sound default. It is the right shape; it needs a
  better gate (MEDIUM-1), not removal.
- **The Google Sheets backend.** Replacing it is a bigger decision than a review
  should make unilaterally. Section 4 lists what to weigh.
- **No consent checkbox was added to the form yet.** It needs your wording, since
  how you describe government sharing is a substantive choice, not a technical
  one. Suggested wording is in §5.

---

## 5. Recommended next steps

**Immediately**
1. Read the updated `privacy.html` and confirm it describes what you actually
   intend to do. It is your policy, not mine.
2. Get the child-data position decided (HIGH-3). This is the one that most needs
   a deliberate choice.
3. Have counsel confirm the cross-border position (HIGH-1).

**Short term**
4. Add the publication consent checkbox. Suggested wording:

   > ☐ I understand that my submission will be published on the Bonga Na Gava
   > public opinions page, and that my name and contact details may be shared
   > with the relevant government authority as part of formal public
   > participation submissions.

   Wire it to the sheet so the value and timestamp are stored alongside the row.
5. Add the age affirmation.
6. Run a DPIA under s.31 and file it 60 days ahead (s.31(5)).

**Medium term**
7. Replace the shared access code with individual reviewer accounts plus an
   audit log.
8. Document the retention schedule and automate it.
9. Write the cross-border safeguards assessment and keep it on file.

---

## 6. Backend decision, when you are ready

Nothing here requires replacing Google Sheets. If you later want to move, the
criteria that matter for this specific workload:

- **Local hosting is not enough.** A Kenyan-hosted server running a US-owned
  SaaS database does not satisfy s.25(h). The processor's jurisdiction is what
  counts.
- What you need is either a processor with an adequacy finding, documented
  transfer safeguards, and regional hosting — or a self-hosted store you control.
- Criteria: documented Kenya/EU-region data residency, a signed DPA with transfer
  terms, per-subject deletion, an access log, and export in a portable format.
- Whatever you pick, keep the Apps Script → Sheet pipeline as an export target
  for a defined period, so submissions are never trapped in one vendor.

**Backups.** Independently of the backend question: the sheet is currently the
only copy of citizen submissions. A single shared drive account, no visible
export path, and no backup. A monthly export to a second location costs nothing
and protects real people's contributions from a single misclick.

---

*Prepared against the Act as published by Kenya Law and ODPC guidance. Section
numbers cited are from Data Protection Act No. 24 of 2019.*
