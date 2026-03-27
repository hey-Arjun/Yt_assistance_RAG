export function getClientId() {
    return new Promise((resolve) => {
        Chrome.storage.local.get("client_id", (r) => {
            if(r.client_id) return resolve(r.client_id);
            const id = crypto.randomUUID();
            chrome.storage.local.set({ client_id: id}, () => resolve(id));
        });
    });
}