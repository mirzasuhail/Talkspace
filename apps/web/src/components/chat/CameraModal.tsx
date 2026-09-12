import React, { useEffect, useRef, useState } from 'react';
import { X, Camera as CameraIcon, RefreshCw, AlertCircle } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Helper to stop all tracks of a stream
  const stopTracks = (mediaStream: MediaStream | null) => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
  };

  // 1. Initialize camera stream when isOpen becomes true
  useEffect(() => {
    let isCancelled = false;

    const startCamera = async () => {
      if (!isOpen) return;

      setLoading(true);
      setError(null);

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access is not supported on this browser or environment.');
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });

        if (isCancelled) {
          stopTracks(mediaStream);
          return;
        }

        setStream(mediaStream);
        setLoading(false);
      } catch (err: any) {
        if (isCancelled) return;
        console.warn('[Camera Access Error]', err);

        let msg = 'Could not access camera.';
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          msg = 'Camera permission was denied. Please allow camera access in your browser settings.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          msg = 'No camera device found.';
        } else if (err.message) {
          msg = err.message;
        }

        setError(msg);
        setLoading(false);
      }
    };

    if (isOpen) {
      startCamera();
    } else {
      setStream((prevStream) => {
        stopTracks(prevStream);
        return null;
      });
      setError(null);
      setLoading(false);
    }

    return () => {
      isCancelled = true;
      setStream((prevStream) => {
        stopTracks(prevStream);
        return null;
      });
    };
  }, [isOpen]);

  // 2. Attach stream to <video> as soon as stream and videoRef.current are ready
  useEffect(() => {
    if (stream && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = stream;
      video.play().catch((playErr) => {
        console.warn('[Camera Video Play Warning]', playErr);
      });
    }
  }, [stream]);

  if (!isOpen) return null;

  const handleCapture = () => {
    if (!videoRef.current || !stream) return;
    const video = videoRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });

          // Stop tracks and close modal
          stopTracks(stream);
          setStream(null);
          onCapture(file);
          onClose();
        }
      },
      'image/jpeg',
      0.9
    );
  };

  const handleClose = () => {
    stopTracks(stream);
    setStream(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/95 text-white animate-fade-in p-4 sm:p-6 select-none"
      role="dialog"
      aria-label="Camera Capture"
    >
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between z-20">
        <span className="text-sm font-semibold tracking-wide text-white/80">Camera</span>
        <button
          type="button"
          onClick={handleClose}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="Close Camera"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Camera Preview Container */}
      <div className="relative flex-1 w-full max-w-lg my-4 rounded-3xl overflow-hidden bg-zinc-900 border border-white/10 flex items-center justify-center">
        {loading && (
          <div className="flex flex-col items-center gap-3 text-white/60">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-violet-500 animate-spin" />
            <span className="text-xs font-medium">Starting camera...</span>
          </div>
        )}

        {error ? (
          <div className="flex flex-col items-center text-center p-6 max-w-xs z-10">
            <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
            <p className="text-sm font-medium text-white/90 mb-4">{error}</p>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setLoading(true);
                navigator.mediaDevices
                  ?.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
                  .then((s) => {
                    setStream(s);
                    setLoading(false);
                  })
                  .catch((err) => {
                    setError(err.message || 'Camera error.');
                    setLoading(false);
                  });
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              stream && !loading ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
      </div>

      {/* Bottom Capture Button */}
      <div className="w-full flex items-center justify-center pb-2 z-20">
        {!error && (
          <button
            type="button"
            onClick={handleCapture}
            disabled={!stream || loading}
            className={`w-16 h-16 rounded-full border-4 border-white transition-all shadow-xl flex items-center justify-center ${
              !stream || loading
                ? 'bg-zinc-700 opacity-50 cursor-not-allowed'
                : 'bg-violet-600 hover:bg-violet-500 active:scale-95 shadow-violet-600/40'
            }`}
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
