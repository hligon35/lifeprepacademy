# Security Guide (Static + GitHub Pages/Cloudflare)

This site is a static HTML/CSS/JS site. Most meaningful security headers are best set as **HTTP response headers** (recommended via Cloudflare Rules/Transform Rules or hosting config), not via `<meta>` tags.

## Recommended headers

These are safe defaults for a public informational site. Validate in staging first.

### Content Security Policy (CSP)

Because the site uses an external Cloudflare Turnstile script on the Contact page, you’ll need to allow that origin.

Start with a report-only policy, then tighten.

**Report-only starter**

```
Content-Security-Policy-Report-Only: default-src 'self';
  base-uri 'self';
  object-src 'none';
  frame-ancestors 'none';
  img-src 'self' data: https:;
  style-src 'self' 'unsafe-inline';
  script-src 'self' https://challenges.cloudflare.com;
  connect-src 'self' https://script.google.com https://script.googleusercontent.com;
  form-action 'self' https://script.google.com;
  upgrade-insecure-requests;
```

Notes:
- `style-src 'unsafe-inline'` is needed if any inline `<style>` remains.
- `connect-src`/`form-action` allow the Google Apps Script endpoint used by the contact form.

### HSTS

Enable only after confirming HTTPS is always used.

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### Other useful headers

```
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Cross-Origin-Opener-Policy: same-origin
```

## Cloudflare setup hints

- Use **Rules → Transform Rules → HTTP Response Header Modification** to set the headers above.
- Roll out CSP as **Report-Only** first and watch the reports before enforcing.

## Netlify (example)

If you deploy on Netlify, you can set headers with a `netlify.toml` or a `_headers` file.

**Option A: `netlify.toml`**

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"
    Cross-Origin-Opener-Policy = "same-origin"
    # Consider enabling only after confirming HTTPS is always used
    # Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
    # Start CSP in Report-Only, then enforce after confirming it’s clean.
    Content-Security-Policy-Report-Only = "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' https://challenges.cloudflare.com; connect-src 'self' https://script.google.com https://script.googleusercontent.com; form-action 'self' https://script.google.com; upgrade-insecure-requests"
```

## GitHub Pages

GitHub Pages does not support configuring arbitrary security headers directly.
If you need CSP/HSTS/etc, put the site behind a reverse proxy/CDN that can set headers (Cloudflare is a common option).

### GitHub Pages checklist

In your repo settings:

1. **Settings → Pages**
  - Select the correct source (typically `main` / root).
  - If you use a custom domain, set it here and keep the `CNAME` file in the repo aligned.
2. Turn on **Enforce HTTPS** (only appears after GitHub provisions the cert for your domain).

Notes:
- This repo is configured like a **custom-domain** site (it includes a `CNAME` file and uses absolute `/...` URLs in the Service Worker). That’s correct for `https://www.lifeprepacademyfoundation.com/`.
- If you ever deploy as a **project site** (e.g. `https://<user>.github.io/<repo>/`), absolute paths like `/style.min.css` and the Service Worker scope will not match the repo subpath. In that case, you must adjust `manifest.json` `start_url` and the paths in `sw.js` to include `/<repo>/...`.

### Recommended approach: Cloudflare in front of GitHub Pages

This gives you real HTTP response headers (CSP/HSTS/etc) while still hosting the files on GitHub.

At a high level:

1. Put your domain on Cloudflare (nameservers).
2. In Cloudflare DNS, create the GitHub Pages records (and keep them **proxied**):
  - `www` → CNAME → `<your-user>.github.io`
  - Root/apex (`@`) → use Cloudflare’s GitHub Pages guidance (often CNAME flattening to `<your-user>.github.io`)
3. In Cloudflare **SSL/TLS**:
  - Mode: **Full** (or **Full (strict)** once everything is clean)
  - Enable **Always Use HTTPS**
  - Enable **HSTS** only after confirming HTTPS is stable
4. In Cloudflare **Rules → Transform Rules → HTTP Response Header Modification**:
  - Add the headers from this guide.
  - Roll out CSP as **Report-Only** first.

Practical tip: after enabling Cloudflare proxying + headers, validate with a browser devtools “Network” tab and an online scanner (e.g. securityheaders.com) to confirm the headers are actually present.

## What we already did in code

- Removed inline event handlers where feasible to improve CSP readiness.
- Standardized `Referrer-Policy` and `theme-color` meta on key pages.

## SendGrid API key placement (Forms)

This site submits forms to a Google Apps Script Web App. The Apps Script handler can send mail via **SendGrid** (primary) and fall back to **Gmail/MailApp** if SendGrid is unavailable.

To keep secrets out of this repo, store the SendGrid key in **Apps Script Script Properties**:

1. Open the Apps Script project that is deployed as your Web App.
2. Go to **Project Settings** (gear icon).
3. Under **Script properties**, add:
  - `SENDGRID_API_KEY` = your SendGrid API key
  - (Optional) `SENDGRID_FROM_EMAIL` = default SendGrid-verified sender address
  - (Optional) `SENDGRID_FROM_NAME` = default display name for outgoing emails

If you want **different sender identities** for different forms, also add:

- Contact form sender:
  - `SENDGRID_FROM_EMAIL_CONTACT`
  - `SENDGRID_FROM_NAME_CONTACT`
- Youth Programs form sender:
  - `SENDGRID_FROM_EMAIL_YOUTH`
  - `SENDGRID_FROM_NAME_YOUTH`

Do not hard-code API keys in `contact-form-google-apps-script.js`.

Note: the form handler may also create its own Script Properties for anti-spam/cooldowns (e.g., keys starting with `lastEmailTS:`, `lastClientTS:`, `lastMsg:`). Those are internal bookkeeping entries and are safe to delete (they will be recreated as needed).
