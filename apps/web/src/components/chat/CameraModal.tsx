import React, { useEffect, useRef, useState } from 'react';
import { X, Camera as CameraIcon, RefreshCw, AlertCircle } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    setLoading(true);
    setError(null);
    stopStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera is not supported on this browser or environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setLoading(false);
    } catch (err: any) {
      console.warn('[Camera Access Error]', err);
      let msg = 'Could not access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please grant camera permissions in your browser.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera device found on this device.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCapture = () => {
    if (!videoRef.current || !streamRef.current) return;
    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const capturedFile = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
        stopStream();
        onCapture(capturedFile);
        onClose();
      }
    }, 'image/jpeg', 0.9);
  };

  const handleClose = () => {
    stopStream();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/95 text-white animate-fade-in p-4 sm:p-6"
      role="dialog"
      aria-label="Camera Capture"
    >
      {/* Top Header */}
      <div className="w-full flex items-center justify-between z-20">
        <span className="text-sm font-semibold tracking-wide text-white/80">Camera</span>
        <button
          onClick={handleClose}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="Close Camera"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Stream Container */}
      <div className="relative flex-1 w-full max-w-lg my-4 rounded-3xl overflow-hidden bg-zinc-900 border border-white/10 flex items-center justify-center">
        {loading && (
          <div className="flex flex-col items-center gap-3 text-white/60">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-violet-500 animate-spin" />
            <span className="text-xs">Starting camera...</span>
          </div>
        )}

        {error ? (
          <div className="flex flex-col items-center text-center p-6 max-w-xs">
            <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
            <p className="text-sm font-medium text-white/90 mb-4">{error}</p>
            <button
              onClick={startCamera}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              loading ? 'opacity-0' : 'opacity-100'
            }`}
          />
        )}
      </div>

      {/* Bottom Controls */}
      <div className="w-full flex items-center justify-center pb-2 z-20">
        {!error && !loading && (
          <button
            onClick={handleCapture}
            className="w-16 h-16 rounded-full border-4 border-white bg-violet-600 hover:bg-violet-500 active:scale-95 transition-all shadow-xl shadow-violet-600/30 flex items-center justify-center"
            title="Take Photo"
            aria-label="Take Photo"
          >
            <CameraIcon className="w-7 h-7 text-white" />
          </button>
        )}
      </div>
    </div>
  );
};
