import { highlightPhrase } from './modules/highlightRange.js';
import { getPortionedChunks } from './modules/textProcessing.js'

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extract_text") {

        const body = document.body.innerText;
        const chunks = getPortionedChunks(body);

        chrome.runtime.sendMessage(
            { action: 'analyze_text', data: chunks }, // sending chunked body through array
            (response) => {
                sendResponse({ status: "ok", bgResponse: response })
        });

        return true;
    }
});