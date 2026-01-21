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

## What we already did in code

- Removed inline event handlers where feasible to improve CSP readiness.
- Standardized `Referrer-Policy` and `theme-color` meta on key pages.
