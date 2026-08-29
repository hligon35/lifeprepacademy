(function () {
  const params = new URLSearchParams(window.location.search);
  const resumeToken = String(params.get("resume") || "").trim();
  if (!resumeToken) return;

  const message = document.getElementById("form-message");
  if (!message) return;

  const requestedTestMode = params.get("resumeTest") === "1";
  const requestedSandboxMode = params.get("resumeSandbox") === "1";

  const LOADING_TEXT =
    "Loading your registration information... We’re securely restoring the details from your previous registration so you can continue where you left off.";
  const LOADED_TEXT =
    "Your registration information has been loaded. Please review the pre-filled details below and complete any remaining steps.";
  const FAILED_TEXT =
    "We couldn’t load your previous registration information. Please reopen the secure continuation link from your email or contact us for assistance.";
  const TEST_TEXT =
    "TEST MODE: This is a read-only continuation preview. No live registration data will be changed.";
  const SANDBOX_TEXT =
    "FULL SANDBOX TEST: Changes will be saved only to the temporary test registration. The original Players row will not be changed.";

  let internalUpdate = false;

  function setStatus(state, text) {
    internalUpdate = true;
    message.classList.remove(
      "error-msg",
      "resume-status--loading",
      "resume-status--loaded",
      "resume-status--error"
    );
    message.classList.add("resume-status", `resume-status--${state}`);
    message.textContent = text;
    internalUpdate = false;
  }

  function loadedText(originalText) {
    if (/^FULL SANDBOX TEST:/i.test(originalText) || requestedSandboxMode) {
      return `${LOADED_TEXT} ${SANDBOX_TEXT}`;
    }
    if (/^TEST MODE:/i.test(originalText) || requestedTestMode) {
      return `${LOADED_TEXT} ${TEST_TEXT}`;
    }
    return LOADED_TEXT;
  }

  function looksLikeLoadSuccess(text) {
    return (
      /^Welcome back\./i.test(text) ||
      /^TEST MODE:/i.test(text) ||
      /^FULL SANDBOX TEST:/i.test(text)
    );
  }

  function looksLikeLoadFailure(text) {
    return (
      /could not load your saved registration/i.test(text) ||
      /saved registration could not be loaded/i.test(text) ||
      /no claimed participant information could be assembled/i.test(text) ||
      /saved registration is missing its registration id/i.test(text)
    );
  }

  setStatus("loading", LOADING_TEXT);

  const observer = new MutationObserver(function () {
    if (internalUpdate) return;

    const text = String(message.textContent || "").trim();
    if (!text || text === LOADING_TEXT || text === LOADED_TEXT || text === FAILED_TEXT) {
      return;
    }

    if (looksLikeLoadSuccess(text)) {
      setStatus("loaded", loadedText(text));
      return;
    }

    if (looksLikeLoadFailure(text)) {
      setStatus("error", FAILED_TEXT);
    }
  });

  observer.observe(message, {
    childList: true,
    characterData: true,
    subtree: true,
  });
})();
