import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { interactionAPI } from '@/services/api';
import { cn } from '@/lib/utils';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-150">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="relative w-full max-w-5xl h-[85vh] max-h-[720px] bg-black border border-[#262626] rounded-xl overflow-hidden flex flex-col md:flex-row">
        {/* Left: Media */}
        <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
          <img
            src={post.image_url}
            alt={post.caption || 'Post'}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Right: Comments */}
        <div className="w-full md:w-[380px] lg:w-[410px] flex flex-col bg-black border-l border-[#262626]">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-[#262626]">
            <Link to={`/profile/${post.user.id}`} onClick={onClose} className="flex items-center gap-3">
              <Avatar src={post.user.profile_picture_url} alt={post.user.username} size="sm" />
              <p className="text-xs font-semibold text-white hover:text-zinc-300">
                {post.user.username}
              </p>
            </Link>
            <button className="text-zinc-400 hover:text-white">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Comments list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {post.caption && (
              <div className="flex items-start gap-3 pb-3 border-b border-[#262626]">
                <Avatar src={post.user.profile_picture_url} alt={post.user.username} size="xs" />
                <p className="text-xs text-white">
                  <span className="font-semibold mr-1.5">{post.user.username}</span>
                  {post.caption}
                </p>
              </div>
            )}

            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3">
                <Avatar src={comment.user?.profile_picture_url} alt={comment.user?.username || 'U'} size="xs" />
                <p className="text-xs text-white">
                  <span className="font-semibold mr-1.5">{comment.user?.username}</span>
                  {comment.content}
                </p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="p-3 border-t border-[#262626] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={handleLike}>
                  <Heart
                    className={cn(
                      'w-6 h-6 transition-colors',
                      isLiked ? 'text-rose-500 fill-rose-500' : 'text-white hover:text-zinc-400'
                    )}
                  />
                </button>
                <button className="text-white hover:text-zinc-400">
                  <MessageCircle className="w-6 h-6" />
                </button>
                <button className="text-white hover:text-zinc-400">
                  <Send className="w-6 h-6" />
                </button>
              </div>
              <button className="text-white hover:text-zinc-400">
                <Bookmark className="w-6 h-6" />
              </button>
            </div>

            <p className="text-xs font-semibold text-white">
              {likeCount.toLocaleString()} {likeCount === 1 ? 'like' : 'likes'}
            </p>
          </div>

          {/* Comment Form */}
          <form onSubmit={handleComment} className="flex items-center gap-3 p-3 border-t border-[#262626]">
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 bg-transparent text-xs text-white placeholder:text-zinc-500 focus:outline-none"
            />
            {commentText.trim() && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="text-xs font-semibold text-[#0095f6] hover:text-white"
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
