# Weather Dashboard Frontend

This is the Next.js frontend for the Weather Dashboard MVP.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

## Usage
- Enter a city name and click Search to view current weather.
- The frontend proxies requests to the Go backend at `http://localhost:3001/weather` via `/api/weather`. 