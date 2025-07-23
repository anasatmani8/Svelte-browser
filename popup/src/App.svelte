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
    
    const success_url = 'https://laizee.ai/'; //for testing
    const cancel_url = 'chrome-extension://cnaohkmeakmelnlilfehmmcefkdkihfc/popup/cancel.html';//  in our case we use test card that are
                                                                                               // always correct so there's no cancel page

    console.log('✅ success_url:', success_url); // Should start with chrome-extension:// but Stripe block the chrome 
                                                 // extensions due to security that's why am using the Laizee project for the instant
    

    try {
      const res = await fetch('http://localhost:4242/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success_url, cancel_url })
      });

      const text = await res.text(); 
      try {
        const session = JSON.parse(text); 
        if (!session.url || !session.url.startsWith('https://')) {
          alert(" Stripe returned an invalid session URL.");
        } else {
          window.open(session.url, '_blank');
        }
      } catch (err) {
        console.error(" Failed to parse JSON:", text);
        alert(" Server error: response was not valid JSON.");
      }
    } catch (err) {
      console.error(" Network/server error:", err);
      alert(" Could not start checkout. Is the backend running?");
    }
  }
</script>

{#if isAuthenticated}
  <p class="auth-message">Welcome, {username} 👋</p>
  <button on:click={logout}>Logout</button>
  {#if  $auth.roles.includes('active_subscription')}
  <button on:click={checkout}>Buy Test Product ($20)</button>
  {:else}
  <p>You are not authorized to view this section.</p>
{/if}

{:else}
  <p class="auth-message">Please log in to use the extension.</p>
  <button on:click={login}>Login</button>
{/if}
