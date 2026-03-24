import { findEntities } from './modules/nlp.js';
import { getPortionedChunks } from './modules/textProcessing.js'

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "send_raw_body") {
    const body = request.data;
    const portionedChunks = getPortionedChunks(body);

    (async () => {
      try {
        const entities = await findEntities(portionedChunks);

        sendResponse({ status: "received", entities });

      } catch (err) {
        console.error("Background failed:", err);
        sendResponse({ status: "error", error: err.toString() });
      }
    })();
    sendResponse({ status: "made it to backend" })
  }
});