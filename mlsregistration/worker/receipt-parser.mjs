const QUEST_URL_RE = /https?:\/\/quest\.build\/[^\s"'<>\])]+/ig;
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

function collapseWhitespace(value) {
  return String(value || "").replace(/\r/g, "\n").replace(/\u00a0/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"');
}

function parseQuestUrls(source) {
  const matches = String(source || "").match(QUEST_URL_RE) || [];
  return [...new Set(matches.map((url) => url.trim()))];
}

function parseIsoFromQuestTimestamp(value) {
  const match = String(value || "").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/);
  if (!match) return "";

  const [, month, day, year, hour, minute] = match;
  const iso = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), 0));
  return Number.isNaN(iso.getTime()) ? "" : iso.toISOString();
}

function parseHeaderDate(dateHeader) {
  const parsed = new Date(String(dateHeader || ""));
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

function extractSubmissionId(urls) {
  for (const rawUrl of urls) {
    try {
      const url = new URL(rawUrl);
      const submissionId = url.searchParams.get("registration_submission_id")
        || url.searchParams.get("submission_id")
        || url.searchParams.get("submissionId")
        || url.searchParams.get("registrationId")
        || url.searchParams.get("reference")
        || url.searchParams.get("external_reference");
      if (submissionId) return submissionId.trim();
    } catch (_error) {
      // Ignore malformed URLs captured from forwarded content.
    }
  }
  return "";
}

function normalizeMoney(value) {
  const amount = String(value || "").replace(/[^0-9.]/g, "").trim();
  if (!amount) return "";
  const parsed = Number(amount);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "";
}

function parseBilledTo(block) {
  const normalized = collapseWhitespace(block).replace(/\n/g, " ");
  const emailMatch = normalized.match(EMAIL_RE);
  if (!emailMatch) {
    return { parentName: "", parentEmail: "", postalCode: "", countryCode: "" };
  }

  const email = emailMatch[0].trim().toLowerCase();
  const before = normalized.slice(0, emailMatch.index).replace(/^Billed to:\s*/i, "").trim();
  const after = normalized.slice((emailMatch.index || 0) + email.length).trim();
  const zipMatch = after.match(/\b\d{5}(?:-\d{4})?\b/);
  const countryMatch = after.match(/\b[A-Z]{2}\b/);

  return {
    parentName: before.replace(/\s{2,}/g, " ").trim(),
    parentEmail: email,
    postalCode: zipMatch ? zipMatch[0] : "",
    countryCode: countryMatch ? countryMatch[0] : "",
  };
}

export function parseQuestReceiptEmail(input = {}) {
  const subject = collapseWhitespace(input.subject || "");
  const text = collapseWhitespace(input.text || "");
  const htmlText = collapseWhitespace(stripHtml(input.html || ""));
  const combined = [subject, text, htmlText].filter(Boolean).join("\n");

  if (!/official donation receipt|registration receipt|order confirmation/i.test(combined)) {
    return null;
  }
  if (!/quest\.build|paducah go soccer|registration fee/i.test(combined)) {
    return null;
  }

  const urls = parseQuestUrls([text, htmlText].filter(Boolean).join("\n"));
  const billedBlockMatch = combined.match(/Billed to:\s*([\s\S]+?)(?:LifePrep Academy Foundation|For any questions|https?:\/\/quest\.build|$)/i);
  const billedTo = parseBilledTo(billedBlockMatch ? billedBlockMatch[0] : "");
  const totalMatch = combined.match(/(?:Order Total|TOTAL)\s*:?\s*\$\s*([0-9]+(?:\.[0-9]{2})?)/i);
  const orderMatch = combined.match(/Order\s*#\s*:?\s*([A-Z0-9-]+)/i);
  const eventMatch = combined.match(/Event\s*:?\s*([^\n\r]+)/i);
  const placedMatch = combined.match(/placed on\s*(\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2})/i);
  const itemMatch = combined.match(/-\s*(\d+)\s*x\s*Registration Fee\s*@\s*\$\s*([0-9]+(?:\.[0-9]{2})?)/i);

  const paidAt = parseIsoFromQuestTimestamp(placedMatch ? placedMatch[1] : "") || parseHeaderDate(input.date || "");
  const amount = normalizeMoney(totalMatch ? totalMatch[1] : itemMatch ? itemMatch[2] : "");
  const playerCount = itemMatch ? Number(itemMatch[1]) : (amount ? Math.max(1, Math.round(Number(amount) / 75)) : 0);
  const receiptUrl = urls.find((url) => /quest\.build\//i.test(url)) || "";

  if (!billedTo.parentEmail || !orderMatch || !amount) {
    return null;
  }

  return {
    provider: "quest",
    paid: true,
    subject,
    parentName: billedTo.parentName,
    parentEmail: billedTo.parentEmail,
    postalCode: billedTo.postalCode,
    countryCode: billedTo.countryCode,
    orderId: orderMatch[1].trim(),
    paymentTransactionId: orderMatch[1].trim(),
    eventName: eventMatch ? eventMatch[1].trim() : "",
    amount,
    currency: "USD",
    playerCount: Number.isFinite(playerCount) ? playerCount : 0,
    paidAt,
    receiptUrl,
    submissionId: extractSubmissionId(urls),
    sourceUrls: urls,
  };
}