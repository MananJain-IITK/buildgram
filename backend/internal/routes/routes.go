package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/harshit/buildgram/internal/handlers"
	"github.com/harshit/buildgram/internal/middlewares"
)

// SetupRoutes configures all API routes.
func SetupRoutes(
	router *gin.Engine,
	jwtSecret string,
	authHandler *handlers.AuthHandler,
	userHandler *handlers.UserHandler,
	postHandler *handlers.PostHandler,
	interactionHandler *handlers.InteractionHandler,
	storyHandler *handlers.StoryHandler,
) {
	api := router.Group("/api")

	// Public auth routes
	auth := api.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
	}

	// Protected routes (require JWT)
	protected := api.Group("")
	protected.Use(middlewares.AuthMiddleware(jwtSecret))
	{
		// Auth
		protected.GET("/auth/me", authHandler.GetMe)

		// User routes
		protected.GET("/users/search", userHandler.SearchUsers)
		protected.GET("/users/:id", userHandler.GetProfile)
		protected.PUT("/users/profile", userHandler.UpdateProfile)
		protected.POST("/users/profile/picture", userHandler.UploadProfilePicture)

		// Post routes
		protected.POST("/posts", postHandler.CreatePost)
		protected.GET("/posts/feed", postHandler.GetFeed)
		protected.GET("/posts/explore", postHandler.GetExplorePosts)
		protected.GET("/posts/user/:id", postHandler.GetUserPosts)
		protected.GET("/posts/:id", postHandler.GetPost)
		protected.DELETE("/posts/:id", postHandler.DeletePost)

		// Interaction routes
		protected.POST("/posts/:id/like", interactionHandler.ToggleLike)
		protected.POST("/posts/:id/comments", interactionHandler.AddComment)
		protected.GET("/posts/:id/comments", interactionHandler.GetComments)
		protected.DELETE("/comments/:id", interactionHandler.DeleteComment)

		// Follow routes
		protected.POST("/users/:id/follow", interactionHandler.ToggleFollow)
		protected.GET("/users/:id/followers", interactionHandler.GetFollowers)
		protected.GET("/users/:id/following", interactionHandler.GetFollowing)

		// Story routes
		protected.POST("/stories", storyHandler.CreateStory)
		protected.GET("/stories/feed", storyHandler.GetFeedStories)
		protected.GET("/stories/user/:id", storyHandler.GetUserStories)
	}
}
