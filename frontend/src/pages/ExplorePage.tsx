import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postAPI, userAPI } from '@/services/api';
import { Input } from '@/components/Input';
import { Avatar } from '@/components/Avatar';
import { PostLightboxModal } from '@/components/PostLightboxModal';
import { Search, Loader2, Heart, MessageCircle, Sparkles, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ExplorePage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'popular' | 'media'>('all');
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  useEffect(() => {
    loadExplorePosts();
  }, []);

  const loadExplorePosts = async () => {
    try {
      const res = await postAPI.getExplorePosts(1, 30);
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await userAPI.searchUsers(searchQuery);
        setSearchResults(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <Loader2 className="w-7 h-7 text-purple-400 animate-spin" />
        <span className="text-xs text-zinc-500 font-mono">Loading explore grid...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header & Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold font-display text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" /> Explore Builds
            </h1>
            <p className="text-xs text-zinc-500">Discover projects, code snapshots, and developers.</p>
          </div>

          <div className="w-full sm:w-72">
            <Input
              id="explore-search"
              placeholder="Search builders & tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Category Pills */}
        {!searchQuery.trim() && (
          <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
            {[
              { id: 'all', label: 'All Builds' },
              { id: 'popular', label: '🔥 Top Trending' },
              { id: 'media', label: '📷 Media Only' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all',
                  activeCategory === cat.id
                    ? 'bg-zinc-800 text-white border border-white/10 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search Results Mode */}
      {searchQuery.trim() ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Builder Results ({searchResults.length})
          </p>

          {isSearching ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-2xl p-6">
              <p className="text-sm text-zinc-400">No builders found for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {searchResults.map((user: any) => (
                <Link
                  key={user.id}
                  to={`/profile/${user.id}`}
                  className="flex items-center justify-between p-3.5 rounded-2xl glass-card hover:border-purple-500/30 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={user.profile_picture_url} alt={user.username} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-200 group-hover:text-purple-400 transition-colors truncate">
                        {user.username}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">{user.full_name || 'Builder'}</p>
                    </div>
                  </div>
                  <UserCheck className="w-4 h-4 text-zinc-500 group-hover:text-purple-400 transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Explore Grid Mode */
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {posts.map((post: any) => (
            <div
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="relative aspect-square group overflow-hidden rounded-xl bg-zinc-900 cursor-pointer border border-white/5"
            >
              <img
                src={post.image_url}
                alt={post.caption || 'Build'}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />

              {/* Hover overlay with statistics */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-250 backdrop-blur-[2px] flex items-center justify-center gap-6 text-white font-medium text-xs">
                <span className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  {post.like_count}
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-purple-400 fill-purple-400" />
                  {post.comment_count}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedPost && (
        <PostLightboxModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  );
}
