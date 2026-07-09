# iManage Traffic Advisor

Smart real-time traffic advisor webapp — know the best time to leave for your destination.

## Features

- 📍 **Auto location detection** — uses browser GPS
- 🗺️ **Google Maps integration** — Places Autocomplete + Routes API
- 🚦 **Live traffic analysis** — Light / Moderate / Heavy with delay minutes
- ✅ **Smart recommendation** — "Leave Now" or "Wait" based on conditions
- 🔔 **Push notifications** — get alerted when traffic improves
- 🌙 **Dark-first design** — matching iManage brand aesthetic

## Tech Stack

- **Next.js 14** (pages router)
- **TailwindCSS v3**
- **Google Maps Platform** (Routes API + Places API)
- **lucide-react** icons
- **react-hot-toast** notifications

## Setup

1. Clone the repo
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.local` and add your Google Maps API key:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_key_here
   GOOGLE_MAPS_SERVER_KEY=your_key_here
   ```
4. Enable these Google Maps APIs in your project:
   - Maps JavaScript API
   - Places API
   - Routes API

5. Run dev server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000)

## Google Maps API Key

Get your key at [console.cloud.google.com](https://console.cloud.google.com).

> **Note:** Without an API key, the app runs in **demo mode** with simulated traffic data so you can preview the UI.
