# Notes for Claude

## index.html is frozen (live ad landing page)

https://aleafiate.vercel.app/ (`index.html`) is the page used for the paid ad campaigns.
Do NOT change it in any way until the user explicitly asks for a change and names that URL.

- Make homepage edits on the copies instead: `homepage-v3.html` (exact copy of index.html),
  `homepage.html` or `homepage-v2.html`.
- index.html also loads these shared files, so changing them changes the live page too:
  `css/blog.css`, `css/booking.css`, `css/footer.css`, `js/booking.js`, `js/footer.js`, `js/vendor/*`.
  Avoid editing them; if a change is needed, scope it so it can't affect index.html, or ask first.
- `css/style.css`, `css/live-style.css`, `css/pages.css` and `js/pages.js` are not loaded by index.html.
