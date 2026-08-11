FROM golang:alpine AS builder

# Set destination for COPY
WORKDIR /app

# Download Go modules
COPY go.mod go.sum ./
RUN go mod download

# Copy the source code.
COPY . .

# Build
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/api

# Second stage: create a minimal image
FROM alpine:latest

WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/main .
# Secrets are injected via platform environment variables (Render dashboard) at runtime

# Create the uploads directory for application
RUN mkdir -p uploads/posts uploads/profiles

# Expose port
EXPOSE 8080

# Run the backend
CMD ["./main"]
