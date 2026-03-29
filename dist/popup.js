/******/ (() => { // webpackBootstrap
/*!**********************!*\
  !*** ./src/popup.js ***!
  \**********************/
// manual run
const buttonManRun = document.getElementById("run-manual");

buttonManRun.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        extractText(tabs);
    });
});

async function extractText(tabs) {
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
/******/ })()
;
//# sourceMappingURL=popup.js.map