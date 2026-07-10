(() => {
  if (window.QRCode && typeof window.QRCode.toCanvas === "function") return;

  window.QRCode = {
    toCanvas(text, options = {}, callback) {
      const width = Number(options.width || 280);
      const margin = Number(options.margin ?? 2);
      const ecLevel = String(options.errorCorrectionLevel || "H");
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = width;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.crossOrigin = "anonymous";

      const qrUrl = new URL("https://quickchart.io/qr");
      qrUrl.searchParams.set("text", String(text || ""));
      qrUrl.searchParams.set("size", String(width));
      qrUrl.searchParams.set("margin", String(margin));
      qrUrl.searchParams.set("ecLevel", ecLevel);
      qrUrl.searchParams.set("format", "png");

      img.onload = () => {
        try {
          ctx.clearRect(0, 0, width, width);
          ctx.drawImage(img, 0, 0, width, width);
          callback?.(null, canvas);
        } catch (error) {
          callback?.(error);
        }
      };
      img.onerror = () => callback?.(new Error("QR image could not be generated."));
      img.src = qrUrl.toString();
      return canvas;
    }
  };
})();