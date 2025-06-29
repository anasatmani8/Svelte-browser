import { writable } from 'svelte/store';

export const auth = writable({
  isAuthenticated: false,
  username: '',
  token: '',
  roles:[]
});

const redirectUri = (typeof chrome !== 'undefined' && chrome.identity && chrome.identity.getRedirectURL)
  ? chrome.identity.getRedirectURL('callback')
  : 'http://localhost:5173/callback';  

console.log('Redirect URI:', redirectUri);

const keycloakConfig = {
  url: 'http://localhost:8080',
  realm: 'my-extension',
  clientId: 'svelte-extension',
  redirectUri,
};

// we have to generate a random nonce for security, we gonna need it in the URL
function generateNonce(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map(x => chars[x % chars.length])
    .join('');
}

function getAuthUrl() {
  const nonce = generateNonce();
  const authUrl = `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/auth` +
    `?client_id=${encodeURIComponent(keycloakConfig.clientId)}` +
    `&redirect_uri=${encodeURIComponent(keycloakConfig.redirectUri)}` +
    `&response_type=token%20id_token` +
    `&scope=openid%20profile` +
    `&nonce=${encodeURIComponent(nonce)}` +
    `&prompt=login`;

  console.log("🔗 Auth URL:", authUrl);
  return authUrl;
}


export async function login() {
  return new Promise((resolve, reject) => {
    const identity = (typeof browser !== 'undefined' && browser.identity)
      || (typeof chrome !== 'undefined' && chrome.identity);

    const launchWebAuthFlow = identity?.launchWebAuthFlow?.bind(identity);

    if (!launchWebAuthFlow) {
      reject('WebAuthFlow is not available. Are you running inside the extension?');
      return;
    }

    const authUrl = getAuthUrl();

    launchWebAuthFlow({
      url: authUrl,
      interactive: true
    }).then((redirectUrl) => {
      if (!redirectUrl) {
        reject('User cancelled login or no redirect URL returned');
        return;
      }

      console.log('🔁 Redirect URL returned:', redirectUrl);

      try {
        const fragment = new URL(redirectUrl).hash.substring(1);
        const params = new URLSearchParams(fragment);
        const token = params.get('access_token');
        const idToken = params.get('id_token');

        if (!token || token.split('.').length !== 3) {
          reject('Access token not found or malformed in redirect URL');
          return;
        }

        const payload = JSON.parse(atob(token.split('.')[1]));
        const username = payload?.preferred_username || 'unknown';
        const roles = payload?.realm_access?.roles || [];

        console.log('👤 Logged in as:', username);
        console.log('🔐 Roles:', roles);

        auth.set({ isAuthenticated: true, username, token });

        if (chrome?.storage?.local) {
          chrome.storage.local.set({ token }, () => {
            if (chrome.runtime.lastError) {
              console.warn('Failed to store token:', chrome.runtime.lastError.message);
            } else {
              console.log('Token stored successfully');
            }
          });
        }

        resolve(token);
      } catch (error) {
        console.error('Error processing login response:', error);
        reject(error.message || error);
      }
    }).catch(err => {
      console.error('Login failed:', err);
      reject(err.message || err);
    });
  });
}

export function logout() {
  auth.set({ isAuthenticated: false, username: '', token: '' });
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.remove('token', () => {
      if (chrome.runtime.lastError) {
        console.warn('Failed to remove token:', chrome.runtime.lastError.message);
      } else {
        console.log('Token removed from storage');
      }
    });
  }
}

export function initAuth() {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      console.warn('chrome.storage.local is not available, cannot restore auth session');
      resolve(false);
      return;
    }

    chrome.storage.local.get('token', (result) => {
      console.log('initAuth storage result:', result);
      const token = result.token;
      if (token && token.split('.').length === 3) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const username = payload?.preferred_username || '';
          const roles = payload?.realm_access?.roles || [];
          auth.set({ isAuthenticated: true, username, token, roles });
          console.log('Auth session restored for', username);
          console.log(' Roles:', roles);
          resolve(true);
        } catch (err) {
          console.error('Invalid token in storage', err);
          logout();
          resolve(false);
        }
      } else {
        resolve(false);
      }
    });
  });
}

export function getToken() {
  let currentToken;
  const unsubscribe = auth.subscribe(state => currentToken = state.token);
  unsubscribe();
  return currentToken;
}
