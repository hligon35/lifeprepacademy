import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { AGREEMENT_TEMPLATES } from "./template-hashes.js";
import { PLAYER_AGREEMENT_FIELD_MAP, VOLUNTEER_AGREEMENT_FIELD_MAP } from "./pdf-field-maps.js";

const MAX_SIGNATURE_DATA_URL_BYTES = 1024 * 1024;
const MAX_TYPED_SIGNATURE_LEN = 120;
const RATE_LIMIT_PER_MINUTE = 30;
const DEFAULT_SIGNER_LINK_TTL_MS = 1000 * 60 * 30;
const EMAIL_SIGNER_LINK_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const PRIMARY_APP_ORIGIN = "https://mlsregistration.lifeprepacademyfoundation.com";
const DEFAULT_ALLOWED_ORIGINS = [
  PRIMARY_APP_ORIGIN,
  "https://lifeprepacademyfoundation.com",
  "https://www.lifeprepacademyfoundation.com",
  "https://preview.lifeprepacademyfoundation.com",
  "https://lpaf-mls.hligon.workers.dev",
  "http://127.0.0.1:3000",
  "http://localhost:3000",
];
const PLAYER_REGISTRATION_PAYMENT_URL = "https://give.cornerstone.cc/lifeprepacademyfnd/checkout?amount=75&designation=MLS%20GO%20Registration%20Fee&source=mls-go-registration";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
      return handleApiOptions(request, env);
    }

    if (url.pathname === "/api/public-config" && request.method === "GET") {
      return handlePublicConfig(env, request);
    }
    if (url.pathname === "/api/public-config") {
      return json({ ok: false, error: "Method not allowed" }, 405, request, env);
    }

    if (url.pathname === "/api/sign-agreement" && request.method === "POST") {
      return handleSignAgreement(request, env, ctx);
    }
    if (url.pathname === "/api/sign-agreement") {
      return json({ ok: false, error: "Method not allowed" }, 405, request, env);
    }

    if (url.pathname === "/api/forms/upsert" && request.method === "POST") {
      return handleFormUpsert(request, env);
    }
    if (url.pathname === "/api/forms/upsert") {
      return json({ ok: false, error: "Method not allowed" }, 405, request, env);
    }

    if (url.pathname === "/api/payment-webhook/cornerstone" && request.method === "POST") {
      return handlePaymentWebhook(request, env);
    }
    if (url.pathname === "/api/payment-webhook/cornerstone") {
      return json({ ok: false, error: "Method not allowed" }, 405, request, env);
    }

    if (url.pathname.startsWith("/api/signer/agreement/") && request.method === "GET") {
      return handleSignerDownload(request, env);
    }
    if (url.pathname.startsWith("/api/signer/agreement/")) {
      return json({ ok: false, error: "Method not allowed" }, 405, request, env);
    }

    if (url.pathname.startsWith("/api/admin/agreement/") && request.method === "GET") {
      return handleAdminDownload(request, env);
    }
    if (url.pathname.startsWith("/api/admin/agreement/")) {
      return json({ ok: false, error: "Method not allowed" }, 405, request, env);
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ ok: false, error: "Not found" }, 404, request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

function handlePublicConfig(env, request) {
  const googleMapsApiKey = String(env.GOOGLE_MAPS_API_KEY || "").trim();
  const corsHeaders = buildCorsHeaders(request, env);
  return new Response(JSON.stringify({ googleMapsApiKey }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      ...corsHeaders,
    },
  });
}

export class SigningTransactionsDO {
  constructor(state) {
    this.state = state;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/rate-limit" && request.method === "POST") {
      const { key, limit = RATE_LIMIT_PER_MINUTE } = await request.json();
      const minuteKey = `${key}:${Math.floor(Date.now() / 60000)}`;
      const current = (await this.state.storage.get(minuteKey)) || 0;
      if (current >= limit) {
        return json({ ok: false, allowed: false }, 429);
      }
      await this.state.storage.put(minuteKey, current + 1, { expirationTtl: 180 });
      return json({ ok: true, allowed: true });
    }

    if (url.pathname === "/transaction" && request.method === "GET") {
      const txId = url.searchParams.get("txId");
      if (!txId) return json({ ok: false, error: "Missing txId" }, 400);
      const row = await this.state.storage.get(`tx:${txId}`);
      return json({ ok: true, value: row || null });
    }

    if (url.pathname === "/transaction" && request.method === "POST") {
      const body = await request.json();
      const { txId, value, ifAbsent = false } = body;
      if (!txId) return json({ ok: false, error: "Missing txId" }, 400);
      const key = `tx:${txId}`;
      if (ifAbsent) {
        const existing = await this.state.storage.get(key);
        if (existing) return json({ ok: true, created: false, value: existing });
      }
      await this.state.storage.put(key, value);
      return json({ ok: true, created: true, value });
    }

    return json({ ok: false, error: "Not found" }, 404);
  }
}

async function handleSignAgreement(request, env) {
  const origin = request.headers.get("Origin") || "";
  if (!isAllowedOrigin(origin, env.ALLOWED_ORIGINS || "")) {
    return json({ ok: false, error: "Origin not allowed" }, 403, request, env);
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const rate = await doFetch(env, "/rate-limit", {
    method: "POST",
    body: JSON.stringify({ key: `ip:${ip}`, limit: RATE_LIMIT_PER_MINUTE }),
  });
  if (!rate.ok) {
    return json({ ok: false, error: "Too many requests" }, 429, request, env);
  }

  const payload = await request.json().catch(() => null);
  if (!payload) return json({ ok: false, error: "Invalid JSON" }, 400, request, env);

  const validation = validateSigningPayload(payload, env);
  if (!validation.ok) return json(validation, 400, request, env);

  const { agreementType, formType, submissionId } = payload;
  const template = AGREEMENT_TEMPLATES[agreementType];
  if (!template) return json({ ok: false, error: "Unknown agreement type" }, 400, request, env);

  const txId = payload.transactionId || crypto.randomUUID();
  const existing = await doFetch(env, `/transaction?txId=${encodeURIComponent(txId)}`);
  if (existing.value?.status === "signed") {
    const signerUrl = await buildSignerUrl(request.url, txId, env);
    const emailDownloadUrl = await buildSignerUrl(request.url, txId, env, EMAIL_SIGNER_LINK_TTL_MS);
    return json({
      ok: true,
      transactionId: txId,
      signerDownloadUrl: signerUrl,
      emailDownloadUrl,
      alreadyExisted: true,
    }, 200, request, env);
  }

  await doFetch(env, "/transaction", {
    method: "POST",
    body: JSON.stringify({
      txId,
      ifAbsent: true,
      value: {
        status: "processing",
        createdAt: new Date().toISOString(),
        agreementType,
        submissionId,
        formType,
      },
    }),
  });

  try {
    const templateBytes = await readTemplateBytes(env, template.key);
    if (!templateBytes) {
      await markTransactionFailed(env, txId, "Template not found");
      await updateAgreementInSheets(env, {
        formType,
        submissionId,
        agreementType,
        signerName: payload.signer.printedName,
        signedAt: payload.audit.signedAtUtc,
        transactionId: txId,
        fileId: "",
        pdfUrl: "",
        sha256: "",
        status: "Generation Failed",
        agreementVersion: template.version,
      });
      return json({ ok: false, error: "Template not found" }, 500, request, env);
    }

    const templateHash = await sha256Hex(templateBytes);
    if (templateHash !== template.hash) {
      await markTransactionFailed(env, txId, "Template hash mismatch");
      await updateAgreementInSheets(env, {
        formType,
        submissionId,
        agreementType,
        signerName: payload.signer.printedName,
        signedAt: payload.audit.signedAtUtc,
        transactionId: txId,
        fileId: "",
        pdfUrl: "",
        sha256: "",
        status: "Generation Failed",
        agreementVersion: template.version,
      });
      return json({ ok: false, error: "Template hash mismatch" }, 409, request, env);
    }

    const completedPdf = await generateSignedPdf({ payload, templateBytes, env, txId, templateHash });
    const completedHash = await sha256Hex(completedPdf);

    const objectKey = buildObjectKey(agreementType, submissionId, txId);
    await env.SIGNED_AGREEMENTS.put(objectKey, completedPdf, {
      customMetadata: {
        transaction_id: txId,
        agreement_type: agreementType,
        submission_id: submissionId,
        completed_sha256: completedHash,
        template_sha256: templateHash,
      },
      httpMetadata: {
        contentType: "application/pdf",
        contentDisposition: `attachment; filename="${agreementType}-agreement-${txId}.pdf"`,
      },
    });

    const adminUrl = buildAdminUrl(request.url, txId);
    const signerUrl = await buildSignerUrl(request.url, txId, env);
    const emailDownloadUrl = await buildSignerUrl(request.url, txId, env, EMAIL_SIGNER_LINK_TTL_MS);

    const sheetUpdate = await updateAgreementInSheets(env, {
      formType,
      submissionId,
      agreementType,
      signerName: payload.signer.printedName,
      signedAt: payload.audit.signedAtUtc,
      transactionId: txId,
      fileId: objectKey,
      pdfUrl: adminUrl,
      sha256: completedHash,
      status: "Signed",
      agreementVersion: template.version,
    });
    if (!sheetUpdate.ok) {
      console.warn("agreement-sheet-update-failed", {
        txId,
        submissionId,
        formType,
        error: sheetUpdate.error,
      });
    }

    let registrationEmail = null;
    if (agreementType === "player") {
      const submissionEmail = await sendRegistrationSubmissionEmail(env, {
        submissionId,
        parentEmail: payload.fields?.guardianEmail,
        parentName: payload.fields?.guardianName || payload.signer?.printedName,
        participantNames: payload.fields?.participantNames || "",
        relationshipToChild: payload.fields?.relationshipToChild || "",
        primaryPhone: payload.fields?.primaryPhone || payload.fields?.parentPhone || "",
        alternatePhone: payload.fields?.alternatePhone || "",
        emergencyContactName: payload.fields?.emergencyContactName || "",
        emergencyRelationship: payload.fields?.emergencyRelationship || "",
        emergencyEmail: payload.fields?.emergencyEmail || "",
        emergencyPhone: payload.fields?.emergencyPhone || "",
        emergencyStreet: payload.fields?.emergencyStreet || "",
        emergencyCity: payload.fields?.emergencyCity || "",
        emergencyState: payload.fields?.emergencyState || "",
        emergencyZip: payload.fields?.emergencyZip || "",
        signedAt: payload.audit?.signedAtUtc || "",
        signedDocumentUrl: emailDownloadUrl,
        paymentUrl: PLAYER_REGISTRATION_PAYMENT_URL,
      });
      registrationEmail = {
        ok: Boolean(submissionEmail.ok),
        error: submissionEmail.ok ? "" : String(submissionEmail.error || "Registration email send failed"),
      };
      if (!submissionEmail.ok) {
        console.warn("registration-submission-email-failed", {
          txId,
          submissionId,
          error: submissionEmail.error,
        });
      }
    }

    await doFetch(env, "/transaction", {
      method: "POST",
      body: JSON.stringify({
        txId,
        value: {
          status: "signed",
          agreementType,
          formType,
          submissionId,
          objectKey,
          templateHash,
          completedHash,
          transactionId: txId,
          signerName: payload.signer.printedName,
          signedAt: payload.audit.signedAtUtc,
        },
      }),
    });

    return json({
      ok: true,
      transactionId: txId,
      agreementType,
      signedAt: payload.audit.signedAtUtc,
      signerDownloadUrl: signerUrl,
      emailDownloadUrl,
      sheetUpdate: {
        ok: Boolean(sheetUpdate.ok),
        error: sheetUpdate.ok ? "" : String(sheetUpdate.error || "Sheet update failed"),
      },
      registrationEmail,
    }, 200, request, env);
  } catch (error) {
    console.error("sign-agreement-failed", {
      txId,
      agreementType,
      formType,
      submissionId,
      error: String(error?.message || error),
      stack: error?.stack || null,
    });
    await markTransactionFailed(env, txId, String(error?.message || error));
    await updateAgreementInSheets(env, {
      formType,
      submissionId,
      agreementType,
      signerName: payload.signer.printedName,
      signedAt: payload.audit.signedAtUtc,
      transactionId: txId,
      fileId: "",
      pdfUrl: "",
      sha256: "",
      status: "Generation Failed",
      agreementVersion: template.version,
    });
    return json({ ok: false, error: "Agreement generation failed" }, 500, request, env);
  }
}

async function handleFormUpsert(request, env) {
  const origin = request.headers.get("Origin") || "";
  if (!isAllowedOrigin(origin, env.ALLOWED_ORIGINS || "")) {
    return json({ ok: false, error: "Origin not allowed" }, 403, request, env);
  }

  if (!env.APPS_SCRIPT_URL) {
    return json({ ok: false, error: "Apps Script URL is not configured" }, 500, request, env);
  }

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return json({ ok: false, error: "Invalid JSON" }, 400, request, env);
  }

  const formType = String(payload.formType || "").trim();
  const values = payload.values && typeof payload.values === "object" ? payload.values : null;
  if (!formType || !values) {
    return json({ ok: false, error: "Missing formType or values" }, 400, request, env);
  }

  const params = new URLSearchParams();
  params.append("form_type", formType);
  Object.entries(values).forEach(([key, value]) => {
    if (!key) return;
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      if (value.length) params.append(key, value.join(", "));
      return;
    }
    const text = String(value).trim();
    if (text) params.append(key, text);
  });

  try {
    const text = await postAppsScriptForm(env.APPS_SCRIPT_URL, params);
    const parsed = safeJsonParse(text);

    if (!parsed?.ok) {
      return json({
        ok: false,
        error: parsed?.error || "Apps Script upsert failed",
        details: parsed || text.slice(0, 500),
      }, 502, request, env);
    }

    return json({ ok: true, result: parsed }, 200, request, env);
  } catch (error) {
    return json({ ok: false, error: String(error?.message || error) }, 502, request, env);
  }
}

async function handlePaymentWebhook(request, env) {
  if (!isAuthorizedWebhookRequest(request, env.PAYMENT_WEBHOOK_TOKEN || "")) {
    return json({ ok: false, error: "Unauthorized webhook" }, 401);
  }

  const payload = await parseWebhookPayload(request);
  if (!payload) {
    return json({ ok: false, error: "Invalid webhook payload" }, 400);
  }

  const normalized = normalizePaymentWebhookPayload(payload);
  if (!normalized.submissionId) {
    return json({ ok: false, error: "Missing registration_submission_id" }, 400);
  }
  if (!normalized.paid) {
    return json({ ok: true, ignored: true, reason: "Payment not completed" }, 202);
  }

  const context = await getRegistrationContext(env, normalized.submissionId);
  if (!context.ok) {
    return json({ ok: false, error: context.error || "Registration context lookup failed" }, 404);
  }
  if (String(context.paymentStatus || "").toLowerCase() === "paid") {
    return json({ ok: true, duplicate: true, submissionId: normalized.submissionId });
  }

  const agreementTxId = context.transactionId || normalized.agreementTransactionId;
  if (!agreementTxId) {
    return json({ ok: false, error: "Missing agreement transaction id" }, 404);
  }

  const signedDocumentUrl = await buildSignerUrl(request.url, agreementTxId, env, EMAIL_SIGNER_LINK_TTL_MS);
  const paymentUpdate = await updatePaymentInSheets(env, {
    submissionId: normalized.submissionId,
    paymentStatus: "Paid",
    paymentAmount: normalized.amount,
    paymentCurrency: normalized.currency,
    paymentPaidAt: normalized.paidAt,
    paymentTransactionId: normalized.paymentTransactionId,
    paymentReceiptUrl: normalized.receiptUrl,
  });
  if (!paymentUpdate.ok) {
    return json({ ok: false, error: paymentUpdate.error || "Payment sheet update failed" }, 502);
  }

  const emailResult = await sendRegistrationPaidEmail(env, {
    submissionId: normalized.submissionId,
    parentEmail: context.parentEmail,
    parentName: context.parentName,
    participantNames: context.participantNames,
    signedAt: context.signedAt,
    signedDocumentUrl,
    paymentUrl: PLAYER_REGISTRATION_PAYMENT_URL,
    paymentReceiptUrl: normalized.receiptUrl,
    registrationFeeAmount: normalized.amount || "75",
    paidAt: normalized.paidAt,
  });
  if (!emailResult.ok) {
    return json({ ok: false, error: emailResult.error || "Payment confirmation email failed" }, 502);
  }

  return json({ ok: true, paid: true, emailed: true, submissionId: normalized.submissionId });
}

async function handleSignerDownload(request, env) {
  const url = new URL(request.url);
  const txId = url.pathname.split("/").pop();
  const exp = url.searchParams.get("exp");
  const sig = url.searchParams.get("sig");

  if (!txId || !exp || !sig) return new Response("Invalid link", { status: 400 });
  if (Date.now() > Number(exp)) return new Response("Link expired", { status: 410 });

  const expected = await hmacHex(env.SIGNER_LINK_SECRET || "", `${txId}:${exp}`);
  if (!timingSafeEq(sig, expected)) return new Response("Invalid link", { status: 403 });

  const tx = await doFetch(env, `/transaction?txId=${encodeURIComponent(txId)}`);
  if (!tx.value?.objectKey) return new Response("Document unavailable", { status: 404 });

  const object = await env.SIGNED_AGREEMENTS.get(tx.value.objectKey, { type: "stream" });
  if (!object) return new Response("Document unavailable", { status: 404 });

  return new Response(object.body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=agreement-copy.pdf",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "Cache-Control": "private, no-store",
    },
  });
}

async function handleAdminDownload(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const expected = env.ADMIN_DOWNLOAD_TOKEN || "";
  if (!expected || auth !== `Bearer ${expected}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const txId = new URL(request.url).pathname.split("/").pop();
  const tx = await doFetch(env, `/transaction?txId=${encodeURIComponent(txId)}`);
  if (!tx.value?.objectKey) return new Response("Document unavailable", { status: 404 });

  const object = await env.SIGNED_AGREEMENTS.get(tx.value.objectKey, { type: "stream" });
  if (!object) return new Response("Document unavailable", { status: 404 });

  return new Response(object.body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${tx.value.agreementType}-${txId}.pdf"`,
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "Cache-Control": "private, no-store",
    },
  });
}

function validateSigningPayload(payload, env) {
  if (!payload || typeof payload !== "object") return { ok: false, error: "Missing payload" };
  if (!payload.agreementType || !AGREEMENT_TEMPLATES[payload.agreementType]) {
    return { ok: false, error: "Invalid agreementType" };
  }

  if (!payload.submissionId || typeof payload.submissionId !== "string") {
    return { ok: false, error: "Missing submissionId" };
  }

  if (!payload.formType || typeof payload.formType !== "string") {
    return { ok: false, error: "Missing formType" };
  }

  const signer = payload.signer || {};
  if (!signer.printedName || !String(signer.printedName).trim()) {
    return { ok: false, error: "Missing signer printed name" };
  }

  const consentVersion = payload.audit?.consentVersion;
  if (!consentVersion || consentVersion !== env.E_CONSENT_TEXT_VERSION) {
    return { ok: false, error: "Invalid or mismatched consent version" };
  }

  if (payload.signature?.method === "typed") {
    const typed = payload.signature?.typed;
    if (!typed || typed.length < 2 || typed.length > MAX_TYPED_SIGNATURE_LEN) {
      return { ok: false, error: "Invalid typed signature" };
    }
  } else if (payload.signature?.method === "drawn") {
    const dataUrl = payload.signature?.dataUrl || "";
    if (!dataUrl.startsWith("data:image/png;base64,")) {
      return { ok: false, error: "Invalid signature image format" };
    }
    if (dataUrl.length > MAX_SIGNATURE_DATA_URL_BYTES) {
      return { ok: false, error: "Signature payload too large" };
    }
  } else {
    return { ok: false, error: "Invalid signature method" };
  }

  if (payload.agreementType === "player") {
    const mode = env.PLAYER_SIGNATURE_PLACEMENT_MODE;
    if (mode !== "parent_guardian_only" && mode !== "both_signature_lines") {
      return { ok: false, error: "Invalid PLAYER_SIGNATURE_PLACEMENT_MODE" };
    }
  }

  if (payload.agreementType === "volunteer") {
    const age = Number(payload.signer?.ageYears || 0);
    if (!Number.isFinite(age) || age < 18) {
      return { ok: false, error: "Volunteer signer must be at least 18" };
    }
  }

  return { ok: true };
}

async function generateSignedPdf({ payload, templateBytes, env, txId, templateHash }) {
  const pdfDoc = await PDFDocument.load(templateBytes);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const map = payload.agreementType === "player"
    ? PLAYER_AGREEMENT_FIELD_MAP
    : VOLUNTEER_AGREEMENT_FIELD_MAP;

  const pages = pdfDoc.getPages();
  const targetPage = pages[Math.max(0, pages.length - map.pageFromEnd)];

  const fieldData = payload.fields || {};
  for (const [fieldName, cfg] of Object.entries(map.fields)) {
    const value = String(fieldData[fieldName] || "").trim();
    if (!value) continue;
    drawWrappedText(targetPage, value, cfg, helvetica);
  }

  const signatureBounds = map.signatureBounds.primary;
  if (payload.signature.method === "drawn") {
    const pngBytes = decodeDataUrl(payload.signature.dataUrl);
    const png = await pdfDoc.embedPng(pngBytes);
    drawImageFit(targetPage, png, signatureBounds);
  } else {
    drawTypedSignature(targetPage, payload.signature.typed, signatureBounds, helveticaBold);
  }

  if (payload.agreementType === "player" && env.PLAYER_SIGNATURE_PLACEMENT_MODE === "both_signature_lines") {
    const secondBounds = map.signatureBounds.parent;
    if (payload.signature.method === "drawn") {
      const pngBytes = decodeDataUrl(payload.signature.dataUrl);
      const png = await pdfDoc.embedPng(pngBytes);
      drawImageFit(targetPage, png, secondBounds);
    } else {
      drawTypedSignature(targetPage, payload.signature.typed, secondBounds, helveticaBold);
    }
  }

  if (String(env.APPEND_SIGNING_CERTIFICATE || "").toLowerCase() === "true") {
    appendCertificatePage(pdfDoc, {
      payload,
      txId,
      templateHash,
      templateVersion: AGREEMENT_TEMPLATES[payload.agreementType].version,
    }, helvetica, helveticaBold);
  }

  return pdfDoc.save();
}

function drawWrappedText(page, text, cfg, font) {
  const lines = wrapText(text, cfg.maxWidth, cfg.fontSize || 10, font);
  const lineHeight = (cfg.fontSize || 10) + 2;
  lines.forEach((line, idx) => {
    page.drawText(line, {
      x: cfg.x,
      y: cfg.y - idx * lineHeight,
      size: cfg.fontSize || 10,
      font,
      color: rgb(0.08, 0.08, 0.08),
    });
  });
}

function drawImageFit(page, img, bounds) {
  const scale = Math.min(bounds.width / img.width, bounds.height / img.height);
  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;
  const x = bounds.x + (bounds.width - drawWidth) / 2;
  const y = bounds.y + (bounds.height - drawHeight) / 2;
  page.drawImage(img, { x, y, width: drawWidth, height: drawHeight });
}

function drawTypedSignature(page, typed, bounds, font) {
  const safe = String(typed || "").slice(0, MAX_TYPED_SIGNATURE_LEN);
  page.drawText(safe, {
    x: bounds.x + 4,
    y: bounds.y + bounds.height / 2 - 6,
    size: 14,
    font,
    color: rgb(0.05, 0.05, 0.05),
  });
}

function appendCertificatePage(pdfDoc, cert, font, bold) {
  const page = pdfDoc.addPage([612, 792]);
  page.drawText("Electronic Signing Certificate", {
    x: 42,
    y: 750,
    size: 18,
    font: bold,
  });

  const rows = [
    ["Agreement Type", cert.payload.agreementType],
    ["Agreement/Template Version", cert.templateVersion],
    ["Template SHA-256", cert.templateHash],
    ["Registration/Application ID", cert.payload.submissionId],
    ["Printed Signer Name", cert.payload.signer?.printedName || ""],
    ["Signing Timestamp UTC", cert.payload.audit?.signedAtUtc || ""],
    ["Electronic Consent Version", cert.payload.audit?.consentVersion || ""],
    ["Signature Method", cert.payload.signature?.method || ""],
    ["Signing Transaction ID", cert.txId],
  ];

  let y = 716;
  rows.forEach(([k, v]) => {
    page.drawText(`${k}:`, { x: 42, y, size: 10, font: bold });
    page.drawText(String(v || ""), { x: 230, y, size: 10, font });
    y -= 22;
  });
}

function wrapText(text, maxWidth, fontSize, font) {
  const words = String(text).split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(candidate, fontSize);
    if (width <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function decodeDataUrl(dataUrl) {
  const b64 = dataUrl.split(",")[1] || "";
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function updateAgreementInSheets(env, input) {
  if (!env.APPS_SCRIPT_URL || !env.APPS_SCRIPT_UPDATE_TOKEN) {
    return { ok: false, error: "Missing Apps Script update configuration" };
  }

  const params = new URLSearchParams();
  params.append("action", "update_agreement_metadata");
  appendUpdateTokenParams(params, env.APPS_SCRIPT_UPDATE_TOKEN);
  params.append("form_type", input.formType);
  params.append("submission_id", input.submissionId);
  params.append("agreement_type", input.agreementType);
  params.append("agreement_status", input.status);
  params.append("agreement_version", input.agreementVersion);
  params.append("agreement_signed_at", input.signedAt);
  params.append("agreement_signer_name", input.signerName);
  params.append("agreement_file_id", input.fileId);
  params.append("agreement_pdf_url", input.pdfUrl);
  params.append("agreement_sha256", input.sha256);
  params.append("agreement_transaction_id", input.transactionId);

  try {
    const text = await postAppsScriptForm(env.APPS_SCRIPT_URL, params);
    const parsed = safeJsonParse(text);
    if (!parsed?.ok) {
      return { ok: false, error: parsed?.error || "Apps Script update failed" };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: String(error?.message || error) };
  }
}

async function updatePaymentInSheets(env, input) {
  if (!env.APPS_SCRIPT_URL || !env.APPS_SCRIPT_UPDATE_TOKEN) {
    return { ok: false, error: "Missing Apps Script update configuration" };
  }

  const params = new URLSearchParams();
  params.append("action", "update_payment_metadata");
  appendUpdateTokenParams(params, env.APPS_SCRIPT_UPDATE_TOKEN);
  params.append("form_type", "mls_registration");
  params.append("submission_id", input.submissionId);
  params.append("payment_status", input.paymentStatus || "Paid");
  params.append("payment_amount", String(input.paymentAmount || ""));
  params.append("payment_currency", String(input.paymentCurrency || ""));
  params.append("payment_paid_at", String(input.paymentPaidAt || new Date().toISOString()));
  params.append("payment_transaction_id", String(input.paymentTransactionId || ""));
  params.append("payment_receipt_url", String(input.paymentReceiptUrl || ""));

  try {
    const text = await postAppsScriptForm(env.APPS_SCRIPT_URL, params);
    const parsed = safeJsonParse(text);
    if (!parsed?.ok) {
      return { ok: false, error: parsed?.error || "Apps Script payment update failed" };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: String(error?.message || error) };
  }
}

async function getRegistrationContext(env, submissionId) {
  if (!env.APPS_SCRIPT_URL || !env.APPS_SCRIPT_UPDATE_TOKEN) {
    return { ok: false, error: "Missing Apps Script lookup configuration" };
  }

  const params = new URLSearchParams();
  params.append("action", "get_registration_context");
  appendUpdateTokenParams(params, env.APPS_SCRIPT_UPDATE_TOKEN);
  params.append("form_type", "mls_registration");
  params.append("submission_id", submissionId);

  try {
    const text = await postAppsScriptForm(env.APPS_SCRIPT_URL, params);
    const parsed = safeJsonParse(text);
    if (!parsed?.ok) {
      return { ok: false, error: parsed?.error || "Apps Script context lookup failed" };
    }
    return {
      ok: true,
      parentEmail: String(parsed.parentEmail || "").trim(),
      parentName: String(parsed.parentName || "").trim(),
      participantNames: String(parsed.participantNames || "").trim(),
      transactionId: String(parsed.transactionId || "").trim(),
      signedAt: String(parsed.signedAt || "").trim(),
    };
  } catch (error) {
    return { ok: false, error: String(error?.message || error) };
  }
}

async function readTemplateBytes(env, templatePath) {
  const url = new URL(templatePath, "https://assets.internal");
  const res = await env.ASSETS.fetch(new Request(url.toString()));
  if (!res.ok) return null;
  return new Uint8Array(await res.arrayBuffer());
}

function buildObjectKey(agreementType, submissionId, txId) {
  const base = agreementType === "player" ? "player-agreements" : "volunteer-agreements";
  return `${base}/${submissionId}/${txId}.pdf`;
}

function buildAdminUrl(baseUrl, txId) {
  const base = new URL(baseUrl);
  return `${base.origin}/api/admin/agreement/${encodeURIComponent(txId)}`;
}

function buildSignerUrl(baseUrl, txId, env, ttlMs = DEFAULT_SIGNER_LINK_TTL_MS) {
  if (!env.SIGNER_LINK_SECRET) {
    throw new Error("Missing SIGNER_LINK_SECRET");
  }

  const exp = Date.now() + ttlMs;
  const payload = `${txId}:${exp}`;
  return hmacHex(env.SIGNER_LINK_SECRET, payload).then((sig) => {
    const base = new URL(baseUrl);
    return `${base.origin}/api/signer/agreement/${encodeURIComponent(txId)}?exp=${exp}&sig=${sig}`;
  });
}

async function sendRegistrationPaidEmail(env, input) {
  if (!env.APPS_SCRIPT_URL || !env.APPS_SCRIPT_UPDATE_TOKEN) {
    return { ok: false, error: "Missing Apps Script email configuration" };
  }

  const parentEmail = String(input.parentEmail || "").trim();
  if (!parentEmail) {
    return { ok: false, error: "Missing parent email" };
  }

  const params = new URLSearchParams();
  params.append("action", "send_registration_paid_email");
  appendUpdateTokenParams(params, env.APPS_SCRIPT_UPDATE_TOKEN);
  params.append("form_type", "mls_registration");
  params.append("registration_submission_id", String(input.submissionId || "").trim());
  params.append("parent_email", parentEmail);
  params.append("parent_name", String(input.parentName || "").trim());
  params.append("participant_names", String(input.participantNames || "").trim());
  params.append("signed_at", String(input.signedAt || "").trim());
  params.append("signed_document_url", String(input.signedDocumentUrl || "").trim());
  params.append("payment_url", String(input.paymentUrl || "").trim());
  params.append("payment_receipt_url", String(input.paymentReceiptUrl || "").trim());
  params.append("payment_paid_at", String(input.paidAt || "").trim());
  params.append("registration_fee_amount", String(input.registrationFeeAmount || "75").trim());

  try {
    const text = await postAppsScriptForm(env.APPS_SCRIPT_URL, params);
    const parsed = safeJsonParse(text);
    if (!parsed?.ok) {
      return { ok: false, error: parsed?.error || "Apps Script email send failed" };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: String(error?.message || error) };
  }
}

async function sendRegistrationSubmissionEmail(env, input) {
  if (!env.APPS_SCRIPT_URL || !env.APPS_SCRIPT_UPDATE_TOKEN) {
    return { ok: false, error: "Missing Apps Script email configuration" };
  }

  const parentEmail = String(input.parentEmail || "").trim();
  if (!parentEmail) {
    return { ok: false, error: "Missing parent email" };
  }

  const payload = {
    registration_submission_id: String(input.submissionId || "").trim(),
    parent_email: parentEmail,
    parent_name: String(input.parentName || "").trim(),
    participant_names: String(input.participantNames || "").trim(),
    relationship_to_child: String(input.relationshipToChild || "").trim(),
    primary_phone: String(input.primaryPhone || "").trim(),
    alternate_phone: String(input.alternatePhone || "").trim(),
    emergency_contact_name: String(input.emergencyContactName || "").trim(),
    emergency_relationship: String(input.emergencyRelationship || "").trim(),
    emergency_email: String(input.emergencyEmail || "").trim(),
    emergency_phone: String(input.emergencyPhone || "").trim(),
    emergency_street: String(input.emergencyStreet || "").trim(),
    emergency_city: String(input.emergencyCity || "").trim(),
    emergency_state: String(input.emergencyState || "").trim(),
    emergency_zip: String(input.emergencyZip || "").trim(),
    signed_at: String(input.signedAt || "").trim(),
    signed_document_url: String(input.signedDocumentUrl || "").trim(),
    payment_url: String(input.paymentUrl || "").trim(),
    registration_fee_amount: "75",
  };

  const primary = await postRegistrationEmailAction(env, "send_registration_receipt_email", payload);
  if (primary.ok) return primary;

  // Backward-compatible fallback for scripts only supporting the newer action name.
  return postRegistrationEmailAction(env, "send_registration_paid_email", payload);
}

async function postRegistrationEmailAction(env, action, payload) {
  const params = new URLSearchParams();
  params.append("action", action);
  appendUpdateTokenParams(params, env.APPS_SCRIPT_UPDATE_TOKEN);
  params.append("form_type", "mls_registration");

  Object.entries(payload).forEach(([key, value]) => {
    params.append(key, String(value || "").trim());
  });

  try {
    const text = await postAppsScriptForm(env.APPS_SCRIPT_URL, params);
    const parsed = safeJsonParse(text);
    if (!parsed?.ok) {
      return { ok: false, error: parsed?.error || `Apps Script ${action} failed` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: String(error?.message || error) };
  }
}

function isAuthorizedWebhookRequest(request, expectedToken) {
  if (!expectedToken) return false;

  const auth = request.headers.get("Authorization") || "";
  if (auth === `Bearer ${expectedToken}`) return true;

  const headerToken = request.headers.get("x-webhook-token") || "";
  if (headerToken === expectedToken) return true;

  const url = new URL(request.url);
  return url.searchParams.get("token") === expectedToken;
}

async function parseWebhookPayload(request) {
  const contentType = request.headers.get("Content-Type") || "";
  if (contentType.includes("application/json")) {
    return request.json().catch(() => null);
  }
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await request.formData().catch(() => null);
    if (!formData) return null;
    const out = {};
    for (const [key, value] of formData.entries()) {
      out[key] = typeof value === "string" ? value : value?.name || "";
    }
    return out;
  }
  const text = await request.text().catch(() => "");
  if (!text) return null;
  return safeJsonParse(text);
}

function normalizePaymentWebhookPayload(payload) {
  const paidStatus = String(
    payload.payment_status || payload.status || payload.event || payload.transaction_status || "",
  ).trim().toLowerCase();

  return {
    submissionId: String(
      payload.registration_submission_id || payload.submission_id || payload.registrationId || payload.reference || "",
    ).trim(),
    agreementTransactionId: String(
      payload.agreement_transaction_id || payload.transaction_id || payload.agreementTxId || "",
    ).trim(),
    paymentTransactionId: String(
      payload.payment_transaction_id || payload.payment_id || payload.gateway_transaction_id || payload.charge_id || "",
    ).trim(),
    amount: String(payload.payment_amount || payload.amount || payload.total || "").trim(),
    currency: String(payload.payment_currency || payload.currency || "USD").trim(),
    receiptUrl: String(payload.payment_receipt_url || payload.receipt_url || payload.receiptUrl || "").trim(),
    paidAt: String(payload.payment_paid_at || payload.paid_at || payload.completed_at || new Date().toISOString()).trim(),
    paid: ["paid", "completed", "complete", "success", "succeeded"].includes(paidStatus),
  };
}

function isAllowedOrigin(origin, csv) {
  if (!origin) return false;
  const allowed = [
    ...DEFAULT_ALLOWED_ORIGINS,
    ...csv.split(",").map((v) => v.trim()).filter(Boolean),
  ];
  return allowed.includes(origin);
}

function buildCorsHeaders(request, env) {
  const origin = request?.headers?.get("Origin") || "";
  const allowOrigin = isAllowedOrigin(origin, env.ALLOWED_ORIGINS || "")
    ? origin
    : PRIMARY_APP_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-webhook-token",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function handleApiOptions(request, env) {
  const origin = request.headers.get("Origin") || "";
  if (!isAllowedOrigin(origin, env.ALLOWED_ORIGINS || "")) {
    return new Response(null, { status: 403 });
  }
  return new Response(null, {
    status: 204,
    headers: buildCorsHeaders(request, env),
  });
}

async function markTransactionFailed(env, txId, reason) {
  await doFetch(env, "/transaction", {
    method: "POST",
    body: JSON.stringify({
      txId,
      value: {
        status: "failed",
        reason,
        updatedAt: new Date().toISOString(),
      },
    }),
  });
}

async function doFetch(env, path, init = {}) {
  const id = env.SIGNING_TRANSACTIONS.idFromName("global-signing-state");
  const stub = env.SIGNING_TRANSACTIONS.get(id);
  const req = new Request(`https://do.internal${path}`, {
    method: init.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    body: init.body,
  });
  const res = await stub.fetch(req);
  const payload = await res.json().catch(() => ({}));
  return payload;
}

async function sha256Hex(bytes) {
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacHex(secret, value) {
  if (!secret) {
    throw new Error("Missing HMAC secret");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEq(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

function isRedirectStatus(status) {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

async function postAppsScriptForm(url, params) {
  const body = typeof params === "string" ? params : params.toString();
  const init = {
    method: "POST",
    body,
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
  };

  let res = await fetch(url, init);
  if (isRedirectStatus(res.status)) {
    const location = res.headers.get("Location");
    if (location) {
      const followUrl = new URL(location, url).toString();
      res = await fetch(followUrl, init);
    }
  }

  return res.text();
}

function appendUpdateTokenParams(params, token) {
  const value = String(token || "").trim();
  params.append("update_token", value);
  // Backward compatibility with older Apps Script deployments.
  params.append("token", value);
  params.append("agreement_update_token", value);
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function json(data, status = 200, request = null, env = null) {
  const corsHeaders = request && env ? buildCorsHeaders(request, env) : {};
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      ...corsHeaders,
    },
  });
}
