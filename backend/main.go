package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()
	app := fiber.New()

	log.Println("Registering /weather route")
	app.Get("/weather", getWeatherHandler)

	log.Println("Starting Fiber server on :3001")
	log.Fatal(app.Listen(":3001"))
}
