import { useState, useEffect } from 'react';
import { PostCard } from '@/components/PostCard';
import { RightSidebar } from '@/components/RightSidebar';
import { Avatar } from '@/components/Avatar';
import { postAPI } from '@/services/api';
import { Loader2, Plus, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BuilderStory {
  id: number;
  name: string;
  avatar?: string;
  hasUpdate: boolean;
}

export default function HomePage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Mock builder updates for top stories reel
  const builderStories: BuilderStory[] = [
    { id: 1, name: 'harshit', hasUpdate: true },
    { id: 2, name: 'sarah_dev', hasUpdate: true },
    { id: 3, name: 'alex_v', hasUpdate: true },
    { id: 4, name: 'tech_guru', hasUpdate: false },
    { id: 5, name: 'cyber_bot', hasUpdate: true },
    { id: 6, name: 'elena_ai', hasUpdate: false },
  ];

  const loadPosts = async (pageNum: number) => {
    try {
      const res = await postAPI.getFeed(pageNum);
      const newPosts = res.data.posts || [];
      if (pageNum === 1) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }
      setHasMore(newPosts.length >= 10);
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts(1);
  }, []);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadPosts(nextPage);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <Loader2 className="w-7 h-7 text-purple-400 animate-spin" />
        <span className="text-xs text-zinc-500 font-mono">Fetching latest builds...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto flex gap-8 px-4 sm:px-6 py-6">
      {/* Center Feed Column */}
      <div className="flex-1 max-w-xl mx-auto space-y-6">
        {/* Builders Reel / Stories Bar */}
        <div className="p-3.5 rounded-2xl glass-panel border border-white/[0.08] overflow-x-auto no-scrollbar flex items-center gap-4">
          {/* New Build Story Button */}
          <Link to="/create" className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-dashed border-zinc-700 flex items-center justify-center group-hover:border-purple-500 transition-colors">
              <Plus className="w-5 h-5 text-zinc-400 group-hover:text-purple-400 transition-colors" />
            </div>
            <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200 truncate w-14 text-center">
              New Update
            </span>
          </Link>

          {/* Builder Stories */}
          {builderStories.map((story) => (
            <div key={story.id} className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group">
              <Avatar alt={story.name} size="md" hasStory={story.hasUpdate} />
              <span className="text-[11px] font-medium text-zinc-300 group-hover:text-white truncate w-14 text-center">
                {story.name}
              </span>
            </div>
          ))}
        </div>

        {/* Main Feed Content */}
        {posts.length === 0 ? (
          <div className="text-center py-20 glass-panel rounded-2xl p-8 border border-white/[0.08]">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <h2 className="text-base font-bold text-white font-display mb-1">Your feed is waiting for builds</h2>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto mb-6">
              Follow other developers or post your first build to start building your network.
            </p>
            <Link
              to="/create"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              <Plus className="w-4 h-4" /> Share First Build
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard key={post.id} {...post} />
            ))}
            {hasMore && (
              <button
                onClick={loadMore}
                className="w-full py-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/60 border border-white/5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-all"
              >
                Load older builds
              </button>
            )}
          </div>
        )}
      </div>

      {/* Desktop Right Widget Panel */}
      <RightSidebar />
    </div>
  );
}
