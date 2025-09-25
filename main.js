import { nanoid } from "nanoid";

/* ...existing code... */
const logEl = document.getElementById("log");
function log(message, meta){
  const el = document.createElement("div");
  el.className = "entry";
  el.innerHTML = `<div class="meta">${meta ?? new Date().toLocaleTimeString()}</div><div class="msg">${escapeHtml(JSON.stringify(message,null,2))}</div>`;
  logEl.prepend(el);
  console.log("Host:", message, meta);
}
function escapeHtml(s){
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

/* Target iframe/window */
const iframe = document.getElementById("aiIframe");
const IFRAME_ORIGIN = "https://websim.com";

/* Receive messages from iframe */
window.addEventListener("message", (ev) => {
  // Only accept messages from the known iframe origin
  if (!ev.origin || !ev.data) return;
  if (ev.origin !== IFRAME_ORIGIN) {
    // ignore others
    return;
  }
  // Log and display
  log({ fromIframe: ev.data }, `recv from ${ev.origin}`);
});

/* Send structured generate request to iframe */
function sendGenerate(type, prompt, options = {}) {
  const id = nanoid();
  const payload = { id, action: "generate", type, prompt, options };
  // send to iframe if ready
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage(payload, IFRAME_ORIGIN);
    log({ sentToIframe: payload }, `sent ${id} -> ${IFRAME_ORIGIN}`);
  } else {
    log({ error: "iframe_not_ready" }, "error");
  }
}

/* UI bindings */
document.getElementById("sendTest").addEventListener("click", () => {
  const type = document.getElementById("testType").value;
  const prompt = document.getElementById("testPrompt").value;
  sendGenerate(type, prompt, {});
});

document.getElementById("focusIframe").addEventListener("click", () => {
  iframe.focus();
  log({ action: "focus_iframe" }, "ui");
});

/* Optional: ping iframe on load to announce host */
iframe.addEventListener("load", () => {
  const ping = { action: "host_ping", ts: Date.now() };
  iframe.contentWindow.postMessage(ping, IFRAME_ORIGIN);
  log({ action: "ping_sent" }, "iframe_load");
});

/* ...existing code... */