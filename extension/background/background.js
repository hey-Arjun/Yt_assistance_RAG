import { ensureClientId } from "./clientId.js";
import { askBackend } from "./api.js";

chrome.runtime.onInstalled.addListener(() => {
  ensureClientId();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ASK_VIDEO") {
    askBackend(message)
      .then((data) => sendResponse({ ok: true, data }))
      .catch((err) =>
        sendResponse({ ok: false, error: err.message })
      );
    return true;
  }
});
