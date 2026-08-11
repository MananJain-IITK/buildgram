# BuildGram — Comprehensive Technical Documentation & Interview Preparation Guide

> **Project:** BuildGram — An Instagram-Inspired Full-Stack Social Media Application  
> **Stack:** React 19 (TypeScript) · Go 1.25 · PostgreSQL 15 · GORM · Gin · JWT · Docker  
> **Purpose:** This document is a deep-dive reference for technical interviews, covering every architectural decision, implementation detail, trade-off, and rationale embedded in the codebase.

---

## Table of Contents

1. [STAR Format Project Overview](#1-star-format-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Backend — Deep Dive](#3-backend--deep-dive)
4. [Frontend — Deep Dive](#4-frontend--deep-dive)
5. [Database Design & Relational Modeling](#5-database-design--relational-modeling)
6. [Deployment & Docker](#6-deployment--docker)
7. [Security Analysis](#7-security-analysis)
8. [Scalability Analysis](#8-scalability-analysis)
9. [Interview Questions & Answers](#9-interview-questions--answers)

---

## 1. STAR Format Project Overview

### Situation
Social media platforms have become the backbone of modern digital communication. Teaching full-stack software engineering in isolation — disconnected from real-world product complexity — often fails to prepare developers for industry challenges. Mentees who had learned individual technologies (React, SQL, REST APIs) in isolation struggled to understand how they work together in a cohesive production system.

### Task
Design, architect, and guide the construction of **BuildGram**: a feature-complete, production-quality, Instagram-inspired social media platform. The goal was to give 30+ mentees hands-on experience implementing:
- Stateless JWT-based authentication
- RESTful API design with clean separation of concerns (Handler → Service → Repository)
- Relational database modeling with proper indexing and constraints
- Media file upload and static file serving
- A full React SPA with protected routes, global state, and a real-time-feel UI
- Containerized deployment using Docker and Docker Compose

### Action
The project was built using a deliberate, layered architecture:
- **Go + Gin** on the backend for type-safety, performance, and concurrency primitives
- **GORM** as the ORM to abstract database operations while staying close to SQL
- **PostgreSQL 15** as the relational database with composite unique indexes enforcing business rules at the DB level
- **React 19 with TypeScript** on the frontend, using Context API for global auth state
- **Axios** as the HTTP client with request/response interceptors for transparent JWT attachment and 401 handling
- **Vite** as the frontend build tool for fast HMR and ESM-native bundling
- **Docker Compose** to orchestrate the three-service stack (db, backend, frontend) with health-check dependencies

### Result
The result is a fully functional Instagram clone with:
- User registration, login, and JWT-based session management
- Profile pages with follow/unfollow, bio, post count, follower/following counts, and profile picture upload
- Photo posts with captions, a chronological follower feed, and an explore grid
- Like toggling with real-time count updates, comment threads with optimistic UI
- Responsive design: sidebar navigation on desktop, bottom tab bar on mobile
- Containerized and deployable with a single `docker-compose up` command

---

## 2. System Architecture

```
+------------------------------------------------------------------------------------+
|                              CLIENT LAYER                                          |
|  React 19 (TypeScript) + Vite + TailwindCSS v4                                    |
|  App.tsx (Router) | AuthContext (Global Auth) | api.ts (Axios) | Pages/Components  |
+------------------------------------------------------------------------------------+
                     |  HTTP/REST  (JSON + multipart/form-data)
                     |  Authorization: Bearer <JWT>
+------------------------------------------------------------------------------------+
|                           API GATEWAY LAYER                                        |
|  Gin Router: CORSMiddleware -> AuthMiddleware -> Route Handler                     |
|                                                                                    |
|  AuthHandler   UserHandler   PostHandler   InteractionHandler                      |
|       |              |             |               |                               |
|  AuthService   UserService   PostService   InteractionService                      |
|       |              |             |               |                               |
|  UserRepo    UserRepo/       PostRepo/     LikeRepo/CommentRepo/                   |
|              FollowRepo      LikeRepo/     FollowRepo                              |
|                              CommentRepo                                           |
+------------------------------------------------------------------------------------+
                     |
+------------------------------------------------------------------------------------+
|                        PostgreSQL 15                                               |
|           users | posts | likes | comments | follows                               |
+------------------------------------------------------------------------------------+
                     |
+------------------------------------------------------------------------------------+
|                      Filesystem (/uploads)                                         |
|             /uploads/posts/  |  /uploads/profiles/                                |
+------------------------------------------------------------------------------------+
```

**Architectural Principle:** The backend follows a strict **3-layer architecture**: Handlers (HTTP) → Services (Business Logic) → Repositories (Data Access). No layer may skip or bypass an adjacent layer. This separation ensures testability, reusability, and clear ownership of concerns.

---

## 3. Backend — Deep Dive

### 3.1 Entry Point & Dependency Injection (`cmd/api/main.go`)

**Explanation:**
`main.go` is the application's composition root. It manually wires together every dependency in a specific order:
1. Load config from environment
2. Initialize the DB connection
3. Run GORM auto-migrations to ensure the schema is up-to-date
4. Create required filesystem directories for uploads
5. Instantiate repositories (pass `*gorm.DB`)
6. Instantiate services (pass repositories + config values)
7. Instantiate handlers (pass services)
8. Build the Gin router, attach middleware, register routes
9. Start the HTTP server

**Rationale — Manual Dependency Injection:**
The choice to do manual DI (rather than a DI framework like `wire` or `fx`) was intentional for a teaching context. Every dependency is explicit in the source code, making the data flow completely readable. There is no "magic" container resolving dependencies behind the scenes.

**Alternatives Considered:**

| Option | Description | Rejected Because |
|--------|-------------|-----------------|
| `google/wire` | Compile-time DI code generation | Adds build complexity; obscures flow for learners |
| `uber/fx` | Runtime DI with reflection | Hides wiring; overkill for this scope |
| Global singletons | Package-level `var DB *gorm.DB` | Implicit coupling, untestable, anti-pattern |

**Trade-offs:**
- Completely transparent; any developer can trace the dependency graph by reading `main.go`
- Zero third-party DI library dependency
- Doesn't scale elegantly to 50+ services; `main.go` grows proportionally

**Scalability:**
For a project at this scale, manual DI is perfectly appropriate. At 10x the number of services, migrating to `wire` (which auto-generates the same code we write manually) would be the natural evolution.

---

### 3.2 Configuration Management (`config/config.go`)

**Explanation:**
The `Config` struct centralizes all runtime configuration. `LoadConfig()` attempts to load a `.env` file via `godotenv`, then reads each key from the environment with a sensible default fallback using `getEnv()`.

```go
func getEnv(key, fallback string) string {
    if value, exists := os.LookupEnv(key); exists {
        return value
    }
    return fallback
}
```

Key configuration fields:
- **DB connection params** (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSLMODE`)
- **`JWT_SECRET`** — The HMAC signing key. Defaults to `"default-secret"` in dev
- **`UPLOAD_DIR`** — Base path for uploaded files
- **`MAX_UPLOAD_SIZE`** — Defaults to 10MB (10485760 bytes)

**`GetDSN()` — Conditional DSN construction:**
The DSN builder omits the `password=` clause entirely when the password is empty. This enables local development with trust authentication (no password set) without code changes.

**Rationale:**
The 12-factor app methodology mandates storing config in the environment, not in code. This pattern enables the same binary to run in dev (no password, local Postgres) and production (full credentials, SSL) without recompilation.

**Alternatives Considered:**

| Option | Rejected Because |
|--------|-----------------|
| Hardcoded values | Fails 12-factor; requires recompilation per environment |
| YAML/TOML config files | More complex parsing; still needs env override support for secrets |
| Consul/Vault | Overkill for this project scope; adds operational complexity |

---

### 3.3 Database Initialization & Connection Pooling (`config/database.go`)

**Explanation:**
`InitDB()` opens a GORM connection using the `pgx`-backed Postgres driver and configures the underlying `database/sql` connection pool:

```go
sqlDB.SetMaxIdleConns(10)
sqlDB.SetMaxOpenConns(100)
```

- **`MaxIdleConns(10)`**: The pool maintains up to 10 open, idle connections ready for immediate reuse. Reduces connection establishment latency for bursty traffic.
- **`MaxOpenConns(100)`**: Hard cap on total connections. Prevents overwhelming Postgres (which defaults to 100 max connections on many setups).

**Rationale:**
Go's `database/sql` pool is connection-oriented (unlike Node.js which is single-threaded). Each goroutine handling an HTTP request may need its own connection concurrently. Without these limits, a traffic spike could open thousands of connections, crashing Postgres.

**Trade-offs:**
- Simple, effective for moderate traffic
- GORM's logging mode (`logger.Info`) logs all SQL queries — invaluable during development and mentoring
- No `SetConnMaxLifetime` configured — in very long-running services, connections can go stale

**Scalability:**
When scaling horizontally (multiple backend instances), each instance holds its own pool. With 3 instances × 100 max connections = 300 potential connections to Postgres. At that scale, PgBouncer in front of Postgres becomes necessary.

---

### 3.4 Data Models & Schema Design

The data model maps directly to Instagram's core entities. Each Go struct is annotated with GORM struct tags that control DDL generation.

#### `User` Model

```go
type User struct {
    ID                uint           `gorm:"primaryKey"`
    Username          string         `gorm:"uniqueIndex;size:30;not null"`
    Email             string         `gorm:"uniqueIndex;size:255;not null"`
    PasswordHash      string         `gorm:"not null" json:"-"`
    FullName          string         `gorm:"size:100"`
    Bio               string         `gorm:"size:500"`
    ProfilePictureURL string         `gorm:"size:500"`
    CreatedAt         time.Time
    UpdatedAt         time.Time
    DeletedAt         gorm.DeletedAt `gorm:"index"`
}
```

**Key decisions:**
- **`json:"-"` on `PasswordHash`**: Critical. The `-` tag instructs Go's JSON marshaler to *never* include this field in any API response, even if someone accidentally serializes the full `User` struct. Prevents password hash leakage at the language level.
- **`gorm.DeletedAt`**: Enables **soft deletes**. Instead of `DELETE FROM users`, GORM sets `deleted_at = NOW()`. Queries automatically filter `WHERE deleted_at IS NULL`.
- **`uniqueIndex` on `username` and `email`**: Enforced at the database level, not just the application level. Even if a bug bypasses the service-layer uniqueness check, the DB will reject duplicate inserts.
- **Size constraints**: Map to `VARCHAR(N)` columns, preventing unbounded data growth.

#### `Follow` Model — Composite Unique Index

```go
type Follow struct {
    ID          uint `gorm:"primaryKey"`
    FollowerID  uint `gorm:"not null;uniqueIndex:idx_follower_following"`
    FollowingID uint `gorm:"not null;uniqueIndex:idx_follower_following"`
    CreatedAt   time.Time
}
```

**The composite unique index `idx_follower_following` on `(follower_id, following_id)` is the most important constraint in the schema.** It prevents a user from following the same user twice at the database level, making the application's toggle logic idempotent and safe under race conditions.

#### `Like` Model — Composite Unique Index

```go
type Like struct {
    ID        uint `gorm:"primaryKey"`
    PostID    uint `gorm:"not null;uniqueIndex:idx_user_post_like"`
    UserID    uint `gorm:"not null;uniqueIndex:idx_user_post_like"`
    CreatedAt time.Time
}
```

Same rationale as `Follow`: prevents double-liking at the database level.

**Schema Design Alternatives Considered:**

| Alternative | Rejected Because |
|-------------|-----------------|
| Storing `follower_count` as a denormalized column | Denormalization risks inconsistency; counts are cheap to compute with indexed `COUNT(*)` |
| Storing `image_url` as a BLOB in the DB | Databases are not designed for large binary data; filesystem storage with URL references is the industry standard |
| Using `uuid` instead of `uint` for PKs | UUIDs are non-sequential, causing index fragmentation in B-trees; auto-increment integers are more efficient for this scale |

---

### 3.5 Auto-Migration Strategy (`models/migrate.go`)

```go
func AutoMigrate(db *gorm.DB) {
    err := db.AutoMigrate(&User{}, &Post{}, &Comment{}, &Like{}, &Follow{})
}
```

**Explanation:**
GORM's `AutoMigrate` inspects the current database schema and compares it against the Go struct definitions. It then issues `ALTER TABLE` statements to create missing tables, add missing columns, and create missing indexes. It **never drops columns or tables** (safe by design).

**Alternatives Considered:**

| Tool | Trade-offs |
|------|-----------|
| **golang-migrate** | File-based migrations (up/down SQL files). More control; better for teams. |
| **goose** | Similar to golang-migrate; adds versioning. Production-grade. |
| **Atlas** | Generates migrations from Go struct diff. Best of both worlds. |
| **Manual SQL scripts** | Maximum control; zero magic; painful to maintain. |

**Trade-offs of AutoMigrate:**
- Zero extra files; structs are the single source of truth
- Perfect for iterative development
- Cannot drop columns (intentional safety feature, but means schema drift over time)
- Not suitable for production systems where migration audit trails are required

> **Defensibility:** "We used AutoMigrate because it's the right tool for rapid, iterative development and teaching. In a production system, I would migrate to Atlas or golang-migrate to get explicit, reversible, versioned migrations."

---

### 3.6 Repository Pattern

The repository pattern abstracts all database access behind a well-defined interface. Each repository is a concrete struct holding a `*gorm.DB` instance.

**Why the Repository Pattern?**
1. **Testability**: Services can be tested with a mock repository without needing a real database.
2. **Single Responsibility**: Handlers contain HTTP logic; services contain business logic; repositories contain data access logic. No SQL leaks into services or handlers.
3. **Replaceability**: Swapping PostgreSQL for another database only requires rewriting the repository layer.

#### `UserRepository` — Case-insensitive Search

```go
func (r *UserRepository) SearchUsers(query string, limit int) ([]models.User, error) {
    err := r.db.Where("username ILIKE ?", "%"+query+"%").Limit(limit).Find(&users).Error
}
```

`ILIKE` is PostgreSQL-specific (case-insensitive LIKE). It avoids `LOWER(username) LIKE LOWER(?)` which prevents index use. Note: for production, a `pg_trgm` trigram index would be added to support fast `ILIKE` searches.

#### `PostRepository` — Feed Query

```go
func (r *PostRepository) GetFeed(userID uint, offset, limit int) ([]models.Post, error) {
    err := r.db.
        Preload("User").
        Preload("Likes").
        Preload("Comments", func(db *gorm.DB) *gorm.DB {
            return db.Order("comments.created_at DESC").Limit(3).Preload("User")
        }).
        Where("user_id IN (SELECT following_id FROM follows WHERE follower_id = ?) OR user_id = ?", userID, userID).
        Order("created_at DESC").
        Offset(offset).Limit(limit).
        Find(&posts).Error
}
```

GORM's `Preload` issues separate `SELECT ... WHERE post_id IN (...)` queries for each preloaded relation — mitigating the N+1 query problem via batch loading.

#### `FollowRepository` — JOIN-based User Fetching

```go
func (r *FollowRepository) GetFollowers(userID uint, offset, limit int) ([]models.User, error) {
    err := r.db.
        Joins("JOIN follows ON follows.follower_id = users.id").
        Where("follows.following_id = ?", userID).
        Offset(offset).Limit(limit).
        Find(&users).Error
}
```

Uses a JOIN rather than two queries (find follow records, then fetch users by ID list), producing a single efficient SQL query.

---

### 3.7 Service Layer — Business Logic

Services contain business logic and orchestrate repositories. They never touch `*gin.Context` or HTTP concerns.

**Key pattern — DTOs (Data Transfer Objects):**

```go
// Input DTO — validated by Gin's ShouldBindJSON
type RegisterInput struct {
    Username string `json:"username" binding:"required,min=3,max=30"`
    Email    string `json:"email" binding:"required,email"`
    Password string `json:"password" binding:"required,min=6"`
}

// Output DTO — never exposes PasswordHash
type UserResponse struct {
    ID       uint   `json:"id"`
    Username string `json:"username"`
    Email    string `json:"email"`
    // ...
}
```

**Why separate DTOs from models?**
If the handler directly serialized `models.User`, a developer could accidentally add a field to the User struct without realizing it would be exposed in the API. The explicit `UserResponse` DTO creates a controlled surface area for API responses.

---

### 3.8 Authentication — JWT Implementation (`auth_service.go`)

**Token Generation:**

```go
func (s *AuthService) generateToken(userID uint) (string, error) {
    claims := jwt.MapClaims{
        "user_id": userID,
        "exp":     time.Now().Add(time.Hour * 72).Unix(),  // 3 days
        "iat":     time.Now().Unix(),
    }
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte(s.jwtSecret))
}
```

**Claims design:**
- **`user_id`**: Minimalist payload — only the identity claim needed
- **`exp` (72 hours)**: 3-day TTL balances security with UX
- **`iat` (issued-at)**: Useful for token revocation strategies
- **`jwt.SigningMethodHS256`**: HMAC-SHA256 symmetric signing; appropriate for single-service architecture

**Rationale — JWT over Session-based auth:**

| Aspect | JWT | Session-based |
|--------|-----|--------------|
| **Statelessness** | Server holds no state | Requires session store (Redis, DB) |
| **Scalability** | Any server can verify token | Session store becomes a bottleneck |
| **Revocation** | Cannot revoke before expiry without a blocklist | Server-side session can be deleted instantly |
| **Mobile-friendliness** | Works well with HTTP headers | Cookie-based sessions are tricky on mobile |

**The registration flow:**

```
Client -> POST /api/auth/register { username, email, password }
AuthHandler.Register()
  -> ShouldBindJSON (validates required fields, email format, min length)
AuthService.Register()
  -> Check email uniqueness (DB)
  -> Check username uniqueness (DB)
  -> bcrypt.GenerateFromPassword(password, DefaultCost)
  -> userRepo.Create(user)
  -> generateToken(user.ID)
Response: { token: "eyJ...", user: { id, username, email, ... } }
```

---

### 3.9 Password Hashing — bcrypt

```go
hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
```

**`bcrypt.DefaultCost`** is currently 10, meaning 2^10 = 1024 iterations of the Blowfish encryption. This takes ~100ms per hash on modern hardware, making brute-force attacks impractical.

**Verification:**
```go
bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password))
```
bcrypt's comparison is constant-time, preventing timing attacks.

**Algorithm comparison:**

| Algorithm | Status |
|-----------|--------|
| MD5 / SHA-1 / SHA-256 | Never use for passwords — fast, no salt, rainbow table vulnerable |
| PBKDF2 | Acceptable; used in Django; adjustable iterations |
| Argon2id | Current gold standard (Password Hashing Competition winner) |
| bcrypt (chosen) | Time-tested, widely supported, battle-hardened |

---

### 3.10 File Upload & Image Handling

**Upload Flow:**

```
Client -> POST /api/posts (multipart/form-data: image + caption)
PostHandler.CreatePost()
  -> c.Request.FormFile("image")
PostService.CreatePost()
  -> Validate file extension (.jpg, .jpeg, .png, .gif, .webp)
  -> ValidateImageAspectRatio() — decode image header, get dimensions
  -> Generate unique filename: post_{userID}_{unixNanoTimestamp}.ext
  -> io.Copy(dst, file) — stream to disk
  -> postRepo.Create() — store URL in DB
```

**Filename uniqueness strategy:**
```go
filename := fmt.Sprintf("post_%d_%d%s", userID, time.Now().UnixNano(), ext)
```
Combining `userID` + `UnixNano()` timestamp virtually eliminates collision probability.

**The seek-back pattern:**
```go
func ValidateImageAspectRatio(file multipart.File) (int, int, error) {
    imgConfig, _, err := image.DecodeConfig(file)
    if seeker, ok := file.(io.Seeker); ok {
        seeker.Seek(0, io.SeekStart)  // Reset position for subsequent io.Copy
    }
    return imgConfig.Width, imgConfig.Height, nil
}
```
`image.DecodeConfig` advances the read position. Seeking back to 0 ensures subsequent `io.Copy` reads the complete file from the beginning.

**Alternatives for file storage:**

| Option | Trade-offs |
|--------|-----------|
| **Local filesystem** (chosen) | Simple, no cost; doesn't scale horizontally |
| **AWS S3** | Industry standard; scales infinitely; requires AWS credentials |
| **Cloudinary** | Adds image transformation automatically; paid service |
| **MinIO** (S3-compatible) | Self-hosted S3 API; good next step from local FS |

---

### 3.11 Feed Generation

The feed query is the most architecturally significant query in the application:

```go
Where("user_id IN (SELECT following_id FROM follows WHERE follower_id = ?) OR user_id = ?", userID, userID)
```

**Explanation:**
Fetches posts where the author is someone the current user follows, **or** the current user themselves. This matches Instagram's exact behavior.

**Pagination:**
```go
Offset(offset).Limit(limit)
```
Offset-based pagination is simple to implement. For large datasets, keyset pagination (cursor-based: `WHERE created_at < ?`) is more efficient as it doesn't scan over skipped rows.

**Feed Algorithm Complexity:**
This is a **pull model** (fan-out on read): each feed request computes the feed on-demand from the follows graph.

| Feed Strategy | Approach | Scale |
|---------------|----------|-------|
| **Pull (fan-out on read)** (chosen) | Query follows graph per-request | Works to ~1M users |
| **Push (fan-out on write)** | Pre-populate timeline in Redis | Needed at 10M+ users |
| **Hybrid** | Push for regular users; pull for celebrities | Instagram's actual approach |

---

### 3.12 HTTP Handlers

Handlers are thin. Their sole responsibility:
1. Parse and validate the HTTP request
2. Extract the current user ID from `gin.Context`
3. Call the appropriate service method
4. Map the service result (or error) to an HTTP status code and JSON body

**Input Validation via Gin binding:**
```go
var input services.RegisterInput
if err := c.ShouldBindJSON(&input); err != nil {
    c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
    return
}
```

The `binding:"required,min=3,max=30"` tags on the input struct are evaluated by `go-playground/validator`. If validation fails, Gin returns a descriptive error message automatically.

---

### 3.13 Routing & Route Groups (`routes/routes.go`)

```go
api := router.Group("/api")

// Public routes — no auth required
auth := api.Group("/auth")
auth.POST("/register", authHandler.Register)
auth.POST("/login", authHandler.Login)

// Protected routes — JWT required
protected := api.Group("")
protected.Use(middlewares.AuthMiddleware(jwtSecret))
// ... all other routes
```

Gin's `Group()` allows attaching middleware to a subset of routes. The `protected` group has `AuthMiddleware` applied at the group level — any new route added to this group automatically requires authentication. This prevents the common bug of forgetting to apply auth middleware to a new endpoint.

**Complete API Surface:**

| Method | Path | Action |
|--------|------|--------|
| POST | `/api/auth/register` | Create user account |
| POST | `/api/auth/login` | Authenticate, get JWT |
| GET | `/api/auth/me` | Get current user identity |
| GET | `/api/users/:id` | Get user profile |
| PUT | `/api/users/profile` | Update own profile |
| POST | `/api/users/profile/picture` | Upload profile picture |
| GET | `/api/users/search?q=...` | Search users |
| POST | `/api/posts` | Create a post |
| GET | `/api/posts/feed` | Get follower feed |
| GET | `/api/posts/explore` | Get explore grid |
| GET | `/api/posts/user/:id` | Get user's posts |
| GET | `/api/posts/:id` | Get single post |
| DELETE | `/api/posts/:id` | Delete own post |
| POST | `/api/posts/:id/like` | Toggle like |
| POST | `/api/posts/:id/comments` | Add comment |
| GET | `/api/posts/:id/comments` | Get comments |
| DELETE | `/api/comments/:id` | Delete comment |
| POST | `/api/users/:id/follow` | Toggle follow |
| GET | `/api/users/:id/followers` | Get followers |
| GET | `/api/users/:id/following` | Get following |

---

### 3.14 JWT Auth Middleware (`middlewares/auth.go`)

```go
token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
    // Algorithm validation — prevents "alg:none" attacks
    if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
        return nil, jwt.ErrSignatureInvalid
    }
    return []byte(jwtSecret), nil
})
```

**Algorithm validation (`token.Method.(*jwt.SigningMethodHMAC)`):**
Guards against the **"algorithm confusion attack"** (the `alg:none` attack). If this check were absent, an attacker could craft a token with `"alg": "none"` and no signature — the library would accept it. By verifying the algorithm is specifically HMAC, any token signed with a different algorithm is rejected.

**Closure pattern:**
The middleware returns a `gin.HandlerFunc` closure that captures `jwtSecret`. The secret is baked into the handler function at initialization time, avoiding a global variable.

---

### 3.15 CORS Middleware (`middlewares/cors.go`)

```go
cors.New(cors.Config{
    AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000"},
    AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
    AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
    AllowCredentials: true,
    MaxAge:           12 * time.Hour,
})
```

**Explanation:**
CORS is required because the frontend (`localhost:5173`) and backend (`localhost:8080`) are on different origins. Browsers block cross-origin requests by default; CORS headers instruct the browser to allow them.

- **`AllowCredentials: true`**: Needed when sending `Authorization` headers cross-origin
- **`MaxAge: 12 * time.Hour`**: Preflight `OPTIONS` requests are cached for 12 hours, avoiding a round-trip on every cross-origin request

---

## 4. Frontend — Deep Dive

### 4.1 Technology Stack Choices

| Technology | Version | Rationale |
|-----------|---------|-----------|
| **React** | 19 | Latest stable; large ecosystem; most job market demand |
| **TypeScript** | ~5.7 | Type safety; catches interface mismatches at compile time |
| **Vite** | ^6 | ESM-native; sub-100ms HMR; fast dev experience |
| **TailwindCSS** | ^4 | Utility-first; rapid UI development; Vite JIT plugin |
| **React Router v7** | ^7 | Nested layouts via `<Outlet>`; declarative routing |
| **Axios** | ^1.7 | Interceptors for JWT injection and 401 handling |
| **lucide-react** | ^0.400 | Consistent, tree-shakable icon library |
| **clsx + tailwind-merge** | ^2.x | Conditional class merging without style conflicts |

**Why React over Vue or Svelte?**
React has the largest ecosystem, most job market demand, and most community resources — the primary criteria for a teaching project.

**Why no Redux or Zustand?**
The application's global state is limited to the authenticated user object. A full state management library would be over-engineering.

---

### 4.2 Application Entry & Routing (`App.tsx`)

```tsx
function ProtectedRoute() {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return <LoadingSpinner />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return (
        <div>
            <Navbar />
            <main className="md:ml-[72px] lg:ml-[240px] pt-14 md:pt-0">
                <Outlet />
            </main>
        </div>
    );
}
```

**`ProtectedRoute` design:**
- **`isLoading` check**: During the initial token validation, renders a spinner instead of flashing the login redirect
- **`<Navigate replace />`**: Uses `replace` to avoid polluting the browser history stack with the redirect
- **Layout in `ProtectedRoute`**: The Navbar wraps all protected routes, ensuring it appears on every authenticated page
- **`md:ml-[72px] lg:ml-[240px]`**: Offsets the main content to account for the fixed sidebar

---

### 4.3 Authentication Context (`contexts/AuthContext.tsx`)

**Token validation on mount (`loadUser`):**
```tsx
const loadUser = useCallback(async () => {
    if (!token) { setIsLoading(false); return; }
    try {
        const meRes = await authAPI.getMe();          // Validates token server-side
        const profileRes = await userAPI.getProfile(meRes.data.user_id);
        setUser(profileRes.data);
    } catch {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    } finally {
        setIsLoading(false);
    }
}, [token]);
```

Even if a valid token string is in `localStorage`, the server must confirm it's still valid. If the backend rejects the token (401), the context clears the local state, effectively logging the user out.

**`isAuthenticated` derivation:**
```tsx
isAuthenticated: !!token && !!user,
```
Both the token string AND the user object must be present. This prevents a state where the token exists but the user profile failed to load from being treated as authenticated.

**`useCallback` on `loadUser`:**
Without `useCallback`, `loadUser` would be a new function reference on every render. The `useEffect` depends on `loadUser`, so every render would trigger the effect — an infinite loop. `useCallback` memoizes the function, only creating a new one when `token` changes.

---

### 4.4 API Service Layer (`services/api.ts`)

The API service centralizes all HTTP communication behind a single Axios instance:

```typescript
const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
});
```

**`baseURL: '/api'`**: Uses a relative base URL. Vite's proxy (or Nginx in production) forwards `/api` requests to `http://localhost:8080/api`, avoiding hardcoded backend URLs.

**Organized API objects:**
```typescript
export const authAPI = { register, login, getMe };
export const userAPI = { getProfile, updateProfile, uploadProfilePicture, searchUsers };
export const postAPI = { createPost, getFeed, getExplorePosts, getUserPosts, getPost, deletePost };
export const interactionAPI = { toggleLike, addComment, getComments, deleteComment, toggleFollow, ... };
```

This organization maps directly to the backend's route groups.

---

### 4.5 Axios Interceptors

**Request interceptor — JWT injection:**
```typescript
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
```

Every request automatically gets the Bearer token, eliminating the need to pass it manually in every API call.

**Response interceptor — 401 handling:**
```typescript
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);
```

A 401 response from any endpoint triggers an immediate logout and redirect. This is a global safety net that prevents confusing error states across the UI.

---

### 4.6 PostCard Component (`components/PostCard.tsx`)

The `PostCard` is the most feature-rich component. Key implementations:

**Like UI with server sync:**
```tsx
const handleLike = async () => {
    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 300);
    try {
        const res = await interactionAPI.toggleLike(id);
        setIsLiked(res.data.is_liked);      // Server-authoritative state
        setLikeCount(res.data.like_count);   // Server-authoritative count
    } catch (err) {
        console.error('Failed to toggle like:', err);
    }
};
```

**Double-tap to like (Instagram-style):**
```tsx
const handleDoubleTap = async () => {
    if (!isLiked) {
        setShowDoubleHeartAnim(true);
        setTimeout(() => setShowDoubleHeartAnim(false), 1000);
        const res = await interactionAPI.toggleLike(id);
        setIsLiked(res.data.is_liked);
    } else {
        setShowDoubleHeartAnim(true);  // Show animation but don't unlike
        setTimeout(() => setShowDoubleHeartAnim(false), 1000);
    }
};
```

The condition `if (!isLiked)` prevents double-tapping a liked post from unliking it, matching Instagram's behavior.

**Local comment state:**
When a new comment is submitted, it's prepended to the local comments array for an instant feedback loop without refetching:
```tsx
setComments([res.data, ...comments]);
setCommentCount(prev => prev + 1);
```

**`loading="lazy"` on images:** Native browser lazy loading defers off-screen images, significantly improving initial page load performance.

---

### 4.7 Feed Page (`pages/HomePage.tsx`)

**Pagination heuristic:**
```tsx
setHasMore(newPosts.length >= 10);  // If fewer posts returned than requested, we're at the end
```

If the API returns fewer items than the page size, there are no more items — no extra API call needed.

**Why "Load More" button instead of infinite scroll?**
Infinite scroll requires an `IntersectionObserver` on the last element. The "Load More" button is simpler, more accessible, and easier for mentees to learn from.

---

### 4.8 Profile Page (`pages/ProfilePage.tsx`)

**Own profile vs. other profile:**
```tsx
const isOwnProfile = currentUser?.id === Number(id);
```

The profile page renders differently based on viewer identity:
- **Own profile**: "Edit Profile" + Settings icon
- **Other profile**: "Follow" / "Following" button

**Follow count update:**
```tsx
setProfile({
    ...profile,
    is_following: res.data.is_following,
    follower_count: profile.follower_count + (res.data.is_following ? 1 : -1),
});
```

Updated locally using the server's returned `is_following` state, avoiding a full profile refetch.

---

### 4.9 Explore Page & Search Debouncing (`pages/ExplorePage.tsx`)

**Debounced search:**
```tsx
useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
        const res = await userAPI.searchUsers(searchQuery);
        setSearchResults(res.data || []);
    }, 300);
    return () => clearTimeout(timer);  // Critical: cancel stale requests
}, [searchQuery]);
```

**Why debouncing?**
Without it, every keystroke triggers an API call. For a query like "harshit", that's 7 API calls where only the last one matters. 300ms debounce means the API is only called after the user stops typing.

**The cleanup function** `return () => clearTimeout(timer)` cancels the pending timeout when `searchQuery` changes before the 300ms fires — preventing race conditions with stale query values.

---

### 4.10 Create Post Page (`pages/CreatePostPage.tsx`)

**Client-side validation + Server-side validation (defense in depth):**
```tsx
// Client-side: instant feedback
if (!validTypes.includes(selectedFile.type)) {
    setError('Please select a valid image file');
}
if (selectedFile.size > 10 * 1024 * 1024) {
    setError('Image must be less than 10MB');
}
// Server-side: security (in post_service.go)
// Client-side validation can always be bypassed
```

**Image preview with FileReader:**
```tsx
const reader = new FileReader();
reader.onload = (ev) => setPreview(ev.target?.result as string);
reader.readAsDataURL(selectedFile);
```

Creates a local `data:` URL for preview without uploading to the server.

**Multipart form data submission:**
```typescript
const formData = new FormData();
formData.append('image', file);
formData.append('caption', caption);
api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
```

`multipart/form-data` is required because you're sending binary data alongside text data. JSON cannot encode binary data without base64 encoding, which would bloat the payload ~33%.

---

### 4.11 Navbar — Responsive Design (`components/Navbar.tsx`)

The Navbar implements a responsive layout strategy matching Instagram's navigation pattern:

- **Desktop sidebar**: `hidden md:flex fixed left-0 top-0 h-full w-[72px] lg:w-[240px]` — icon-only on tablet, icon + label on large screens
- **Mobile bottom tab bar**: `md:hidden fixed bottom-0 left-0 right-0 h-16` — fixed at the bottom like native apps
- **Mobile top bar**: Fixed header with app logo and hamburger menu

**Active state detection:**
```tsx
const isActive = location.pathname === item.path;
```
Uses `useLocation()` from React Router to apply active styles to the current route.

---

## 5. Database Design & Relational Modeling

### Entity Relationships

```
users (1) ----< posts (many)        A user has many posts
users (1) ----< comments (many)     A user has many comments
users (1) ----< likes (many)        A user has many likes
posts (1) ----< comments (many)     A post has many comments
posts (1) ----< likes (many)        A post has many likes
users (M) >----< users (N)          Users follow users (via follows table)
```

### Indexing Strategy

| Table | Column(s) | Index Type | Purpose |
|-------|----------|------------|---------|
| users | `username` | Unique B-tree | Uniqueness + O(log n) lookup |
| users | `email` | Unique B-tree | Uniqueness + O(log n) lookup by email for login |
| users | `deleted_at` | B-tree | Soft delete filter |
| posts | `user_id` | B-tree | Profile page: `WHERE user_id = ?` |
| posts | `deleted_at` | B-tree | Soft delete filter |
| likes | `(post_id, user_id)` | Composite Unique | Double-like prevention + IsLiked check |
| follows | `(follower_id, following_id)` | Composite Unique | Double-follow prevention + IsFollowing check |
| comments | `post_id` | B-tree | Fetch comments for a post |
| comments | `user_id` | B-tree | Fetch user's comments |

### Soft Deletes

GORM's `gorm.DeletedAt` field enables soft deletes. Rather than physical deletion, a `deleted_at` timestamp is set, and all queries automatically include `WHERE deleted_at IS NULL`. This provides:
1. **Data recovery**: Accidentally deleted content can be restored
2. **Referential integrity**: Foreign key relationships to deleted records remain valid
3. **Audit trail**: When and what was deleted is preserved

`Like` and `Follow` do **not** use soft delete — a like/follow is either present or absent, and there is no historical value to preserving deleted social interactions.

---

## 6. Deployment & Docker

### Docker Compose Architecture

**Service ordering with health checks:**
```yaml
backend:
  depends_on:
    db:
      condition: service_healthy
```
The backend only starts after PostgreSQL reports healthy (via `pg_isready`). Without this, the backend might start, attempt to connect to an unready DB, fail, and crash before Postgres is ready.

**Volume mounts:**
```yaml
volumes:
  db_data:         # Persistent Postgres data (survives container restarts)
  backend_uploads: # Persistent upload storage
```
Named volumes persist data across `docker-compose down` / `docker-compose up` cycles.

**Multi-stage backend Dockerfile:**
```dockerfile
FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o api ./cmd/api/main.go

FROM alpine:latest
COPY --from=builder /app/api /app/api
```
The multi-stage build keeps the final image small (~10MB vs ~300MB for `golang:alpine`). Only the compiled binary is included in the runtime image.

---

## 7. Security Analysis

### Implemented Security Measures

| Measure | Implementation | Location |
|---------|---------------|---------|
| Password hashing | bcrypt with DefaultCost (10) | `auth_service.go` |
| JWT signature verification | HMAC-SHA256 | `middlewares/auth.go` |
| Algorithm confusion prevention | `token.Method.(*jwt.SigningMethodHMAC)` check | `middlewares/auth.go` |
| SQL injection prevention | GORM parameterized queries | All repositories |
| XSS prevention | React's JSX escaping (default) | Frontend |
| CORS restriction | Whitelist of specific origins | `middlewares/cors.go` |
| Password never serialized | `json:"-"` on `PasswordHash` | `models/user.go` |
| Authorization on delete | `WHERE id = ? AND user_id = ?` | post/comment repositories |

### Known Security Gaps & Mitigations

| Gap | Risk | Mitigation |
|-----|------|-----------|
| File extension validation (not magic bytes) | Low | Use `mimetype` library (already in `go.mod`) |
| No rate limiting | Medium | Add `tollbooth` or `limiter` middleware |
| No JWT blacklist | Low | Redis blocklist + short-lived tokens + refresh tokens |
| JWT secret has insecure default | High in production | Add config validation that panics on default secret |

---

## 8. Scalability Analysis

### Current Bottlenecks

| Component | Current State | Bottleneck at Scale |
|-----------|--------------|---------------------|
| Database | Single PostgreSQL | Read replicas needed at high traffic |
| File storage | Local filesystem | Shared storage (S3) needed for multiple instances |
| Feed generation | Pull model | Needs push/cache model at high follower counts |
| Authentication | JWT stateless | No change needed; scales linearly |

### Scaling Path

**Phase 1 (~10k users):** Single server, PostgreSQL, local filesystem — works perfectly.

**Phase 2 (~100k users):**
- PostgreSQL read replicas for read-heavy queries
- S3 for file storage; CDN (CloudFront) for image delivery
- Redis for session caching and like counts

**Phase 3 (~1M users):**
- Horizontal backend scaling behind a load balancer
- Message queue (Kafka/RabbitMQ) for fan-out on write
- Separate media processing service (image resizing, thumbnail generation)
- Elasticsearch replacing `ILIKE` for user search

---

## 9. Interview Questions & Answers

### Backend / Go

---

**Q1: Why did you choose Go for the backend instead of Node.js or Python?**

**A:** Several concrete reasons tied to this project:

1. **Goroutines vs threads**: Go's goroutines are lightweight (2KB stack, vs 1MB for OS threads). Each HTTP request handled by Gin runs in its own goroutine, enabling true concurrent I/O without callback hell or async/await complexity.
2. **Static typing with compilation**: Type errors are caught at compile time. In a teaching context, this helps mentees catch interface mismatches before runtime.
3. **Single binary deployment**: `go build` produces a statically linked binary. The Docker image is a ~10MB Alpine + binary vs. a 300MB+ Node.js image with `node_modules`.
4. **Performance**: Gin benchmarks at ~60k req/s on a single core.

However, Go has a steeper initial learning curve than Node.js. For a small team or solo project, Node.js with TypeScript would be equally valid.

---

**Q2: Walk me through what happens when a user logs in.**

**A:**
1. Frontend calls `POST /api/auth/login` with JSON body `{ email, password }`.
2. Gin routes to `AuthHandler.Login()` — no auth middleware on this route.
3. `ShouldBindJSON(&input)` validates email format (via `binding:"email"` tag) and that password is non-empty.
4. `AuthService.Login()` calls `userRepo.FindByEmail(input.Email)` — `SELECT * FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1`.
5. `bcrypt.CompareHashAndPassword(storedHash, providedPassword)` — constant-time comparison taking ~100ms.
6. If passwords match: `generateToken(user.ID)` creates a JWT with `user_id`, `exp` (72h), `iat` claims, signed with HMAC-SHA256.
7. Returns `AuthResponse{Token, UserResponse}` — `PasswordHash` is excluded by `json:"-"`.
8. Frontend's `AuthContext.login()` stores the token in `localStorage`, sets `user` and `token` state. React re-renders; `ProtectedRoute` sees `isAuthenticated: true` and renders the home page.

---

**Q3: How do you prevent a user from liking a post twice?**

**A:** Defense in depth — two layers:

1. **Service layer**: `InteractionService.ToggleLike()` first calls `likeRepo.IsLiked(postID, userID)`. If already liked, it calls `likeRepo.Delete()` (unlike) instead of `Create()`.
2. **Database layer**: The `likes` table has a composite unique index `UNIQUE(post_id, user_id)`. Even if a race condition bypassed the service check (two concurrent requests both see `IsLiked = false`), only one `INSERT` succeeds; the second gets a unique constraint violation.

The database constraint is the authoritative safeguard. The service-layer check prevents unnecessary database errors from propagating to the user.

---

**Q4: Explain the N+1 query problem and how you addressed it.**

**A:** The N+1 problem occurs when you fetch N records and then make N additional queries to fetch related data for each record.

Example without addressing it: fetch 10 posts (1 query), then for each post, fetch its likes (10 queries) = 11 queries total.

In `post_repo.go`, GORM's `Preload` is used:
```go
db.Preload("User").Preload("Likes").Find(&posts)
```

GORM translates this into:
1. `SELECT * FROM posts WHERE ... LIMIT 10` (1 query)
2. `SELECT * FROM users WHERE id IN (1, 2, 3, ...)` (1 batch query for all post authors)
3. `SELECT * FROM likes WHERE post_id IN (1, 2, 3, ...)` (1 batch query for all likes)

Total: 3 queries instead of 11. This is the "eager loading" pattern — GORM uses the `IN` clause to batch-load related records.

---

**Q5: What is the difference between `gorm.Save()` and `gorm.Updates()` and which did you use?**

**A:**
- `db.Save(user)` performs a full record update, writing all fields including zero-values. Equivalent to `UPDATE users SET username=?, email=?, ..., full_name=? WHERE id=?` for every single column.
- `db.Updates(map[string]interface{}{...})` only updates specified fields.

`db.Save(user)` is used in `user_repo.go`. The service layer first fetches the user, modifies only the relevant fields, then calls `Save`. Since Go's zero values (empty string) could overwrite valid data, the service layer guards against this:
```go
if input.FullName != "" {
    user.FullName = input.FullName
}
```

The pattern — fetch → modify → save — is safe and readable. The `Updates` alternative would require building a map of changed fields, which is more complex.

---

**Q6: How does the feed query work and why does it use a subquery?**

**A:** The feed query is:
```sql
SELECT * FROM posts
WHERE user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)
   OR user_id = ?
ORDER BY created_at DESC
OFFSET ? LIMIT ?
```

The subquery returns the set of user IDs that the current user follows. The outer query then fetches posts from those users. The `OR user_id = ?` clause includes the viewer's own posts (exactly as Instagram does).

**Why a subquery?**
PostgreSQL's query planner often converts IN subqueries to JOINs anyway. The subquery form is more readable and self-documenting. The key performance requirement is that `follows.follower_id` is indexed, which it is via the composite unique index `(follower_id, following_id)`.

---

**Q7: What is the `toPostResponse` function and why is it necessary?**

**A:** `toPostResponse` in `post_service.go` converts a raw `models.Post` (ORM struct) into a `PostResponse` (DTO):

```go
func (s *PostService) toPostResponse(post *models.Post, currentUserID uint) *PostResponse {
    isLiked, _ := s.likeRepo.IsLiked(post.ID, currentUserID)
    likeCount, _ := s.likeRepo.GetLikeCount(post.ID)
    commentCount, _ := s.commentRepo.GetCommentCount(post.ID)
    return &PostResponse{IsLiked: isLiked, LikeCount: likeCount, ...}
}
```

It's necessary because:
1. **`IsLiked` is viewer-dependent**: Whether the current user liked a post is not a property of the post itself — it depends on who's asking.
2. **Aggregated counts**: `LikeCount` and `CommentCount` are computed from related tables, not stored on the post.
3. **Shape control**: The DTO explicitly selects which fields to expose, preventing accidental leakage of internal fields.

The trade-off: this function makes 2 additional DB queries per post. For a feed of 10 posts, that's 20 extra queries — a known N+1 pattern within the service layer that would be batched in a production optimization.

---

### Frontend / React

---

**Q8: Why use React Context for auth state instead of Redux?**

**A:** Context is sufficient for auth state because:
1. **Single piece of global state**: Only the current user and token need to be globally accessible.
2. **Low update frequency**: Auth state changes only on login, logout, and profile update — not on every user interaction.
3. **No derived state complexity**: No selectors, reducers, or action creators needed.

Redux would be justified if we had complex cross-feature state (e.g., a notification system affecting dozens of components, or optimistic updates with rollback across multiple resources). For auth state alone, Context is the industry-standard pattern.

---

**Q9: Explain the `isLoading` state in `AuthContext` and why it's necessary.**

**A:** On page load, `isLoading` starts as `true`. `loadUser` makes two API calls to validate the stored token and fetch the user profile. During this period, `isAuthenticated` is `false` because `user` is still `null`.

Without the `isLoading` check, `ProtectedRoute` would see `isAuthenticated: false` and immediately redirect to `/login`, even for users refreshing the page while logged in.

The `ProtectedRoute` shows a spinner while `isLoading` is `true`:
```tsx
if (isLoading) return <LoadingSpinner />;
if (!isAuthenticated) return <Navigate to="/login" replace />;
```
This prevents the flash of an incorrect redirect — a common UX bug in auth implementations.

---

**Q10: How does the search debouncing work and why is the cleanup function critical?**

**A:** The `useEffect` with `searchQuery` as a dependency runs every time the input changes. Instead of immediately calling the API, a 300ms timeout is set:

```tsx
const timer = setTimeout(async () => {
    const res = await userAPI.searchUsers(searchQuery);
}, 300);
return () => clearTimeout(timer);  // Cleanup
```

The cleanup function `return () => clearTimeout(timer)` is critical. When `searchQuery` changes before the 300ms fires, React runs the cleanup of the previous effect, cancelling the pending timeout. The API is only called 300ms after the user *stops* typing.

Without the cleanup, old timeouts would fire and call the API with stale query values — a race condition where out-of-order responses could display incorrect results.

---

**Q11: What is the purpose of the Axios request interceptor?**

**A:** The request interceptor runs before every Axios request is sent:
```typescript
config.headers.Authorization = `Bearer ${token}`;
```

Without it, every API call would need to manually attach the token. The interceptor centralizes this concern: add the token once, apply to all requests. It reads from `localStorage` on every request, so if the token is refreshed, subsequent requests automatically use the new value.

The response interceptor handles 401s globally, triggering logout and redirect without any per-component handling.

---

### Database / System Design

---

**Q12: Why use PostgreSQL over MongoDB for this application?**

**A:** Social media data is highly relational:
- A post belongs to a user
- A like belongs to a post and a user
- A follow connects two users

PostgreSQL gives us:
- **JOIN queries** for feed generation
- **Referential integrity** via foreign keys
- **ACID transactions** for atomic operations
- **Unique constraints** to prevent double-likes and double-follows at the DB level

MongoDB would be appropriate if posts had highly variable schemas, or if we needed horizontal sharding from day one. For this application's data model, PostgreSQL is the correct choice.

---

**Q13: What is a composite unique index and why is it critical for the `follows` table?**

**A:** A composite unique index enforces that the combination of two columns is unique across all rows. For the `follows` table:
```sql
UNIQUE(follower_id, following_id)
```

This means: a specific `(follower_id, following_id)` pair can only appear once. User 5 can follow User 10 at most once.

It's critical because it handles race conditions. If two simultaneous requests both try to create the same follow relationship, the service layer might not catch it in time. But the database will reject the second INSERT with a constraint violation, ensuring data integrity regardless of concurrency.

---

**Q14: What is soft delete and why did you implement it?**

**A:** Soft delete marks a record as deleted without physically removing it. GORM's `gorm.DeletedAt` field enables this — when you call `db.Delete(&post)`, GORM executes:
```sql
UPDATE posts SET deleted_at = NOW() WHERE id = ?
```
All subsequent queries automatically add `WHERE deleted_at IS NULL`.

Reasons:
1. **Data recovery**: Accidentally deleted content can be restored by clearing `deleted_at`.
2. **Audit trail**: You can see what was deleted and when.
3. **Referential integrity**: Likes and comments referencing a soft-deleted post still have valid foreign keys.

Trade-off: Tables grow indefinitely. A background job that hard-deletes records with `deleted_at` older than N days addresses this in production.

---

**Q15: How would you scale the feed for a user with 10 million followers?**

**A:** The current pull model breaks at this scale. The subquery `SELECT following_id FROM follows WHERE follower_id = 10M_follower_user` returns 10 million rows.

The solution is a **push model (fan-out on write)**:
1. When a user posts, a background worker reads their 10M followers list
2. It inserts the post ID into each follower's pre-computed timeline (Redis sorted set: `ZADD feed:{user_id} {timestamp} {post_id}`)
3. When a follower requests their feed, it's a single Redis sorted set read: `ZREVRANGE feed:{user_id} 0 9`

For celebrities with 100M+ followers, even pushing to 100M Redis keys is expensive. Instagram uses a **hybrid model**: push for regular users, pull for celebrities, and merge the two at read time.

---

**Q16: How does your authorization work for resource deletion?**

**A:** When deleting a post, the query includes both the post ID and the authenticated user's ID:
```go
db.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Post{})
```

If the current user doesn't own the post, `user_id` won't match, and the `DELETE` affects 0 rows. This prevents **IDOR (Insecure Direct Object Reference)** vulnerabilities where a user could delete someone else's content by guessing their resource ID.

The same pattern applies to comment deletion: `WHERE id = ? AND user_id = ?`.

---

**Q17: How does `ValidateImageAspectRatio` work and why does it seek back to the beginning of the file?**

**A:**
```go
func ValidateImageAspectRatio(file multipart.File) (int, int, error) {
    imgConfig, _, err := image.DecodeConfig(file)
    if seeker, ok := file.(io.Seeker); ok {
        seeker.Seek(0, io.SeekStart)
    }
    return imgConfig.Width, imgConfig.Height, nil
}
```

`image.DecodeConfig` reads only the image header to determine dimensions without decoding the full pixel data. However, it advances the file's read position to after the header.

If we then tried to copy the file to disk with `io.Copy`, we'd copy only the data *after* the header, resulting in a corrupted image file.

Seeking back to `io.SeekStart` (position 0) resets the read position so the subsequent `io.Copy` reads the complete file from the beginning.

---

**Q18: What is `gin.Default()` vs `gin.New()` and which did you use?**

**A:**
- `gin.New()`: Creates a router with no middleware attached.
- `gin.Default()`: Creates a router with two middleware pre-attached: `Logger()` (logs each request) and `Recovery()` (recovers from panics and returns 500 instead of crashing).

The project uses `gin.Default()` because:
1. **Logger middleware** is essential during development — every request is logged with method, path, status code, and latency.
2. **Recovery middleware** is critical for production stability — if any handler panics (nil pointer dereference, etc.), the server continues serving other requests instead of crashing.

---

**Q19: How does the Vite proxy relate to CORS in this project?**

**A:** In development, the Vite dev server runs on `localhost:5173` and the Go backend on `localhost:8080` — different origins, so direct requests would be blocked by CORS.

Vite's proxy intercepts requests to `/api` and forwards them to `http://localhost:8080/api`. From the browser's perspective, the request is to `localhost:5173` (same origin) — no CORS issue.

The backend's CORS middleware is still necessary for production deployments where the frontend is served from a CDN (different origin than the API server). In that scenario, requests go directly from the browser to the API server cross-origin, and the `AllowOrigins` whitelist must include the production frontend URL.

---

**Q20: What would you change about this project if building for production?**

**A:**
1. **File storage**: Replace local filesystem with S3 + CloudFront CDN for scalable, globally distributed media delivery.
2. **Migration strategy**: Replace GORM AutoMigrate with Atlas or golang-migrate for versioned, reversible migrations with an audit trail.
3. **Rate limiting**: Add `rate` middleware on `/auth/login` to prevent brute-force attacks and on comment/like endpoints to prevent spam.
4. **Refresh tokens**: Implement refresh token flow so users don't re-login every 72 hours, while keeping access tokens short-lived (15 minutes).
5. **Observability**: Add structured logging (zerolog/zap), distributed tracing (OpenTelemetry), and metrics (Prometheus + Grafana).
6. **Test coverage**: Unit tests for service layer (with mock repositories); integration tests with a real test DB.
7. **Feed optimization**: Cache feeds in Redis to avoid re-querying the follows graph on every request.
8. **Magic bytes file validation**: Use the `mimetype` library (already in `go.mod`) to verify actual file content, not just extension.
9. **Config validation**: Add `ValidateConfig()` that panics if `JWT_SECRET` equals `"default-secret"`.
10. **`SetConnMaxLifetime`**: Add connection max lifetime to the DB pool to prevent stale connections in long-running processes.

---

**Q21: How did you approach the mentoring process for 30+ mentees on the same codebase?**

**A:** The mentoring process was structured around clear architectural boundaries:

- Each mentee worked on a specific feature area (auth, posts, interactions, profile) using the established 3-layer pattern as a template
- Code reviews focused on adherence to the Handler → Service → Repository separation and proper error handling
- Common mistakes corrected: putting business logic in handlers, SQL in service layer, serializing model structs with sensitive fields
- Git workflow: feature branches, PRs with review, squash-merge to main
- Pair programming sessions for complex implementations (feed query, JWT middleware, file upload)
- The architecture was designed to be **explicit and repetitive** (same pattern for every feature) rather than maximally DRY, which made it easier for learners to see and replicate the pattern

---

**Q22: Why does the `Follow` model not have soft delete, but `Post` does?**

**A:** Intentional design decision. A follow relationship has no historical value after deletion — knowing that User A once followed User B and then unfollowed is not useful for any application feature. Physical deletion:
1. Keeps the `follows` table lean and avoids `deleted_at IS NULL` filter on every query
2. Ensures accurate follower counts without needing to filter by `deleted_at`

Posts, on the other hand, may have likes and comments referencing them. Soft-deleting posts allows related records to remain valid and content to potentially be restored. `Like` also doesn't have soft delete — a like is either present or absent, and the composite unique index handles all edge cases.

---

**Q23: Explain the JWT algorithm confusion attack and how you prevent it in the middleware.**

**A:** The algorithm confusion attack (also called the `alg:none` attack) exploits JWT libraries that trust the `alg` field in the token header. An attacker could craft a token with:
```json
{ "alg": "none", "typ": "JWT" }
```
and no signature. A naive library would accept this as valid because "none" means "no signature required."

The middleware prevents this with:
```go
if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
    return nil, jwt.ErrSignatureInvalid
}
```

This type assertion verifies that the algorithm is specifically HMAC-based (HS256, HS384, HS512). If the token was signed with RS256, ES256, or `none`, the assertion fails and the token is rejected. The library is only asked to verify with our secret if the algorithm is HMAC — preventing any form of algorithm substitution.

---

*This document was generated from full codebase analysis of BuildGram. All implementation details, file paths, and code snippets are sourced directly from the actual source code.*
