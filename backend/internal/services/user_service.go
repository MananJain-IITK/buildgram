package services

import (
	"errors"
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/harshit/buildgram/internal/repositories"
)

// UserService handles user-related business logic.
type UserService struct {
	userRepo   *repositories.UserRepository
	followRepo *repositories.FollowRepository
	uploadDir  string
}

// NewUserService creates a new UserService.
func NewUserService(userRepo *repositories.UserRepository, followRepo *repositories.FollowRepository, uploadDir string) *UserService {
	return &UserService{
		userRepo:   userRepo,
		followRepo: followRepo,
		uploadDir:  uploadDir,
	}
}

// UpdateProfileInput represents the input for updating user profile.
type UpdateProfileInput struct {
	FullName  string `json:"full_name"`
	Bio       string `json:"bio"`
	Username  string `json:"username"`
	IsPrivate *bool  `json:"is_private"`
}

// ProfileResponse represents a detailed user profile response.
type ProfileResponse struct {
	UserResponse
	PostCount      int64 `json:"post_count"`
	FollowerCount  int64 `json:"follower_count"`
	FollowingCount int64 `json:"following_count"`
	IsFollowing    bool  `json:"is_following"`
	IsPrivate      bool  `json:"is_private"`
	CanViewPosts   bool  `json:"can_view_posts"`
}

// GetProfile retrieves a user's profile with counts.
func (s *UserService) GetProfile(userID uint, currentUserID uint) (*ProfileResponse, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	postCount, _ := s.userRepo.GetPostCount(userID)
	followerCount, _ := s.userRepo.GetFollowerCount(userID)
	followingCount, _ := s.userRepo.GetFollowingCount(userID)

	isFollowing := false
	if currentUserID != userID {
		isFollowing, _ = s.followRepo.IsFollowing(currentUserID, userID)
	}

	// Can view posts: public account OR own profile OR following
	canViewPosts := !user.IsPrivate || currentUserID == userID || isFollowing

	return &ProfileResponse{
		UserResponse:   toUserResponse(user),
		PostCount:      postCount,
		FollowerCount:  followerCount,
		FollowingCount: followingCount,
		IsFollowing:    isFollowing,
		IsPrivate:      user.IsPrivate,
		CanViewPosts:   canViewPosts,
	}, nil
}

// UpdateProfile updates a user's profile information.
func (s *UserService) UpdateProfile(userID uint, input UpdateProfileInput) (*UserResponse, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if input.FullName != "" {
		user.FullName = input.FullName
	}
	if input.Bio != "" {
		user.Bio = input.Bio
	}
	if input.Username != "" && input.Username != user.Username {
		existing, err := s.userRepo.FindByUsername(input.Username)
		if err == nil && existing.ID != userID {
			return nil, errors.New("username already taken")
		}
		user.Username = input.Username
	}
	if input.IsPrivate != nil {
		user.IsPrivate = *input.IsPrivate
	}

	if err := s.userRepo.Update(user); err != nil {
		return nil, errors.New("failed to update profile")
	}

	resp := toUserResponse(user)
	return &resp, nil
}

// UploadProfilePicture handles the upload of a user's profile picture.
func (s *UserService) UploadProfilePicture(userID uint, file multipart.File, header *multipart.FileHeader) (*UserResponse, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	// Validate file type
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".gif" {
		return nil, errors.New("only jpg, jpeg, png, and gif files are allowed")
	}

	// Create uploads directory if it doesn't exist
	profileDir := filepath.Join(s.uploadDir, "profiles")
	if err := os.MkdirAll(profileDir, os.ModePerm); err != nil {
		return nil, errors.New("failed to create upload directory")
	}

	// Generate unique filename
	filename := fmt.Sprintf("profile_%d_%d%s", userID, time.Now().UnixNano(), ext)
	filePath := filepath.Join(profileDir, filename)

	// Save file
	dst, err := os.Create(filePath)
	if err != nil {
		return nil, errors.New("failed to save file")
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		return nil, errors.New("failed to save file")
	}

	// Delete old profile picture if exists
	if user.ProfilePictureURL != "" {
		oldPath := filepath.Join(s.uploadDir, strings.TrimPrefix(user.ProfilePictureURL, "/uploads/"))
		os.Remove(oldPath)
	}

	user.ProfilePictureURL = "/uploads/profiles/" + filename

	if err := s.userRepo.Update(user); err != nil {
		return nil, errors.New("failed to update profile picture")
	}

	resp := toUserResponse(user)
	return &resp, nil
}

// SearchUsers searches for users by username.
func (s *UserService) SearchUsers(query string) ([]UserResponse, error) {
	users, err := s.userRepo.SearchUsers(query, 20)
	if err != nil {
		return nil, err
	}

	var responses []UserResponse
	for _, u := range users {
		responses = append(responses, UserResponse{
			ID:                u.ID,
			Username:          u.Username,
			Email:             u.Email,
			FullName:          u.FullName,
			Bio:               u.Bio,
			ProfilePictureURL: u.ProfilePictureURL,
		})
	}
	return responses, nil
}

// ValidateImageAspectRatio validates that an image has a supported aspect ratio.
// Supported ratios: 1:1 (square), 4:5 (portrait), 16:9 (landscape).
func ValidateImageAspectRatio(file multipart.File) (int, int, error) {
	imgConfig, _, err := image.DecodeConfig(file)
	if err != nil {
		return 0, 0, errors.New("invalid image file")
	}
	// Seek back to beginning for subsequent reads
	if seeker, ok := file.(io.Seeker); ok {
		seeker.Seek(0, io.SeekStart)
	}
	return imgConfig.Width, imgConfig.Height, nil
}
