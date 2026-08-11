import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI, postAPI, interactionAPI } from '@/services/api';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Settings, Grid3X3, Bookmark, Loader2 } from 'lucide-react';
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-white">User not found</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10">
        <Avatar src={profile.profile_picture_url} alt={profile.username} size="xl" />

        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
            <h1 className="text-xl font-semibold text-white">{profile.username}</h1>
            {isOwnProfile ? (
              <div className="flex items-center gap-2">
                <Link to="/settings">
                  <Button variant="secondary" size="sm">
                    Edit Profile
                  </Button>
                </Link>
                <Link to="/settings">
                  <Button variant="ghost" size="icon">
                    <Settings className="w-5 h-5" />
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

          {/* Stats */}
          <div className="flex items-center justify-center md:justify-start gap-8 mb-4">
            <div className="text-center">
              <span className="font-bold text-white text-lg">{profile.post_count}</span>
              <span className="text-zinc-400 text-sm ml-1">posts</span>
            </div>
            <div className="text-center cursor-pointer hover:opacity-80 transition-opacity">
              <span className="font-bold text-white text-lg">{profile.follower_count}</span>
              <span className="text-zinc-400 text-sm ml-1">followers</span>
            </div>
            <div className="text-center cursor-pointer hover:opacity-80 transition-opacity">
              <span className="font-bold text-white text-lg">{profile.following_count}</span>
              <span className="text-zinc-400 text-sm ml-1">following</span>
            </div>
          </div>

          {/* Bio */}
          <div>
            {profile.full_name && (
              <p className="font-semibold text-white text-sm">{profile.full_name}</p>
            )}
            {profile.bio && (
              <p className="text-zinc-300 text-sm mt-1 whitespace-pre-wrap">{profile.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center border-t border-zinc-800">
        <button
          onClick={() => setActiveTab('posts')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors border-t-2 -mt-[2px]',
            activeTab === 'posts'
              ? 'border-white text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          )}
        >
          <Grid3X3 className="w-4 h-4" /> Posts
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors border-t-2 -mt-[2px]',
            activeTab === 'saved'
              ? 'border-white text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          )}
        >
          <Bookmark className="w-4 h-4" /> Saved
        </button>
      </div>

      {/* Posts Grid */}
      {activeTab === 'posts' && (
        <div className="grid grid-cols-3 gap-1 mt-1">
          {posts.length === 0 ? (
            <div className="col-span-3 py-20 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full border-2 border-zinc-700 flex items-center justify-center">
                <span className="text-3xl">📷</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-1">
                {isOwnProfile ? 'Share Photos' : 'No Posts Yet'}
              </h3>
              <p className="text-zinc-500 text-sm">
                {isOwnProfile
                  ? 'When you share photos, they will appear on your profile.'
                  : 'This user hasn\'t posted anything yet.'}
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <Link
                key={post.id}
                to={`/post/${post.id}`}
                className="relative aspect-square group overflow-hidden bg-zinc-800"
              >
                <img
                  src={post.image_url}
                  alt={post.caption || 'Post'}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex items-center gap-6 text-white font-semibold">
                    <span className="flex items-center gap-1">
                      ❤️ {post.like_count}
                    </span>
                    <span className="flex items-center gap-1">
                      💬 {post.comment_count}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="py-20 text-center">
          <p className="text-zinc-500 text-sm">Saved posts feature coming soon</p>
        </div>
      )}
    </div>
  );
}
