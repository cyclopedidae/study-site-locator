import { highlightPhrase } from './modules/highlightRange.js';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "read_body") {

        const body = document.body.innerText;

        chrome.runtime.sendMessage(
            { action: 'send_raw_body', data: body }, 
            (response) => {
                sendResponse({ status: "ok", bgResponse: response })
        });
        // highlightPhrase("Netherlands Organization");
        return true;
    }
});