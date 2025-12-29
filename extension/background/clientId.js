export function ensureClientId() {
    chrome.storage.local.get("client_id", (result) => {
        if(!result.client_id){
            chrome.storage.local.set({ client_id: crypto.randomUUID() });
        }
    });
}

export function getClientId() {
    return new Promise((resolve) => {
        chrome.storage.local.get("client_id", (r) => resolve(r.client_id));
    });
}