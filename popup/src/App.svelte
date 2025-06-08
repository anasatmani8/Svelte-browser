<script>
  import { auth, login, logout, initAuth } from '../public/authStore.js';
  import { onMount } from 'svelte';

  let isAuthenticated = false;
  let username = '';

  $: ({ isAuthenticated, username } = $auth);

  onMount(async () => {
    await initAuth();
  });

  $: if (isAuthenticated && username) {
    alert(`👋 Hello ${username}`);
  }
</script>

<div class="container">
  <div class="title">Svelte Extension</div>

  {#if isAuthenticated}
    <p class="auth-message">Welcome, {username} 👋</p>
    <button on:click={logout}>Logout</button>
  {:else}
    <p class="auth-message">Please log in to use the extension.</p>
    <button on:click={login}>Login</button>
  {/if}
</div>
