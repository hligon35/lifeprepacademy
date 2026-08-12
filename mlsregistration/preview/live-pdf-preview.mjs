import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "..", "..");

const mapPath = path.resolve(__dirname, "..", "worker", "pdf-field-maps.js");
const outputDir = path.resolve(__dirname, "live");

const MAX_TYPED_SIGNATURE_LEN = 60;
const agreementType = process.argv.includes("--volunteer")
  ? "volunteer"
  : process.argv.includes("--ppf")
    ? "ppf"
    : "player";
const watchMode = process.argv.includes("--watch");

const PREVIEW_CONFIG = {
  player: {
    templatePath: path.resolve(__dirname, "..", "documents", "MLS GO Player Registration Agreement.pdf"),
    samplePath: path.resolve(__dirname, "player-preview-sample.json"),
    outputPdfPath: path.resolve(outputDir, "player-agreement-preview.pdf"),
    outputMetaPath: path.resolve(outputDir, "player-preview-meta.json"),
    mapExport: "PLAYER_AGREEMENT_FIELD_MAP",
  },
  volunteer: {
    templatePath: path.resolve(__dirname, "..", "documents", "MLS GO Volunteer Agreement.pdf"),
    samplePath: path.resolve(__dirname, "volunteer-preview-sample.json"),
    outputPdfPath: path.resolve(outputDir, "volunteer-agreement-preview.pdf"),
    outputMetaPath: path.resolve(outputDir, "volunteer-preview-meta.json"),
    mapExport: "VOLUNTEER_AGREEMENT_FIELD_MAP",
  },
  ppf: {
    templatePath: path.resolve(__dirname, "..", "documents", "PPF Liability Form.pdf"),
    samplePath: path.resolve(__dirname, "ppf-liability-preview-sample.json"),
    outputPdfPath: path.resolve(outputDir, "ppf-liability-preview.pdf"),
    outputMetaPath: path.resolve(outputDir, "ppf-liability-preview-meta.json"),
    mapExport: "PPF_LIABILITY_FIELD_MAP",
  },
};

const previewConfig = PREVIEW_CONFIG[agreementType];

async function loadFieldMap() {
  const mapUrl = `${pathToFileURL(mapPath).href}?t=${Date.now()}`;
  const mod = await import(mapUrl);
  const fieldMap = mod?.[previewConfig.mapExport];
  if (!fieldMap) {
    throw new Error(`${previewConfig.mapExport} export not found`);
  }
  return fieldMap;
}

function readSampleData() {
  const raw = fs.readFileSync(previewConfig.samplePath, "utf8");
  return JSON.parse(raw);
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

function drawWrappedText(page, text, cfg, font) {
  const fontSize = cfg.fontSize || 10;
  const lines = wrapText(text, cfg.maxWidth, fontSize, font);
  const lineHeight = fontSize + 2;

  lines.forEach((line, idx) => {
    page.drawText(line, {
      x: cfg.x,
      y: cfg.y - idx * lineHeight,
      size: fontSize,
      font,
      color: rgb(0.08, 0.08, 0.08),
    });
  });
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

async function generatePreview() {
  const [fieldMap, sample] = await Promise.all([loadFieldMap(), Promise.resolve(readSampleData())]);

  const templateBytes = fs.readFileSync(previewConfig.templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pages = pdfDoc.getPages();
  const targetPage = pages[Math.max(0, pages.length - fieldMap.pageFromEnd)];
  const fields = sample.fields || {};

  for (const [fieldName, cfg] of Object.entries(fieldMap.fields)) {
    const value = String(fields[fieldName] || "").trim();
    if (!value) continue;
    drawWrappedText(targetPage, value, cfg, helvetica);
  }

  const signature = sample.signature || { method: "typed", typed: sample.signer?.printedName || "" };
  if (signature.method !== "typed") {
    throw new Error("Preview currently supports typed signatures only.");
  }

  drawTypedSignature(targetPage, signature.typed, fieldMap.signatureBounds.primary, helveticaBold);

  if (sample.signatureMode === "both_signature_lines") {
    drawTypedSignature(targetPage, signature.typed, fieldMap.signatureBounds.parent, helveticaBold);
  }

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(previewConfig.outputPdfPath, await pdfDoc.save());

  const meta = {
    agreementType,
    generatedAt: new Date().toISOString(),
    source: {
      mapPath: path.relative(workspaceRoot, mapPath).replace(/\\/g, "/"),
      samplePath: path.relative(workspaceRoot, previewConfig.samplePath).replace(/\\/g, "/"),
    },
    outputPdf: path.relative(workspaceRoot, previewConfig.outputPdfPath).replace(/\\/g, "/"),
  };
  fs.writeFileSync(previewConfig.outputMetaPath, JSON.stringify(meta, null, 2));

  return meta;
}

let debounceTimer;
async function handleRegenerate(trigger) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    try {
      const meta = await generatePreview();
      console.log(`[preview] Regenerated from ${trigger} at ${meta.generatedAt}`);
    } catch (error) {
      console.error("[preview] Generation failed:", error.message);
    }
  }, 120);
}

async function run() {
  const meta = await generatePreview();
  console.log(`[preview] Generated ${meta.outputPdf}`);

  if (!watchMode) return;

  console.log("[preview] Watching for changes...");
  console.log(`[preview] Map: ${path.relative(workspaceRoot, mapPath)}`);
  console.log(`[preview] Sample: ${path.relative(workspaceRoot, previewConfig.samplePath)}`);

  fs.watch(mapPath, { persistent: true }, () => handleRegenerate("field map"));
  fs.watch(previewConfig.samplePath, { persistent: true }, () => handleRegenerate("sample data"));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
