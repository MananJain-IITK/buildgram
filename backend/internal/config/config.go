package config

import (
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config holds all configuration for the application.
type Config struct {
	DatabaseURL   string // Render provides this as a single connection string
	DBHost        string
	DBPort        string
	DBUser        string
	DBPassword    string
	DBName        string
	DBSSLMode     string
	ServerPort    string
	JWTSecret     string
	UploadDir     string
	MaxUploadSize int64
}

// LoadConfig reads configuration from .env file and environment variables.
func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	maxUploadSize, _ := strconv.ParseInt(getEnv("MAX_UPLOAD_SIZE", "10485760"), 10, 64)

	return &Config{
		DatabaseURL:   os.Getenv("DATABASE_URL"), // set by Render automatically
		DBHost:        getEnv("DB_HOST", "localhost"),
		DBPort:        getEnv("DB_PORT", "5432"),
		DBUser:        getEnv("DB_USER", "harshit"),
		DBPassword:    getEnv("DB_PASSWORD", ""),
		DBName:        getEnv("DB_NAME", "buildgram"),
		DBSSLMode:     getEnv("DB_SSLMODE", "disable"),
		ServerPort:    getEnv("SERVER_PORT", "8080"),
		JWTSecret:     getEnv("JWT_SECRET", "default-secret"),
		UploadDir:     getEnv("UPLOAD_DIR", "./uploads"),
		MaxUploadSize: maxUploadSize,
	}
}

// GetDSN returns the PostgreSQL connection string.
// If DATABASE_URL is set (Render production), it is used directly.
// Otherwise the individual DB_* environment variables are used (local dev).
func (c *Config) GetDSN() string {
	if c.DatabaseURL != "" {
		log.Println("Using DATABASE_URL for database connection")
		return c.DatabaseURL
	}
	if c.DBPassword == "" {
		return fmt.Sprintf(
			"host=%s port=%s user=%s dbname=%s sslmode=%s",
			c.DBHost, c.DBPort, c.DBUser, c.DBName, c.DBSSLMode,
		)
	}
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.DBHost, c.DBPort, c.DBUser, c.DBPassword, c.DBName, c.DBSSLMode,
	)
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
