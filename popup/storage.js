const api = (typeof browser !== 'undefined' && browser.storage) ? browser
          : (typeof chrome !== 'undefined' && chrome.storage) ? chrome
          : {
              storage: {
                local: {
                  get: (keys, cb) => cb({}), // mock get
                  set: (items, cb) => cb(),  // mock set
                }
              }
            };



export function getStorage(keys) {
  return new Promise((resolve, reject) => {
    if (!api?.storage?.local) {
      return reject(new Error("Storage API not available."));
    }

    api.storage.local.get(keys, (result) => {
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
    api.storage.local.set(items, () => {
      if (chrome.runtime?.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}
