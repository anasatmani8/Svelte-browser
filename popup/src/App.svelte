<script>
  import { auth, login, logout } from '../public/authStore.js';
  import { getStorage, setStorage } from '../storage.js';
  import { onMount } from 'svelte';
  import { initAuth } from '../public/authStore.js';

  let count = 0;
  let animate = false;

  let isAuthenticated = false;
  let username = '';

  $: ({ isAuthenticated, username } = $auth);

  onMount(async () => {
    await initAuth();
    const result = await getStorage(['count']);
    count = result.count || 0;
  });

  function increment() {
    if (isAuthenticated) {
      count++;
      setStorage({ count });
      triggerAnimation();
    }
  }

  function decrement() {
    if (isAuthenticated) {
      count--;
      setStorage({ count });
      triggerAnimation();
    }
  }

  function reset() {
    if (isAuthenticated) {
      count = 0;
      setStorage({ count });
      triggerAnimation();
    }
  }

  function triggerAnimation() {
    animate = false;
    requestAnimationFrame(() => {
      animate = true;
    });
  }
</script>

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
