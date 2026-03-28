import { getClientId } from "./clientId.js";

const BACKEND_URL = "http://127.0.0.1:8000/ask";

export async function askBackend({ video_id, question }) {
    // 1. Get the UUID for the client
    const client_id = await getClientId(); 
    
    // 2. Build the exact URL
    const video_url = `https://www.youtube.com/watch?v=${video_id}`;

    console.log("🚀 Sending Request to Backend...");

    const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
            video_id: video_id,   
            video_url: video_url, 
            question: question,   
            client_id: client_id  
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        // This will now show you if any fields are still missing/wrong
        throw new Error(errorData.detail?.[0]?.msg || "Backend validation error");
    }

    return response.json();
}

// Add this new function to your api.js
export async function askBackendStream({ video_id, question }, onChunk) {
    const client_id = await getClientId();
    const video_url = `https://www.youtube.com/watch?v=${video_id}`;

    const response = await fetch("http://127.0.0.1:8000/ask-stream", { // Note the new endpoint
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_id, video_url, question, client_id })
    });

    if (!response.ok) throw new Error("Stream connection failed");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        onChunk(chunk); 
    }
}