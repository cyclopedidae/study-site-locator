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

// Fires on reloads, URL changes, navigation progress.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    extractedTabs[tabId] = {
      url: changeInfo.url,
      done: false
    };
  }

  if (changeInfo.status === "complete") {
    await maybeExtract(tabId, tab.url);
  }
});

// Fires when the user switches tabs.
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  await maybeExtract(tab.id, tab.url);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  delete extractedTabs[tabId];
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

async function isAutoExtractEnabled() {
  const { autoExtractEnabled: enabled = false } =
    await chrome.storage.local.get("autoExtractEnabled");

  return enabled;
}

function isAcceptedUrl(urlString) {
  if (!urlString) return false;

  try {
    const url = new URL(urlString);
    const host = url.hostname;

    return (
      host === "pubmed.ncbi.nlm.nih.gov" ||
      host === "pmc.ncbi.nlm.nih.gov" ||
      host === "nature.com" ||
      host.endsWith(".nature.com") ||
      host === "frontiersin.org" ||
      host === "springer.com" ||
      host.endsWith(".springer.com")
    );
  } catch {
    return false;
  }
}

async function maybeExtract(tabId, url) {
  if (!tabId || !url) return;
  if (!isAcceptedUrl(url)) return;
  if (!(await isAutoExtractEnabled())) return;

  const record = extractedTabs[tabId];

  if (record && record.url === url && record.done) {
    console.log("[BACKGROUND] Already extracted for this page:", url);
    return;
  }

  try {
    console.log("[BACKGROUND] Triggering extract_text for:", url);

    await chrome.tabs.sendMessage(tabId, { action: "extract_text" });

    extractedTabs[tabId] = {
      url: url,
      done: true
    };

    console.log("[BACKGROUND] Extraction marked done for:", url);
  } catch (err) {
    console.log(`[BACKGROUND] Could not message tab ${url}:`, err);
  }
}