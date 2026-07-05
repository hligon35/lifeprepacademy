(() => {
  const $ = (id) => document.getElementById(id);
  const cfg = window.AT_THE_GATE_CONFIG || {};
  const params = new URLSearchParams(window.location.search);
  const state = { parent: null, children: [], qrValue: null, scanner: null, busy: false };

  const panels = ["loadingPanel", "parentPanel", "passPanel", "staffPanel", "walkupPanel", "messagePanel"];
  const show = (id) => panels.forEach((p) => $(p).classList.toggle("hidden", p !== id));
  const setHero = (title, intro) => { $("screenTitle").textContent = title; $("screenIntro").textContent = intro; };
  const message = (title, body) => { $("messageTitle").textContent = title; $("messageBody").textContent = body; show("messagePanel"); };
  const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));

  function api(action, payload = {}) {
    const base = cfg.googleAppsScriptUrl;
    if (!base || base.includes("PASTE_DEPLOYED")) {
      return Promise.reject(new Error("Google Apps Script URL is not configured yet."));
    }
    const callback = `atg_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const url = new URL(base);
    url.searchParams.set("action", action);
    url.searchParams.set("callback", callback);
    Object.entries(payload).forEach(([key, value]) => url.searchParams.set(key, value ?? ""));

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error("The check-in system did not respond in time."));
      }, 15000);
      function cleanup() {
        clearTimeout(timer);
        delete window[callback];
        script.remove();
      }
      window[callback] = (data) => { cleanup(); data?.ok ? resolve(data) : reject(new Error(data?.error || "Request failed.")); };
      script.onerror = () => { cleanup(); reject(new Error("Could not reach the check-in system.")); };
      script.src = url.toString();
      document.body.appendChild(script);
    });
  }

  function childName(child = {}) {
    return child.name || [child.firstName, child.lastName].filter(Boolean).join(" ") || "Registered child";
  }

  function childrenText(children = []) {
    return children.map(childName).filter(Boolean).join(", ");
  }

  function renderChildCards(children = [], { staff = false } = {}) {
    if (!children.length) return "<li>No child registration is connected yet.</li>";
    return children.map((child) => {
      const shirt = child.shirtSize || child.shirt || "Not listed";
      const medical = child.medicalInfo || child.medical || child.medicalNotes || "None listed";
      return `
        <li class="child-card">
          <strong>${escapeHtml(childName(child))}</strong>
          ${staff ? `<span>Shirt: ${escapeHtml(shirt)}</span><span class="medical ${medical === "None listed" ? "" : "has-medical"}">Medical: ${escapeHtml(medical)}</span>` : ""}
        </li>
      `;
    }).join("");
  }

  function renderParent(data) {
    state.parent = data.parent;
    state.children = data.children || [];
    $("parentName").textContent = `Welcome, ${data.parent.parentName || "Parent"}`;
    $("childList").innerHTML = renderChildCards(state.children);
    $("addChildBtn").href = buildRegistrationUrl("add_child", data.parent.parentKey);
    show("parentPanel");
  }

  function buildRegistrationUrl(type, parentKey = "") {
    const base = type === "missing" ? cfg.missingRegistrationUrl : cfg.registrationUrl;
    if (!base) return "#";
    const url = new URL(base, window.location.href);
    url.searchParams.set("registration_type", type);
    if (parentKey) url.searchParams.set("parent_key", parentKey);
    const returnUrl = new URL(window.location.href);
    returnUrl.searchParams.delete("staff");
    returnUrl.searchParams.delete("register");
    returnUrl.searchParams.delete("walkup");
    if (parentKey) returnUrl.searchParams.set("k", parentKey);
    returnUrl.searchParams.set("returning", "1");
    url.searchParams.set("return_url", returnUrl.toString());
    return url.toString();
  }

  async function verifyParent() {
    if (!state.parent || state.busy) return;
    state.busy = true;
    try {
      const data = await api("verify", { parentKey: state.parent.parentKey });
      renderPass(data);
    } catch (err) {
      message("Could not verify yet", err.message);
    } finally { state.busy = false; }
  }

  function renderPass(data) {
    const parent = data.parent || state.parent || {};
    const children = data.children || state.children || [];
    const qrId = data.qrId || parent.qrId || parent.parentKey;
    state.qrValue = `${window.location.origin}${window.location.pathname}?staff=1&code=${encodeURIComponent(qrId)}`;
    $("passParent").textContent = parent.parentName || "Parent";
    $("passChildren").textContent = childrenText(children) || parent.childNames || "Children verified";
    $("passStatus").textContent = parent.checkedIn === "Yes" ? "Checked In" : "Verified";
    $("qrCode").innerHTML = "";
    if (window.QRCode) {
      QRCode.toCanvas(state.qrValue, { width: 238, margin: 1 }, (err, canvas) => {
        if (err) $("qrCode").textContent = qrId;
        else $("qrCode").appendChild(canvas);
      });
    } else {
      $("qrCode").textContent = qrId;
    }
    setHero("Your Fast Pass Is Ready", "Show this QR code at the gate for a quicker check-in.");
    show("passPanel");
  }

  async function staffLookup(code) {
    if (!code || state.busy) return;
    state.busy = true;
    $("staffResult").classList.remove("hidden");
    $("staffResult").innerHTML = "Looking up pass...";
    try {
      const data = await api("staffLookup", { code });
      const parent = data.parent || {};
      const children = data.children || [];
      const already = String(parent.checkedIn || "").toLowerCase() === "yes";
      $("staffResult").innerHTML = `
        <p class="${already ? "warn" : "ok"}">${already ? "Already checked in" : "Ready to check in"}</p>
        <h2>${escapeHtml(parent.parentName || "Parent")}</h2>
        <p class="muted">Review each child before pressing confirm.</p>
        <ul class="child-list staff-child-list">${renderChildCards(children, { staff: true })}</ul>
        <button class="btn primary" data-complete="${escapeHtml(code)}">${already ? "Record another scan" : "Confirm Check-In"}</button>
      `;
    } catch (err) {
      $("staffResult").innerHTML = `<p class="danger">${escapeHtml(err.message)}</p>`;
    } finally { state.busy = false; }
  }

  async function completeCheckin(code) {
    if (!code || state.busy) return;
    state.busy = true;
    try {
      const data = await api("completeCheckin", { code, device: navigator.userAgent.slice(0, 80) });
      const parent = data.parent || {};
      $("staffResult").innerHTML = `
        <p class="ok">✅ Check-in complete</p>
        <h2>${escapeHtml(parent.parentName || "Parent")}</h2>
        <p>${escapeHtml(parent.childNames || childrenText(data.children || []) || "Participant(s) recorded")}</p>
        <p class="muted">Marked checked in and ready for the next scan. Time: ${escapeHtml(data.checkedInAt || "Recorded in Google Sheets")}</p>
        <button class="btn secondary" id="nextScanBtn">Ready for next scan</button>
      `;
    } catch (err) {
      $("staffResult").innerHTML = `<p class="danger">${escapeHtml(err.message)}</p>`;
    } finally { state.busy = false; }
  }

  function resetScannerResult() {
    $("staffResult").classList.add("hidden");
    $("staffResult").innerHTML = "";
    $("manualCode").value = "";
    state.scanner?.resume?.();
  }

  function startScanner() {
    if (!window.Html5Qrcode) return;
    state.scanner = new Html5Qrcode("reader");
    state.scanner.start({ facingMode: "environment" }, { fps: 8, qrbox: 250 }, (decoded) => {
      const code = new URL(decoded, window.location.href).searchParams.get("code") || decoded;
      state.scanner.pause(true);
      staffLookup(code);
    }).catch(() => {
      $("reader").innerHTML = "Camera unavailable. Use manual lookup below.";
    });
  }

  function setupWalkup() {
    setHero("Registration Station", "Finish the correct registration route before entering the gate line.");
    $("ticketHolderLink").href = buildRegistrationUrl("missing");
    $("walkupLink").href = buildRegistrationUrl("walkup");
    show("walkupPanel");
  }

  function setupStaff() {
    setHero("Staff Gate Mode", "Scan a Fast Pass, review children, then confirm check-in.");
    show("staffPanel");
    startScanner();
    const code = params.get("code");
    if (code) staffLookup(code);
  }

  function setupParent() {
    const parentKey = params.get("k") || params.get("parent_key") || params.get("parentKey");
    if (!parentKey) {
      message("Fast Pass link needed", "Open the personalized link from your text message, or see the check-in table for help.");
      return;
    }
    api("lookupPass", { parentKey })
      .then(renderParent)
      .catch((err) => message("Could not load registration", err.message));
  }

  document.addEventListener("click", (event) => {
    const complete = event.target?.dataset?.complete;
    if (complete) completeCheckin(complete);
    if (event.target?.id === "nextScanBtn") resetScannerResult();
  });
  $("verifyBtn").addEventListener("click", verifyParent);
  $("helpBtn").addEventListener("click", () => message("We can help at the table", "Please keep your Fast Pass screen open and stop at the help station when you arrive."));
  $("manualLookupBtn").addEventListener("click", () => staffLookup($("manualCode").value.trim()));

  window.addEventListener("load", () => {
    if (params.has("staff")) setupStaff();
    else if (params.has("walkup") || params.has("register")) setupWalkup();
    else setupParent();
  });
})();
