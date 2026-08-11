import axios from 'axios';

// In production (Vercel), VITE_API_URL points to the Render backend.
// In local dev, it's empty and the Vite proxy forwards /api → localhost:8080.
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: { username: string; email: string; password: string; full_name: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// User API
export const userAPI = {
  getProfile: (id: number) => api.get(`/users/${id}`),
  updateProfile: (data: { full_name?: string; bio?: string; username?: string }) =>
    api.put('/users/profile', data),
  uploadProfilePicture: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/users/profile/picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  searchUsers: (query: string) => api.get(`/users/search?q=${query}`),
};

// Post API
export const postAPI = {
  createPost: (file: File, caption: string) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('caption', caption);
    return api.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getFeed: (page = 1, limit = 10) =>
    api.get(`/posts/feed?page=${page}&limit=${limit}`),
  getExplorePosts: (page = 1, limit = 20) =>
    api.get(`/posts/explore?page=${page}&limit=${limit}`),
  getUserPosts: (userId: number, page = 1, limit = 12) =>
    api.get(`/posts/user/${userId}?page=${page}&limit=${limit}`),
  getPost: (id: number) => api.get(`/posts/${id}`),
  deletePost: (id: number) => api.delete(`/posts/${id}`),
};

// Interaction API
export const interactionAPI = {
  toggleLike: (postId: number) => api.post(`/posts/${postId}/like`),
  addComment: (postId: number, content: string) =>
    api.post(`/posts/${postId}/comments`, { content }),
  getComments: (postId: number, page = 1, limit = 20) =>
    api.get(`/posts/${postId}/comments?page=${page}&limit=${limit}`),
  deleteComment: (id: number) => api.delete(`/comments/${id}`),
  toggleFollow: (userId: number) => api.post(`/users/${userId}/follow`),
  getFollowers: (userId: number, page = 1, limit = 20) =>
    api.get(`/users/${userId}/followers?page=${page}&limit=${limit}`),
  getFollowing: (userId: number, page = 1, limit = 20) =>
    api.get(`/users/${userId}/following?page=${page}&limit=${limit}`),
};

// Story API
export const storyAPI = {
  create: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/stories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getFeed: () => api.get('/stories/feed'),
  getUserStories: (userId: number) => api.get(`/stories/user/${userId}`),
};

export default api;
