# Weather Dashboard

A serverless weather dashboard built with **Next.js**. No separate backend process required — weather data is fetched directly from the [OpenWeather API](https://openweathermap.org/api) via a Next.js serverless API route.

## Features

- Search weather by city name
- Search weather by clicking anywhere on an interactive map
- Displays temperature, feels-like, min/max, humidity, pressure, wind, visibility, clouds, sunrise/sunset
- Animated weather backgrounds based on current conditions
- Fully serverless — deploys to Vercel or any Node.js host with zero extra services

## Project Structure

```
frontend/
├── components/
│   ├── WeatherDisplay.jsx   # Weather data card
│   ├── WeatherForm.jsx      # Search input
│   └── WeatherMap.jsx       # Interactive Leaflet map
├── pages/
│   ├── index.jsx            # Main page
│   └── api/
│       └── weather.js       # Serverless function → OpenWeather API
├── public/
│   ├── fonts.css
│   └── weather-anim.css
└── .env.local               # API keys (not committed)
```

## Setup

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure environment variables

Create `frontend/.env.local`:

```env
# Server-only: used by the /api routes, never sent to the browser
OPENWEATHER_API_KEY=your_openweather_api_key
```

Get a free API key at <https://openweathermap.org/api>.

### 3. Run

```bash
npm run dev
```

Open <http://localhost:3000>.

## Development

Run these from `frontend/` (Node 22, see `.nvmrc`):

| Command | What it does |
|---|---|
| `npm run lint` | ESLint (Next.js core-web-vitals rules) |
| `npm run format` | Format with Prettier (`format:check` only reports) |
| `npm test` | Run the Vitest suite once (`test:watch` to re-run on save) |
| `npm run build` | Production build |

CI (`.github/workflows/ci.yml`) runs lint, format check, tests, build and `npm audit --omit=dev` on every pull request and push to `main`.

## Deployment (Vercel)

```bash
cd frontend
npx vercel
```

Set `OPENWEATHER_API_KEY` in the Vercel project environment variables. Do not create a `NEXT_PUBLIC_` copy of it.

## How it works

```
Browser
  └─ GET /api/weather?city=London
       └─ pages/api/weather.js  (Next.js serverless function)
            └─ GET api.openweathermap.org/data/2.5/weather
                 └─ returns normalized JSON to the browser
```
