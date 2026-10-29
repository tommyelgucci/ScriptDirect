import { isTauriRuntime } from './shared/fs/capability'

// Only the production web build gets a service worker; the Tauri shell already
// ships its assets locally and dev mode must never serve stale cached files.
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || isTauriRuntime() || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Offline support is an enhancement; the app works without it.
    })
  })
}
