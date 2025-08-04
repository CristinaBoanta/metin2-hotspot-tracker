// Service Worker Registration Utility
class ServiceWorkerManager {
  constructor() {
    this.registration = null;
    this.isSupported = 'serviceWorker' in navigator;
  }

  async register() {
    if (!this.isSupported) {
      console.warn('Service Worker not supported in this browser');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', this.registration);

      // Listen for service worker updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New service worker available');
            // You could show a notification to the user to refresh
          }
        });
      });

      // Handle service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'HOTSPOT_ACTIVE') {
          console.log('Received hotspot notification from service worker');
          // Dispatch a custom event that the main app can listen to
          window.dispatchEvent(new CustomEvent('hotspotActive', {
            detail: { timestamp: event.data.timestamp }
          }));
        }
      });

      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async unregister() {
    if (this.registration) {
      await this.registration.unregister();
      this.registration = null;
      console.log('Service Worker unregistered');
    }
  }

  // Send message to service worker
  async sendMessage(message) {
    if (this.registration && this.registration.active) {
      this.registration.active.postMessage(message);
    }
  }

  // Start background checks in service worker
  async startBackgroundChecks() {
    await this.sendMessage({ type: 'START_BACKGROUND_CHECKS' });
  }

  // Stop background checks in service worker
  async stopBackgroundChecks() {
    await this.sendMessage({ type: 'STOP_BACKGROUND_CHECKS' });
  }

  // Check if service worker is active
  isActive() {
    return this.registration && this.registration.active;
  }
}

export default ServiceWorkerManager; 