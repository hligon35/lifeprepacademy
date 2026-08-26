/**
 * Scholarship signature styling patch.
 *
 * The Cloudflare/pdf-lib documents embed the repository TTF directly. Google
 * Docs does not expose an API for embedding a repository TTF into a generated
 * Doc, so the scholarship document uses the matching Google Docs font family
 * name (Great Vibes) for the accepted parent/guardian name before PDF export.
 *
 * This wraps the existing scholarshipWriteLine_ implementation at Apps Script
 * load time without changing the scholarship document-generation workflow.
 */
var SCHOLARSHIP_SIGNATURE_FONT_FAMILY = 'Great Vibes';
var SCHOLARSHIP_SIGNATURE_FONT_SIZE = 18;

var SCHOLARSHIP_SIGNATURE_PATCH_INSTALLED = (function() {
  if (typeof scholarshipWriteLine_ !== 'function') return false;

  var originalScholarshipWriteLine_ = scholarshipWriteLine_;

  scholarshipWriteLine_ = function(
    body,
    firstLabel,
    firstValue,
    secondLabel,
    secondValue,
    firstWidth,
    secondWidth
  ) {
    originalScholarshipWriteLine_(
      body,
      firstLabel,
      firstValue,
      secondLabel,
      secondValue,
      firstWidth,
      secondWidth
    );

    if (firstLabel !== 'Parent/Guardian') return;

    var signatureName = scholarshipNormalize_(firstValue).replace(/[\r\n]+/g, ' ');
    if (!signatureName) return;

    var match = body.findText(firstLabel.replace('/', '\\/') + ':\\s*');
    if (!match) {
      throw new Error('The Parent/Guardian signature line was not found after rendering.');
    }

    var text = match.getElement().asText();
    var signatureStart = (firstLabel + ': ').length;
    var signatureEnd = signatureStart + signatureName.length - 1;
    if (signatureEnd < signatureStart || signatureEnd >= text.getText().length) return;

    text.setFontFamily(signatureStart, signatureEnd, SCHOLARSHIP_SIGNATURE_FONT_FAMILY);
    text.setFontSize(signatureStart, signatureEnd, SCHOLARSHIP_SIGNATURE_FONT_SIZE);
    text.setBold(signatureStart, signatureEnd, false);
    text.setItalic(signatureStart, signatureEnd, false);
  };

  return true;
})();
