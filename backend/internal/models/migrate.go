package models

import (
	"log"

	"gorm.io/gorm"
)

// AutoMigrate runs Gorm auto-migration for all models.
func AutoMigrate(db *gorm.DB) {
	err := db.AutoMigrate(
		&User{},
		&Post{},
		&Comment{},
		&Like{},
		&Follow{},
		&Story{},
	)
	if err != nil {
		log.Fatalf("Failed to auto-migrate models: %v", err)
	}
	log.Println("✅ Database migration completed successfully")
}
