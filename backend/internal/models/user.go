package models

import (
	"time"

	"gorm.io/gorm"
)

// User represents a user account in the system.
type User struct {
	ID                uint           `gorm:"primaryKey" json:"id"`
	Username          string         `gorm:"uniqueIndex;size:30;not null" json:"username"`
	Email             string         `gorm:"uniqueIndex;size:255;not null" json:"email"`
	PasswordHash      string         `gorm:"not null" json:"-"`
	FullName          string         `gorm:"size:100" json:"full_name"`
	Bio               string         `gorm:"size:500" json:"bio"`
	ProfilePictureURL string         `gorm:"size:500" json:"profile_picture_url"`
	IsPrivate         bool           `gorm:"default:false" json:"is_private"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Posts    []Post    `gorm:"foreignKey:UserID" json:"posts,omitempty"`
	Comments []Comment `gorm:"foreignKey:UserID" json:"comments,omitempty"`
	Likes    []Like    `gorm:"foreignKey:UserID" json:"likes,omitempty"`
}
