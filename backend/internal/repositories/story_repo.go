package repositories

import (
	"time"

	"github.com/harshit/buildgram/internal/models"
	"gorm.io/gorm"
)

// StoryRepository handles database operations for stories.
type StoryRepository struct {
	db *gorm.DB
}

// NewStoryRepository creates a new StoryRepository.
func NewStoryRepository(db *gorm.DB) *StoryRepository {
	return &StoryRepository{db: db}
}

// Create inserts a new story record.
func (r *StoryRepository) Create(story *models.Story) error {
	return r.db.Create(story).Error
}

// GetFeedStories returns all active (non-expired) stories from users the given
// user follows, plus their own stories. Stories are ordered newest-first and
// grouped by user on the service layer.
func (r *StoryRepository) GetFeedStories(userID uint) ([]models.Story, error) {
	var stories []models.Story
	err := r.db.
		Preload("User").
		Joins("JOIN follows ON follows.following_id = stories.user_id AND follows.follower_id = ?", userID).
		Where("stories.expires_at > ? AND stories.deleted_at IS NULL", time.Now()).
		Order("stories.created_at DESC").
		Find(&stories).Error

	// Also fetch the user's own stories
	var ownStories []models.Story
	err2 := r.db.
		Preload("User").
		Where("stories.user_id = ? AND stories.expires_at > ? AND stories.deleted_at IS NULL", userID, time.Now()).
		Order("stories.created_at DESC").
		Find(&ownStories).Error

	if err != nil {
		return nil, err
	}
	if err2 != nil {
		return nil, err2
	}

	// Merge own stories at the front, deduplicate by ID
	seen := make(map[uint]bool)
	combined := make([]models.Story, 0, len(ownStories)+len(stories))
	for _, s := range ownStories {
		if !seen[s.ID] {
			seen[s.ID] = true
			combined = append(combined, s)
		}
	}
	for _, s := range stories {
		if !seen[s.ID] {
			seen[s.ID] = true
			combined = append(combined, s)
		}
	}
	return combined, nil
}

// GetUserStories returns all active stories for a specific user.
func (r *StoryRepository) GetUserStories(userID uint) ([]models.Story, error) {
	var stories []models.Story
	err := r.db.
		Preload("User").
		Where("user_id = ? AND expires_at > ? AND deleted_at IS NULL", userID, time.Now()).
		Order("created_at ASC").
		Find(&stories).Error
	return stories, err
}

// HasActiveStory returns true if the user has at least one non-expired story.
func (r *StoryRepository) HasActiveStory(userID uint) bool {
	var count int64
	r.db.Model(&models.Story{}).
		Where("user_id = ? AND expires_at > ? AND deleted_at IS NULL", userID, time.Now()).
		Count(&count)
	return count > 0
}
