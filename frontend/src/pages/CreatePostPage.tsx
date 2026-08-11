import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { postAPI } from '@/services/api';
import { Button } from '@/components/Button';
import { X, ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CreatePostPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [activeFilter, setActiveFilter] = useState<'normal' | 'mono' | 'contrast' | 'sepia'>('normal');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
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
    mono: 'grayscale contrast-125',
    contrast: 'contrast-150 saturate-120',
    sepia: 'sepia-60 saturate-120',
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <h1 className="text-lg font-semibold text-white">Create new post</h1>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg p-3 text-center">
          {error}
        </div>
      )}

      {!preview ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="aspect-square rounded-xl border border-dashed border-[#363636] bg-[#121212] flex flex-col items-center justify-center cursor-pointer hover:border-zinc-500 transition-colors p-6 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4 text-zinc-400">
            <ImagePlus className="w-8 h-8" />
          </div>
          <p className="text-xs font-semibold text-white">Drag photos and videos here</p>
          <p className="text-[11px] text-zinc-500 mt-1">JPG, PNG, GIF or WebP (max 10MB)</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-black border border-[#262626]">
            <img
              src={preview}
              alt="Preview"
              className={cn('w-full h-full object-cover', filterStyles[activeFilter])}
            />
            <button
              onClick={clearFile}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/80 text-white hover:bg-black"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {[
              { id: 'normal', name: 'Normal' },
              { id: 'mono', name: 'Mono' },
              { id: 'contrast', name: 'Contrast' },
              { id: 'sepia', name: 'Sepia' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={cn(
                  'flex-1 py-1 rounded-md text-xs font-medium border transition-colors',
                  activeFilter === f.id
                    ? 'border-white text-white bg-zinc-800'
                    : 'border-[#262626] text-zinc-400 hover:text-white'
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

      <div className="space-y-1.5">
        <textarea
          placeholder="Write a caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={2200}
          rows={4}
          className="w-full bg-[#121212] border border-[#262626] rounded-xl p-3 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
        />
        <p className="text-right text-[10px] text-zinc-500">{caption.length}/2200</p>
      </div>

      <Button
        onClick={handleSubmit}
        variant="primary"
        className="w-full"
        isLoading={isLoading}
        disabled={!file}
      >
        Share Post
      </Button>
    </div>
  );
}
