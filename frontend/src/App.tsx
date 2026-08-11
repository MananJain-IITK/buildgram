import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import HomePage from '@/pages/HomePage';
import ProfilePage from '@/pages/ProfilePage';
import CreatePostPage from '@/pages/CreatePostPage';
import CreateStoryPage from '@/pages/CreateStoryPage';
import ExplorePage from '@/pages/ExplorePage';
import SettingsPage from '@/pages/SettingsPage';
import { Loader2 } from 'lucide-react';

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 text-zinc-400 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 antialiased">
      <Navbar />
      <main className="md:ml-[76px] lg:ml-[240px] pt-14 md:pt-0 pb-16 md:pb-0 min-h-screen transition-all duration-300">
        <Outlet />
      </main>
    </div>
  );
}

function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/" replace />;

  return <Outlet />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/create" element={<CreatePostPage />} />
            <Route path="/stories/create" element={<CreateStoryPage />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route
              path="/activity"
              element={
                <div className="max-w-lg mx-auto px-4 py-24 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-xl">
                    ⚡
                  </div>
                  <h2 className="text-lg font-bold text-white font-display">Activity & Notifications</h2>
                  <p className="text-sm text-zinc-500 max-w-xs mx-auto">
                    You're all caught up! Likes, comments, and mentions will show up here.
                  </p>
                </div>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
