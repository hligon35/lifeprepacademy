# Make + SendGrid Fast Pass Delivery

## Scenario modules

1. **Scheduler** — run once for the initial send, or every 15 minutes while registrations remain open.
2. **Google Sheets: Search Rows** — spreadsheet `Youth NFL Flag Football Camp Registration`, tab `Parent Check-In`.
3. **Filter: Ready to email**.
4. **SendGrid: Send an Email**.
5. **Google Sheets: Update a Row** using the row number returned by Search Rows.
6. Add an error-handler route that updates the same row to `Failed`.

## Search and filter rules

Only continue when all are true:

- `email_status` equals `Ready for Make`
- `parent_email` is not empty
- `fast_pass_url` is not empty
- `registration_status` is not cancelled
- `checked_in` is not `Yes`

This status filter prevents duplicate sends when the scenario runs again.

## SendGrid mapping

- **To:** `parent_email`
- **To name:** `parent_name`
- **Subject:** `Your Paducah Flag Football Clinic Fast Pass`
- **HTML:** use `sendgrid-fast-pass-email.html`
- Map `parent_name`, `registered_child_names`, and `fast_pass_url` from the Google Sheets row.
- Use a verified From address and domain in SendGrid.

Do not email `qr_id` as the parent link. The parent must receive `fast_pass_url`; the page then loads the family information and generates the branded QR safely.

## Success update

After SendGrid succeeds, update the same row:

- `email_status` = `Sent`
- `sendgrid_message_id` = the SendGrid message ID, if returned
- `email_sent_at` = `now`

Do not modify:

- `parent_token`
- `qr_id`
- `fast_pass_url`
- `registered_child_names`
- `branded_qr_code`

## Error handler

If SendGrid fails, update:

- `email_status` = `Failed`

Leave `email_sent_at` blank. After correcting the email or SendGrid issue, manually change the status back to `Ready for Make` to retry.

## Test before activation

Use a test family with multiple children and confirm:

1. only one email is sent to the shared parent email;
2. the button opens the correct family's page;
3. every registered child appears;
4. **Yes, everything is correct** produces the existing branded background;
5. the QR opens staff mode and the same family is displayed;
6. the success update prevents a second email.
