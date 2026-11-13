# Notes for Claude

## Campaign pages are frozen

These five pages are used for the paid ad campaign. Do NOT change them in any way
(including nav and footer changes) until the user explicitly asks for a change and names
that page's URL:

| URL | File |
|---|---|
| https://aleafiate.vercel.app/ | `index.html` |
| https://aleafiate.vercel.app/thank-you | `thank-you.html` (+ `js/thank-you.js`) |
| https://aleafiate.vercel.app/check-eligibility | `check-eligibility.html` (+ `js/eligibility.js`) |
| https://aleafiate.vercel.app/privacy-policy | `privacy-policy.html` |
| https://aleafiate.vercel.app/terms-and-conditions | `terms-and-conditions.html` |

- Make homepage edits on the copies instead: `homepage-v3.html` (exact copy of index.html),
  `homepage.html` or `homepage-v2.html`.
- The campaign pages share these files with the rest of the site, so changing them changes
  the campaign pages too: `css/footer.css`, `js/footer.js`, `css/booking.css`, `js/booking.js`,
  `css/blog.css`, `css/live-style.css`, `css/style.css`, `js/main.js`, `js/vendor/*`.
  Do not edit them for site-wide nav/footer work. Put new nav/footer markup and styles in
  new files (or inline in each non-campaign page) so the campaign pages stay exactly as they are.
- `css/pages.css` and `js/pages.js` are not loaded by any campaign page.
- The whole site currently has `<meta name="robots" content="noindex, nofollow">` (requested
  2026-11-13). Keep it on new pages until the user asks to make pages visible.

## 404 page uses the campaign header and footer

Ad visitors can land on `404.html`, so its header, phone menu and footer are kept identical to
the campaign pages (copied from `thank-you.html`). Leave `404.html` out of site-wide nav/footer
changes; when the campaign header/footer changes, copy it to `404.html` too.
