// Shapes returned by our own /api routes. Safe to import from client code.

/** GET /api/weather */
export interface WeatherDTO {
  /** Empty for unnamed points such as open water */
  city: string;
  country?: string;
  lat: number;
  lon: number;
  /** °C */
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  /** OpenWeather group, e.g. "Clear", "Rain" */
  condition: string;
  /** Sentence-case detail, e.g. "Broken clouds"; empty if upstream omits it */
  description: string;
  /** % */
  humidity: number;
  /** hPa */
  pressure: number;
  /** m/s */
  wind_speed?: number;
  /** Degrees the wind comes from */
  wind_deg?: number;
  /** m/s */
  wind_gust?: number;
  /** Metres */
  visibility?: number;
  /** Unix seconds, UTC */
  sunrise?: number;
  sunset?: number;
  /** Cloud cover % */
  clouds?: number;
  /** Absolute URL of the condition icon; ends in d@2x.png or n@2x.png */
  icon: string;
  /** Offset from UTC in seconds */
  timezone: number;
}

/** GET /api/geocode (array) and /api/geocode/reverse (single or null) */
export interface PlaceDTO {
  name: string;
  state?: string;
  country?: string;
  lat: number;
  lon: number;
}

/** Body of every non-2xx /api response */
export interface ApiErrorDTO {
  error: string;
}

export interface LatLon {
  lat: number;
  lon: number;
}

/** One 3-hour step of GET /api/forecast */
export interface ForecastHourDTO {
  /** Unix seconds, UTC */
  time: number;
  /** °C */
  temp: number;
  condition: string;
  /** Absolute URL of the condition icon */
  icon: string;
  /** Chance of precipitation, 0–100 % */
  pop: number;
  /** m/s */
  wind_speed?: number;
}

/** One local calendar day of GET /api/forecast */
export interface ForecastDayDTO {
  /** "YYYY-MM-DD" in the location's timezone */
  date: string;
  /** °C */
  temp_min: number;
  temp_max: number;
  /** Condition of the step nearest local noon */
  condition: string;
  icon: string;
  /** Highest chance of precipitation that day, 0–100 % */
  pop: number;
}

/** GET /api/forecast */
export interface ForecastDTO {
  /** Offset from UTC in seconds */
  timezone: number;
  /** Next 24 h in 3-hour steps (8 entries) */
  hourly: ForecastHourDTO[];
  /** Up to 6 local days; the first and last may be partial */
  daily: ForecastDayDTO[];
}

/** GET /api/air */
export interface AirDTO {
  /** OpenWeather index: 1 Good, 2 Fair, 3 Moderate, 4 Poor, 5 Very poor */
  aqi: 1 | 2 | 3 | 4 | 5;
  /** Unix seconds, UTC */
  time: number;
  /** Concentrations in µg/m³ */
  components: {
    co?: number;
    no2?: number;
    o3?: number;
    so2?: number;
    pm2_5?: number;
    pm10?: number;
  };
}
