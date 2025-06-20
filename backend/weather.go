package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gofiber/fiber/v2"
)

type WeatherResponse struct {
	City       string  `json:"city"`
	Country    string  `json:"country"`
	Lat        float64 `json:"lat"`
	Lon        float64 `json:"lon"`
	Temp       float64 `json:"temp"`
	FeelsLike  float64 `json:"feels_like"`
	TempMin    float64 `json:"temp_min"`
	TempMax    float64 `json:"temp_max"`
	Condition  string  `json:"condition"`
	Humidity   int     `json:"humidity"`
	Pressure   int     `json:"pressure"`
	WindSpeed  float64 `json:"wind_speed"`
	WindDeg    int     `json:"wind_deg"`
	Visibility int     `json:"visibility"`
	Sunrise    int64   `json:"sunrise"`
	Sunset     int64   `json:"sunset"`
	Clouds     int     `json:"clouds"`
	Icon       string  `json:"icon"`
	Timezone   int     `json:"timezone"`
}

func getWeatherHandler(c *fiber.Ctx) error {
	city := c.Query("city")
	lat := c.Query("lat")
	lon := c.Query("lon")
	apiKey := os.Getenv("OPENWEATHER_API_KEY")
	if apiKey == "" {
		log.Println("Error: API key not set")
		return c.Status(500).JSON(fiber.Map{"error": "API key not set"})
	}
	var url string
	if lat != "" && lon != "" {
		log.Printf("Received /weather request for coordinates: lat=%s, lon=%s", lat, lon)
		url = fmt.Sprintf("https://api.openweathermap.org/data/2.5/weather?lat=%s&lon=%s&appid=%s&units=metric", lat, lon, apiKey)
	} else if city != "" {
		log.Printf("Received /weather request for city: %s", city)
		url = fmt.Sprintf("https://api.openweathermap.org/data/2.5/weather?q=%s&appid=%s&units=metric", city, apiKey)
	} else {
		log.Println("Error: City or coordinates required")
		return c.Status(400).JSON(fiber.Map{"error": "City or coordinates required"})
	}
	log.Printf("Fetching weather from OpenWeather API: %s", url)
	resp, err := http.Get(url)
	if err != nil || resp.StatusCode != 200 {
		log.Printf("Error fetching weather: %v, status: %d", err, resp.StatusCode)
		return c.Status(404).JSON(fiber.Map{"error": "City not found or API error"})
	}
	defer resp.Body.Close()
	var data struct {
		Name string `json:"name"`
		Main struct {
			Temp      float64 `json:"temp"`
			FeelsLike float64 `json:"feels_like"`
			TempMin   float64 `json:"temp_min"`
			TempMax   float64 `json:"temp_max"`
			Humidity  int     `json:"humidity"`
			Pressure  int     `json:"pressure"`
		} `json:"main"`
		Weather []struct {
			Main string `json:"main"`
			Icon string `json:"icon"`
		} `json:"weather"`
		Wind struct {
			Speed float64 `json:"speed"`
			Deg   int     `json:"deg"`
		} `json:"wind"`
		Visibility int `json:"visibility"`
		Sys        struct {
			Country string `json:"country"`
			Sunrise int64  `json:"sunrise"`
			Sunset  int64  `json:"sunset"`
		} `json:"sys"`
		Clouds struct {
			All int `json:"all"`
		} `json:"clouds"`
		Coord struct {
			Lat float64 `json:"lat"`
			Lon float64 `json:"lon"`
		} `json:"coord"`
		Timezone int `json:"timezone"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		log.Printf("Error decoding weather data: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to parse weather data"})
	}
	if len(data.Weather) == 0 {
		log.Printf("No weather data found")
		return c.Status(500).JSON(fiber.Map{"error": "No weather data found"})
	}
	result := WeatherResponse{
		City:       data.Name,
		Country:    data.Sys.Country,
		Lat:        data.Coord.Lat,
		Lon:        data.Coord.Lon,
		Temp:       data.Main.Temp,
		FeelsLike:  data.Main.FeelsLike,
		TempMin:    data.Main.TempMin,
		TempMax:    data.Main.TempMax,
		Condition:  data.Weather[0].Main,
		Humidity:   data.Main.Humidity,
		Pressure:   data.Main.Pressure,
		WindSpeed:  data.Wind.Speed,
		WindDeg:    data.Wind.Deg,
		Visibility: data.Visibility,
		Sunrise:    data.Sys.Sunrise,
		Sunset:     data.Sys.Sunset,
		Clouds:     data.Clouds.All,
		Icon:       fmt.Sprintf("https://openweathermap.org/img/wn/%s@2x.png", data.Weather[0].Icon),
		Timezone:   data.Timezone,
	}
	log.Printf("Success: Weather for %s, %s: Temp=%.1f°C, FeelsLike=%.1f°C, Min=%.1f°C, Max=%.1f°C, Condition=%s, Humidity=%d%%, Pressure=%dhPa, Wind=%.1fkm/h, Clouds=%d%%", result.City, result.Country, result.Temp, result.FeelsLike, result.TempMin, result.TempMax, result.Condition, result.Humidity, result.Pressure, result.WindSpeed, result.Clouds)
	return c.JSON(result)
}
