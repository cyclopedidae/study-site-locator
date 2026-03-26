import { getPortionedChunks } from './modules/textProcessing.js'

let creating; // global promise to avoid concurrency issues

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyze_text") {

    (async() => {
      try {
        await setupOffscreenDocument("offscreen.html");
        
        const result = await chrome.runtime.sendMessage({ action: 'run_ner', data: request.data });

        sendResponse({ status: "ok", data: result});
      } catch (err) {
        console.error("Background call to NER failed.", err);
        sendResponse({ status: "error", message: err.message });
      }
    })();

    return true;
  }
});

async function setupOffscreenDocument(path) {
  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({ 
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });

  // only one may exist
  if (existingContexts.length > 0) return;

  // create offscreen document
  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: ['WORKERS'],
      justification: 'Run NER to avoid web interactivity',
    });

    await creating;
    creating = null;
  }
}