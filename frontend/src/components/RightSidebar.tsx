import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, TrendingUp, ShieldCheck, ArrowUpRight } from 'lucide-react';

interface SuggestedUser {
  id: number;
  username: string;
  role: string;
  avatar?: string;
  isFollowing?: boolean;
}

export function RightSidebar() {
  const { user } = useAuth();
  const [suggested, setSuggested] = useState<SuggestedUser[]>([
    { id: 101, username: 'alex_dev', role: 'Fullstack @ Vercel', isFollowing: false },
    { id: 102, username: 'sarah_code', role: 'AI Infrastructure Eng', isFollowing: false },
    { id: 103, username: 'cyber_builder', role: 'Rust & Go Architect', isFollowing: false },
  ]);

  const toggleFollow = (id: number) => {
    setSuggested((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isFollowing: !item.isFollowing } : item
      )
    );
  };

  const trendingTags = [
    { tag: '#golang', posts: '1.2k builds' },
    { tag: '#react19', posts: '840 builds' },
    { tag: '#ai_agents', posts: '2.4k builds' },
    { tag: '#system_design', posts: '670 builds' },
  ];

  return (
    <aside className="hidden xl:block fixed right-0 top-0 h-full w-[320px] p-6 border-l border-white/[0.08] bg-[#0c0c11]/40 backdrop-blur-xl z-30 space-y-6 overflow-y-auto">
      {/* Current User Quick Card */}
      {user && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl glass-card border border-white/5">
          <Link to={`/profile/${user.id}`} className="flex items-center gap-3 group min-w-0">
            <Avatar src={user.profile_picture_url} alt={user.username} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-100 group-hover:text-purple-400 transition-colors truncate">
                {user.username}
              </p>
              <p className="text-xs text-zinc-500 truncate">{user.full_name || 'Builder'}</p>
            </div>
          </Link>
          <Link
            to={`/profile/${user.id}`}
            className="text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-0.5"
          >
            Profile <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Suggested Builders */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Suggested Builders
          </div>
          <Link to="/explore" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            See all
          </Link>
        </div>

        <div className="space-y-2.5">
          {suggested.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-900/60 transition-all border border-transparent hover:border-white/5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar alt={item.username} size="sm" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-200 truncate">{item.username}</p>
                  <p className="text-[11px] text-zinc-500 truncate">{item.role}</p>
                </div>
              </div>
              <button
                onClick={() => toggleFollow(item.id)}
                className={`text-xs font-medium px-3 py-1 rounded-lg transition-all ${
                  item.isFollowing
                    ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    : 'bg-purple-600/10 text-purple-400 hover:bg-purple-600/20 border border-purple-500/20'
                }`}
              >
                {item.isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Topics */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <TrendingUp className="w-3.5 h-3.5 text-purple-400" /> Trending Build Topics
        </div>
        <div className="grid grid-cols-2 gap-2">
          {trendingTags.map((t) => (
            <Link
              key={t.tag}
              to="/explore"
              className="p-3 rounded-xl glass-card hover:border-purple-500/30 transition-all group"
            >
              <p className="text-xs font-semibold text-zinc-200 group-hover:text-purple-400 transition-colors">
                {t.tag}
              </p>
              <p className="text-[10px] text-zinc-500 mt-0.5">{t.posts}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer & Status */}
      <div className="pt-4 border-t border-white/[0.06] text-xs text-zinc-500 space-y-2">
        <div className="flex items-center gap-2 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-emerald-400 font-medium">All Systems Operational</span>
        </div>
        <p className="text-[11px]">BuildGram © 2026 • Build & Share in Public</p>
      </div>
    </aside>
  );
}
