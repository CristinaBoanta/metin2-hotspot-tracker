# Metin2 Fishing Hotspot Tracker

A React application that tracks fishing hotspots in Metin2 and sends notifications when they become active. The app uses a service worker to ensure notifications work even when the browser tab is minimized or in the background.

## Features

- **Real-time tracking**: Monitors fishing hotspots that occur every 1 hour and 20 minutes
- **Background notifications**: Service worker ensures notifications work when tab is not active
- **Multiple alert methods**: Browser notifications, audio alerts, and page title flashing
- **PWA support**: Can be installed as a Progressive Web App
- **Responsive design**: Works on desktop and mobile devices

## How it works

1. **Base time**: Fishing hotspots start at 21:18 (9:18 PM) and repeat every 80 minutes
2. **Background service**: A service worker runs in the background to check for hotspots
3. **Notifications**: Multiple notification methods ensure you never miss a hotspot
4. **History tracking**: Keeps a record of recent hotspots

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Build for production: `npm run build`

## Usage

1. Open the app in your browser
2. Enable notifications when prompted
3. The app will automatically track hotspots and send notifications
4. You can minimize the browser tab - notifications will still work!

## Technical Details

- **Service Worker**: Handles background notifications and periodic checks
- **PWA Manifest**: Makes the app installable
- **Background Sync**: Ensures reliable notification delivery
- **Audio Alerts**: Works even without notification permission

## Browser Support

- Chrome/Edge: Full support with background notifications
- Firefox: Full support with background notifications  
- Safari: Limited background support (notifications may not work when minimized)

## Development

The app is built with:
- React 19
- Vite
- Service Workers for background functionality
- PWA capabilities
