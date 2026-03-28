import { askBackendStream } from "./api.js";

// background/background.js
chrome.runtime.onConnect.addListener((port) => {
    console.log("Port Connected:", port.name); // Check if this prints in the Service Worker console
    
    port.onMessage.addListener(async (msg) => {
        console.log("Message received in background:", msg);
        
        if (msg.type === "START_STREAM") {
            try {
                // IMPORTANT: Ensure askBackendStream is actually imported and called
                await askBackendStream(msg.payload, (chunk) => {
                    port.postMessage({ type: "CHUNK", text: chunk });
                });
                port.postMessage({ type: "DONE" });
            } catch (err) {
                console.error("Streaming Error:", err);
                port.postMessage({ type: "ERROR", error: err.message });
            }
        }
    });
});