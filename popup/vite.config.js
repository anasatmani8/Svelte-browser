import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

function reloadExtensionPlugin() {
  return {
    name: 'reload-extension',
    apply: 'serve',
    configureServer(server) {
      server.watcher.on('change', () => {
        server.ws.send({
          type: 'custom',
          event: 'reload-extension'
        });
      });
    }
  };
}




export default defineConfig({
  plugins: [svelte(), reloadExtensionPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  },
  base: './'
});
