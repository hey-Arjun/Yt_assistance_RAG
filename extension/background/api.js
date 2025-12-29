import  { getClientId } from "./clientId.js";

const BACKEND_URL = "http://127.0.0.1:8000/ask";

export async function askBackend({video_id, question}) {
    const client_id = await fetch(BACKEND_URL, {
        "method": "POST",
        "headers": JSON.stringify({ cliet_id, video_id, question })
    });

    if (!res.ok) throw new Error("Backend error");
    return res.json();
}