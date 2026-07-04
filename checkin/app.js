(() => {
  const $ = (id) => document.getElementById(id);
  const cfg = window.AT_THE_GATE_CONFIG || {};
  const params = new URLSearchParams(window.location.search);
  const state = { parent: null, qrValue: null, scanner: null, busy: false };

  const panels = ["loadingPanel", "parentPanel", "passPanel", "staffPanel", "walkupPanel", "messagePanel"];
  const show = (id) => panels.forEach((p) => $(p).classList.toggle("hidden", p !== id));
  const setHero = (title, intro) => { $("screenTitle").textContent = title; $("screenIntro").textContent = intro; };
  const message = (title, body) => { $("messageTitle").textContent = title; $("messageBody").textContent = body; show("messagePanel"); };

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

  function childrenText(children = []) {
    return children.map((c) => [c.firstName, c.lastName].filter(Boolean).join(" ") || c.name).filter(Boolean).join(", ");
  }

  function renderParent(data) {
    state.parent = data.parent;
    $("parentName").textContent = `Welcome, ${data.parent.parentName || "Parent"}`;
    $("childList").innerHTML = "";
    (data.children || []).forEach((child) => {
      const li = document.createElement("li");
      li.textContent = child.name || [child.firstName, child.lastName].filter(Boolean).join(" ") || "Registered child";
      $("childList").appendChild(li);
    });
    if (!(data.children || []).length) {
      $("childList").innerHTML = "<li>No child registration is connected yet.</li>";
    }
    $("addChildBtn").href = buildRegistrationUrl("add_child", data.parent.parentKey);
    show("parentPanel");
  }

  function buildRegistrationUrl(type, parentKey = "") {
    const base = type === "missing" ? cfg.missingRegistrationUrl : cfg.registrationUrl;
    if (!base) return "#";
    const url = new URL(base, window.location.href);
    url.searchParams.set("registration_type", type);
    if (parentKey) url.searchParams.set("parent_key", parentKey);
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
    const children = data.children || [];
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
        <h2>${parent.parentName || "Parent"}</h2>
        <p><strong>Children:</strong> ${childrenText(children) || parent.childNames || "Not listed"}</p>
        <p><strong>Shirts:</strong> ${data.shirts || "Check registration sheet"}</p>
        <p><strong>Medical flag:</strong> ${data.medicalFlag ? "Yes - check private notes" : "No"}</p>
        <button class="btn primary" data-complete="${code}">${already ? "Record another scan" : "Complete Check-In"}</button>
      `;
    } catch (err) {
      $("staffResult").innerHTML = `<p class="danger">${err.message}</p>`;
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
        <h2>${parent.parentName || "Parent"}</h2>
        <p>${parent.childNames || childrenText(data.children || []) || "Participant(s) recorded"}</p>
        <p class="muted">Time: ${data.checkedInAt || "Recorded in Google Sheets"}</p>
      `;
    } catch (err) {
      $("staffResult").innerHTML = `<p class="danger">${err.message}</p>`;
    } finally { state.busy = false; }
  }

  function startScanner() {
    if (!window.Html5Qrcode) return;
    state.scanner = new Html5Qrcode("reader");
    state.scanner.start({ facingMode: "environment" }, { fps: 8, qrbox: 250 }, (decoded) => {
      const code = new URL(decoded, window.location.href).searchParams.get("code") || decoded;
      state.scanner.pause(true);
      staffLookup(code);
      setTimeout(() => state.scanner?.resume(), 2500);
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
    setHero("Staff Gate Mode", "Scan Fast Pass QR codes, verify details, and record attendance.");
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
