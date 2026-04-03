const buttonManRun = document.getElementById("run-manual");
const buttonPrev = document.getElementById("prev-highlight");
const buttonNext = document.getElementById("next-highlight");

const params = { active: true, currentWindow: true };

let statusPoller = null;
let isRunLocked = false;
const defaultRunLabel = buttonManRun.textContent || "Find Location";

// ----- LISTENERS -----
buttonManRun.addEventListener("click", () => {
  if (isRunLocked) return;

  chrome.tabs.query(params, (tabs) => {
    const tab = tabs?.[0];
    if (!tab?.id) return;

    lockRunButton();

    chrome.tabs.sendMessage(
      tab.id,
      { action: "extract_text" },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("Popup sendMessage error:", chrome.runtime.lastError.message);
          unlockRunButton();
          return;
        }

        console.log("Popup got:", response);
        startStatusPolling(tab.id);
      }
    );
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

// ----- HELPER FUNCTIONS -----
function lockRunButton() {
  isRunLocked = true;
  buttonManRun.disabled = true;
  buttonManRun.textContent = "Running...";
}

function unlockRunButton() {
  isRunLocked = false;
  buttonManRun.disabled = false;
  buttonManRun.textContent = defaultRunLabel;
}

function startStatusPolling(tabId) {
  stopStatusPolling();

  statusPoller = setInterval(() => {
    chrome.tabs.sendMessage(
      tabId,
      { action: "get_extraction_status" },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("Popup status poll error:", chrome.runtime.lastError.message);
          stopStatusPolling();
          unlockRunButton();
          return;
        }

        if (!response?.running) {
          stopStatusPolling();
          unlockRunButton();
        }
      }
    );
  }, 500);
}

function stopStatusPolling() {
  if (statusPoller) {
    clearInterval(statusPoller);
    statusPoller = null;
  }
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