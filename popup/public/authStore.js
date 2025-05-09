import { writable } from 'svelte/store';
import Keycloak from 'keycloak-js';

export const auth = writable({
  isAuthenticated: false,
  username: '',
  token: '',
});

const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'my-extension',
  clientId: 'svelte-extension',
});

export async function initAuth() {
  console.log('initAuth function');

  try {
    const authenticated = await keycloak.init({
      pkceMethod: 'S256',
      onLoad: 'login-required',
      checkLoginIframe: false
    });

    if (authenticated) {
      console.log("✅ Already authenticated");
      auth.set({
        isAuthenticated: true,
        username: keycloak.tokenParsed?.preferred_username || '',
        token: keycloak.token,
      });

      // Store token in chrome storage with error handling
      chrome.storage.local.set({ token: keycloak.token }, () => {
        if (chrome.runtime.lastError) {
          console.error("Failed to set token in storage:", chrome.runtime.lastError);
        } else {
          console.log("Token stored successfully in chrome storage.");
        }
      });
    }
  } catch (error) {
    console.error('Auth init failed', error?.message || error);
  }
}

export async function login() {
  console.log('login function');
  try {
    await keycloak.login({
      prompt: 'login' // open login popup (no redirect)
    });
  } catch (error) {
    console.error('Login failed:', error);
  }
}

export async function logout() {
  try {
    await keycloak.logout();
    auth.set({ isAuthenticated: false, username: '', token: '' });

    // Clear the token from chrome storage on logout
    chrome.storage.local.remove('token', () => {
      if (chrome.runtime.lastError) {
        console.error("Failed to remove token from storage:", chrome.runtime.lastError);
      } else {
        console.log("Token removed from chrome storage.");
      }
    });
  } catch (error) {
    console.error('Logout failed:', error);
  }
}
