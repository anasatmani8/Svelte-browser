import { writable } from 'svelte/store';

//Svelte store to track authentication state ===
export const auth = writable({
  isAuthenticated: false,
  username: '',
  token: '',
});


const redirectUri = (typeof chrome !== 'undefined' && chrome.identity && chrome.identity.getRedirectURL)
  ? chrome.identity.getRedirectURL('callback')
  : 'http://localhost:5173/callback';  // fallback for local dev/testing

const keycloakConfig = {
  url: 'http://localhost:8080',  
  realm: 'my-extension',        
  clientId: 'svelte-extension',  
  redirectUri,
};

// Generate authorization URL
function generateNonce(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map(x => chars[x % chars.length])
    .join('');
}

function getAuthUrl() {
  const redirectUri = chrome.identity.getRedirectURL('callback');
  const nonce = generateNonce(); 

  const authUrl = `http://localhost:8080/realms/my-extension/protocol/openid-connect/auth` +
    `?client_id=svelte-extension` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=token id_token` +
    `&scope=openid profile` +
    `&nonce=${nonce}` + 
    `&prompt=login`;

  console.log("🔗 Auth URL:", authUrl);
  return authUrl;
}


//  Login function with chrome.identity check
export async function login() {
  return new Promise((resolve, reject) => {

    if (typeof chrome === 'undefined' || !chrome.identity || !chrome.identity.launchWebAuthFlow) {
      reject('chrome.identity.launchWebAuthFlow is not available. Are you running inside the extension?');
      return;
    }


    chrome.identity.launchWebAuthFlow(
      {
        url: getAuthUrl(),
        interactive: true,
      },
      (redirectUrl) => {

        if (chrome.runtime.lastError) {
          console.error('Login failed:', chrome.runtime.lastError.message);
          reject(chrome.runtime.lastError.message);
          return;
        }

        if (!redirectUrl) {
          console.error('No redirect URL returned');
          reject('No redirect URL returned');
          return;
        }


        console.log('🔁 Redirect URL returned:', redirectUrl);

        try {

          const fragment = new URL(redirectUrl).hash.substring(1);
          const params = new URLSearchParams(fragment);
          const token = params.get('access_token');
          const idToken = params.get('id_token');


          console.log(' Access Token:', token);
          console.log(' ID Token:', idToken);

          if (!token) {
            console.error(' Access token not found in redirect URL');
            reject('Access token not found in redirect URL');
            return;
          }

          // Decode JWT payload (for username display/debug)
          const payload = JSON.parse(atob(token.split('.')[1]));
          const username = payload?.preferred_username || 'unknown';


          console.log('👤 Logged in as:', username);


          auth.set({ isAuthenticated: true, username, token });


          if (chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ token }, () => {
              if (chrome.runtime.lastError) {
                console.warn(' Failed to store token:', chrome.runtime.lastError.message);
              } else {
                console.log(' Token stored in chrome.storage.local');
              }
            });
          }

          resolve(token);
        } catch (error) {
          console.error(' Error processing login response:', error);
          reject(error.message || error);
        }
      }
    );
  });
}

// Logout function with safe chrome.storage removal 
export function logout() {
  auth.set({ isAuthenticated: false, username: '', token: '' });
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.remove('token', () => {
      if (chrome.runtime.lastError) {
        console.warn('Failed to remove token:', chrome.runtime.lastError.message);
      }
    });
  }
}

// Restore session from stored token safely 
export function initAuth() {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    console.warn('chrome.storage.local is not available, cannot restore auth session');
    return;
  }

  chrome.storage.local.get('token', (result) => {
    const token = result.token;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const username = payload?.preferred_username || '';
        auth.set({ isAuthenticated: true, username, token });
      } catch (err) {
        console.error('Invalid token in storage', err);
        logout();
      }
    }
  });
}
