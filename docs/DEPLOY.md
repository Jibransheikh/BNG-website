# Deployment

**Prepared:** 30 September 2026

## What changed and where it lands

| File | Purpose |
|---|---|
| `.htaccess` | **New.** Must be copied to the web root, including the dot. |
| `404.html` | **New.** Served by `ErrorDocument 404 /404.html`. |
| `package.json`, `.gitignore` | Local dev only. Not needed on the server. |
| `tests/`, `docs/` | Local dev only. Safe to exclude from deploy. |
| `assets/images/movement/*-{800}.jpg/.webp`, `*.webp` | **New image variants.** Required by `index.html` `srcset`. |

## Order that matters

1. **Upload the new image variants first.** `index.html` now references
   `movement-NN.webp` and `movement-NN-800.webp`. If those 404 while the new
   markup is live, browsers fall back to the `.jpg` and the site still works —
   but you would lose the savings silently. Upload assets, then HTML.

2. **Then `.htaccess`.** It sets caching and headers. Note the cache durations are
   deliberately moderate (30 days images, 7 days CSS/JS) because asset filenames
   are **not** fingerprinted. If you replace `warriors.js` or re-encode a
   `movement-NN.jpg` in place, returning visitors may keep the old copy until the
   cache expires. That is the trade for not being stranded on stale JS for a year.
   Once you add fingerprinting, switch to `max-age=31536000, immutable`.

3. **Then the HTML.**

## Verifying after deploy

```powershell
# 1. www should now redirect to the apex
curl -sI https://www.bonganagava.com | Select-String "HTTP|Location"

# 2. A broken URL should return a real 404 with your page
curl -s -o NUL -w "%{http_code}" https://bonganagava.com/does-not-exist

# 3. Security headers should be present
curl -sI https://bonganagava.com/ | Select-String "Strict-Transport|Content-Security|X-Content-Type|Referrer-Policy"

# 4. Images should be cached (30 days)
curl -sI https://bonganagava.com/assets/images/movement/movement-01.webp | Select-String "Cache-Control"

# 5. Extensionless URLs should keep their query string
#    /submissions?policy=... must not lose the query on redirect
curl -sI "https://bonganagava.com/submissions" | Select-String "HTTP|Location"

# 6. New page should be in the sitemap
curl -s https://bonganagava.com/sitemap.xml | Select-String -Pattern "<loc>"
```

If (3) returns nothing on Cloudflare, Cloudflare may be stripping or overriding
origin headers. Set them in the Cloudflare dashboard instead:

- **Rules → Modify Response Header** (available on Free)
- HSTS also available under **SSL/TLS → Edge Certificates → HTTP Strict Transport Security**

That is better than `.htaccess` for headers anyway, since you can read back the
response you actually get.

## Cloudflare settings worth checking

- **SSL/TLS mode: Full (strict).** Not "Flexible", which is currently
  deprecated and will break.
- **Always Use HTTPS: On.** Belt and braces with the `.htaccess` rule.
- **Minimum TLS version: 1.2.**
- **Early Hints: optional.**

## Moving to Hostinger later

`.htaccess` is written for Apache and LiteSpeed, both of which Hostinger runs,
so it should work as-is. Things to re-check on the move:

- Re-verify the headers, since Hostinger's defaults differ from Cloudflare's.
- The `www` redirect and `ErrorDocument` will start working from the origin
  rather than the edge — confirm both.
- DNS cutover: lower the DNS TTL to 300 a day in advance so the switch is fast
  and rollback is quick.
- Cloudflare Web Analytics, if adopted, needs re-pointing to the new origin.

## Cloudflare Workers deploy

```bash
npm install
npm run build:deploy   # stage into dist/, then report sizes
npm run deploy         # stage, then wrangler deploy
npm run deploy:dry     # stage, then wrangler deploy --dry-run
npm run preview        # serve dist/ locally via wrangler dev
```

Set the Cloudflare project's deploy command to `npm run deploy`. Use
`npm run build` if you only need the generated file refreshed.

**Do not point `assets.directory` at the repo root.** Workers rejects any single
asset over 25 MiB, and Wrangler's own `workerd` binary is ~92 MiB, so deploying
the working directory fails on that file alone. `tools/build-deploy.js` stages an
allowlisted copy into `dist/` — the config points there, and nothing outside the
allowlist can leak into an upload.

There is no `assets.exclude` option to filter the upload instead: Wrangler's config
schema rejects unknown keys under `assets` and silently ignores them with a
warning, so an exclusion list there gives the false impression the upload was
filtered when it was not.

`_headers` and `_redirects` are ported from `.htaccess`. Both must be edited
together — `.htaccess` serves the Apache origin, these serve the Cloudflare
deploy. Two `.htaccess` rules are configured in the Cloudflare dashboard instead:
enable "Always Use HTTPS" in SSL/TLS, and `html_handling` in `wrangler.jsonc`
covers the extensionless `/about` → `/about.html` rewrite.

## Running locally

```bash
npm install
npm run build      # regenerates policy-reviews-data.js from <meta> tags
npm test           # jsdom regression suite
```

There is no bundler or dev server. Open any `.html` file directly, though
`submissions.html` needs the Apps Script endpoint reachable, so serve over HTTP
rather than `file://`:

```bash
npx serve .
```

## A note on the generated file

`policy-reviews-data.js` is generated by `build.js` from the `<meta
name="bng-policy">` tags on pages in `policy-reviews/`. It is committed so the
site works without a build step on the server. **If you add a policy review, run
`node build.js` before deploying**, or the new review will not appear in the
submission dropdown or the opinions filter.

The same convention is the natural place to add `deadline` and `status` fields —
see `STACK-RECOMMENDATION.md`.
