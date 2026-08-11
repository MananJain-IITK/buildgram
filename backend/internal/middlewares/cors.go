package middlewares

import (
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// CORSMiddleware configures CORS settings for the API.
// In production, set the ALLOWED_ORIGINS env var to a comma-separated list of
// allowed origins, e.g. "https://buildgram.vercel.app,https://myapp.com".
func CORSMiddleware() gin.HandlerFunc {
	allowedOrigins := []string{"http://localhost:5173", "http://localhost:3000"}

	if envOrigins := os.Getenv("ALLOWED_ORIGINS"); envOrigins != "" {
		parsed := strings.Split(envOrigins, ",")
		for i, o := range parsed {
			parsed[i] = strings.TrimSpace(o)
		}
		allowedOrigins = parsed
	}

	return cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	})
}
