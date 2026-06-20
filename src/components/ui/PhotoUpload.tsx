import { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoUploadProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  max?: number;
  className?: string;
}

export default function PhotoUpload({ photos, onChange, max = 6, className }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newPhotos: string[] = [];
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          newPhotos.push(ev.target.result as string);
          if (newPhotos.length + photos.length <= max) {
            onChange([...photos, ...newPhotos]);
          }
        }
      };
      reader.readAsDataURL(file);
    });
    if (inputRef.current) inputRef.current.value = '';
  };

  const removePhoto = (index: number) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, idx) => (
          <div key={idx} className="relative group aspect-[4/3] rounded-lg overflow-hidden border border-zinc-200">
            <img src={photo} alt={`照片 ${idx + 1}`} className="w-full h-full object-cover" />
            <button
              onClick={() => removePhoto(idx)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {photos.length < max && (
          <button
            onClick={() => inputRef.current?.click()}
            className="aspect-[4/3] rounded-lg border-2 border-dashed border-zinc-300 hover:border-orange-400 flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-orange-500 transition-colors bg-zinc-50 hover:bg-orange-50"
          >
            <Upload size={20} />
            <span className="text-xs">上传照片</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
