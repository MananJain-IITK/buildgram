import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/Avatar';
import { Home, Search, PlusSquare, Heart, User, LogOut, Menu, X, Instagram, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/explore', icon: Search, label: 'Search' },
    { path: '/create', icon: PlusSquare, label: 'Create' },
    { path: '/activity', icon: Heart, label: 'Notifications' },
    { path: `/profile/${user?.id}`, icon: User, label: 'Profile' },
  ];

  return (
    <>
      {/* Desktop Sidebar (Classic Instagram Dark Style) */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-[76px] lg:w-[245px] flex-col border-r border-[#262626] bg-black z-40 select-none px-3 py-6 justify-between">
        <div className="space-y-6">
          {/* Brand Header */}
          <Link to="/" className="flex items-center gap-3 px-3 py-2">
            <Instagram className="w-6 h-6 text-white flex-shrink-0" />
            <span className="hidden lg:block text-xl font-bold font-serif italic tracking-wide text-white">
              BuildGram
            </span>
          </Link>

          {/* Primary Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-4 px-3 py-3 rounded-xl transition-colors duration-150 group text-sm font-normal',
                    isActive
                      ? 'text-white font-bold'
                      : 'text-zinc-300 hover:text-white hover:bg-[#121212]'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-6 h-6 flex-shrink-0 transition-transform duration-150 group-hover:scale-105',
                      isActive ? 'text-white' : 'text-zinc-300'
                    )}
                    strokeWidth={isActive ? 2.5 : 1.75}
                  />
                  <span className="hidden lg:block truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Settings section */}
        <div className="space-y-1 pt-4 border-t border-[#262626]">
          <div
            onClick={() => navigate(`/profile/${user?.id}`)}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#121212] transition-colors cursor-pointer"
          >
            <Avatar src={user?.profile_picture_url} alt={user?.username || 'U'} size="sm" />
            <div className="hidden lg:block flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.username}</p>
              <p className="text-[11px] text-zinc-500 truncate">{user?.full_name}</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-4 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-[#121212] transition-colors w-full text-xs"
          >
            <Settings className="w-5 h-5 flex-shrink-0" strokeWidth={1.75} />
            <span className="hidden lg:block">Settings</span>
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-4 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-[#121212] transition-colors w-full text-xs"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" strokeWidth={1.75} />
            <span className="hidden lg:block">Log out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-black border-b border-[#262626] z-40 flex items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Instagram className="w-5 h-5 text-white" />
          <span className="text-lg font-bold font-serif italic tracking-wide text-white">
            BuildGram
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/create')} className="text-white">
            <PlusSquare className="w-6 h-6" strokeWidth={1.75} />
          </button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-zinc-300">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-black border-t border-[#262626] z-40 flex items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'p-2 rounded-xl transition-colors',
                isActive ? 'text-white' : 'text-zinc-500'
              )}
            >
              <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 1.75} />
            </Link>
          );
        })}
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/95 z-30 pt-16 pb-20 px-6 flex flex-col justify-between">
          <div className="space-y-3 pt-4">
            <div
              onClick={() => { navigate(`/profile/${user?.id}`); setMobileMenuOpen(false); }}
              className="flex items-center gap-3 p-3 rounded-xl bg-[#121212] border border-[#262626]"
            >
              <Avatar src={user?.profile_picture_url} alt={user?.username || 'U'} size="md" />
              <div>
                <p className="text-sm font-bold text-white">{user?.username}</p>
                <p className="text-xs text-zinc-400">{user?.full_name}</p>
              </div>
            </div>

            <button
              onClick={() => { navigate('/settings'); setMobileMenuOpen(false); }}
              className="w-full text-left p-3 rounded-xl bg-[#121212] border border-[#262626] text-sm text-zinc-200"
            >
              Settings
            </button>
          </div>

          <button
            onClick={() => { logout(); setMobileMenuOpen(false); }}
            className="w-full py-3 rounded-xl bg-rose-500/10 text-rose-400 font-semibold text-sm border border-rose-500/20"
          >
            Log out
          </button>
        </div>
      )}
    </>
  );
}
