<script>
  import { auth, login, logout, initAuth } from '../public/authStore.js';
  import { onMount } from 'svelte';
console.log("✅ Svelte script loaded 1");

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
     const success_url = chrome.runtime.getURL('popup/success.html');
  const cancel_url = chrome.runtime.getURL('popup/cancel.html');

  console.log("✅ Checkout clicked");
  console.log("Success URL:", success_url);
  console.log("Cancel URL:", cancel_url);

  alert("Debug: checkout() called");
/*

    try {
      const res = await fetch('http://localhost:4242/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success_url, cancel_url })
      });

      const text = await res.text(); // Get response as text
      try {
        const session = JSON.parse(text); // Try to parse as JSON
        if (!session.url || !session.url.startsWith('https://')) {
          alert("⚠️ Stripe returned an invalid session URL.");
        } else {
          window.open(session.url, '_blank');
        }
      } catch (err) {
        console.error("❌ Failed to parse JSON:", text);
        alert("❌ Server error: response was not valid JSON.");
      }
    } catch (err) {
      console.error("❌ Network/server error:", err);
      alert("❌ Could not start checkout. Is the backend running?");
    }*/
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
