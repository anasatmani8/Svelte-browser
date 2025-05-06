<script>
  import { getStorage, setStorage } from '../storage.js';
  import Keycloak from 'keycloak-js';

  let count = 0;
  let animate = false;
  let isAuthenticated = false;
  let username = '';
  let token = '';

  const keycloak = new Keycloak({
    url: 'http://localhost:8080',
    realm: 'my-extension',
    clientId: 'svelte-extension',
  });

  async function initAuth() {
    console.log("Initializing Keycloak...");

    try {
      const authenticated = await keycloak.init({
        pkceMethod: 'S256',
        onLoad: 'check-sso',
        checkLoginIframe: false,
        redirectUri: 'https://serene-phoenix-3d7aa7.netlify.app/redirect.html'
      });

      console.log("Keycloak authenticated:", authenticated);

      if (authenticated) {
        isAuthenticated = true;
        username = keycloak.tokenParsed?.preferred_username || '';
        token = keycloak.token;
        chrome.storage.local.set({ token });

        console.log("User authenticated:", username);

        const result = await getStorage(['count']);
        if (result.count !== undefined) {
          count = result.count;
        }
      } else {
        console.log("User not authenticated.");
      }
    } catch (error) {
      console.error("Keycloak init error:", error);
    }
  }

  async function login() {
  try {
    const loginUrl = await keycloak.createLoginUrl({
      redirectUri: 'https://serene-phoenix-3d7aa7.netlify.app/redirect.html',
      prompt: 'login',
    });

    chrome.tabs.create({ url: loginUrl });
  } catch (error) {
    console.error("Login failed:", error);
  }
}



  async function logout() {
    try {
      await keycloak.logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  initAuth();

  function triggerAnimation() {
    animate = false;
    requestAnimationFrame(() => {
      animate = true;
    });
  }

  function increment() {
    if (isAuthenticated) {
      count++;
      setStorage({ count }).catch(console.error);
      triggerAnimation();
    }
  }

  function decrement() {
    if (isAuthenticated) {
      count--;
      setStorage({ count }).catch(console.error);
      triggerAnimation();
    }
  }

  function reset() {
    if (isAuthenticated) {
      count = 0;
      setStorage({ count }).catch(console.error);
      triggerAnimation();
    }
  }

  // Listen to messages from redirect.html
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'KEYCLOAK_TOKEN') {
      token = message.token;
      isAuthenticated = true;
      chrome.storage.local.set({ token });
      console.log('Token received from redirect page');
    }
  });

  if (import.meta.env.MODE === 'development') {
    const socket = new WebSocket('ws://localhost:5173');
    socket.addEventListener('message', (event) => {
      if (event.data === 'reload-extension') {
        chrome.runtime?.sendMessage('reload-extension');
      }
    });
  }
</script>

<style>
  /* unchanged CSS */
</style>

<div class="container">
  <div class="title">Counter Extension</div>

  {#if isAuthenticated}
    <div class="count" class:animate>{count}</div>
    <div class="buttons">
      <button on:click={increment}>+1</button>
      <button on:click={decrement}>-1</button>
      <button on:click={reset} class="reset-btn">Reset</button>
      <button on:click={logout}>Logout</button>
    </div>
  {:else}
    <p class="auth-message">Please log in to use the extension.</p>
    <button on:click={login}>Login</button>
  {/if}
</div>
