let creating; // global promise to avoid concurrency issues for offscreen
const extractedTabs = {}; // tabId -> { url, done }

// ----- LISTENERS -----

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyze_text") {
    (async () => {
      try {
        console.log("[BACKGROUND] analyze_text received");
        console.log("[BACKGROUND] Incoming blocks:", request.data);

        await setupOffscreenDocument("offscreen.html");
        console.log("[BACKGROUND] Offscreen document ready");

        const result = await chrome.runtime.sendMessage({
          action: 'run_ner',
          data: request.data,
          tabId: sender.tab?.id ?? null
        });

        console.log("[BACKGROUND] Final NER result from offscreen:", result);

        sendResponse({ status: "ok", data: result });
      } catch (err) {
        console.error("[BACKGROUND] Call to NER failed:", err);
        sendResponse({ status: "error", message: err.message });
      }
    })();

    return true;
  }

  if (request.action === "stream_ner_match") {
    (async () => {
      try {
        const tabId = request.tabId;

        if (typeof tabId !== "number") {
          console.warn("[BACKGROUND] Missing tabId for streamed match:", request);
          sendResponse({ status: "missing_tabId" });
          return;
        }

        await chrome.tabs.sendMessage(tabId, {
          action: "ner_match_found",
          match: request.match
        });

        sendResponse({ status: "ok" });
      } catch (err) {
        console.error("[BACKGROUND] Failed to relay streamed match:", err);
        sendResponse({ status: "error", message: err.message });
      }
    })();

    return true;
  }
});

// ----- HELPER FUNCTIONS -----

async function setupOffscreenDocument(path) {
  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) {
    console.log("[BACKGROUND] Offscreen document already exists");
    return;
  }

  if (creating) {
    console.log("[BACKGROUND] Awaiting existing offscreen creation...");
    await creating;
  } else {
    console.log("[BACKGROUND] Creating offscreen document...");
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: ['WORKERS'],
      justification: 'Run NER to avoid web interactivity',
    });

    await creating;
    creating = null;
    console.log("[BACKGROUND] Offscreen document created");
  }
}