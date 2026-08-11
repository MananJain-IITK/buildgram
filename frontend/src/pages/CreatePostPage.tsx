import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { postAPI } from '@/services/api';
import { Button } from '@/components/Button';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { X, Sparkles, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CreatePostPage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [activeFilter, setActiveFilter] = useState<'normal' | 'cyber' | 'mono' | 'warm'>('normal');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileSelect = (selectedFile?: File) => {
    if (!selectedFile) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please select a valid image file (JPG, PNG, GIF, or WebP)');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }
    setFile(selectedFile);
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select an image');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await postAPI.createPost(file, caption);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create post');
    } finally {
      setIsLoading(false);
    }
  };

  const filterStyles = {
    normal: '',
    cyber: 'hue-rotate-30 contrast-125 saturate-150',
    mono: 'grayscale contrast-150',
    warm: 'sepia-50 saturate-120 contrast-110',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold font-display text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" /> Share a Build Update
        </h1>
        <p className="text-xs text-zinc-500">Post project updates, screenshots, or code achievements.</p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl p-3.5 text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Image Dropzone / Filter Selector */}
        <div className="space-y-4">
          {!preview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
              }}
              className={cn(
                'aspect-square rounded-2xl border-2 border-dashed glass-panel flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group p-6 text-center',
                isDragging
                  ? 'border-purple-500 bg-purple-500/10 scale-[0.99]'
                  : 'border-zinc-700/80 hover:border-purple-500/50 hover:bg-zinc-900/60'
              )}
            >
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 group-hover:border-purple-500/30 flex items-center justify-center mb-4 transition-all group-hover:scale-110">
                <UploadCloud className="w-7 h-7 text-zinc-400 group-hover:text-purple-400 transition-colors" />
              </div>
              <p className="text-xs font-semibold text-zinc-200">
                Drag & drop image here, or <span className="text-purple-400">browse</span>
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">JPG, PNG, GIF or WebP (max 10MB)</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-black border border-white/10 group">
                <img
                  src={preview}
                  alt="Preview"
                  className={cn('w-full h-full object-cover transition-all duration-300', filterStyles[activeFilter])}
                />
                <button
                  onClick={clearFile}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/80 text-white hover:bg-black transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Filter Selection Pills */}
              <div className="flex items-center gap-2">
                {[
                  { id: 'normal', name: 'Normal' },
                  { id: 'cyber', name: 'Cyber' },
                  { id: 'mono', name: 'Mono' },
                  { id: 'warm', name: 'Warm' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id as any)}
                    className={cn(
                      'flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all',
                      activeFilter === f.id
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                        : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:text-zinc-200'
                    )}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
            className="hidden"
          />
        </div>

        {/* Right Column: Caption Editor & Preview */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/60 border border-white/5">
              <Avatar src={user?.profile_picture_url} alt={user?.username || 'U'} size="sm" />
              <div>
                <p className="text-xs font-semibold text-white">{user?.username}</p>
                <p className="text-[10px] text-zinc-500">Publishing publicly</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Caption & Details
              </label>
              <textarea
                placeholder="What did you build today? Write your caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={2200}
                rows={6}
                className="w-full bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 resize-none transition-all"
              />
              <p className="text-right text-[10px] text-zinc-500">{caption.length}/2200</p>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            variant="primary"
            className="w-full"
            isLoading={isLoading}
            disabled={!file}
          >
            Share Build Update
          </Button>
        </div>
      </div>
    </div>
  );
}
