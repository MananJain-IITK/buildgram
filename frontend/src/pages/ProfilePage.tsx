import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI, postAPI, interactionAPI } from '@/services/api';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { PostLightboxModal } from '@/components/PostLightboxModal';
import { Settings, Grid3X3, Bookmark, Loader2, Sparkles, Code2, Heart, MessageCircle } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'builds'>('posts');
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
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <Loader2 className="w-7 h-7 text-purple-400 animate-spin" />
        <span className="text-xs text-zinc-500 font-mono">Loading profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-24 glass-panel max-w-md mx-auto my-12 rounded-2xl p-8 border border-white/10">
        <h2 className="text-lg font-bold font-display text-white mb-2">Builder Not Found</h2>
        <p className="text-xs text-zinc-500">The user profile you are looking for doesn't exist or has been renamed.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* Cover Banner & Profile Card */}
      <div className="relative rounded-3xl overflow-hidden glass-panel border border-white/[0.08]">
        {/* Decorative Mesh Cover */}
        <div className="h-36 sm:h-44 bg-gradient-to-r from-purple-950/40 via-zinc-900 to-indigo-950/40 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] text-zinc-400 font-mono">
            <Sparkles className="w-3 h-3 text-purple-400" /> PRO BUILDER
          </div>
        </div>

        {/* Profile Details Container */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-16 sm:-mt-20 gap-4 mb-6">
            {/* Avatar with Ring */}
            <div className="ring-4 ring-[#09090b] rounded-full">
              <Avatar src={profile.profile_picture_url} alt={profile.username} size="2xl" hasStory />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {isOwnProfile ? (
                <>
                  <Link to="/settings">
                    <Button variant="secondary" size="sm">
                      Edit Profile
                    </Button>
                  </Link>
                  <Link to="/settings">
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </Link>
                </>
              ) : (
                <Button
                  variant={profile.is_following ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={handleFollow}
                  isLoading={isFollowLoading}
                >
                  {profile.is_following ? 'Following' : 'Follow Builder'}
                </Button>
              )}
            </div>
          </div>

          {/* User Info Header */}
          <div className="space-y-3 text-center sm:text-left">
            <div>
              <h1 className="text-xl font-bold font-display text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
                {profile.full_name || profile.username}
              </h1>
              <p className="text-xs font-mono text-purple-400 mt-0.5">@{profile.username}</p>
            </div>

            {/* Bio & Tech Badges */}
            {profile.bio && (
              <p className="text-xs text-zinc-300 max-w-xl leading-relaxed whitespace-pre-wrap">
                {profile.bio}
              </p>
            )}

            {/* Stats Counter Pills */}
            <div className="flex items-center justify-center sm:justify-start gap-6 pt-2 border-t border-white/[0.06]">
              <div className="text-center sm:text-left">
                <span className="text-sm font-bold text-white block">{profile.post_count}</span>
                <span className="text-[11px] text-zinc-500 font-medium">Builds</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="text-sm font-bold text-white block">{profile.follower_count}</span>
                <span className="text-[11px] text-zinc-500 font-medium">Followers</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="text-sm font-bold text-white block">{profile.following_count}</span>
                <span className="text-[11px] text-zinc-500 font-medium">Following</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-center border-b border-white/[0.08] gap-8">
        {[
          { id: 'posts', label: 'Builds', icon: Grid3X3 },
          { id: 'saved', label: 'Saved', icon: Bookmark },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider transition-colors relative border-b-2 -mb-[1px]',
                isActive
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              )}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Media Grid Section */}
      {activeTab === 'posts' && (
        <div>
          {posts.length === 0 ? (
            <div className="text-center py-20 glass-panel rounded-2xl p-8 border border-white/[0.08]">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center">
                <Code2 className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-base font-bold text-white font-display mb-1">
                {isOwnProfile ? 'No Builds Published Yet' : 'No Public Builds'}
              </h3>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto mb-6">
                {isOwnProfile
                  ? 'Share your first project update or code snapshot to showcase your work.'
                  : "This builder hasn't published any updates yet."}
              </p>
              {isOwnProfile && (
                <Link to="/create">
                  <Button variant="primary" size="sm">
                    Publish Build
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="relative aspect-square group overflow-hidden rounded-xl bg-zinc-900 cursor-pointer border border-white/5"
                >
                  <img
                    src={post.image_url}
                    alt={post.caption || 'Post'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-250 backdrop-blur-[2px] flex items-center justify-center gap-6 text-white font-semibold text-xs">
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
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="py-20 text-center glass-panel rounded-2xl p-6 border border-white/[0.08]">
          <Bookmark className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-xs text-zinc-400 font-medium">Saved posts feature is synced with your account</p>
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
