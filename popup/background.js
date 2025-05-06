
chrome.runtime.onInstalled.addListener(() => {
  console.log("Svelte Hello World Extension Installed");

  chrome.storage.local.set({ key: 'value' }, () => {
    console.log('Stored value in local storage');
  });
});
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed and background script running.");
});

