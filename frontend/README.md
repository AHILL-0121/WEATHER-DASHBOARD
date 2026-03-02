# Weather Dashboard Frontend

This is the Next.js frontend for the Weather Dashboard MVP.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Add your API key to `frontend/.env.local` (already present – replace the value if needed):
   ```
   OPENWEATHER_API_KEY=your_key_here
   NEXT_PUBLIC_OPENWEATHER_API_KEY=your_key_here
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Architecture

This project uses a **pure serverless** design — no separate backend process is required.

| Layer | Description |
|---|---|
| `pages/api/weather.js` | Next.js serverless function that calls the OpenWeather API directly |
| `OPENWEATHER_API_KEY` | Server-side env var – never exposed to the browser |
| `NEXT_PUBLIC_OPENWEATHER_API_KEY` | Client-side env var – used for map reverse-geocoding |

## Usage
- Enter a city name and click Search to view current weather.
- Click any point on the map to load weather for that location.
- The `/api/weather` route is a self-contained serverless function – no Go backend needed.