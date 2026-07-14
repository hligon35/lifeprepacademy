(() => {
  const cfg = window.AT_THE_GATE_CONFIG || {};
  const params = new URLSearchParams(window.location.search);
  const panels = ["loadingPanel", "parentPanel", "passPanel", "staffPanel", "messagePanel"];
  const state = {
    parent: null,
    children: [],
    qrId: "",
    qrUrl: "",
    busy: false,
    scanner: null,
    passReady: false,
    qrFailed: false,
    latestStaffLookup: null,
    lastScannedCode: "",
    lastScannedAt: 0
  };

  const $ = (id) => document.getElementById(id);
  const els = {
    screenTitle: $("screenTitle"),
    screenIntro: $("screenIntro"),
    statusBanner: $("statusBanner"),
    errorBanner: $("errorBanner"),
    loadingPanel: $("loadingPanel"),
    loadingMessage: $("loadingMessage"),
    parentPanel: $("parentPanel"),
    parentSummary: $("parentSummary"),
    registrationStatus: $("registrationStatus"),
    childList: $("childList"),
    verifyBtn: $("verifyBtn"),
    addChildBtn: $("addChildBtn"),
    registerChildBtn: $("registerChildBtn"),
    helpBtn: $("helpBtn"),
    helpMessage: $("helpMessage"),
    passPanel: $("passPanel"),
    passMeta: $("passMeta"),
    fastPassCanvas: $("fastPassCanvas"),
    savePassBtn: $("savePassBtn"),
    qrFallback: $("qrFallback"),
    qrFallbackCode: $("qrFallbackCode"),
    staffPanel: $("staffPanel"),
    readerStatus: $("readerStatus"),
    reader: $("reader"),
    manualCode: $("manualCode"),
    manualLookupBtn: $("manualLookupBtn"),
    staffResultOverlay: $("staffResultOverlay"),
    closeStaffResultBtn: $("closeStaffResultBtn"),
    staffResult: $("staffResult"),
    messagePanel: $("messagePanel"),
    messageHeading: $("messageHeading"),
    messageBody: $("messageBody"),
    messagePrimaryLink: $("messagePrimaryLink"),
    messageActionBtn: $("messageActionBtn")
  };

  const PASS_LAYOUT = {
    width: 1024,
    height: 1536,
    parentX: 90,
    parentY: 975,
    parentWidth: 380,
    parentHeight: 90,
    childrenX: 90,
    childrenY: 1150,
    childrenWidth: 380,
    childrenHeight: 230,
    statusX: 175,
    statusY: 1425,
    qrX: 510,
    qrY: 940,
    qrSize: 435
  };

  function showPanel(id) {
    panels.forEach((panelId) => {
      const panel = $(panelId);
      if (panel) panel.classList.toggle("hidden", panelId !== id);
    });
  }

  function setHero(title, intro) {
    els.screenTitle.textContent = title;
    els.screenIntro.textContent = intro;
  }

  function setStatus(text) {
    if (!text) {
      els.statusBanner.textContent = "";
      els.statusBanner.classList.add("hidden");
      return;
    }
    els.statusBanner.textContent = text;
    els.statusBanner.classList.remove("hidden");
  }

  function setError(text) {
    if (!text) {
      els.errorBanner.textContent = "";
      els.errorBanner.classList.add("hidden");
      return;
    }
    els.errorBanner.textContent = text;
    els.errorBanner.classList.remove("hidden");
  }

  function showMessage(title, body, options = {}) {
    setStatus("");
    setError(options.error ? body : "");
    els.messageHeading.textContent = title;
    els.messageBody.textContent = body;

    if (options.linkText && options.linkHref) {
      els.messagePrimaryLink.textContent = options.linkText;
      els.messagePrimaryLink.href = options.linkHref;
      els.messagePrimaryLink.classList.remove("hidden");
    } else {
      els.messagePrimaryLink.classList.add("hidden");
      els.messagePrimaryLink.removeAttribute("href");
    }

    if (options.actionText && typeof options.onAction === "function") {
      els.messageActionBtn.textContent = options.actionText;
      els.messageActionBtn.onclick = options.onAction;
      els.messageActionBtn.classList.remove("hidden");
    } else {
      els.messageActionBtn.onclick = null;
      els.messageActionBtn.classList.add("hidden");
    }

    showPanel("messagePanel");
  }

  function withTimeout(promise, timeoutMs, timeoutMessage) {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        window.setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      })
    ]);
  }

  function normalizeApiPayload(payload) {
    const clean = {};
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) clean[key] = value;
    });
    return clean;
  }

  function api(action, payload = {}) {
    const base = String(cfg.googleAppsScriptUrl || "").trim();
    if (!base) {
      return Promise.reject(new Error("The check-in service is not configured right now."));
    }

    let url;
    try {
      url = new URL(base, window.location.href);
    } catch (_error) {
      return Promise.reject(new Error("The check-in service URL is invalid."));
    }

    const callback = `fastpass_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    url.searchParams.set("action", action);
    url.searchParams.set("callback", callback);
    Object.entries(normalizeApiPayload(payload)).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });

    return withTimeout(new Promise((resolve, reject) => {
      const script = document.createElement("script");

      function cleanup() {
        delete window[callback];
        script.remove();
      }

      window[callback] = (data) => {
        cleanup();
        if (data && data.ok) resolve(data);
        else reject(new Error((data && data.error) || "The check-in service returned an error."));
      };

      script.onerror = () => {
        cleanup();
        reject(new Error("The check-in service could not be reached."));
      };

      script.src = url.toString();
      document.body.appendChild(script);
    }), 15000, "The check-in service timed out. Please try again in a moment.");
  }

  function childName(child = {}) {
    return String(
      child.name || [child.firstName, child.lastName].filter(Boolean).join(" ") || "Registered child"
    ).trim();
  }

  function childNames(children = []) {
    return children.map(childName).filter(Boolean);
  }

  function sanitizeFilename(value) {
    return String(value || "family")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "family";
  }

  function wrapLines(ctx, text, maxWidth) {
    const words = String(text || "").split(/\s+/).filter(Boolean);
    if (!words.length) return [""];
    const lines = [];
    let line = words[0];

    for (let i = 1; i < words.length; i += 1) {
      const nextLine = `${line} ${words[i]}`;
      if (ctx.measureText(nextLine).width <= maxWidth) line = nextLine;
      else {
        lines.push(line);
        line = words[i];
      }
    }

    lines.push(line);
    return lines;
  }

  function formatChildBlocks(ctx, names, maxWidth, maxLines) {
    const lines = [];
    names.forEach((name) => {
      wrapLines(ctx, name, maxWidth).forEach((line) => lines.push(line));
    });
    return lines.slice(0, maxLines);
  }

  function loadImage(url, errorMessage) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(errorMessage));
      img.src = new URL(url, window.location.href).toString();
    });
  }

  function qrTargetUrl(qrId) {
    return `${window.location.origin}${window.location.pathname}?staff=1&code=${encodeURIComponent(qrId)}`;
  }

  function drawRoundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function generateQrCanvas(value, size) {
    return new Promise((resolve, reject) => {
      if (!window.QRCode || typeof window.QRCode.toCanvas !== "function") {
        reject(new Error("QR generation is unavailable."));
        return;
      }

      const canvas = document.createElement("canvas");
      const options = { errorCorrectionLevel: "H", width: size, margin: 1 };
      const done = (error, outputCanvas) => {
        if (error) reject(error);
        else resolve(outputCanvas || canvas);
      };

      try {
        const result = window.QRCode.toCanvas(canvas, value, options, done);
        if (result && typeof result.then === "function") {
          result.then(() => resolve(canvas)).catch(reject);
        } else if (window.QRCode.toCanvas.length === 3) {
          window.QRCode.toCanvas(value, options, done);
        }
      } catch (_error) {
        try {
          window.QRCode.toCanvas(value, options, done);
        } catch (innerError) {
          reject(innerError);
        }
      }
    });
  }

  async function addLogoToQr(qrCanvas) {
    const logoUrl = String(cfg.fastPassLogoUrl || "").trim();
    if (!logoUrl) return { canvas: qrCanvas, logoApplied: false };

    try {
      const logo = await loadImage(logoUrl, "Logo image could not be loaded.");
      const ctx = qrCanvas.getContext("2d");
      const logoSize = Math.round(qrCanvas.width * 0.2);
      const padding = Math.round(logoSize * 0.18);
      const boxSize = logoSize + padding * 2;
      const x = Math.round((qrCanvas.width - boxSize) / 2);
      const y = Math.round((qrCanvas.height - boxSize) / 2);

      ctx.save();
      ctx.fillStyle = "#ffffff";
      drawRoundedRect(ctx, x, y, boxSize, boxSize, Math.round(boxSize * 0.12));
      ctx.fill();
      ctx.drawImage(logo, x + padding, y + padding, logoSize, logoSize);
      ctx.restore();
      return { canvas: qrCanvas, logoApplied: true };
    } catch (_error) {
      return { canvas: qrCanvas, logoApplied: false };
    }
  }

  async function buildFastPassCanvas(parent, children, qrId) {
    const templateUrl = String(cfg.fastPassTemplateUrl || "").trim();
    if (!templateUrl) {
      throw new Error("The Fast Pass template image is not configured.");
    }

    const targetCanvas = els.fastPassCanvas;
    const ctx = targetCanvas.getContext("2d");
    const template = await loadImage(templateUrl, "The Fast Pass template image could not be loaded.");
    const names = childNames(children);
    state.qrFailed = false;

    targetCanvas.width = PASS_LAYOUT.width;
    targetCanvas.height = PASS_LAYOUT.height;

    ctx.clearRect(0, 0, PASS_LAYOUT.width, PASS_LAYOUT.height);
    ctx.drawImage(template, 0, 0, PASS_LAYOUT.width, PASS_LAYOUT.height);

    ctx.fillStyle = "#11284f";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    ctx.font = "700 18px Arial, Helvetica, sans-serif";
    ctx.fillText("PARENT / GUARDIAN", PASS_LAYOUT.parentX + 90, PASS_LAYOUT.parentY - 35);

    let parentFontSize = 32;
    const parentName = String(
      parent.parentName || "Parent / Guardian"
    ).trim();

    let parentNameLines = [];

    while (parentFontSize >= 24) {
      ctx.font = `700 ${parentFontSize}px Arial, Helvetica, sans-serif`;

      parentNameLines = wrapLines(
        ctx,
        parentName,
        PASS_LAYOUT.parentWidth
      ).slice(0, 2);

      const parentLineHeight = parentFontSize + 6;
      const parentBlockHeight =
        parentNameLines.length * parentLineHeight;

      if (
        parentNameLines.length <= 2 &&
        parentBlockHeight <= PASS_LAYOUT.parentHeight
      ) {
        break;
      }

      parentFontSize -= 2;
    }

    ctx.font =
      `700 ${parentFontSize}px Arial, Helvetica, sans-serif`;

    const parentLineHeight = parentFontSize + 6;

    parentNameLines.forEach((line, index) => {
      ctx.fillText(
        line,
        PASS_LAYOUT.parentX,
        PASS_LAYOUT.parentY +
          index * parentLineHeight
      );
    });

    ctx.font = "700 18px Arial, Helvetica, sans-serif";
    ctx.fillText("REGISTERED CHILDREN", PASS_LAYOUT.childrenX + 75, PASS_LAYOUT.childrenY - 42);

    let childFontSize = 28;
    let childLines = [];

    while (childFontSize >= 18) {
      ctx.font =
        `700 ${childFontSize}px Arial, Helvetica, sans-serif`;

      childLines = formatChildBlocks(
        ctx,
        names.length
          ? names
          : [parent.childNames || "Registration on file"],
        PASS_LAYOUT.childrenWidth,
        8
      );

      const childLineHeight = childFontSize + 18;
      const childrenBlockHeight =
        childLines.length * childLineHeight;

      if (
        childrenBlockHeight <=
        PASS_LAYOUT.childrenHeight
      ) {
        break;
      }

      childFontSize -= 2;
    }

    ctx.font =
      `700 ${childFontSize}px Arial, Helvetica, sans-serif`;

    const childLineHeight = childFontSize + 18;

    childLines.forEach((line, index) => {
      ctx.fillText(
        line,
        PASS_LAYOUT.childrenX,
        PASS_LAYOUT.childrenY +
          index * childLineHeight
      );
    });

    ctx.font = "700 22px Arial, Helvetica, sans-serif";
    ctx.fillStyle = "#284c83";
    const statusText =
      parent.checkedIn === "Yes"
        ? "Checked In"
        : (parent.preCheckStatus || "Verified");

    ctx.fillText(
      `STATUS: ${statusText}`,
      PASS_LAYOUT.statusX,
      PASS_LAYOUT.statusY
    );

    const qrValue = qrTargetUrl(qrId);
    state.qrUrl = qrValue;

    try {
      const qrCanvas = await generateQrCanvas(qrValue, PASS_LAYOUT.qrSize - 32);
      const qrWithLogo = await addLogoToQr(qrCanvas);
      const qrFrameX = PASS_LAYOUT.qrX;
      const qrFrameY = PASS_LAYOUT.qrY;
      const qrFrameSize = PASS_LAYOUT.qrSize;
      const safetyMargin = 12;

      ctx.fillStyle = "#ffffff";
      drawRoundedRect(ctx, qrFrameX, qrFrameY, qrFrameSize, qrFrameSize, 24);
      ctx.fill();
      ctx.drawImage(
        qrWithLogo.canvas,
        qrFrameX + safetyMargin,
        qrFrameY + safetyMargin,
        qrFrameSize - safetyMargin * 2,
        qrFrameSize - safetyMargin * 2
      );
      return { qrFailed: false, logoApplied: qrWithLogo.logoApplied };
    } catch (_error) {
      state.qrFailed = true;
      ctx.fillStyle = "#ffffff";
      drawRoundedRect(ctx, PASS_LAYOUT.qrX, PASS_LAYOUT.qrY, PASS_LAYOUT.qrSize, PASS_LAYOUT.qrSize, 24);
      ctx.fill();
      ctx.fillStyle = "#11284f";
      ctx.font = "700 22px Arial, Helvetica, sans-serif";
      ctx.fillText("Manual staff code:", PASS_LAYOUT.qrX + 22, PASS_LAYOUT.qrY + 42);
      ctx.font = "800 26px Arial, Helvetica, sans-serif";
      wrapLines(ctx, qrId, PASS_LAYOUT.qrSize - 44).slice(0, 6).forEach((line, index) => {
        ctx.fillText(line, PASS_LAYOUT.qrX + 22, PASS_LAYOUT.qrY + 88 + index * 32);
      });
      return { qrFailed: true, logoApplied: false };
    }
  }

  function renderChildrenList(children) {
    els.childList.replaceChildren();
    if (!children.length) {
      const li = document.createElement("li");
      li.textContent = "No child registrations were found yet.";
      els.childList.appendChild(li);
      return;
    }

    children.forEach((child) => {
      const li = document.createElement("li");
      li.className = "child-card";
      const strong = document.createElement("strong");
      strong.textContent = childName(child);
      li.appendChild(strong);
      els.childList.appendChild(li);
    });
  }

  function buildRegistrationUrl(baseUrl, type, parentKey) {
    if (!baseUrl) return "";
    const url = new URL(baseUrl, window.location.href);
    url.searchParams.set("registration_type", type);
    if (parentKey) url.searchParams.set("parent_key", parentKey);
    const returnUrl = new URL(window.location.href);
    returnUrl.search = "";
    returnUrl.searchParams.set("k", parentKey);
    returnUrl.searchParams.set("returning", "1");
    url.searchParams.set("return_url", returnUrl.toString());
    return url.toString();
  }

  function renderParentPanel(parent, children) {
    state.parent = parent;
    state.children = children;
    state.qrId = parent.qrId || parent.parentKey || "";

    setHero("Review Your Family Registration", "Confirm your family details and bring your Fast Pass to the clinic.");
    setStatus("");
    setError("");

    const names = childNames(children);
    els.parentSummary.innerHTML = `${parent.parentName || "Parent"}${names.length ? ` has <strong>${names.length} child${names.length === 1 ? "" : "ren"} registered.</strong>` : " has a registration on file."}`;
    renderChildrenList(children);

    if (parent.registrationStatus) {
      els.registrationStatus.textContent = `Registration status: ${parent.registrationStatus}`;
      els.registrationStatus.classList.remove("hidden");
    } else {
      els.registrationStatus.classList.add("hidden");
    }

    const available = Number(parent.availableTicketCount || 0);
    const addChildHref = buildRegistrationUrl(cfg.registrationUrl, "add_child", parent.parentKey);
    const registerChildHref = buildRegistrationUrl(cfg.missingRegistrationUrl || cfg.registrationUrl, "waitlist", parent.parentKey);

    if (available > 0 && addChildHref) {
      els.addChildBtn.href = addChildHref;
      els.addChildBtn.classList.remove("hidden");
    } else {
      els.addChildBtn.classList.add("hidden");
    }

    if (available <= 0 && registerChildHref) {
      els.registerChildBtn.href = registerChildHref;
      els.registerChildBtn.classList.remove("hidden");
      els.registerChildBtn.textContent = "Register another child";
    } else {
      els.registerChildBtn.classList.add("hidden");
    }

    if (parent.preCheckStatus) {
      setStatus(`This family is already marked ${parent.preCheckStatus.toLowerCase()}. The Fast Pass can be shown again below after confirmation.`);
    }

    showPanel("parentPanel");
  }

  async function renderFastPass(parent, children, meta = {}) {
    setHero("Your Fast Pass Is Ready", "Keep this pass on screen at the gate and save a backup copy now.");
    els.passMeta.textContent = parent.checkedIn === "Yes"
      ? `This family was already checked in${parent.checkedInAt ? ` at ${parent.checkedInAt}` : ""}.`
      : `${children.length || childNames(children).length} child${children.length === 1 ? "" : "ren"} listed for this family.`;
    showPanel("loadingPanel");
    els.loadingMessage.textContent = "Building your Fast Pass...";
    setError("");
    setStatus("");

    try {
      const qrId = meta.qrId || parent.qrId || parent.parentKey;
      state.qrId = qrId;
      const result = await buildFastPassCanvas(parent, children, qrId);
      state.passReady = true;
      els.qrFallbackCode.textContent = qrId;
      els.qrFallback.classList.toggle("hidden", !result.qrFailed);
      if (result.qrFailed) {
        setStatus("The QR image could not be drawn, but the staff lookup code is still available below.");
      }
      showPanel("passPanel");
    } catch (error) {
      state.passReady = false;
      showMessage("Fast Pass could not be created", error.message, {
        error: true,
        actionText: "Back",
        onAction: () => renderParentPanel(parent, children)
      });
    }
  }

  async function loadParentPass(parentKey) {
    els.loadingMessage.textContent = "Loading your family registration...";
    showPanel("loadingPanel");
    setHero("Fast Pass", "Loading your family Fast Pass.");
    setStatus("");
    setError("");

    try {
      const data = await api("lookupPass", { parentKey });
      renderParentPanel(data.parent || {}, data.children || []);
      if (String((data.parent || {}).preCheckStatus || "").toLowerCase() === "verified") {
        await renderFastPass(data.parent || {}, data.children || []);
      }
    } catch (error) {
      showMessage("Could not load this Fast Pass", error.message, { error: true });
    }
  }

  async function verifyParent() {
    if (state.busy || !state.parent) return;
    state.busy = true;
    els.verifyBtn.disabled = true;
    setStatus("Saving your confirmation...");

    try {
      const data = await api("verify", { parentKey: state.parent.parentKey });
      const parent = data.parent || state.parent;
      const children = data.children || state.children;
      state.parent = parent;
      state.children = children;
      await renderFastPass(parent, children, { qrId: data.qrId });
    } catch (error) {
      setError(error.message);
    } finally {
      state.busy = false;
      els.verifyBtn.disabled = false;
    }
  }

  function renderHelpMessage() {
    els.helpMessage.textContent = "Please keep this page open and stop at the help table when you arrive. Staff can look up your family manually if needed.";
    els.helpMessage.classList.remove("hidden");
  }

  function openStaffResultOverlay() {
    els.staffResultOverlay.classList.remove("hidden");
    document.body.classList.add("staff-result-open");

    if (
      state.scanner &&
      typeof state.scanner.pause === "function"
    ) {
      try {
        state.scanner.pause(true);
      } catch (_error) {
        // Scanner may already be paused.
      }
    }
  }

  function closeStaffResultOverlay(options = {}) {
    const shouldClear = options.clear !== false;

    els.staffResultOverlay.classList.add("hidden");
    document.body.classList.remove("staff-result-open");

    if (shouldClear) {
      els.staffResult.replaceChildren();
      els.manualCode.value = "";
    }

    state.lastScannedCode = "";
    state.lastScannedAt = 0;

    if (
      state.scanner &&
      typeof state.scanner.resume === "function"
    ) {
      try {
        state.scanner.resume();
      } catch (_error) {
        // Scanner may already be active or unavailable.
      }
    }
  }

  function fillStaffResult(parent, children, code) {
    state.latestStaffLookup = { parent, children, code };
    els.staffResult.replaceChildren();

    const banner = document.createElement("p");
    const alreadyCheckedIn = String(parent.checkedIn || "").toLowerCase() === "yes";
    banner.className = alreadyCheckedIn ? "result-flag warn" : "result-flag ok";
    banner.textContent = alreadyCheckedIn ? "Already checked in" : "Ready to check in";
    els.staffResult.appendChild(banner);

    const heading = document.createElement("h3");
    heading.id = "staffResultTitle";
    heading.textContent = parent.parentName || "Parent";
    els.staffResult.appendChild(heading);

    const summary = document.createElement("p");
    const statusPieces = [];
    if (parent.registrationStatus) statusPieces.push(`Registration status: ${parent.registrationStatus}`);
    if (parent.checkedInAt) statusPieces.push(`Checked in at: ${parent.checkedInAt}`);
    summary.className = "support-text";
    summary.textContent = statusPieces.join(" | ") || "Review the family and confirm check-in.";
    els.staffResult.appendChild(summary);

    const list = document.createElement("ul");
    list.className = "child-list staff-child-list";
    (children || []).forEach((child) => {
      const li = document.createElement("li");
      li.className = "child-card";

      const name = document.createElement("strong");
      name.textContent = childName(child);
      li.appendChild(name);

      const shirt = document.createElement("span");
      shirt.textContent = `Shirt size: ${child.shirtSize || child.shirt || "Not listed"}`;
      li.appendChild(shirt);

      const medical = document.createElement("span");
      medical.textContent = `Medical notes: ${child.medicalInfo || child.medical || child.medicalNotes || "None listed"}`;
      medical.className = child.medicalInfo || child.medical || child.medicalNotes ? "medical has-medical" : "medical";
      li.appendChild(medical);

      const medications = document.createElement("span");
      medications.textContent = `Current medications: ${child.medications || "None listed"}`;
      li.appendChild(medications);

      list.appendChild(li);
    });

    if (!children.length) {
      const li = document.createElement("li");
      li.textContent = "No child details were returned for this family.";
      list.appendChild(li);
    }

    els.staffResult.appendChild(list);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn primary";
    button.dataset.complete = code;
    button.textContent = alreadyCheckedIn ? "Record another scan" : "Confirm Check-In";
    els.staffResult.appendChild(button);

    openStaffResultOverlay();
  }

  async function staffLookup(code) {
    const trimmed = String(code || "").trim();
    if (!trimmed || state.busy) return;

    state.busy = true;
    els.manualCode.value = trimmed;
    els.staffResult.replaceChildren();

    const loading = document.createElement("p");
    loading.className = "staff-result-loading";
    loading.textContent = "Looking up family...";
    els.staffResult.appendChild(loading);

    openStaffResultOverlay();
    setError("");
    setStatus("");

    try {
      const data = await api("staffLookup", { code: trimmed });
      renderStaffResult(data.parent || {}, data.children || [], trimmed);
    } catch (error) {
      els.staffResult.replaceChildren();

      const banner = document.createElement("p");
      banner.className = "result-flag warn";
      banner.textContent = "Lookup problem";
      els.staffResult.appendChild(banner);

      const heading = document.createElement("h3");
      heading.id = "staffResultTitle";
      heading.textContent = "Family not found";
      els.staffResult.appendChild(heading);

      const details = document.createElement("p");
      details.className = "support-text";
      details.textContent = error.message;
      els.staffResult.appendChild(details);

      const back = document.createElement("button");
      back.type = "button";
      back.id = "closeLookupErrorBtn";
      back.className = "btn secondary";
      back.textContent = "Back to Scanner";
      els.staffResult.appendChild(back);

      openStaffResultOverlay();
    } finally {
      state.busy = false;
    }
  }

  function renderStaffResult(parent, children, code) {
    showPanel("staffPanel");
    fillStaffResult(parent, children, code);
  }

  async function completeCheckin(code) {
    if (state.busy) return;
    state.busy = true;
    setStatus("Recording check-in...");
    setError("");

    try {
      const data = await api("completeCheckin", {
        code,
        device: navigator.userAgent.slice(0, 120)
      });

      els.staffResult.replaceChildren();
      const ok = document.createElement("p");
      ok.className = "result-flag ok";
      ok.textContent = "Check-in complete";
      els.staffResult.appendChild(ok);

      const heading = document.createElement("h3");
      heading.id = "staffResultTitle";
      heading.textContent = (data.parent && data.parent.parentName) || "Parent";
      els.staffResult.appendChild(heading);

      const time = document.createElement("p");
      time.className = "support-text";
      time.textContent = `Recorded at ${data.checkedInAt || "the current time"}.`;
      els.staffResult.appendChild(time);

      const next = document.createElement("button");
      next.type = "button";
      next.id = "nextScanBtn";
      next.className = "btn secondary";
      next.textContent = "Ready for next scan";
      els.staffResult.appendChild(next);
      setStatus("");
    } catch (error) {
      setError(error.message);
    } finally {
      state.busy = false;
    }
  }

  function scannerAvailable() {
    return Boolean(window.Html5Qrcode && typeof window.Html5Qrcode === "function");
  }

  async function startScanner() {
    if (!scannerAvailable()) {
      els.reader.textContent = "Staff scanner library is unavailable. Use manual code lookup below.";
      els.readerStatus.textContent = "Manual lookup is enabled because the camera scanner library did not load.";
      els.readerStatus.classList.remove("hidden");
      return;
    }

    try {
      state.scanner = new window.Html5Qrcode("reader");
      await state.scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1
        },
        (decodedText) => {
          const parsed = (() => {
            try {
              return new URL(decodedText);
            } catch (_error) {
              return null;
            }
          })();
          const code = parsed ? parsed.searchParams.get("code") || decodedText : decodedText;
          const now = Date.now();

          if (
            code === state.lastScannedCode &&
            now - state.lastScannedAt < 3000
          ) {
            return;
          }

          state.lastScannedCode = code;
          state.lastScannedAt = now;
          state.scanner.pause(true);
          staffLookup(code);
        }
      );
      els.readerStatus.textContent = "Camera ready. Scan the family Fast Pass QR code.";
    } catch (_error) {
      els.reader.textContent = "Camera access was denied or unavailable. Use manual code lookup below.";
      els.readerStatus.textContent = "Camera permission was denied or unavailable. Manual code lookup is ready below.";
    }
  }

  function resetStaffScreen() {
    closeStaffResultOverlay();
    setStatus("");
    setError("");
  }

  function saveFastPass() {
    if (!state.passReady) return;
    const filename = `fast-pass-${sanitizeFilename((state.parent && state.parent.parentName) || "family")}.png`;
    const canvas = els.fastPassCanvas;

    const saveBlob = (blob) => {
      if (!blob) {
        setError("The Fast Pass image could not be downloaded.");
        return;
      }
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(href), 1000);
    };

    if (canvas.toBlob) {
      canvas.toBlob(saveBlob, "image/png");
    } else {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  }

  function setupStaffMode() {
    document.body.classList.add("staff-mode");
    setHero("Staff Check-In", "Scan a Fast Pass, review the family, and confirm the gate check-in.");
    showPanel("staffPanel");
    setStatus("");
    setError("");
    startScanner();
    const directCode = params.get("code");
    if (directCode) {
      staffLookup(directCode);
    }
  }

  function init() {
    const parentKey = params.get("k");
    if (params.get("staff") === "1") {
      setupStaffMode();
      return;
    }

    if (!parentKey) {
      showMessage("Fast Pass link needed", "Use the personalized link from your message. If you cannot find it, the help table can look up your family.", { error: true });
      return;
    }

    loadParentPass(parentKey);
  }

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.dataset.complete) {
      completeCheckin(target.dataset.complete);
      return;
    }

    if (target.id === "nextScanBtn") {
      closeStaffResultOverlay();
      return;
    }

    if (target.id === "closeLookupErrorBtn") {
      closeStaffResultOverlay();
      return;
    }

    if (target.id === "closeStaffResultBtn") {
      closeStaffResultOverlay({ clear: false });
    }
  });

  els.verifyBtn.addEventListener("click", verifyParent);
  els.helpBtn.addEventListener("click", renderHelpMessage);
  els.manualLookupBtn.addEventListener("click", () => staffLookup(els.manualCode.value));
  els.manualCode.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      staffLookup(els.manualCode.value);
    }
  });
  els.savePassBtn.addEventListener("click", saveFastPass);
  els.closeStaffResultBtn.addEventListener(
    "click",
    () => closeStaffResultOverlay({ clear: false })
  );
  els.staffResultOverlay.addEventListener("click", (event) => {
    if (event.target === els.staffResultOverlay) {
      closeStaffResultOverlay();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      !els.staffResultOverlay.classList.contains("hidden")
    ) {
      closeStaffResultOverlay();
    }
  });

  window.addEventListener("load", init);
})();