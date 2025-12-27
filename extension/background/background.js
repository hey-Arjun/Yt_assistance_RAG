chrome.runtime.onInstalled.addListener(()=>{
    chrome.storage.local.get("client_id",(result)=> {
        if(!result.client_id){
            const clientId = crypto.randomUUID();
            chrome.storage.local.set({client_id: clientId})
        }
    })
})