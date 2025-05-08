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
      onLoad: 'check-sso',
      checkLoginIframe: false,
      redirectUri: 'https://serene-phoenix-3d7aa7.netlify.app/redirect.html'
    });

    if (authenticated) {
      auth.set({
        isAuthenticated: true,
        username: keycloak.tokenParsed?.preferred_username || '',
        token: keycloak.token,
      });

      chrome.storage.local.set({ token: keycloak.token });
    }
  } catch (error) {
    console.error('Auth init failed', error);
  }
}

export async function login() {
  console.log('login function');
  try {
    const loginUrl = await keycloak.createLoginUrl({
      redirectUri: 'https://serene-phoenix-3d7aa7.netlify.app/redirect.html',
      prompt: 'login',
    });

    chrome.tabs.create({ url: loginUrl });
  } catch (error) {
    console.error('Login failed:', error);
  }
}

export async function logout() {
  try {
    await keycloak.logout();
    auth.set({ isAuthenticated: false, username: '', token: '' });
  } catch (error) {
    console.error('Logout failed:', error);
  }
}
