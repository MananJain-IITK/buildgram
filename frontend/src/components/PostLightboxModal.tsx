import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { interactionAPI } from '@/services/api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface PostUser {
  id: number;
  username: string;
  profile_picture_url: string;
}

interface Comment {
  id: number;
  content: string;
  created_at: string;
  user: PostUser;
}

interface PostLightboxProps {
  post: {
    id: number;
    user: PostUser;
    image_url: string;
    caption: string;
    like_count: number;
    comment_count: number;
    is_liked: boolean;
    created_at: string;
    comments?: Comment[];
  };
  onClose: () => void;
  onLikeToggle?: (isLiked: boolean, count: number) => void;
}

export function PostLightboxModal({ post, onClose, onLikeToggle }: PostLightboxProps) {
  const { user: currentUser } = useAuth();
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLike = async () => {
    try {
      const res = await interactionAPI.toggleLike(post.id);
      setIsLiked(res.data.is_liked);
      setLikeCount(res.data.like_count);
      if (onLikeToggle) onLikeToggle(res.data.is_liked, res.data.like_count);
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await interactionAPI.addComment(post.id, commentText.trim());
      setComments([res.data, ...comments]);
      setCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900/80 text-zinc-400 hover:text-white transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Main Lightbox Container */}
      <div className="relative w-full max-w-5xl h-[85vh] max-h-[750px] bg-[#0c0c11] border border-white/10 rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
        {/* Left: Image Display */}
        <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden group">
          <img
            src={post.image_url}
            alt={post.caption || 'Post detail'}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Right: Comments & Actions Sidebar */}
        <div className="w-full md:w-[380px] lg:w-[420px] flex flex-col bg-[#121218] border-l border-white/[0.08]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
            <Link to={`/profile/${post.user.id}`} onClick={onClose} className="flex items-center gap-3">
              <Avatar src={post.user.profile_picture_url} alt={post.user.username} size="sm" />
              <div>
                <p className="text-sm font-semibold text-white hover:text-purple-400 transition-colors">
                  {post.user.username}
                </p>
              </div>
            </Link>
            <button className="text-zinc-500 hover:text-zinc-300">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Comment Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Caption as first comment */}
            {post.caption && (
              <div className="flex items-start gap-3 pb-3 border-b border-white/5">
                <Avatar src={post.user.profile_picture_url} alt={post.user.username} size="xs" />
                <div className="text-xs space-y-1">
                  <p className="text-zinc-300">
                    <span className="font-semibold text-white mr-1.5">{post.user.username}</span>
                    {post.caption}
                  </p>
                </div>
              </div>
            )}

            {/* Comments List */}
            {comments.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs">
                No comments yet. Start the conversation!
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-3">
                  <Avatar src={comment.user?.profile_picture_url} alt={comment.user?.username || 'U'} size="xs" />
                  <div className="text-xs space-y-0.5 min-w-0">
                    <p className="text-zinc-300">
                      <span className="font-semibold text-white mr-1.5">
                        {comment.user?.username || 'User'}
                      </span>
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Actions & Like Count */}
          <div className="p-4 border-t border-white/[0.08] space-y-3 bg-[#0c0c11]/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={handleLike} className="hover:scale-110 transition-transform">
                  <Heart
                    className={cn(
                      'w-6 h-6 transition-colors',
                      isLiked ? 'text-rose-500 fill-rose-500' : 'text-zinc-400 hover:text-zinc-200'
                    )}
                  />
                </button>
                <button className="text-zinc-400 hover:text-zinc-200">
                  <MessageCircle className="w-6 h-6" />
                </button>
                <button className="text-zinc-400 hover:text-zinc-200">
                  <Send className="w-6 h-6" />
                </button>
              </div>
              <button className="text-zinc-400 hover:text-zinc-200">
                <Bookmark className="w-6 h-6" />
              </button>
            </div>

            <p className="text-xs font-semibold text-white">
              {likeCount.toLocaleString()} {likeCount === 1 ? 'like' : 'likes'}
            </p>
          </div>

          {/* Add Comment Input */}
          <form onSubmit={handleComment} className="flex items-center gap-3 p-3 border-t border-white/[0.08]">
            <Avatar src={currentUser?.profile_picture_url} alt={currentUser?.username || 'U'} size="xs" />
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 bg-transparent text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none"
            />
            {commentText.trim() && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="text-xs font-semibold text-purple-400 hover:text-purple-300"
              >
                Post
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
