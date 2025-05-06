
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message === 'reload-extension') {
      chrome.runtime.reload();
    }
  });
  chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed and background script running.");
  });
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'KEYCLOAK_TOKEN') {
      chrome.storage.local.set({ token: message.token });
      console.log('Received token from redirect page:', message.token);
    }
  });
  