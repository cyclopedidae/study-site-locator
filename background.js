// service worker

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "send_raw_body") {
    text = message.data
    console.log(text)
    sendResponse({ status: "received" })
    return true;
  }
});