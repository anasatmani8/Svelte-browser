import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'my-extension',
  clientId: 'svelte-extension'
});

export async function initKeycloak() {
  try {
    const authenticated = await keycloak.init({
      pkceMethod: 'S256',
      checkLoginIframe: false,
      onLoad: 'check-sso', // not login-required
    });

    if (!authenticated) {
      // Try login with popup (no redirect)
      await keycloak.login({ prompt: 'login' });
    }

    console.log("Authenticated:", authenticated);
    console.log("Token:", keycloak.token);

    return keycloak;
  } catch (err) {
    console.error("Keycloak init failed:", err);
    return null;
  }
}
 