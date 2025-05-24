// background.js
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed.');
});
  
chrome.runtime.onInstalled.addListener(() => {
  console.log("Svelte Hello World Extension Installed");

  chrome.storage.local.set({ key: 'value' }, () => {
    console.log('Stored value in local storage');
  });
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
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({ url: "popup/dist/index.html" });
});
