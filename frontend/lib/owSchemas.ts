// Server-only: runtime validation of OpenWeather responses. Only the fields we
// use are declared; anything else is stripped. Optional fields really are
// missing in some responses (e.g. ocean points have no sys.country).
import { z } from 'zod';

export const OwWeatherSchema = z.object({
  name: z.string().default(''),
  coord: z.object({ lat: z.number(), lon: z.number() }),
  weather: z.array(z.object({ main: z.string(), icon: z.string() })).min(1),
  main: z.object({
    temp: z.number(),
    feels_like: z.number(),
    temp_min: z.number(),
    temp_max: z.number(),
    humidity: z.number(),
    pressure: z.number(),
  }),
  wind: z.object({ speed: z.number().optional(), deg: z.number().optional() }).optional(),
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
