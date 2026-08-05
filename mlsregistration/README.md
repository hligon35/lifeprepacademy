# MLS Registration App (Cloudflare Pages)

This folder contains a Cloudflare Pages-ready MLS GO registration application that uses a section-by-section wizard and submits to your existing Google Form.

## Files

- index.html: App shell
- styles.css: Visual design and responsive layout
- app.js: Wizard logic and Google Form submission mapping
- google-apps-script/Code.gs: Spreadsheet logging endpoint for emergency/contact data

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
   - Target: your-pages-project.pages.dev
4. Enable Proxied in Cloudflare DNS if available.
5. Wait for SSL issuance.

## Spreadsheet Logging

The page still submits the original MLS GO data to the Google Form, and it also supports a secondary Google Apps Script webhook that appends the complete registration, including emergency-contact fields, into the linked spreadsheet.

1. Open the spreadsheet from your Google Sheet link.
2. Go to Extensions > Apps Script.
3. Paste the contents of [google-apps-script/Code.gs](google-apps-script/Code.gs).
4. Deploy it as a Web App with Execute as: Me and Access: Anyone.
5. Copy the Web App URL into the `google-apps-script-url` meta tag in [index.html](index.html).
6. The script writes into a tab named `MLS Registration`.

## Verify

1. Open the deployed URL and complete a test submission.
2. Confirm a new row appears in your Google Sheet.
3. Open mlsregistration.lifeprepacademyfoundation.com and verify HTTPS lock icon.

## Notes

- The app posts to Google Forms formResponse endpoint.
- After player registration, the wizard can optionally continue into volunteer and/or coaching follow-up flows.
- Standalone follow-up modes are available with query params: `?flow=volunteer` or `?flow=coach`.
- If you change fields in Google Form, update the entry IDs in app.js.
- To reduce spam, add Cloudflare Turnstile before production launch.
