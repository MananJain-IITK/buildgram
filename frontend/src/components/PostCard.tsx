import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Bookmark, MoreHorizontal, Send } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { Toast } from '@/components/Toast';
import { PostLightboxModal } from '@/components/PostLightboxModal';
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
    setToastMessage('Link copied to clipboard');
  };

  return (
    <>
      <article className="bg-black border border-[#262626] rounded-xl overflow-hidden mb-6">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <Link to={`/profile/${postUser.id}`} className="flex items-center gap-3 group">
            <Avatar src={postUser.profile_picture_url} alt={postUser.username} size="sm" hasStory />
            <div>
              <p className="text-xs font-semibold text-white group-hover:text-zinc-300 transition-colors">
                {postUser.username}
              </p>
            </div>
          </Link>
          <button onClick={handleCopyLink} className="text-zinc-400 hover:text-white p-1">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Media */}
        <div
          className="relative aspect-square bg-[#121212] cursor-pointer overflow-hidden select-none"
          onDoubleClick={handleDoubleTap}
          onClick={() => setIsLightboxOpen(true)}
        >
          <img
            src={image_url}
            alt={caption || 'Post'}
            className="w-full h-full object-cover"
            loading="lazy"
          />

          {showDoubleHeartAnim && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Heart className="w-24 h-24 text-rose-500 fill-rose-500 animate-[heartPop_0.8s_ease-out_forwards] drop-shadow-lg" />
            </div>
          )}
        </div>

        {/* Actions Bar */}
        <div className="px-3 pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className={cn(
                  'transition-transform duration-150 hover:scale-110 p-0.5',
                  isLikeAnimating && 'animate-[heartBounce_0.3s_ease-out]'
                )}
              >
                <Heart
                  className={cn(
                    'w-6 h-6 transition-colors',
                    isLiked ? 'text-rose-500 fill-rose-500' : 'text-white hover:text-zinc-400'
                  )}
                  strokeWidth={1.75}
                />
              </button>
              <button
                onClick={() => setIsLightboxOpen(true)}
                className="text-white hover:text-zinc-400 transition-colors hover:scale-110 duration-150 p-0.5"
              >
                <MessageCircle className="w-6 h-6" strokeWidth={1.75} />
              </button>
              <button
                onClick={handleCopyLink}
                className="text-white hover:text-zinc-400 transition-colors hover:scale-110 duration-150 p-0.5"
              >
                <Send className="w-6 h-6" strokeWidth={1.75} />
              </button>
            </div>
            <button className="text-white hover:text-zinc-400 transition-colors hover:scale-110 duration-150 p-0.5">
              <Bookmark className="w-6 h-6" strokeWidth={1.75} />
            </button>
          </div>

          {/* Likes */}
          <p className="text-xs font-semibold text-white">
            {likeCount.toLocaleString()} {likeCount === 1 ? 'like' : 'likes'}
          </p>

          {/* Caption */}
          {caption && (
            <p className="text-xs text-white leading-relaxed">
              <Link
                to={`/profile/${postUser.id}`}
                className="font-semibold mr-1.5 hover:text-zinc-300 transition-colors"
              >
                {postUser.username}
              </Link>
              {caption}
            </p>
          )}

          {/* View comments button */}
          {commentCount > 0 && (
            <button
              onClick={() => setIsLightboxOpen(true)}
              className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors block font-normal"
            >
              View all {commentCount} comments
            </button>
          )}

          {/* Inline comments */}
          {comments.slice(0, 2).map((comment) => (
            <p key={comment.id} className="text-xs text-white">
              <Link
                to={`/profile/${comment.user.id}`}
                className="font-semibold mr-1.5 hover:text-zinc-300 transition-colors"
              >
                {comment.user.username}
              </Link>
              {comment.content}
            </p>
          ))}

          {/* Date */}
          <p className="text-[10px] text-zinc-500 uppercase tracking-wide pt-1">
            {timeAgo(created_at)} AGO
          </p>
        </div>

        {/* Comment Form */}
        <form
          onSubmit={handleComment}
          className="flex items-center gap-3 px-3 py-2.5 mt-2 border-t border-[#262626]"
        >
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
              disabled={isSubmittingComment}
              className="text-xs font-semibold text-[#0095f6] hover:text-white transition-colors disabled:opacity-50"
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
