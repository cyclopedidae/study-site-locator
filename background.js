// service worker

const extensions = 'https://developer.chrome.com/docs/extensions';
const webstore = 'https://developer.chrome.com/docs/webstore';

chrome.runtime.onInstalled.addListener(() => {
    chrome.action.setBadgeText({
        text: "HI",
    });
});

chrome.action.onClicked.addListener( async (tab) => {
    if (tab.url.startsWith(extensions) || tab.url.startsWith(webstore)) {
        // Retrieve action badge to check if extension is 'ON' or 'OFF'
        const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
        // Next state is always the opposite
        const nextState = prevState === 'ON' ? 'OFF' : 'ON';
        
        // Set action badge to next state
        await chrome.action.setBadgeText( {
            tabId: tab.id,
            text: nextState,
        });
    }

    if (nextState === "ON") {
      // Insert the CSS file when the user turns the extension on
      await chrome.scripting.insertCSS({
        files: ["focus-mode.css"],
        target: { tabId: tab.id },
      });
    } else if (nextState === "OFF") {
      // Remove the CSS file when the user turns the extension off
      await chrome.scripting.removeCSS({
        files: ["focus-mode.css"],
        target: { tabId: tab.id },
      });
    }
  });