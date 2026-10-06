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
  /** % */
  humidity: number;
  /** hPa */
  pressure: number;
  /** m/s */
  wind_speed?: number;
  /** Degrees the wind comes from */
  wind_deg?: number;
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
