# At The Gate

A branded fast-pass check-in web app for the Paducah Flag Football Clinic.

## System flow

1. Send the parent a text with their personal confirmation link:

```text
https://lifeprepacademyfoundation.com/checkin/?k={{parent_key}}
```

2. The parent sees the children currently connected to their registration.

3. If all children are registered, the parent taps **Yes, everything is correct** and receives a branded Fast Pass QR code.

4. If another child needs to be registered, the parent taps **Add another child**. The app sends them to the configured Jotform link with their `parent_key` and a `return_url` back to the check-in app. After the Jotform submission, send them back to the same Fast Pass process.

5. At the clinic gate, the helper opens staff mode:

```text
https://lifeprepacademyfoundation.com/checkin/?staff=1
```

6. The helper scans the parent's QR code. The helper screen shows the registered children, shirt size, and medical info.

7. The helper presses **Confirm Check-In**. The app marks the parent and child rows checked in, records the check-in time, writes a scan log entry, and resets the screen for the next scan.

## What this adds

- Parent Fast Pass page: `checkin/?k=PARENT_KEY`
- Staff gate scanner: `checkin/?staff=1`
- Missing registration / walk-up station: `checkin/?register=1`
- Google Sheets backend through Google Apps Script
- Check-in status fields in the Parents tab
- Child-level check-in support when a `Children` tab exists
- Scan Log tab for attendance history

## Google Sheet connection

The app is designed to sit on top of the existing registration spreadsheet:

`16xbM_ZXe4mEdfjABwPVfc6HqWhn-iW9DumoFfaQ9JTQ`

The backend expects the `Parents` tab to include these existing columns if available:

- `parent_key`
- `parent_email`
- `parent_name`
- `parent_phone`
- `ticket_count`
- `registered_child_names`

For best gate display, add or generate a `Children` tab with one row per child and these fields where available:

- `parent_key`
- `child_name`, or `Child's Full Name`
- `T-Shirt Size`, or `shirt_size`
- `Medical Conditions, Allergies, or Special Needs`, or `medical_info`
- `Current Medications`, or `medications`

The Apps Script will add these fields if they do not already exist:

- `qr_id`
- `precheck_status`
- `precheck_time`
- `checked_in`
- `checked_in_at`
- `checked_in_by`
- `checkin_status`

It also creates or uses:

- `Check-In Passes`
- `Scan Log`

## Setup steps

1. Open the Google Sheet.
2. Go to Extensions > Apps Script.
3. Paste the contents of `checkin/google-apps-script/Code.gs`.
4. Deploy as a Web App.
5. Choose a Web App access setting that allows parent phones and gate devices to reach the app endpoint.
6. Copy the deployed Web App URL.
7. Paste it into `checkin/config.js` as `googleAppsScriptUrl`.
8. Add the Jotform child registration URL to `registrationUrl`.
9. Configure Jotform to redirect back to the `return_url` value after submission, or redirect manually back to the parent's Fast Pass link.
10. Add the missing-registration Jotform URL to `missingRegistrationUrl`.

## QR pass format

The QR pass that appears after verification points staff to:

```text
https://lifeprepacademyfoundation.com/checkin/?staff=1&code={{qr_id}}
```

## Subdomain note

This repo currently has `CNAME` set to `lifeprepacademyfoundation.com`, so the app is immediately designed for:

```text
https://lifeprepacademyfoundation.com/checkin/
```

To use:

```text
https://checkin.lifeprepacademyfoundation.com
```

use one of these no-subscription options:

1. Create a separate GitHub Pages site or repo for the check-in app and set that site's custom domain to `checkin.lifeprepacademyfoundation.com`.
2. Use DNS or Cloudflare to redirect `checkin.lifeprepacademyfoundation.com` to `https://lifeprepacademyfoundation.com/checkin/`.

Do not replace this repo's existing `CNAME` with the check-in subdomain unless you want the main website domain to stop being the primary GitHub Pages custom domain.
