import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface PhotoViewerProps {
  photos: string[];
  initialIndex?: number;
  onClose: () => void;
}

export default function PhotoViewer({ photos, initialIndex = 0, onClose }: PhotoViewerProps) {
  const [current, setCurrent] = useState(initialIndex);

  if (photos.length === 0) return null;

  const goPrev = () => setCurrent((c) => Math.max(0, c - 1));
  const goNext = () => setCurrent((c) => Math.min(photos.length - 1, c + 1));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" onClick={onClose}>
      <div className="relative max-w-4xl max-h-[85vh] w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-orange-400 transition-colors"
        >
          <X size={28} />
        </button>
        <img
          src={photos[current]}
          alt={`照片 ${current + 1}`}
          className="w-full max-h-[85vh] object-contain rounded-lg"
        />
        {photos.length > 1 && (
          <>
            <button
              onClick={goPrev}
              disabled={current === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 disabled:opacity-30 transition"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={goNext}
              disabled={current === photos.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 disabled:opacity-30 transition"
            >
              <ChevronRight size={24} />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
              {current + 1} / {photos.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
