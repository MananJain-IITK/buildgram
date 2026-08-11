import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, ImagePlus, X, Loader2 } from 'lucide-react';
import { storyAPI } from '@/services/api';

export default function CreateStoryPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('Image must be under 20 MB.');
      return;
    }
    setError(null);
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleShare = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setError(null);
    try {
      await storyAPI.create(selectedFile);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to share story. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-[22px] font-semibold text-white">Create Story</h1>
        <p className="text-[13px] text-zinc-500 mt-1">
          Share a photo — it disappears after 24 hours.
        </p>
      </div>

      {/* Upload area */}
      {!preview ? (
        <div
          id="story-drop-zone"
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed
            cursor-pointer transition-all duration-200 py-20 px-8
            ${isDragging
              ? 'border-[#0095f6] bg-[#0095f6]/5'
              : 'border-[#262626] bg-black hover:border-zinc-600 hover:bg-zinc-900/30'
            }
          `}
        >
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center">
            <ImagePlus size={28} className="text-zinc-500" />
          </div>
          <div className="text-center">
            <p className="text-[15px] font-semibold text-white">
              {isDragging ? 'Drop image here' : 'Select photo'}
            </p>
            <p className="text-[12px] text-zinc-500 mt-1">
              Drag & drop or click to browse · JPG, PNG, WEBP up to 20 MB
            </p>
          </div>
          <input
            ref={fileInputRef}
            id="story-file-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />
        </div>
      ) : (
        /* Preview */
        <div className="relative rounded-2xl overflow-hidden border border-[#262626] aspect-[9/16] max-h-[480px]">
          <img
            src={preview}
            alt="Story preview"
            className="w-full h-full object-cover"
          />
          {/* Overlay: clear button */}
          <button
            id="story-clear-btn"
            onClick={clearFile}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          >
            <X size={15} />
          </button>
          {/* Story duration hint */}
          <div className="absolute bottom-3 left-3 right-3 text-center">
            <span className="text-[11px] text-white/70 bg-black/50 px-3 py-1 rounded-full">
              Visible for 24 hours
            </span>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 text-[13px] text-red-400">{error}</p>
      )}

      {/* Action buttons */}
      <div className="mt-6 flex gap-3">
        <button
          id="story-discard-btn"
          onClick={() => navigate('/')}
          className="flex-1 py-2.5 rounded-xl border border-[#262626] text-zinc-400 hover:text-white text-[14px] font-medium transition-colors"
        >
          Discard
        </button>
        <button
          id="story-share-btn"
          onClick={handleShare}
          disabled={!selectedFile || isUploading}
          className="flex-1 py-2.5 rounded-xl bg-[#0095f6] hover:bg-[#1877f2] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[14px] font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Upload size={15} />
          )}
          {isUploading ? 'Sharing…' : 'Share to Story'}
        </button>
      </div>
    </div>
  );
}
