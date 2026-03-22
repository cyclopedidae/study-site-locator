document.getElementById("run").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(
                tabs[0].id, 
                { action: "read_body" },
                (response) => {
                    console.log("Popup got:", response);
                }
            );
    });
});