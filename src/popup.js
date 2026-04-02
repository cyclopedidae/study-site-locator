const buttonManRun = document.getElementById("run-manual");
const buttonPrev = document.getElementById("prev-highlight");
const buttonNext = document.getElementById("next-highlight");
const extensionToggle = document.getElementById("toggle-extension");

const params = { active: true, currentWindow: true };
const storage = chrome.storage.local;

// ----- LISTENERS -----
buttonManRun.addEventListener("click", () => {
  chrome.tabs.query(params, (tabs) => {
    extractText(tabs);
  });
});

buttonPrev.addEventListener("click", () => {
  chrome.tabs.query(params, (tabs) => {
    sendNavCommand(tabs, "previous_highlight");
  });
});

buttonNext.addEventListener("click", () => {
  chrome.tabs.query(params, (tabs) => {
    sendNavCommand(tabs, "next_highlight");
  });
});

extensionToggle.addEventListener("change", async (event) => {
  const enabled = event.target.checked;
  await storage.set({ autoExtractEnabled: enabled });
});

document.addEventListener("DOMContentLoaded", async () => {
  const { autoExtractEnabled = false } =
    await storage.get("autoExtractEnabled");

  extensionToggle.checked = autoExtractEnabled;
});

// ----- HELPER FUNCTIONS -----
function extractText(tabs) {
  chrome.tabs.sendMessage(
    tabs[0].id,
    { action: "extract_text" },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error("Popup sendMessage error:", chrome.runtime.lastError.message);
        return;
      }
      console.log("Popup got:", response);
    }
  );
}

function sendNavCommand(tabs, action) {
  chrome.tabs.sendMessage(
    tabs[0].id,
    { action },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error("Popup sendMessage error:", chrome.runtime.lastError.message);
        return;
      }
      console.log("Popup got:", response);
    }
  );
}