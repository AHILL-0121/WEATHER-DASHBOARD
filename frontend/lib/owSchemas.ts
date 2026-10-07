// Server-only: runtime validation of OpenWeather responses. Only the fields we
// use are declared; anything else is stripped. Optional fields really are
// missing in some responses (e.g. ocean points have no sys.country).
import { z } from 'zod';

export const OwWeatherSchema = z.object({
  name: z.string().default(''),
  coord: z.object({ lat: z.number(), lon: z.number() }),
  weather: z
    .array(z.object({ main: z.string(), description: z.string().default(''), icon: z.string() }))
    .min(1),
  main: z.object({
    temp: z.number(),
    feels_like: z.number(),
    temp_min: z.number(),
    temp_max: z.number(),
    humidity: z.number(),
    pressure: z.number(),
  }),
  wind: z
    .object({ speed: z.number().optional(), deg: z.number().optional(), gust: z.number().optional() })
    .optional(),
  clouds: z.object({ all: z.number() }).optional(),
  sys: z
    .object({
      country: z.string().optional(),
      sunrise: z.number().optional(),
      sunset: z.number().optional(),
    })
    .optional(),
  visibility: z.number().optional(),
  timezone: z.number().default(0),
});

export const OwPlaceSchema = z.object({
  name: z.string(),
  state: z.string().optional(),
  country: z.string().optional(),
  lat: z.number(),
  lon: z.number(),
});

export const OwPlacesSchema = z.array(OwPlaceSchema);

export type OwWeather = z.infer<typeof OwWeatherSchema>;
export type OwPlace = z.infer<typeof OwPlaceSchema>;

// /data/2.5/forecast: 3-hour steps for 5 days
export const OwForecastSchema = z.object({
  list: z
    .array(
      z.object({
        dt: z.number(),
        main: z.object({ temp: z.number(), temp_min: z.number(), temp_max: z.number() }),
        weather: z.array(z.object({ main: z.string(), icon: z.string() })).min(1),
        wind: z.object({ speed: z.number().optional() }).optional(),
        // Probability of precipitation, 0–1
        pop: z.number().default(0),
      }),
    )
    .min(1),
  city: z.object({ timezone: z.number().default(0) }).default({ timezone: 0 }),
});

// /data/2.5/air_pollution: current conditions, a single-entry list
export const OwAirSchema = z.object({
  list: z
    .array(
      z.object({
        dt: z.number(),
        main: z.object({ aqi: z.number().int().min(1).max(5) }),
        components: z.object({
          co: z.number().optional(),
          no2: z.number().optional(),
          o3: z.number().optional(),
          so2: z.number().optional(),
          pm2_5: z.number().optional(),
          pm10: z.number().optional(),
        }),
      }),
    )
    .min(1),
});

export type OwForecast = z.infer<typeof OwForecastSchema>;
export type OwForecastEntry = OwForecast['list'][number];
export type OwAir = z.infer<typeof OwAirSchema>;
