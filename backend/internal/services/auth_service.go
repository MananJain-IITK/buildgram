package services

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/harshit/buildgram/internal/models"
	"github.com/harshit/buildgram/internal/repositories"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// AuthService handles authentication business logic.
type AuthService struct {
	userRepo  *repositories.UserRepository
	jwtSecret string
}

// NewAuthService creates a new AuthService.
func NewAuthService(userRepo *repositories.UserRepository, jwtSecret string) *AuthService {
	return &AuthService{
		userRepo:  userRepo,
		jwtSecret: jwtSecret,
	}
}

// RegisterInput represents the input for user registration.
type RegisterInput struct {
	Username string `json:"username" binding:"required,min=3,max=30"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	FullName string `json:"full_name"`
}

// LoginInput represents the input for user login.
type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// AuthResponse represents the response after successful authentication.
type AuthResponse struct {
	Token string       `json:"token"`
	User  UserResponse `json:"user"`
}

// UserResponse represents a safe user response (without password hash).
type UserResponse struct {
	ID                uint   `json:"id"`
	Username          string `json:"username"`
	Email             string `json:"email"`
	FullName          string `json:"full_name"`
	Bio               string `json:"bio"`
	ProfilePictureURL string `json:"profile_picture_url"`
	IsPrivate         bool   `json:"is_private"`
}

// Register creates a new user account.
func (s *AuthService) Register(input RegisterInput) (*AuthResponse, error) {
	// Check if email already exists
	_, err := s.userRepo.FindByEmail(input.Email)
	if err == nil {
		return nil, errors.New("email already registered")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// Check if username already exists
	_, err = s.userRepo.FindByUsername(input.Username)
	if err == nil {
		return nil, errors.New("username already taken")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}

	user := &models.User{
		Username:     input.Username,
		Email:        input.Email,
		PasswordHash: string(hashedPassword),
		FullName:     input.FullName,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, errors.New("failed to create user")
	}

	// Generate JWT token
	token, err := s.generateToken(user.ID)
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	return &AuthResponse{
		Token: token,
		User:  toUserResponse(user),
	}, nil
}

// Login authenticates a user and returns a JWT token.
func (s *AuthService) Login(input LoginInput) (*AuthResponse, error) {
	user, err := s.userRepo.FindByEmail(input.Email)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		return nil, errors.New("invalid email or password")
	}

	token, err := s.generateToken(user.ID)
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	return &AuthResponse{
		Token: token,
		User:  toUserResponse(user),
	}, nil
}

func (s *AuthService) generateToken(userID uint) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(time.Hour * 72).Unix(),
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}

func toUserResponse(user *models.User) UserResponse {
	return UserResponse{
		ID:                user.ID,
		Username:          user.Username,
		Email:             user.Email,
		FullName:          user.FullName,
		Bio:               user.Bio,
		ProfilePictureURL: user.ProfilePictureURL,
		IsPrivate:         user.IsPrivate,
	}
}
