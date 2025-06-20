# Weather Dashboard Backend

This is the Go (Fiber) backend for the Weather Dashboard MVP.

## Setup

1. Copy `.env.example` to `.env` and add your OpenWeather API key.
2. Install dependencies:
   ```bash
   go mod tidy
   ```
3. Run the server:
   ```bash
   go run main.go weather.go db.go
   ```

## Endpoints
- `GET /weather?city=CityName` — Returns current weather for the given city.
- `GET /weather?lat=LAT&lon=LON` — Returns current weather for the given coordinates (recommended for best accuracy). 