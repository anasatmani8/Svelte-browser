
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message === 'reload-extension') {
      chrome.runtime.reload();
    }
  });
  chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed and background script running.");
  });
  