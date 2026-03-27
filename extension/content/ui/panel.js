import { getVideoID } from "../utils/youtube.js";

export function toggleAssistantPanel() {
  let panel = document.getElementById("yt-assistant-panel");

  if (panel) {
    panel.remove();
    return;
  }

  panel = document.createElement("div");
  panel.id = "yt-assistant-panel";

  // 🔴 ALL YOUR STYLES + HTML KEPT AS-IS
  // (no UI changes at all)

  document.body.appendChild(panel);

  const input = panel.querySelector("#yt-assistant-input");
  const sendButton = panel.querySelector("#yt-assistant-send");
  const chatContainer = panel.querySelector("#yt-assistant-chat");

  function addMessage(text, isUser = false) {
    // unchanged
  }

  async function sendMessage() {
    const question = input.value.trim();
    if (!question) return;

    input.value = "";
    input.disabled = true;

    addMessage(question, true);

    // thinking UI (unchanged)

    try {
      const videoId = getVideoID();
      if (!videoId) throw new Error("Video ID not found");

      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            type: "ASK_VIDEO",
            video_id: videoId,
            question
          },
          (res) => {
            if (!res || !res.ok) {
              reject(new Error(res?.error || "Backend error"));
            } else {
              resolve(res.data);
            }
          }
        );
      });

      textDiv.innerHTML = response.answer;
      textDiv.style.color = "#fff";

    } catch (err) {
      textDiv.innerHTML = `❌ ${err.message}`;
      textDiv.style.color = "#ff6b6b";
    } finally {
      input.disabled = false;
      input.focus();
    }
  }

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  sendButton.addEventListener("click", sendMessage);

  setTimeout(() => {
    addMessage("Hello! I'm your YouTube Assistant...", false);
  }, 100);

  input.focus();
}
