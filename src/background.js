let creating; // global promise to avoid concurrency issues for offscreen
const extractedTabs = {}; //   url: url, done: boolean

// ----- LISTENERS  -----

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

// ----- HELPER FUNCTIONS  -----

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
      host === "springer.com"
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

  // already extracted for this exact page
  if (record && record.url === url && record.done) {
    return;
  }

  try {
    await chrome.tabs.sendMessage(tabId, { action: "extract_text" });

    extractedTabs[tabId] = {
      url: url,
      done: true
    };
  } catch (err) {
    console.log(`Could not message tab ${url}:`, err);
  }
}