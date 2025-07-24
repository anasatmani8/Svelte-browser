import { writable } from 'svelte/store';
import browser from 'webextension-polyfill';

export const auth = writable({
  isAuthenticated: false,
  username: '',
  token: '',
  roles: []
});

const redirectUri = browser.identity.getRedirectURL('callback');
console.log('Redirect URI:', redirectUri);

const keycloakConfig = {
  url: 'http://localhost:8080',
  realm: 'my-extension',
  clientId: 'svelte-extension',
  redirectUri,
};

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
  try {
    const authUrl = getAuthUrl();
    const redirectUrl = await browser.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true
    });

    if (!redirectUrl) {
      throw new Error('User cancelled login or no redirect URL returned');
    }

    console.log('🔁 Redirect URL returned:', redirectUrl);

    const fragment = new URL(redirectUrl).hash.substring(1);
    const params = new URLSearchParams(fragment);
    const token = params.get('access_token');
    const idToken = params.get('id_token');

    if (!token || token.split('.').length !== 3) {
      throw new Error('Access token not found or malformed in redirect URL');
    }

    const payload = JSON.parse(atob(token.split('.')[1]));
    const username = payload?.preferred_username || 'unknown';
    const roles = payload?.realm_access?.roles || [];

    console.log('👤 Logged in as:', username);
    console.log('🔐 Roles:', roles);

    auth.set({ isAuthenticated: true, username, token, roles });

    await browser.storage.local.set({ token });
    console.log('Token stored successfully');

    return token;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

export async function logout() {
  auth.set({ isAuthenticated: false, username: '', token: '', roles: [] });
  try {
    await browser.storage.local.remove('token');
    console.log('Token removed from storage');
  } catch (err) {
    console.warn('Failed to remove token:', err);
  }
}

export async function initAuth() {
  try {
    const result = await browser.storage.local.get('token');
    console.log('initAuth storage result:', result);
    const token = result.token;

    if (token && typeof token === 'string' && token.split('.').length === 3) {
  const payload = JSON.parse(atob(token.split('.')[1]));
      const username = payload?.preferred_username || '';
      const roles = payload?.realm_access?.roles || [];
      auth.set({ isAuthenticated: true, username, token, roles });
      console.log('Auth session restored for', username);
      console.log(' Roles:', roles);
      return true;
    }
  } catch (err) {
    console.error('Invalid token in storage', err);
    await logout();
  }
  return false;
}

export function getToken() {
  let currentToken;
  const unsubscribe = auth.subscribe(state => currentToken = state.token);
  unsubscribe();
  return currentToken;
}
