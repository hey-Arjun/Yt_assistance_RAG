import { getVideoID } from "../utils/youtube.js";

export function toggleAssistantPanel() {
  let panel = document.getElementById("yt-assistant-panel");

  if (panel) {
    panel.style.display = panel.style.display === "none" ? "flex" : "none";
    return;
  }

  panel = document.createElement("div");
  panel.id = "yt-assistant-panel";

  const style = document.createElement("style");
  style.textContent = `
    #yt-assistant-panel {
      position: fixed;
      bottom: 100px;
      right: 20px;
      width: 350px;
      height: 500px;
      background: #ffffff;
      border: 1px solid #6405e0;
      border-radius: 20px;
      display: flex;
      flex-direction: column;
      z-index: 1000000;
      box-shadow: 0 10px 40px rgba(100, 5, 224, 0.2);
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      overflow: hidden;
    }
    #yt-header { 
      background: #6405e0; 
      color: white; 
      padding: 15px; 
      font-weight: 800; 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      cursor: move;
      user-select: none;
    }
    #yt-header-title { font-family: "Arial Round", sans-serif; font-size: 16px; }
    #yt-close-btn { cursor: pointer; font-size: 22px; font-weight: bold; padding: 0 5px; }
    
    #yt-assistant-chat { 
      flex: 1; 
      overflow-y: auto; 
      padding: 15px; 
      display: flex; 
      flex-direction: column; 
      gap: 12px; 
      background: #f8f9fa; 
    }
    
    #yt-input-container { 
      padding: 15px; 
      background: #6405e0; 
      display: flex; 
      gap: 8px; 
      align-items: center;
    }
    
    #yt-assistant-input { 
      flex: 1; 
      background: rgba(255, 255, 255, 0.2); 
      border: 1px solid rgba(255, 255, 255, 0.4); 
      color: white; 
      padding: 10px 15px; 
      border-radius: 25px; 
      outline: none; 
    }
    #yt-assistant-input::placeholder { color: rgba(255, 255, 255, 0.8); }
    
    #yt-assistant-send { 
      background: white; 
      border: none; 
      color: #6405e0; 
      padding: 10px 20px; 
      border-radius: 25px; 
      cursor: pointer; 
      font-weight: 800;
    }

    .msg { padding: 10px 14px; border-radius: 15px; max-width: 85%; font-size: 13px; line-height: 1.4; word-wrap: break-word; margin-bottom: 5px; }
    .user-msg { background: #6405e0; color: white; align-self: flex-end; border-bottom-right-radius: 2px; }
    .bot-msg { background: #e9ecef; color: #333; align-self: flex-start; border-bottom-left-radius: 2px; border: 1px solid #dee2e6; }
  `;
  document.head.appendChild(style);

  panel.innerHTML = `
    <div id="yt-header">
        <span id="yt-header-title">Trippi</span>
        <span id="yt-close-btn">×</span>
    </div>
    <div id="yt-assistant-chat"></div>
    <div id="yt-input-container">
        <input type="text" id="yt-assistant-input" placeholder="Ask about this video...">
        <button id="yt-assistant-send">Send</button>
    </div>
  `;

  document.body.appendChild(panel);

  const header = panel.querySelector("#yt-header");
  const closeBtn = panel.querySelector("#yt-close-btn");
  const chatContainer = panel.querySelector("#yt-assistant-chat");
  const input = panel.querySelector("#yt-assistant-input");
  const sendButton = panel.querySelector("#yt-assistant-send");

  // --- Drag Logic ---
  let isDragging = false;
  let startX, startY, initialLeft, initialTop;

  header.addEventListener("mousedown", (e) => {
    if (e.target === closeBtn) return;
    const rect = panel.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    initialLeft = rect.left;
    initialTop = rect.top;
    isDragging = true;

    const onMouseMove = (ev) => {
      if (!isDragging) return;
      panel.style.left = `${initialLeft + (ev.clientX - startX)}px`;
      panel.style.top = `${initialTop + (ev.clientY - startY)}px`;
      panel.style.bottom = "auto";
      panel.style.right = "auto";
    };

    const onMouseUp = () => {
      isDragging = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });

  closeBtn.addEventListener("click", () => panel.remove());

  function addMessage(text, isUser = false) {
    const msg = document.createElement("div");
    msg.className = isUser ? "msg user-msg" : "msg bot-msg";
    msg.textContent = text;
    chatContainer.appendChild(msg);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return msg;
  }

  async function sendMessage() {
    const question = input.value.trim();
    if (!question) return;

    // 1. Show User Message Immediately
    addMessage(question, true);

    // 2. Clear and disable input
    input.value = "";
    input.disabled = true;

    // 3. Prepare Bot Placeholder
    const botMsg = addMessage("Thinking...", false);
    let fullText = "";

    try {
        const videoId = getVideoID();
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        let storage = await chrome.storage.local.get("client_id");
        let client_id = storage.client_id;

        if (!client_id) {
            client_id = crypto.randomUUID();
            await chrome.storage.local.set({ client_id });
        }

      const port = chrome.runtime.connect({ name: "streaming-chat" });

      port.postMessage({
          type: "START_STREAM",
          payload: { 
              video_id: videoId, 
              video_url: videoUrl, 
              question: question,
              client_id: client_id   
          }
      });

      port.onMessage.addListener((msg) => {
          if (msg.type === "CHUNK") {
              // Clear "Thinking..." only on first chunk arrival
              if (fullText === "") {
                  botMsg.textContent = "";
              }
              fullText += msg.text;
              botMsg.textContent = fullText; 
              chatContainer.scrollTop = chatContainer.scrollHeight;
          } else if (msg.type === "ERROR") {
              botMsg.textContent = "❌ " + msg.error;
              input.disabled = false;
              port.disconnect();
          } else if (msg.type === "DONE") {
              input.disabled = false;
              input.focus();
              port.disconnect();
          }
      });

      port.onDisconnect.addListener(() => {
        input.disabled = false;
      });

    } catch (err) {
      botMsg.textContent = "❌ " + err.message;
      input.disabled = false;
    }
  }

  sendButton.addEventListener("click", sendMessage);
  input.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });

  addMessage("Hi! I'm Trippi. How can I help You?", false);
  input.focus();
}