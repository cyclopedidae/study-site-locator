chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "read_body") {

        const text = document.body.innerText;
        chrome.runtime.sendMessage(
            { action: 'send_raw_body', data: text }, 
            (response) => {
                sendResponse({ status: "ok", bgResponse: response })
        });
        highlightPhrase("Netherlands Organization");
        return true;
    }
});