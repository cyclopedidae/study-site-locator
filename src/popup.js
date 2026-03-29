const buttonManRun = document.getElementById("run-manual");
const extensionToggle = document.getElementById("toggle-extension");

const params = { active: true, currentWindow: true };
const storage = chrome.storage.local; // single storage point

// ----- LISTENERS  -----
buttonManRun.addEventListener("click", () => {
    chrome.tabs.query(params, (tabs) => {
        extractText(tabs);
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

// ----- HELPER FUNCTIONS  -----
// Description: extracts all visible text
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