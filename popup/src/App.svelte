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

  async function checkout() {
    console.log("Debug: checkout() called");

    try {
      const res = await fetch('http://localhost:4242/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const text = await res.text();
      const session = JSON.parse(text);
      console.log("Stripe session created:", session);

      const checkoutTab = window.open(session.url, '_blank');

      // Check when tab is closed, then show a fake success alert
      const poll = setInterval(() => {
        if (checkoutTab.closed) {
          clearInterval(poll);
          alert("✅ Payment assumed successful!"); // No redirect needed
        }
      }, 500);
    } catch (err) {
      console.error("Error starting checkout:", err);
      alert("❌ Error launching payment.");
    }
  }
</script>

{#if isAuthenticated}
  <p class="auth-message">Welcome, {username} 👋</p>
  <button on:click={logout}>Logout</button>
  <button on:click={checkout}>Buy Test Product ($20)</button>
{:else}
  <p class="auth-message">Please log in to use the extension.</p>
  <button on:click={login}>Login</button>
{/if}
