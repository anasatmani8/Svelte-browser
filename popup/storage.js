// Safe reference to the browser storage API
const storage = 
  typeof browser !== 'undefined' && browser.storage?.local
    ? browser.storage.local
    : typeof chrome !== 'undefined' && chrome.storage?.local
      ? chrome.storage.local
      : {
          get: (keys, cb) => cb({}), // fallback mock
          set: (items, cb) => cb(),
        };

export function getStorage(keys) {
  return new Promise((resolve, reject) => {
    storage.get(keys, (result) => {
      if (chrome.runtime?.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result);
      }
    });
  });
}

export function setStorage(items) {
  return new Promise((resolve, reject) => {
    storage.set(items, () => {
      if (chrome.runtime?.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}
