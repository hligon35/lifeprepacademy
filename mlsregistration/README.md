# MLS Registration App (Cloudflare Pages)

This folder contains a Cloudflare Pages-ready MLS GO registration application that uses a one-question-per-screen flow and submits to your existing Google Form.

## Files

- index.html: App shell
- styles.css: Visual design and responsive layout
- app.js: Wizard logic and Google Form submission mapping

## Deploy To Cloudflare Pages

1. In Cloudflare, go to Workers & Pages -> Create -> Pages -> Connect to Git.
2. Select this repository.
3. Set Framework preset to None.
4. Set Build command to blank.
5. Set Build output directory to mlsregistration.
6. Deploy.

## Connect Custom Domain

1. In the Pages project, go to Custom domains.
2. Add mlsregistration.lifeprepacademyfoundation.com.
3. If prompted for DNS record, create:
   - Type: CNAME
   - Name: mlsregistration
   - Target: <your-pages-project>.pages.dev
4. Enable Proxied in Cloudflare DNS if available.
5. Wait for SSL issuance.

## Verify

1. Open the deployed URL and complete a test submission.
2. Confirm a new row appears in your Google Sheet.
3. Open mlsregistration.lifeprepacademyfoundation.com and verify HTTPS lock icon.

## Notes

- The app posts to Google Forms formResponse endpoint.
- If you change fields in Google Form, update the entry IDs in app.js.
- To reduce spam, add Cloudflare Turnstile before production launch.
