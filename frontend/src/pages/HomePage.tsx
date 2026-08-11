import { useState, useEffect } from 'react';
import { PostCard } from '@/components/PostCard';
import { RightSidebar } from '@/components/RightSidebar';
import { Avatar } from '@/components/Avatar';
import { postAPI } from '@/services/api';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface StoryItem {
  id: number;
  username: string;
  avatar?: string;
  hasStory: boolean;
}

export default function HomePage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Mock Stories bar
  const stories: StoryItem[] = [
    { id: 1, username: 'harshit', hasStory: true },
    { id: 2, username: 'sarah_m', hasStory: true },
    { id: 3, username: 'alex_k', hasStory: true },
    { id: 4, username: 'david_99', hasStory: false },
    { id: 5, username: 'elena_r', hasStory: true },
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
        <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex gap-12 px-4 sm:px-6 py-6">
      {/* Center Feed */}
      <div className="flex-1 max-w-[470px] mx-auto space-y-4">
        {/* Top Stories Reel */}
        <div className="p-3 bg-black border border-[#262626] rounded-xl overflow-x-auto no-scrollbar flex items-center gap-4">
          {stories.map((story) => (
            <div key={story.id} className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer">
              <Avatar alt={story.username} size="lg" hasStory={story.hasStory} />
              <span className="text-[11px] font-normal text-zinc-300 truncate w-14 text-center">
                {story.username}
              </span>
            </div>
          ))}
        </div>

        {/* Feed Posts */}
        {posts.length === 0 ? (
          <div className="text-center py-20 bg-black border border-[#262626] rounded-xl p-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-900 flex items-center justify-center text-2xl">
              📷
            </div>
            <h2 className="text-base font-semibold text-white mb-1">Welcome to BuildGram</h2>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto mb-6">
              When you follow people or create posts, you'll see photos here.
            </p>
            <Link
              to="/create"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0095f6] hover:bg-[#1877f2] text-white text-xs font-semibold"
            >
              Create Post
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} {...post} />
            ))}
            {hasMore && (
              <button
                onClick={loadMore}
                className="w-full py-3 rounded-lg bg-zinc-900 border border-[#262626] text-xs font-semibold text-[#0095f6] hover:text-white transition-colors"
              >
                Load more posts
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <RightSidebar />
    </div>
  );
}
