package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/harshit/buildgram/internal/services"
)

// StoryHandler handles story-related HTTP requests.
type StoryHandler struct {
	storyService *services.StoryService
}

// NewStoryHandler creates a new StoryHandler.
func NewStoryHandler(storyService *services.StoryService) *StoryHandler {
	return &StoryHandler{storyService: storyService}
}

// CreateStory creates a new story from an uploaded image.
// POST /api/stories
func (h *StoryHandler) CreateStory(c *gin.Context) {
	currentUserID, _ := c.Get("userID")

	file, header, err := c.Request.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "image file is required"})
		return
	}
	defer file.Close()

	response, err := h.storyService.CreateStory(currentUserID.(uint), file, header)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, response)
}

// GetFeedStories returns active stories from followed users + self, grouped by user.
// GET /api/stories/feed
func (h *StoryHandler) GetFeedStories(c *gin.Context) {
	currentUserID, _ := c.Get("userID")

	groups, err := h.storyService.GetFeedStories(currentUserID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch stories"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"story_groups": groups})
}

// GetUserStories returns all active stories for a specific user.
// GET /api/stories/user/:id
func (h *StoryHandler) GetUserStories(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	stories, err := h.storyService.GetUserStories(uint(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch user stories"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"stories": stories})
}
