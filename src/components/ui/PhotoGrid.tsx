import { useState } from 'react';
import PhotoViewer from '@/components/ui/PhotoViewer';

interface PhotoGridProps {
  photos: string[];
  maxPreview?: number;
}

export default function PhotoGrid({ photos, maxPreview = 3 }: PhotoGridProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  if (photos.length === 0) {
    return <span className="text-xs text-zinc-400">暂无照片</span>;
  }

  const previewPhotos = photos.slice(0, maxPreview);
  const remaining = photos.length - maxPreview;

  const openViewer = (idx: number) => {
    setViewerIndex(idx);
    setViewerOpen(true);
  };

  return (
    <>
      <div className="flex gap-1.5">
        {previewPhotos.map((photo, idx) => (
          <div
            key={idx}
            onClick={() => openViewer(idx)}
            className="relative w-14 h-10 rounded overflow-hidden border border-zinc-200 cursor-pointer hover:border-orange-400 transition-colors"
          >
            <img src={photo} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
        {remaining > 0 && (
          <div
            onClick={() => openViewer(maxPreview)}
            className="w-14 h-10 rounded bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xs text-zinc-500 cursor-pointer hover:bg-zinc-200 transition"
          >
            +{remaining}
          </div>
        )}
      </div>
      {viewerOpen && (
        <PhotoViewer
          photos={photos}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}
