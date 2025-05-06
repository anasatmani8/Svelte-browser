<script>
import { getStorage, setStorage } from '../storage.js';
import Keycloak from 'keycloak-js';

let count = 0;
let animate = false;
let isAuthenticated = false;
let username = '';

const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'my-extension',
  clientId: 'svelte-extension',
});

async function initAuth() {
  try {
    const authenticated = await keycloak.init({
      pkceMethod: 'S256',
      onLoad: 'check-sso',
      checkLoginIframe: false, // Prevents the iframe login check from firing
    });

    if (!authenticated) {
      await keycloak.login({ prompt: 'login' });
    }

    isAuthenticated = true;
    username = keycloak.tokenParsed?.preferred_username || '';

    // Load existing count from storage
    const result = await getStorage(['count']);
    if (result.count !== undefined) {
      count = result.count;
    }
  } catch (error) {
    console.error('Keycloak init/login failed:', error);
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
    </div>
  {:else}
    <p class="auth-message">Please log in to use the extension.</p>
  {/if}
</div>
