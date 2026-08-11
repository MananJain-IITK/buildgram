package repositories

import (
	"github.com/harshit/buildgram/internal/models"
	"gorm.io/gorm"
)

// PostRepository handles database operations for Post model.
type PostRepository struct {
	db *gorm.DB
}

// NewPostRepository creates a new PostRepository.
func NewPostRepository(db *gorm.DB) *PostRepository {
	return &PostRepository{db: db}
}

// Create inserts a new post into the database.
func (r *PostRepository) Create(post *models.Post) error {
	return r.db.Create(post).Error
}

// FindByID retrieves a post by its ID with associated user, comments, and likes.
func (r *PostRepository) FindByID(id uint) (*models.Post, error) {
	var post models.Post
	err := r.db.Preload("User").Preload("Likes").First(&post, id).Error
	return &post, err
}

// GetFeed retrieves posts from followed users, ordered by newest first.
func (r *PostRepository) GetFeed(userID uint, offset, limit int) ([]models.Post, error) {
	var posts []models.Post
	err := r.db.
		Preload("User").
		Preload("Likes").
		Preload("Comments", func(db *gorm.DB) *gorm.DB {
			return db.Order("comments.created_at DESC").Limit(3).Preload("User")
		}).
		Where("user_id IN (SELECT following_id FROM follows WHERE follower_id = ?) OR user_id = ?", userID, userID).
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&posts).Error
	return posts, err
}

// GetUserPosts retrieves all posts by a specific user.
func (r *PostRepository) GetUserPosts(userID uint, offset, limit int) ([]models.Post, error) {
	var posts []models.Post
	err := r.db.
		Preload("User").
		Preload("Likes").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&posts).Error
	return posts, err
}

// Delete removes a post (soft delete).
func (r *PostRepository) Delete(id, userID uint) error {
	return r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Post{}).Error
}

// GetExplorePosts returns recent posts for the explore page (all users — kept for reference).
func (r *PostRepository) GetExplorePosts(offset, limit int) ([]models.Post, error) {
	var posts []models.Post
	err := r.db.
		Preload("User").
		Preload("Likes").
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&posts).Error
	return posts, err
}

// GetExplorePostsPublic returns posts only from public accounts,
// plus posts from private accounts that the current viewer follows.
func (r *PostRepository) GetExplorePostsPublic(currentUserID uint, offset, limit int) ([]models.Post, error) {
	var posts []models.Post
	err := r.db.
		Preload("User").
		Preload("Likes").
		Joins("JOIN users ON users.id = posts.user_id").
		Where(
			"users.is_private = false OR users.id = ? OR users.id IN (SELECT following_id FROM follows WHERE follower_id = ?)",
			currentUserID, currentUserID,
		).
		Where("posts.deleted_at IS NULL").
		Order("posts.created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&posts).Error
	return posts, err
}
