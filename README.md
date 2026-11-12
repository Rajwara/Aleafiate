# Aleafiate Health Clinics — website

Open `index.html` in a browser (double-click). Works offline — all animation libraries are in `js/vendor/`.
Fonts load from Google Fonts when online (falls back to Georgia / system font offline).

## Structure
- index.html — Home (the former home-v3; self-contained: its CSS and JS are inline)
- home-v1.html — The previous homepage, kept for reference (not indexed by search engines)
- about.html — About
- terms-and-conditions.html — Terms & Conditions
- blog.html + blog-*.html — Blog listing and three articles (styles in css/blog.css, shared with the Home v2 blog section)
- privacy-policy.html — Privacy Policy
- practitioners.html — Meet Our Prescribing Practitioners (filter + profile drawer)
- faq.html — FAQ (search, section nav, accordions)
- contact.html — Contact (info cards, request form, map)
- check-eligibility.html + js/eligibility.js — "Check eligibility" quiz (homepage header/footer; questions and ActiveCampaign settings at the top of js/eligibility.js)
- thank-you.html + js/thank-you.js — page shown after a booking or eligibility-check submission (?form=booking | eligibility&result=…)
- homepage.html — new Homepage (design in progress, built section by section; noindex until it goes live)
- homepage-v2.html — homepage v2 draft: every section of the live homepage rebuilt with the best of the mock-ups (noindex until it goes live)
- homepage-v3.html — exact copy of index.html (the live homepage) for editing; noindex
- mock-test-about.html — holding page for the old About sections (About Aleafiate, Our mission, Our approach, The experience) removed from about.html; noindex
- about-v2.html, pricing.html, how-it-works.html — new inner pages (noindex for review); shared css/pages.css + js/pages.js for their layout and scroll animations
- test-mock.html — Test page with the old home-v2 nav and banner (not indexed)
- css/style.css — all styles (colours & fonts at the top in :root; headings Montserrat, text Poppins)
- css/footer.css + js/footer.js — the site footer (same on every page) and its newsletter sign-up
- css/live-style.css — the live homepage’s fonts and button style (Montserrat 600 headings, 52px Poppins pill buttons), loaded last on every page except index.html
- css/booking.css + js/booking.js — floating "Book appointment" button and pop-up form on every page. Requests go to the ActiveCampaign form "Website – Book appointment" (ID 16; settings at the top of js/booking.js)
- js/main.js — all animations (driven by data-attributes, see comment at top)
- js/vendor/ — GSAP 3.13 (ScrollTrigger, SplitText, Draggable) + Lenis
- images/ — one folder per page; each folder's README lists the file names, sizes and AI prompts
  - images/logos/ — logos and favicons
  - images/home/ — previous homepage (home-v1.html) and shared images
  - images/practitioners/ — practitioner photos (also used on the homepage) and the practitioners page
  - images/about/, images/home-v2/, images/contact/, images/faq/ — the other pages

## Adding images
Every placeholder is `<img src="" alt="">` with a size label.
Change it to `<img src="images/your-photo.jpg" alt="Describe the photo">` — the label disappears automatically.

## Rebranding
Brand colours are at the top of css/style.css. Logos live in images/logos/ (aleafiate-logo-dark-compact.svg for light backgrounds, aleafiate-logo-light-compact.svg for dark ones such as the footer). The favicon is favicon.ico in the site root, with PNG sizes in images/logos/.

## Practitioners
Each practitioner is one `<article class="doc">` in practitioners.html. Edit the `data-name`, `data-role`,
`data-reg` and `data-cat` (doctor / nurse / pharmacist) attributes, the visible text, and the `<template>`
inside it — that template is what shows in the profile panel. Update the tab counts if you add or remove people.

## Contact form
By default the form opens the visitor's email app, addressed to `data-mailto` on the `<form>`.
To receive requests directly, sign up to a form service (e.g. Formspree) and put its URL in `action=""`.
