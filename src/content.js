import { highlightPhrase } from './modules/highlightRange.js';
import { getPortionedChunks } from './modules/textProcessing.js'
import { findEntities } from './modules/nlp.js'

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "read_body") {

        const body = document.body.innerText;
        const chunks = getPortionedChunks(body);

        findEntities(chunks)
        .then((result) => {
            sendResponse({ status: "ok", entities: result });
        })
        .catch((error) => {
            console.error(error);
            sendResponse({ status: "error", message: error.message });
        });

        return true;

        chrome.runtime.sendMessage(
            { action: 'send_raw_body', data: "nothing yet" }, // nothing sent to backend yet
            (response) => {
                sendResponse({ status: "ok", bgResponse: response })
        });
    }
});