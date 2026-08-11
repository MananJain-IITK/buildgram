import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI, postAPI, interactionAPI } from '@/services/api';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { PostLightboxModal } from '@/components/PostLightboxModal';
import { Settings, Grid3X3, Bookmark, Loader2, Heart, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileData {
  id: number;
  username: string;
  email: string;
  full_name: string;
  bio: string;
  profile_picture_url: string;
  post_count: number;
  follower_count: number;
  following_count: number;
  is_following: boolean;
}

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  const isOwnProfile = currentUser?.id === Number(id);

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const profileRes = await userAPI.getProfile(Number(id));
      setProfile(profileRes.data);

      const postsRes = await postAPI.getUserPosts(Number(id));
      setPosts(postsRes.data.posts || []);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!profile) return;
    setIsFollowLoading(true);
    try {
      const res = await interactionAPI.toggleFollow(profile.id);
      setProfile({
        ...profile,
        is_following: res.data.is_following,
        follower_count: profile.follower_count + (res.data.is_following ? 1 : -1),
      });
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <h2 className="text-lg font-semibold text-white">User not found</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Classic Instagram Profile Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 sm:gap-16 border-b border-[#262626] pb-10">
        {/* Avatar */}
        <Avatar src={profile.profile_picture_url} alt={profile.username} size="2xl" hasStory />

        {/* Profile Info */}
        <div className="flex-1 space-y-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <h1 className="text-xl font-normal text-white">{profile.username}</h1>
            {isOwnProfile ? (
              <div className="flex items-center gap-2">
                <Link to="/settings">
                  <Button variant="secondary" size="sm">
                    Edit profile
                  </Button>
                </Link>
                <Link to="/settings">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings className="w-5 h-5 text-zinc-300" />
                  </Button>
                </Link>
              </div>
            ) : (
              <Button
                variant={profile.is_following ? 'secondary' : 'default'}
                size="sm"
                onClick={handleFollow}
                isLoading={isFollowLoading}
              >
                {profile.is_following ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-center sm:justify-start gap-8">
            <div className="text-sm">
              <span className="font-semibold text-white">{profile.post_count}</span>{' '}
              <span className="text-zinc-400">posts</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold text-white">{profile.follower_count}</span>{' '}
              <span className="text-zinc-400">followers</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold text-white">{profile.following_count}</span>{' '}
              <span className="text-zinc-400">following</span>
            </div>
          </div>

          {/* Bio */}
          <div className="text-xs text-white space-y-1">
            {profile.full_name && <p className="font-semibold">{profile.full_name}</p>}
            {profile.bio && <p className="text-zinc-300 whitespace-pre-wrap">{profile.bio}</p>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center border-t border-[#262626] -mt-8">
        <button
          onClick={() => setActiveTab('posts')}
          className={cn(
            'flex items-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-widest transition-colors border-t border-white -mt-[1px]',
            activeTab === 'posts'
              ? 'border-white text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          )}
        >
          <Grid3X3 className="w-3.5 h-3.5" /> Posts
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={cn(
            'flex items-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-widest transition-colors border-t border-white -mt-[1px]',
            activeTab === 'saved'
              ? 'border-white text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          )}
        >
          <Bookmark className="w-3.5 h-3.5" /> Saved
        </button>
      </div>

      {/* Media Grid */}
      {activeTab === 'posts' && (
        <div>
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border border-zinc-700 flex items-center justify-center text-2xl">
                📷
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">
                {isOwnProfile ? 'Share Photos' : 'No Posts Yet'}
              </h3>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                {isOwnProfile
                  ? 'When you share photos, they will appear on your profile.'
                  : "This user hasn't posted anything yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 sm:gap-2">
              {posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="relative aspect-square group overflow-hidden bg-zinc-900 cursor-pointer"
                >
                  <img
                    src={post.image_url}
                    alt={post.caption || 'Post'}
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
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="py-20 text-center text-xs text-zinc-500">
          Only you can see what you've saved
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
