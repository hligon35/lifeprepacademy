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

- `Child Registrations` (existing confirmed registrations)
- `Waitlist` (new Jotform submissions)
- `Event Tickets`

Only `Waitlist` rows with `registration_type=add_child` and a valid existing `parent_key` are added to a Fast Pass. Normal waitlist registrations remain excluded from confirmed families.

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


## Additional-child return flow

The Fast Pass page sends these hidden values into Jotform when a parent selects **Add another child**:

- `parent_key`
- `return_url`
- `registration_type`
- `previous_child_count`

Configure Jotform to return the parent to the submitted `return_url`. The URL contains the existing family token, `returning=1`, and the previous child count.

After the submission:

1. Jotform writes the submission to `Waitlist`.
2. `Sync.gs` accepts it only when `registration_type=add_child` and `parent_key` matches an existing family. It then links by that key first, with email or phone as supporting identifiers.
3. The existing `parent_token` and `qr_id` are preserved.
4. A changed child list clears the old verification state.
5. `email_status` returns to `Ready for Make`, so the existing SendGrid scenario sends the updated Fast Pass email.
6. The returning browser waits for the child count to increase and then shows the full family verification screen again.

Run `installFastPassSyncTrigger()` once from Apps Script after deploying these files. It installs a five-minute synchronization fallback. If Make calls the `syncParents` action immediately after the Jotform submission, the browser will usually refresh before the fallback trigger is needed.
