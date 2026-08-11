import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/Avatar';
import { Home, Compass, PlusSquare, Heart, User, LogOut, Menu, X, Terminal, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', icon: Home, label: 'Feed' },
    { path: '/explore', icon: Compass, label: 'Explore' },
    { path: '/create', icon: PlusSquare, label: 'New Post' },
    { path: '/activity', icon: Heart, label: 'Activity' },
    { path: `/profile/${user?.id}`, icon: User, label: 'Profile' },
  ];

  return (
    <>
      {/* Desktop Sidebar (Linear / Vercel style) */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-[76px] lg:w-[240px] flex-col border-r border-white/[0.08] bg-[#0c0c11]/90 backdrop-blur-2xl z-40 transition-all duration-300 select-none">
        {/* Brand Header */}
        <Link to="/" className="flex items-center gap-3 px-4 lg:px-6 py-6 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-lg shadow-black/50 group-hover:border-purple-500/40 transition-colors">
            <Terminal className="w-5 h-5 text-purple-400" />
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="font-display text-lg font-bold text-zinc-100 tracking-tight flex items-center gap-1.5">
              BuildGram
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono font-normal">
                v1.0
              </span>
            </span>
            <span className="text-[11px] text-zinc-500 font-medium">For Builders & Creators</span>
          </div>
        </Link>

        {/* Primary Navigation */}
        <nav className="flex-1 flex flex-col gap-1.5 px-3 mt-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'relative flex items-center gap-3.5 px-3 py-3 rounded-xl transition-all duration-200 group text-sm font-medium',
                  isActive
                    ? 'bg-zinc-800/80 text-white shadow-sm border border-white/5'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                )}
              >
                {/* Active left glowing bar */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                )}
                <Icon
                  className={cn(
                    'w-5 h-5 flex-shrink-0 transition-transform duration-200',
                    isActive ? 'text-purple-400 scale-105' : 'text-zinc-400 group-hover:text-zinc-200 group-hover:scale-105'
                  )}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                <span className="hidden lg:block truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card & Settings section */}
        <div className="px-3 pb-6 flex flex-col gap-1">
          <div
            onClick={() => navigate(`/profile/${user?.id}`)}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-800/50 transition-all cursor-pointer border border-transparent hover:border-white/5 group"
          >
            <Avatar src={user?.profile_picture_url} alt={user?.username || 'U'} size="sm" />
            <div className="hidden lg:block flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-200 group-hover:text-white truncate">
                {user?.username}
              </p>
              <p className="text-xs text-zinc-500 truncate">{user?.full_name || 'Builder'}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 pt-1">
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center justify-center p-2.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-all flex-1"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden lg:inline ml-2 text-xs font-medium">Settings</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center justify-center p-2.5 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all flex-1"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:inline ml-2 text-xs font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#0c0c11]/90 backdrop-blur-xl border-b border-white/[0.08] z-40 flex items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center">
            <Terminal className="w-4 h-4 text-purple-400" />
          </div>
          <span className="font-display font-bold text-base text-zinc-100 tracking-tight">
            BuildGram
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/create')}
            className="p-2 rounded-lg bg-purple-600 text-white text-xs font-medium flex items-center gap-1 shadow-sm"
          >
            <PlusSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-zinc-400 hover:text-zinc-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0c0c11]/95 backdrop-blur-xl border-t border-white/[0.08] z-40 flex items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200',
                isActive ? 'text-purple-400' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.8} />
            </Link>
          );
        })}
      </nav>

      {/* Mobile Menu Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-md z-30 pt-16 pb-20 px-6 flex flex-col justify-between">
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/80 border border-white/10">
              <Avatar src={user?.profile_picture_url} alt={user?.username || 'U'} size="lg" />
              <div>
                <p className="text-base font-bold text-white">{user?.username}</p>
                <p className="text-xs text-zinc-400">{user?.full_name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => { navigate(`/profile/${user?.id}`); setMobileMenuOpen(false); }}
                className="w-full text-left p-3.5 rounded-xl bg-zinc-900/50 text-zinc-200 font-medium text-sm border border-white/5"
              >
                View Profile
              </button>
              <button
                onClick={() => { navigate('/settings'); setMobileMenuOpen(false); }}
                className="w-full text-left p-3.5 rounded-xl bg-zinc-900/50 text-zinc-200 font-medium text-sm border border-white/5"
              >
                Account Settings
              </button>
            </div>
          </div>

          <button
            onClick={() => { logout(); setMobileMenuOpen(false); }}
            className="w-full py-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold text-sm flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </>
  );
}
