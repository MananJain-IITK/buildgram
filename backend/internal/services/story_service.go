package services

import (
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/harshit/buildgram/internal/models"
	"github.com/harshit/buildgram/internal/repositories"
)

// StoryService handles story-related business logic.
type StoryService struct {
	storyRepo *repositories.StoryRepository
	uploadDir string
}

// NewStoryService creates a new StoryService.
func NewStoryService(storyRepo *repositories.StoryRepository, uploadDir string) *StoryService {
	return &StoryService{storyRepo: storyRepo, uploadDir: uploadDir}
}

// StoryResponse represents a single story in API responses.
type StoryResponse struct {
	ID        uint         `json:"id"`
	ImageURL  string       `json:"image_url"`
	ExpiresAt time.Time    `json:"expires_at"`
	CreatedAt time.Time    `json:"created_at"`
	User      UserResponse `json:"user"`
}

// UserStoriesGroup groups all active stories for a single user.
type UserStoriesGroup struct {
	User    UserResponse    `json:"user"`
	Stories []StoryResponse `json:"stories"`
}

// CreateStory validates and saves a story image, then persists the story record.
func (s *StoryService) CreateStory(userID uint, file multipart.File, header *multipart.FileHeader) (*StoryResponse, error) {
	// Validate file type
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".gif" && ext != ".webp" {
		return nil, errors.New("only jpg, jpeg, png, gif, and webp files are allowed")
	}

	// Create stories directory if it doesn't exist
	storiesDir := filepath.Join(s.uploadDir, "stories")
	if err := os.MkdirAll(storiesDir, os.ModePerm); err != nil {
		return nil, errors.New("failed to create stories upload directory")
	}

	// Generate unique filename
	filename := fmt.Sprintf("story_%d_%d%s", userID, time.Now().UnixNano(), ext)
	filePath := filepath.Join(storiesDir, filename)

	// Save file to disk
	dst, err := os.Create(filePath)
	if err != nil {
		return nil, errors.New("failed to save story file")
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		return nil, errors.New("failed to write story file")
	}

	story := &models.Story{
		UserID:    userID,
		ImageURL:  "/uploads/stories/" + filename,
		ExpiresAt: time.Now().Add(24 * time.Hour),
	}

	if err := s.storyRepo.Create(story); err != nil {
		return nil, errors.New("failed to create story")
	}

	// Re-fetch to get User preloaded
	stories, err := s.storyRepo.GetUserStories(userID)
	if err != nil || len(stories) == 0 {
		return &StoryResponse{
			ID:        story.ID,
			ImageURL:  story.ImageURL,
			ExpiresAt: story.ExpiresAt,
			CreatedAt: story.CreatedAt,
		}, nil
	}
	// Return the latest one (last in ASC order)
	latest := stories[len(stories)-1]
	return s.toStoryResponse(&latest), nil
}

// GetFeedStories returns all active stories from followed users + self,
// grouped by user (self first).
func (s *StoryService) GetFeedStories(userID uint) ([]UserStoriesGroup, error) {
	stories, err := s.storyRepo.GetFeedStories(userID)
	if err != nil {
		return nil, err
	}

	// Group by user, preserving order (own stories are first from the repo)
	groupMap := make(map[uint]*UserStoriesGroup)
	orderKeys := make([]uint, 0)

	for _, story := range stories {
		uid := story.User.ID
		if _, exists := groupMap[uid]; !exists {
			groupMap[uid] = &UserStoriesGroup{
				User: UserResponse{
					ID:                story.User.ID,
					Username:          story.User.Username,
					FullName:          story.User.FullName,
					ProfilePictureURL: story.User.ProfilePictureURL,
				},
				Stories: []StoryResponse{},
			}
			orderKeys = append(orderKeys, uid)
		}
		groupMap[uid].Stories = append(groupMap[uid].Stories, *s.toStoryResponse(&story))
	}

	result := make([]UserStoriesGroup, 0, len(orderKeys))
	for _, uid := range orderKeys {
		result = append(result, *groupMap[uid])
	}
	return result, nil
}

// GetUserStories returns all active stories for a specific user.
func (s *StoryService) GetUserStories(userID uint) ([]StoryResponse, error) {
	stories, err := s.storyRepo.GetUserStories(userID)
	if err != nil {
		return nil, err
	}
	result := make([]StoryResponse, 0, len(stories))
	for _, story := range stories {
		result = append(result, *s.toStoryResponse(&story))
	}
	return result, nil
}

func (s *StoryService) toStoryResponse(story *models.Story) *StoryResponse {
	return &StoryResponse{
		ID:        story.ID,
		ImageURL:  story.ImageURL,
		ExpiresAt: story.ExpiresAt,
		CreatedAt: story.CreatedAt,
		User: UserResponse{
			ID:                story.User.ID,
			Username:          story.User.Username,
			FullName:          story.User.FullName,
			ProfilePictureURL: story.User.ProfilePictureURL,
		},
	}
}
