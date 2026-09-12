import React, { useEffect, useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

export interface LightboxImage {
  url: string;
  senderNickname?: string;
  timestamp?: string;
}

export interface LightboxProps {
  images: LightboxImage[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (newIndex: number) => void;
}

export const Lightbox: React.FC<LightboxProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [zoom, setZoom] = useState(1);

  const currentImage = images[currentIndex];

  useEffect(() => {
    setZoom(1);
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0 && onNavigate) {
        onNavigate(currentIndex - 1);
      }
      if (e.key === 'ArrowRight' && currentIndex < images.length - 1 && onNavigate) {
        onNavigate(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length, onClose, onNavigate]);

  if (!isOpen || !currentImage) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = currentImage.url;
    a.download = `talksy-image-${Date.now()}.webp`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 animate-fade-in select-none"
      role="dialog"
      aria-label="Image viewer"
    >
      {/* Top Bar */}
      <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between z-20">
        <div className="text-sm text-white/70">
          {currentImage.senderNickname && (
            <span className="font-medium text-white mr-2">{currentImage.senderNickname}</span>
          )}
          {currentImage.timestamp && (
            <span className="text-white/40">{currentImage.timestamp}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.5, 3))}
            className="p-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Zoom In"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.5, 0.5))}
            className="p-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Zoom Out"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          {zoom !== 1 && (
            <button
              onClick={() => setZoom(1)}
              className="p-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              title="Reset Zoom"
              aria-label="Reset zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleDownload}
            className="p-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Download Image"
            aria-label="Download image"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors ml-1"
            title="Close (Esc)"
            aria-label="Close image viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image */}
      <div
        className="relative max-w-full max-h-full p-8 flex items-center justify-center overflow-auto"
        onClick={onClose}
      >
        <img
          src={currentImage.url}
          alt="Shared content"
          className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Navigation */}
      {images.length > 1 && onNavigate && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={() => onNavigate(currentIndex - 1)}
              className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-20"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {currentIndex < images.length - 1 && (
            <button
              onClick={() => onNavigate(currentIndex + 1)}
              className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-20"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </>
      )}
    </div>
  );
};
