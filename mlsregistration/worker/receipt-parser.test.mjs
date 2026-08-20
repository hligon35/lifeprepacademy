import test from "node:test";
import assert from "node:assert/strict";

import { parseQuestReceiptEmail } from "./receipt-parser.mjs";

const sampleText = `Hi Randi  Williams,

This is your order confirmation and ticket receipt for Paducah GO Soccer.
Order #: 12256 (placed on 08/20/2026 14:47)
Event: Paducah GO Soccer
- 1 x Registration Fee @ $75.00
TOTAL: $75.00
Fair Market Value of Goods or Services Received : $75.00
Tax-deductible amount : $0.00
Billed to: Randi Williams rcwilliams0105@gmail.com 42001 US
LifePrep Academy Foundation
https://quest.build/lpafoundation/paducah-go-soccer/1598/71794/0`;

test("parses a Quest payment receipt email", () => {
  const parsed = parseQuestReceiptEmail({
    subject: "Official Donation Receipt and Registration - LifePrep Academy Foundation",
    text: sampleText,
    date: "Thu, 20 Aug 2026 14:48:09 +0000",
  });

  assert.ok(parsed);
  assert.equal(parsed.provider, "quest");
  assert.equal(parsed.parentName, "Randi Williams");
  assert.equal(parsed.parentEmail, "rcwilliams0105@gmail.com");
  assert.equal(parsed.orderId, "12256");
  assert.equal(parsed.amount, "75.00");
  assert.equal(parsed.currency, "USD");
  assert.equal(parsed.playerCount, 1);
  assert.equal(parsed.eventName, "Paducah GO Soccer");
  assert.equal(parsed.receiptUrl, "https://quest.build/lpafoundation/paducah-go-soccer/1598/71794/0");
  assert.equal(parsed.paidAt, "2026-08-20T14:47:00.000Z");
});

test("extracts submission id from receipt urls when available", () => {
  const parsed = parseQuestReceiptEmail({
    subject: "Official Donation Receipt and Registration - LifePrep Academy Foundation",
    text: `${sampleText}\nhttps://quest.build/example?registration_submission_id=sub_12345`,
  });

  assert.equal(parsed.submissionId, "sub_12345");
});

test("ignores unrelated emails", () => {
  const parsed = parseQuestReceiptEmail({
    subject: "Hello",
    text: "This is not a payment receipt.",
  });

  assert.equal(parsed, null);
});