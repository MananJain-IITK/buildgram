import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Bookmark, MoreHorizontal, Share2 } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { Toast } from '@/components/Toast';
import { PostLightboxModal } from '@/components/PostLightboxModal';
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

interface PostCardProps {
  id: number;
  user: PostUser;
  image_url: string;
  caption: string;
  like_count: number;
  comment_count: number;
  is_liked: boolean;
  created_at: string;
  comments?: Comment[];
}

export function PostCard({
  id,
  user: postUser,
  image_url,
  caption,
  like_count: initialLikeCount,
  comment_count: initialCommentCount,
  is_liked: initialIsLiked,
  created_at,
  comments: initialComments = [],
}: PostCardProps) {
  const { user: currentUser } = useAuth();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [commentText, setCommentText] = useState('');
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [showDoubleHeartAnim, setShowDoubleHeartAnim] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    const weeks = Math.floor(days / 7);
    return `${weeks}w`;
  };

  const handleLike = async () => {
    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 300);

    try {
      const res = await interactionAPI.toggleLike(id);
      setIsLiked(res.data.is_liked);
      setLikeCount(res.data.like_count);
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleDoubleTap = async () => {
    setShowDoubleHeartAnim(true);
    setTimeout(() => setShowDoubleHeartAnim(false), 800);
    if (!isLiked) {
      try {
        const res = await interactionAPI.toggleLike(id);
        setIsLiked(res.data.is_liked);
        setLikeCount(res.data.like_count);
      } catch (err) {
        console.error('Failed to double tap like:', err);
      }
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const res = await interactionAPI.addComment(id, commentText.trim());
      setComments([res.data, ...comments]);
      setCommentCount((prev) => prev + 1);
      setCommentText('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${id}`);
    setToastMessage('Post link copied to clipboard!');
  };

  return (
    <>
      <article className="glass-panel border border-white/[0.08] rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/15">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
          <Link to={`/profile/${postUser.id}`} className="flex items-center gap-3 group">
            <Avatar src={postUser.profile_picture_url} alt={postUser.username} size="sm" hasStory />
            <div>
              <p className="text-xs font-semibold text-zinc-100 group-hover:text-purple-400 transition-colors">
                {postUser.username}
              </p>
              <p className="text-[10px] text-zinc-500">{timeAgo(created_at)} ago</p>
            </div>
          </Link>
          <button
            onClick={handleCopyLink}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1.5 rounded-lg hover:bg-white/5"
            title="Share post"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Media Canvas */}
        <div
          className="relative aspect-[4/3] bg-zinc-950 cursor-pointer overflow-hidden group select-none"
          onDoubleClick={handleDoubleTap}
          onClick={() => setIsLightboxOpen(true)}
        >
          <img
            src={image_url}
            alt={caption || 'Build Gram Post'}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            loading="lazy"
          />

          {/* Double tap heart overlay */}
          {showDoubleHeartAnim && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20 backdrop-blur-[2px]">
              <Heart className="w-20 h-20 text-rose-500 fill-rose-500 animate-[heartPop_0.8s_ease-out_forwards] drop-shadow-[0_0_20px_rgba(244,63,94,0.6)]" />
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="px-4 pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className={cn(
                  'transition-all duration-200 hover:scale-110 p-1 -ml-1 text-zinc-400 hover:text-zinc-100',
                  isLikeAnimating && 'animate-[heartBounce_0.3s_ease-out]'
                )}
              >
                <Heart
                  className={cn(
                    'w-5 h-5 transition-colors',
                    isLiked ? 'text-rose-500 fill-rose-500' : ''
                  )}
                />
              </button>
              <button
                onClick={() => setIsLightboxOpen(true)}
                className="text-zinc-400 hover:text-zinc-100 transition-colors hover:scale-110 duration-200 p-1"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
              <button
                onClick={handleCopyLink}
                className="text-zinc-400 hover:text-zinc-100 transition-colors hover:scale-110 duration-200 p-1"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
            <button className="text-zinc-400 hover:text-zinc-100 transition-colors hover:scale-110 duration-200 p-1">
              <Bookmark className="w-5 h-5" />
            </button>
          </div>

          {/* Likes Summary */}
          <p className="text-xs font-semibold text-zinc-200">
            {likeCount.toLocaleString()} {likeCount === 1 ? 'like' : 'likes'}
          </p>

          {/* Caption */}
          {caption && (
            <p className="text-xs text-zinc-300 leading-relaxed">
              <Link
                to={`/profile/${postUser.id}`}
                className="font-semibold text-white hover:text-purple-400 transition-colors mr-1.5"
              >
                {postUser.username}
              </Link>
              {caption}
            </p>
          )}

          {/* Comment Count Link */}
          {commentCount > 0 && (
            <button
              onClick={() => setIsLightboxOpen(true)}
              className="text-[11px] text-zinc-500 hover:text-zinc-400 transition-colors font-medium"
            >
              View all {commentCount} comments
            </button>
          )}

          {/* Inline Comments Preview */}
          {comments.slice(0, 2).map((comment) => (
            <p key={comment.id} className="text-xs text-zinc-400">
              <Link
                to={`/profile/${comment.user.id}`}
                className="font-semibold text-zinc-200 mr-1.5 hover:text-purple-400 transition-colors"
              >
                {comment.user.username}
              </Link>
              {comment.content}
            </p>
          ))}
        </div>

        {/* Fast Comment Input */}
        <form
          onSubmit={handleComment}
          className="flex items-center gap-2 px-4 py-2.5 mt-2 border-t border-white/[0.06] bg-zinc-950/40"
        >
          <Avatar src={currentUser?.profile_picture_url} alt={currentUser?.username || 'U'} size="xs" />
          <input
            type="text"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 bg-transparent text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
          />
          {commentText.trim() && (
            <button
              type="submit"
              disabled={isSubmittingComment}
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
            >
              Post
            </button>
          )}
        </form>
      </article>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <PostLightboxModal
          post={{
            id,
            user: postUser,
            image_url,
            caption,
            like_count: likeCount,
            comment_count: commentCount,
            is_liked: isLiked,
            created_at,
            comments,
          }}
          onClose={() => setIsLightboxOpen(false)}
          onLikeToggle={(newIsLiked, newCount) => {
            setIsLiked(newIsLiked);
            setLikeCount(newCount);
          }}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}
    </>
  );
}
