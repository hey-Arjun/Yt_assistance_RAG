// Avoid duplicate injection
const BACKEND_URL = "http://127.0.0.1:8000/ask";

// Get video ID from YouTube URL
function getVideoID() {
  const url = window.location.href;
  const match = url.match(/[?&]v=([^&]+)/);
  return match ? match[1] : null;
}

// Get or create client ID
function getClientId() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get("client_id", (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }

      if (result.client_id) {
        resolve(result.client_id);
      } else {
        const newClientId = crypto.randomUUID();
        chrome.storage.local.set({ client_id: newClientId }, () => {
          resolve(newClientId);
        });
      }
    });
  });
}

// Call backend API
async function askBackend(videoId, question) {
  const clientId = await getClientId();

  const response = await fetch(BACKEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      video_id: videoId,
      question: question,
      client_id: clientId
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Backend error");
  }
  
  const data = await response.json();
  return data;
}

// Initialize client ID
getClientId()
  .then((id) => console.log("[YT Assistant] client_id:", id))
  .catch((err) => console.error("[YT Assistant] client_id error:", err));

// Create robot if not exists
if (!document.getElementById("yt-assistant-robot")) {
  const robot = document.createElement("div");
  robot.id = "yt-assistant-robot";

  robot.innerHTML = "🤖"; // Robot emoji
  robot.style.position = "fixed";
  robot.style.bottom = "20px";
  robot.style.right = "20px";
  robot.style.width = "64px";
  robot.style.height = "64px";
  robot.style.zIndex = "999999";
  robot.style.cursor = "pointer";
  robot.style.userSelect = "none";
  robot.style.filter = "drop-shadow(0 6px 16px rgba(0,0,0,0.4))";
  robot.style.backgroundColor = "#f9f0f0ff"; // White background for robot emoji
  robot.style.borderRadius = "50%";
  robot.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
  robot.style.display = "flex";
  robot.style.alignItems = "center";
  robot.style.justifyContent = "center";
  robot.style.fontSize = "32px";
  robot.style.color = "white";

  robot.title = "YT Assistant - Click to chat";

  // Hover animation
  robot.addEventListener("mouseenter", () => {
    robot.style.transform = "scale(1.1)";
    robot.style.transition = "transform 0.2s ease";
  });

  robot.addEventListener("mouseleave", () => {
    robot.style.transform = "scale(1)";
  });

  // Make robot draggable with click vs drag detection
  let isRobotDragging = false;
  let robotOffsetX = 0;
  let robotOffsetY = 0;
  let robotMouseDownTime = 0;
  let robotMouseDownX = 0;
  let robotMouseDownY = 0;

  robot.addEventListener("mousedown", (e) => {
    if (e.target === robot || robot.contains(e.target)) {
      isRobotDragging = false; // Start as false
      robotOffsetX = e.clientX - robot.getBoundingClientRect().left;
      robotOffsetY = e.clientY - robot.getBoundingClientRect().top;
      robot.style.transition = "none";
      
      // Store mouse down position and time
      robotMouseDownTime = Date.now();
      robotMouseDownX = e.clientX;
      robotMouseDownY = e.clientY;
      
      e.stopPropagation();
    }
  });

  robot.addEventListener("mousemove", (e) => {
    // Check if mouse has moved enough to consider it a drag (not a click)
    if (!isRobotDragging && robotMouseDownTime > 0) {
      const moveDistance = Math.sqrt(
        Math.pow(e.clientX - robotMouseDownX, 2) + 
        Math.pow(e.clientY - robotMouseDownY, 2)
      );
      
      // If mouse moved more than 5 pixels, it's a drag
      if (moveDistance > 5) {
        isRobotDragging = true;
      }
    }
  });

  document.addEventListener("mousemove", (e) => {
    if (!isRobotDragging || robotMouseDownTime === 0) return;

    const x = e.clientX - robotOffsetX;
    const y = e.clientY - robotOffsetY;
    
    // Keep robot within viewport bounds
    const maxX = window.innerWidth - robot.offsetWidth;
    const maxY = window.innerHeight - robot.offsetHeight;
    
    robot.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
    robot.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
    robot.style.right = "auto";
    robot.style.bottom = "auto";
  });

  document.addEventListener("mouseup", () => {
    if (robotMouseDownTime > 0) {
      const clickDuration = Date.now() - robotMouseDownTime;
      const isClick = !isRobotDragging && clickDuration < 500;
      
      if (isRobotDragging) {
        // It was a drag - don't open panel
        isRobotDragging = false;
        robot.style.transition = "all 0.2s ease";
      } else if (isClick) {
        // It was a click - open panel
        toggleAssistantPanel();
      }
      
      // Reset drag tracking
      robotMouseDownTime = 0;
      robotMouseDownX = 0;
      robotMouseDownY = 0;
      isRobotDragging = false;
    }
  });

  document.body.appendChild(robot);
}

function toggleAssistantPanel() {
  let panel = document.getElementById("yt-assistant-panel");

  if (panel) {
    panel.remove();
    return;
  }

  panel = document.createElement("div");
  panel.id = "yt-assistant-panel";

  panel.style.position = "fixed";
  panel.style.bottom = "90px";
  panel.style.right = "20px";
  panel.style.width = "320px";
  panel.style.height = "420px";
  panel.style.background = "#111";
  panel.style.color = "#fff";
  panel.style.zIndex = "999999";
  panel.style.borderRadius = "12px";
  panel.style.boxShadow = "0 8px 24px rgba(0,0,0,0.5)";
  panel.style.padding = "12px";
  panel.style.fontFamily = "Arial, sans-serif";
  panel.style.display = "flex";
  panel.style.flexDirection = "column";

  panel.innerHTML = `
    <div id="yt-assistant-header" style="display: flex; align-items: center; margin-bottom: 12px; cursor: move; user-select: none;">
      <div style="font-weight: bold; font-size: 16px; color: white;">🤖 YT Assistant</div>
      <button 
        id="yt-assistant-close"
        style="
          margin-left: auto;
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s;
        "
        onmouseover="this.style.color='red'; this.style.background='#333'"
        onmouseout="this.style.color='white'; this.style.background='transparent'"
      >
        ×
      </button>
    </div>
    <div id="yt-assistant-chat" style="flex: 1; overflow-y: auto; margin-bottom: 12px; padding: 8px; background: #0a0a0a; border-radius: 6px; display: flex; flex-direction: column; gap: 8px;">
      <!-- Chat messages will appear here -->
    </div>
    <div style="display: flex; gap: 8px;">
      <input 
        id="yt-assistant-input"
        placeholder="Type your question about this video..."
        style="
          flex: 1;
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px solid #333;
          outline: none;
          background: #1a1a1a;
          color: #fff;
          font-size: 13px;
        "
      />
      <button 
        id="yt-assistant-send"
        style="
          padding: 10px 16px;
          border-radius: 6px;
          border: none;
          background: #ff0000;
          color: white;
          font-weight: bold;
          cursor: pointer;
          font-size: 13px;
          transition: background 0.2s;
        "
        onmouseover="this.style.background='#cc0000'"
        onmouseout="this.style.background='#ff0000'"
      >
        Send
      </button>
    </div>
  `;

  document.body.appendChild(panel);

  // Close button functionality
  const closeButton = document.getElementById("yt-assistant-close");
  closeButton.addEventListener("click", () => {
    panel.remove();
  });

  // Make panel draggable
  const header = document.getElementById("yt-assistant-header");
  let isPanelDragging = false;
  let panelOffsetX = 0;
  let panelOffsetY = 0;

  header.addEventListener("mousedown", (e) => {
    // Don't start dragging if clicking the close button
    if (e.target.id === "yt-assistant-close" || e.target.closest("#yt-assistant-close")) {
      return;
    }
    
    isPanelDragging = true;
    const panelRect = panel.getBoundingClientRect();
    panelOffsetX = e.clientX - panelRect.left;
    panelOffsetY = e.clientY - panelRect.top;
    panel.style.transition = "none";
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!isPanelDragging) return;

    const x = e.clientX - panelOffsetX;
    const y = e.clientY - panelOffsetY;
    
    // Keep panel within viewport bounds
    const maxX = window.innerWidth - panel.offsetWidth;
    const maxY = window.innerHeight - panel.offsetHeight;
    
    panel.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
    panel.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
  });

  document.addEventListener("mouseup", () => {
    if (isPanelDragging) {
      isPanelDragging = false;
      panel.style.transition = "all 0.2s ease";
    }
  });

  // Get DOM elements
  const input = panel.querySelector("#yt-assistant-input");
  const sendButton = panel.querySelector("#yt-assistant-send");
  const chatContainer = panel.querySelector("#yt-assistant-chat");

  // Function to add message to chat
  function addMessage(text, isUser = false) {
    const messageDiv = document.createElement("div");
    messageDiv.style.display = "flex";
    messageDiv.style.flexDirection = isUser ? "row-reverse" : "row";
    messageDiv.style.alignItems = "flex-start";
    messageDiv.style.gap = "8px";
    
    const avatar = document.createElement("div");
    avatar.textContent = isUser ? "👤" : "🤖";
    avatar.style.fontSize = "12px";
    avatar.style.background = isUser ? "#444" : "#ff0000";
    avatar.style.width = "24px";
    avatar.style.height = "24px";
    avatar.style.borderRadius = "50%";
    avatar.style.display = "flex";
    avatar.style.alignItems = "center";
    avatar.style.justifyContent = "center";
    avatar.style.flexShrink = "0";
    
    const textDiv = document.createElement("div");
    textDiv.textContent = text;
    textDiv.style.background = isUser ? "#333" : "#222";
    textDiv.style.padding = "8px 12px";
    textDiv.style.borderRadius = "12px";
    textDiv.style.maxWidth = "80%";
    textDiv.style.wordBreak = "break-word";
    textDiv.style.fontSize = "13px";
    textDiv.style.lineHeight = "1.4";
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(textDiv);
    chatContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // Send message function
  async function sendMessage() {
    const question = input.value.trim();
    if (!question) return;

    // Clear input and disable it
    input.value = "";
    input.disabled = true;

    // Show user message
    addMessage(question, true);

    // Create thinking message
    const thinkingDiv = document.createElement("div");
    thinkingDiv.style.display = "flex";
    thinkingDiv.style.flexDirection = "row";
    thinkingDiv.style.alignItems = "flex-start";
    thinkingDiv.style.gap = "8px";
    
    const avatar = document.createElement("div");
    avatar.textContent = "🤖";
    avatar.style.fontSize = "12px";
    avatar.style.background = "#ff0000";
    avatar.style.width = "24px";
    avatar.style.height = "24px";
    avatar.style.borderRadius = "50%";
    avatar.style.display = "flex";
    avatar.style.alignItems = "center";
    avatar.style.justifyContent = "center";
    avatar.style.flexShrink = "0";
    
    const textDiv = document.createElement("div");
    textDiv.innerHTML = "<i>Thinking...</i>";
    textDiv.style.background = "#222";
    textDiv.style.padding = "8px 12px";
    textDiv.style.borderRadius = "12px";
    textDiv.style.maxWidth = "80%";
    textDiv.style.fontSize = "13px";
    textDiv.style.lineHeight = "1.4";
    textDiv.style.color = "#aaa";
    
    thinkingDiv.appendChild(avatar);
    thinkingDiv.appendChild(textDiv);
    chatContainer.appendChild(thinkingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
      const videoId = getVideoID();
      if (!videoId) {
        throw new Error("Could not detect video ID. Please make sure you're on a YouTube video page.");
      }

      const result = await askBackend(videoId, question);
      
      // Replace thinking message with actual response
      textDiv.innerHTML = result.answer;
      textDiv.style.color = "#fff";
      
      // Add remaining queries if available
      if (result.remaining_queries !== undefined) {
        textDiv.innerHTML += `<div style="font-size:11px; opacity:0.6; margin-top:4px;">Remaining today: ${result.remaining_queries}</div>`;
      }
    } catch (err) {
      // Replace thinking message with error
      textDiv.innerHTML = `❌ ${err.message || "Error connecting to server"}`;
      textDiv.style.color = "#ff6b6b";
    } finally {
      input.disabled = false;
      input.focus();
    }
  }

  // Event listeners
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  sendButton.addEventListener("click", sendMessage);

  // Add initial welcome message
  setTimeout(() => {
    addMessage("Hello! I'm your YouTube Assistant. You can ask me about this video's content, request summaries, or get explanations about specific topics mentioned. How may I assist you?", false);
  }, 100);

  // Focus input
  input.focus();
}