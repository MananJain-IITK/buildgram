import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/contexts/AuthContext';

interface SuggestedUser {
  id: number;
  username: string;
  subtext: string;
  isFollowing?: boolean;
}

export function RightSidebar() {
  const { user } = useAuth();
  const [suggested, setSuggested] = useState<SuggestedUser[]>([
    { id: 101, username: 'alex_m', subtext: 'Suggested for you', isFollowing: false },
    { id: 102, username: 'sarah_j', subtext: 'Followed by user1 + 2 more', isFollowing: false },
    { id: 103, username: 'david_k', subtext: 'New to BuildGram', isFollowing: false },
  ]);

  const toggleFollow = (id: number) => {
    setSuggested((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isFollowing: !item.isFollowing } : item
      )
    );
  };

  return (
    <aside className="hidden xl:block fixed right-0 top-0 h-full w-[340px] p-6 bg-black z-30 space-y-6 overflow-y-auto border-l border-[#262626]">
      {/* Current User Row */}
      {user && (
        <div className="flex items-center justify-between py-2">
          <Link to={`/profile/${user.id}`} className="flex items-center gap-3 group min-w-0">
            <Avatar src={user.profile_picture_url} alt={user.username} size="md" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.username}</p>
              <p className="text-xs text-zinc-500 truncate">{user.full_name || 'User'}</p>
            </div>
          </Link>
          <Link
            to={`/profile/${user.id}`}
            className="text-xs font-semibold text-[#0095f6] hover:text-white transition-colors"
          >
            Switch
          </Link>
        </div>
      )}

      {/* Suggested For You Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-400">Suggested for you</span>
          <Link to="/explore" className="text-xs font-semibold text-white hover:text-zinc-400 transition-colors">
            See All
          </Link>
        </div>

        <div className="space-y-3">
          {suggested.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar alt={item.username} size="sm" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{item.username}</p>
                  <p className="text-[11px] text-zinc-500 truncate">{item.subtext}</p>
                </div>
              </div>
              <button
                onClick={() => toggleFollow(item.id)}
                className={`text-xs font-semibold transition-colors ${
                  item.isFollowing ? 'text-zinc-400 hover:text-white' : 'text-[#0095f6] hover:text-white'
                }`}
              >
                {item.isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Links */}
      <div className="pt-6 text-[11px] text-zinc-600 space-y-3 leading-relaxed">
        <p>
          About • Help • Press • API • Jobs • Privacy • Terms • Locations • Language
        </p>
        <p className="uppercase tracking-wider">© 2026 BuildGram FROM META</p>
      </div>
    </aside>
  );
}
