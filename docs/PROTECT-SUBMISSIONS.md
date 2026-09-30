# Protecting the submissions page

**Prepared:** 30 September 2026

`submissions.html` is an internal reviewers' view of citizen submissions. It is
not part of the public site.

## Current state — read this before deploying

The page currently has **no access control at the page level**. It is a static
file that anyone who knows the URL can load.

What that exposes right now:

| Data | Exposed to any visitor? |
|---|---|
| Opinion text, and which policy it maps to | **Yes** |
| Number of submissions | **Yes** |
| Name and contact details | No — the Apps Script withholds these unless a correct reviewer `key` is sent |
| Reviewer access code | No — never present in the page source |

So the reviewer code does protect the most damaging columns (name, phone,
email). But "opinion text tied to a specific environmental bill" is itself
personal data, and arguably sensitive data, because it reveals a person's
political position. Under Kenya's Data Protection Act 2019 that is worth
protecting regardless of whether names are attached.

Already done:

- Removed from `sitemap.xml` — it was being advertised to search engines.
- `Disallow` added to `robots.txt` for `/submissions.html` and `/submissions`.

Note clearly: **robots.txt is a crawler hint, not access control.** It is a
public file, and anyone can load the URL directly regardless. It reduces
incidental discovery. It does not protect anything against a determined person.

## Recommended protection

Pick one. Option 1 is the best fit if you stay on Cloudflare.

### Option 1 — Cloudflare Access (recommended, no code)

Free for up to 50 users. Put the page behind an email or Google login, so only
accounts you explicitly allow can load it.

Pros: per-person identity, so you can see who viewed submissions and revoke one
person without changing a shared password; revocable; survives the page being
publicly linked; logs access. Cons: Cloudflare-only, so it must be re-created if
you move to Hostinger.

Setup (I can't do this part, it needs your Cloudflare dashboard):

1. **Zero Trust → Access → Applications → Add an application**
2. Self-hosted, domain `bonganagava.com/submissions.html`
3. Add a **path** rule rather than a wildcard
4. Policy: **Allow** emails you list, or **Allow** anyone with email ending
   `@suso.world`
5. Set a session duration — 1 hour is sensible for PII

Do this *before* the page goes live, and use "test as self" while setting it up.

### Option 2 — HTTP Basic Auth in `.htaccess`

Works on Apache and LiteSpeed, so it survives a move to Hostinger. No dashboard
access needed.

```apache
<FilesMatch "^submissions\.html$">
    AuthType Basic
    AuthName "BNG Internal"
    AuthUserFile /path/to/.htpasswd
    Require valid-user
</FilesMatch>

# The extensionless alias needs protecting too.
<IfModule mod_rewrite.c>
    RewriteCond %{REQUEST_URI} ^/submissions$
    RewriteRule ^ - [AUTH]
</IfModule>
```

Generate the password file (run this on the server, not locally):

```bash
htpasswd -c /path/to/.htpasswd reviewer
```

Pros: portable, works everywhere Apache runs, no third party in the path.
Cons: one shared password for everyone, no per-person accountability, and it
sends credentials to anyone who has the URL unless you combine it with HTTPS.
Keep `.htpasswd` outside the web root.

### Option 3 — Don't publish it at all

Keep `submissions.html` out of the deployed site entirely, and add a local
script that fetches the sheet and writes a gitignored local file. Nothing to
protect, because nothing is exposed.

This is the strongest option and the least convenient. It suits a one-person
team who mostly needs a quick overview and doesn't need the page on a phone.

## Also worth doing regardless

**Rate-limit the reviewer code in Apps Script.** I added a client-side limiter
to `submissions.html` (5 attempts, then a 5-minute lockout), but it is a speed
bump only — anyone can bypass it with devtools or by calling the endpoint
directly. The real control has to be in `doGet()`:

- Track failed attempts per IP in `CacheService`
- Lock out after ~5 failures
- Never log the key itself

**Stop putting the key in the URL.** It is currently sent as a GET parameter
(`?view=opinions&key=...`), so it lands in browser history and in Cloudflare
and server access logs. The `Referrer-Policy: strict-origin-when-cross-origin`
header in `.htaccess` stops it leaking to third-party hosts via the Referer
header, which is the worst of the leaks, but logs and history remain. A POST
body, or better a Cloudflare Access session, removes this class of problem.

## Operational warning

The page has a PDF/print export. An unlocked export contains every submission
with names and contacts in a file that can then be emailed around. Treat any
downloaded file as sensitive: don't put it in a shared drive, and delete it when
you're done.

## Until this is sorted

If you need to deploy now and can't set up Access yet, Option 3 or Option 2 both
work. What you should not do is deploy the page as-is and rely on the reviewer
code — that code guards the names, not the opinions.
