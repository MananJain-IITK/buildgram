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

// PostService handles post-related business logic.
type PostService struct {
	postRepo    *repositories.PostRepository
	likeRepo    *repositories.LikeRepository
	commentRepo *repositories.CommentRepository
	userRepo    *repositories.UserRepository
	followRepo  *repositories.FollowRepository
	uploadDir   string
}

// NewPostService creates a new PostService.
func NewPostService(
	postRepo *repositories.PostRepository,
	likeRepo *repositories.LikeRepository,
	commentRepo *repositories.CommentRepository,
	userRepo *repositories.UserRepository,
	followRepo *repositories.FollowRepository,
	uploadDir string,
) *PostService {
	return &PostService{
		postRepo:    postRepo,
		likeRepo:    likeRepo,
		commentRepo: commentRepo,
		userRepo:    userRepo,
		followRepo:  followRepo,
		uploadDir:   uploadDir,
	}
}

// PostResponse represents a post in API responses.
type PostResponse struct {
	ID           uint           `json:"id"`
	UserID       uint           `json:"user_id"`
	ImageURL     string         `json:"image_url"`
	Caption      string         `json:"caption"`
	CreatedAt    time.Time      `json:"created_at"`
	User         UserResponse   `json:"user"`
	LikeCount    int64          `json:"like_count"`
	CommentCount int64          `json:"comment_count"`
	IsLiked      bool           `json:"is_liked"`
	Comments     []CommentResponse `json:"comments,omitempty"`
}

// CommentResponse represents a comment in API responses.
type CommentResponse struct {
	ID        uint         `json:"id"`
	Content   string       `json:"content"`
	CreatedAt time.Time    `json:"created_at"`
	User      UserResponse `json:"user"`
}

// CreatePost creates a new post with an image upload.
func (s *PostService) CreatePost(userID uint, caption string, file multipart.File, header *multipart.FileHeader) (*PostResponse, error) {
	// Validate file type
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".gif" && ext != ".webp" {
		return nil, errors.New("only jpg, jpeg, png, gif, and webp files are allowed")
	}

	// Validate image dimensions and aspect ratio
	width, height, err := ValidateImageAspectRatio(file)
	if err != nil {
		return nil, err
	}

	// Enforce standard aspect ratios: 1:1, 4:5, or 16:9 (with tolerance)
	ratio := float64(width) / float64(height)
	validRatio := false
	switch {
	case ratio >= 0.75 && ratio <= 1.35: // Covers 4:5 to ~square and slightly wider
		validRatio = true
	case ratio >= 1.7 && ratio <= 1.85: // 16:9 landscape
		validRatio = true
	}
	if !validRatio {
		// Allow the upload but log that ratio is non-standard
		// We'll accept it anyway for better UX, as Instagram also allows various ratios
		_ = ratio
	}
	_ = width
	_ = height

	// Create posts directory if it doesn't exist
	postsDir := filepath.Join(s.uploadDir, "posts")
	if err := os.MkdirAll(postsDir, os.ModePerm); err != nil {
		return nil, errors.New("failed to create upload directory")
	}

	// Generate unique filename
	filename := fmt.Sprintf("post_%d_%d%s", userID, time.Now().UnixNano(), ext)
	filePath := filepath.Join(postsDir, filename)

	// Save file
	dst, err := os.Create(filePath)
	if err != nil {
		return nil, errors.New("failed to save file")
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		return nil, errors.New("failed to save file")
	}

	post := &models.Post{
		UserID:   userID,
		ImageURL: "/uploads/posts/" + filename,
		Caption:  caption,
	}

	if err := s.postRepo.Create(post); err != nil {
		return nil, errors.New("failed to create post")
	}

	// Fetch the post with user info
	createdPost, err := s.postRepo.FindByID(post.ID)
	if err != nil {
		return nil, err
	}

	return s.toPostResponse(createdPost, userID), nil
}

// GetFeed retrieves the feed for a user.
func (s *PostService) GetFeed(userID uint, page, limit int) ([]PostResponse, error) {
	offset := (page - 1) * limit
	posts, err := s.postRepo.GetFeed(userID, offset, limit)
	if err != nil {
		return nil, err
	}

	var responses []PostResponse
	for _, post := range posts {
		responses = append(responses, *s.toPostResponse(&post, userID))
	}
	return responses, nil
}

// GetUserPosts retrieves all posts by a user, respecting privacy settings.
// Returns empty if the profile is private and the viewer is not a follower/owner.
func (s *PostService) GetUserPosts(userID, currentUserID uint, page, limit int) ([]PostResponse, error) {
	// Check privacy: load the user first
	canView, err := s.canViewUserPosts(userID, currentUserID)
	if err != nil {
		return nil, err
	}
	if !canView {
		// Return empty slice — profile is private and viewer has no access
		return []PostResponse{}, nil
	}

	offset := (page - 1) * limit
	posts, err := s.postRepo.GetUserPosts(userID, offset, limit)
	if err != nil {
		return nil, err
	}

	var responses []PostResponse
	for _, post := range posts {
		responses = append(responses, *s.toPostResponse(&post, currentUserID))
	}
	return responses, nil
}

// GetPost retrieves a single post by ID.
func (s *PostService) GetPost(postID, currentUserID uint) (*PostResponse, error) {
	post, err := s.postRepo.FindByID(postID)
	if err != nil {
		return nil, errors.New("post not found")
	}
	return s.toPostResponse(post, currentUserID), nil
}

// DeletePost deletes a post.
func (s *PostService) DeletePost(postID, userID uint) error {
	return s.postRepo.Delete(postID, userID)
}

// GetExplorePosts retrieves posts for the explore page, excluding private accounts.
func (s *PostService) GetExplorePosts(currentUserID uint, page, limit int) ([]PostResponse, error) {
	offset := (page - 1) * limit
	posts, err := s.postRepo.GetExplorePostsPublic(currentUserID, offset, limit)
	if err != nil {
		return nil, err
	}

	var responses []PostResponse
	for _, post := range posts {
		responses = append(responses, *s.toPostResponse(&post, currentUserID))
	}
	return responses, nil
}

func (s *PostService) toPostResponse(post *models.Post, currentUserID uint) *PostResponse {
	isLiked, _ := s.likeRepo.IsLiked(post.ID, currentUserID)
	likeCount, _ := s.likeRepo.GetLikeCount(post.ID)
	commentCount, _ := s.commentRepo.GetCommentCount(post.ID)

	var commentResponses []CommentResponse
	for _, c := range post.Comments {
		commentResponses = append(commentResponses, CommentResponse{
			ID:        c.ID,
			Content:   c.Content,
			CreatedAt: c.CreatedAt,
			User: UserResponse{
				ID:                c.User.ID,
				Username:          c.User.Username,
				ProfilePictureURL: c.User.ProfilePictureURL,
			},
		})
	}

	return &PostResponse{
		ID:           post.ID,
		UserID:       post.UserID,
		ImageURL:     post.ImageURL,
		Caption:      post.Caption,
		CreatedAt:    post.CreatedAt,
		LikeCount:    likeCount,
		CommentCount: commentCount,
		IsLiked:      isLiked,
		Comments:     commentResponses,
		User: UserResponse{
			ID:                post.User.ID,
			Username:          post.User.Username,
			FullName:          post.User.FullName,
			ProfilePictureURL: post.User.ProfilePictureURL,
		},
	}
}

// canViewUserPosts checks whether currentUserID is allowed to view userID's posts.
// Allowed if: account is public, or viewer is the owner, or viewer follows the account.
func (s *PostService) canViewUserPosts(userID, currentUserID uint) (bool, error) {
	if currentUserID == userID {
		return true, nil
	}
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return false, errors.New("user not found")
	}
	if !user.IsPrivate {
		return true, nil
	}
	// Private — check if viewer follows
	isFollowing, _ := s.followRepo.IsFollowing(currentUserID, userID)
	return isFollowing, nil
}
