
```javascript
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
// derive origin from iframe src to avoid mismatches
const IFRAME_ORIGIN = (() => { try { return new URL(iframe.src).origin } catch(e){ return "https://websim.com" } })();

/* simple queue until iframe is ready */
let iframeReady = false;
const messageQueue = [];
function postToIframe(payload){
    if (iframe && iframe.contentWindow && iframeReady) {
        // use derived origin to target the iframe safely
        try {
            iframe.contentWindow.postMessage(payload, IFRAME_ORIGIN);
        } catch(e) {
            iframe.contentWindow.postMessage(payload, "*");
        }
        log({ sentToIframe: payload }, `sent -> ${IFRAME_ORIGIN}`);
    } else {
        messageQueue.push(payload);
        log({ queued: payload }, "queued");
    }
}

/* Receive messages from iframe */
window.addEventListener("message", (ev) => {
  // Ensure message is from the expected iframe window (allow any origin from that window)
  if (!ev.source || ev.source !== iframe.contentWindow) return;
  // Note: relax strict origin check to allow cross-origin iframe responses (log mismatches)
  if (ev.origin && ev.origin !== IFRAME_ORIGIN) {
    log({ warning: "origin_mismatch", expected: IFRAME_ORIGIN, got: ev.origin }, "security");
  }
  // Log and display
  log({ fromIframe: ev.data }, `recv from ${ev.origin}`);
  // mark iframe ready if it announces readiness
  if (ev.data && ev.data.action === "iframe_ready") {
    iframeReady = true;
    // flush queue
    while (messageQueue.length) postToIframe(messageQueue.shift());
    log({ action: "flushed_queue" }, "iframe_ready");
  }
});

/* Send structured generate request to iframe */
function sendGenerate(type, prompt, options = {}) {
  const id = nanoid();
  const payload = { id, action: "generate", type, prompt, options };
  // send via helper that queues if iframe not ready
  postToIframe(payload);
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
  try {
    iframe.contentWindow.postMessage(ping, IFRAME_ORIGIN);
    log({ action: "ping_sent" }, "iframe_load");
  } catch(e){
    try { iframe.contentWindow.postMessage(ping, "*"); log({ action: "ping_sent_wildcard" }, "iframe_load"); } catch(err){ log({ error: "post_failed", e: err }, "iframe_load"); }
  }
  // If the iframe doesn't explicitly announce readiness, consider it ready after load and flush queued messages.
  iframeReady = true;
  while (messageQueue.length) postToIframe(messageQueue.shift());
});

/* ...existing code... */