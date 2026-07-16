# At The Gate

A branded Fast Pass check-in web app for the Paducah Flag Football Clinic.

## System flow

1. Google Apps Script synchronizes one family row into the `Parent Check-In` tab and creates a stable `parent_token`, `qr_id`, and `fast_pass_url`.
2. Make watches for rows where `email_status` is `Ready for Make`.
3. SendGrid emails the parent their personal Fast Pass link:

```text
https://lifeprepacademyfoundation.com/checkin/?k={{parent_token}}
```

4. The parent sees the parent/guardian name and every registered child connected to the family.
5. After the parent selects **Yes, everything is correct**, the browser creates the QR code and composites it onto `fastpass-template.png` with the parent and child information.
6. At the clinic gate, staff open:

```text
https://lifeprepacademyfoundation.com/checkin/?staff=1
```

7. Staff scan the QR, review the family, and select **Confirm Check-In**.

Twilio is not part of QR generation or check-in. Make and SendGrid only deliver the personal Fast Pass link.

## QR generation and template safety

The branded pass is produced by `checkin/app.js` and `checkin/qr-local.js`. The app:

- reads the family through the Google Apps Script endpoint;
- uses the existing `qr_id`;
- draws `fastpass-template.png` as the background;
- adds the parent/guardian name and registered child names;
- creates a QR pointing to `?staff=1&code={{qr_id}}`.

The Make scenario must email `fast_pass_url`. It must not replace `qr_id`, `parent_token`, the template image, or the browser rendering code.

## Parent Check-In delivery fields

The sync creates and preserves:

- `email_status`: `Ready for Make`, `Sent`, or `Failed`
- `sendgrid_message_id`: SendGrid ID when Make exposes it
- `email_sent_at`: successful-send timestamp
- `fast_pass_url`: personalized parent confirmation page
- `branded_qr_code`: optional spreadsheet QR preview

A shared parent email produces one family row and one email containing all connected child names.

## Setup

1. In the registration spreadsheet, open **Extensions > Apps Script**.
2. Add each file from `checkin/google-apps-script/` to the Apps Script project.
3. Run `setupAndRefreshFastPasses()`.
4. Confirm each family row has `parent_token`, `qr_id`, `fast_pass_url`, and `email_status`.
5. Deploy the Apps Script project as a Web App that parent phones and staff devices can reach.
6. Confirm the deployment URL matches `googleAppsScriptUrl` in `checkin/config.js`.
7. Build the Make scenario in [MAKE-SENDGRID-SETUP.md](MAKE-SENDGRID-SETUP.md).
8. Test with a parent email that has multiple children before activating the schedule.

## Google Sheet connection

Spreadsheet ID:

`16xbM_ZXe4mEdfjABwPVfc6HqWhn-iW9DumoFfaQ9JTQ`

Source tabs:

- `Child Registrations`
- `Event Tickets`

Generated/updated tabs:

- `Parent Check-In`
- `Scan Log`

## QR pass format

The generated QR points staff to:

```text
https://lifeprepacademyfoundation.com/checkin/?staff=1&code={{qr_id}}
```

The email points the parent to:

```text
https://lifeprepacademyfoundation.com/checkin/?k={{parent_token}}
```
