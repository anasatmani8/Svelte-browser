// background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed.');
});

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
  chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.create({ url: "popup/dist/index.html" });
  });
  // src/background.js
/*export function createStripeUrl(sessionId) {
  return `https://checkout.stripe.com/pay/${sessionId}`;
}
*/