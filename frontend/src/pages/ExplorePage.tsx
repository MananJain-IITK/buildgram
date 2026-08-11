import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postAPI, userAPI } from '@/services/api';
import { Input } from '@/components/Input';
import { Avatar } from '@/components/Avatar';
import { PostLightboxModal } from '@/components/PostLightboxModal';
import { Search, Loader2, Heart, MessageCircle } from 'lucide-react';

export default function ExplorePage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
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
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Search Input */}
      <div className="max-w-md mx-auto">
        <Input
          id="explore-search"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Search Results Mode */}
      {searchQuery.trim() ? (
        <div className="max-w-md mx-auto space-y-2">
          {isSearching ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
            </div>
          ) : searchResults.length === 0 ? (
            <p className="text-center text-zinc-500 text-xs py-8">No results found</p>
          ) : (
            searchResults.map((user: any) => (
              <Link
                key={user.id}
                to={`/profile/${user.id}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-black hover:bg-[#121212] border border-[#262626] transition-colors"
              >
                <Avatar src={user.profile_picture_url} alt={user.username} size="md" />
                <div>
                  <p className="text-xs font-semibold text-white">{user.username}</p>
                  <p className="text-xs text-zinc-500">{user.full_name}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      ) : (
        /* Explore Grid Mode */
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {posts.map((post: any) => (
            <div
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="relative aspect-square group overflow-hidden bg-zinc-900 cursor-pointer"
            >
              <img
                src={post.image_url}
                alt={post.caption || 'Explore post'}
                className="w-full h-full object-cover"
                loading="lazy"
              />

              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center gap-6 text-white font-semibold text-xs">
                <span className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-white fill-white" />
                  {post.like_count}
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-white fill-white" />
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
