import { getVideoID } from "../utils/youtube.js";

export function initChat(panel) {
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
    avatar.style.fontSize = "14px";
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
    textDiv.style.whiteSpace = "pre-wrap";
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(textDiv);
    chatContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
  
  async function sendToBackend(videoId, question) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: "ASK_VIDEO",
          video_id: videoId,
          question
        },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          
          if (!response || !response.ok) {
            reject(new Error(response?.error || "Backend error"));
            return;
          }
          
          resolve(response.data);
        }
      );
    });
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
    avatar.style.fontSize = "14px";
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

      const result = await sendToBackend(videoId, question);
      
      // Replace thinking message with actual response
      textDiv.textContent = result.answer;
      textDiv.style.color = "#fff";
      
      // Add remaining queries if available
      if (result.remaining_queries !== undefined) {
        textDiv.textContent += `\n\nRemaining today: ${result.remaining_queries}`;
      }
    } catch (err) {
      // Replace thinking message with error
      textDiv.textContent = `❌ ${err.message || "Error connecting to server"}`;
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

  // Add initial welcome message only if chat is empty
  if (!chatContainer.hasChildNodes()) {
    setTimeout(() => {
      addMessage("Hello! I'm your YouTube Assistant. You can ask me about this video's content, request summaries, or get explanations about specific topics mentioned. How may I assist you?", false);
    }, 100);
  }

  // Focus input
  input.focus();

  // Return the addMessage function in case panel needs it
  return { addMessage, sendMessage };
}