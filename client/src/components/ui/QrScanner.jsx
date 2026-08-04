import { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { Camera, X, SwitchCamera } from 'lucide-react';

/**
 * QrScanner — Native getUserMedia + jsQR based scanner.
 * No third-party UI libraries — full control, no double-render issues.
 *
 * Props:
 *  - onScan(decodedText): fires once on successful scan
 *  - onClose(): called when user closes the scanner
 */
export default function QrScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const scannedRef = useRef(false);
  const isMountedRef = useRef(true);

  const [cameras, setCameras] = useState([]);
  const [currentCamIndex, setCurrentCamIndex] = useState(0);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);

  // Stop any active camera stream
  const stopStream = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Decode QR from video frame via jsQR
  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !isMountedRef.current) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && !scannedRef.current) {
        scannedRef.current = true;
        stopStream();
        onScan(code.data);
        return; // Stop the loop after scan
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [onScan, stopStream]);

  // Start camera by device ID (or facingMode fallback)
  const startCamera = useCallback(async (deviceId) => {
    stopStream();
    setError(null);
    setScanning(false);
    scannedRef.current = false;

    const constraints = deviceId
      ? { video: { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } } }
      : { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (!isMountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanning(true);
        rafRef.current = requestAnimationFrame(tick);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError(`Camera error: ${err.message}`);
      }
    }
  }, [stopStream, tick]);

  // On mount: enumerate cameras, then start
  useEffect(() => {
    isMountedRef.current = true;

    navigator.mediaDevices.enumerateDevices()
      .then((devices) => {
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setCameras(videoDevices);

        // Prefer a rear camera
        const rearIndex = videoDevices.findIndex((d) =>
          /back|rear|environment/i.test(d.label)
        );
        const startIndex = rearIndex >= 0 ? rearIndex : 0;
        setCurrentCamIndex(startIndex);
        startCamera(videoDevices[startIndex]?.deviceId);
      })
      .catch(() => {
        // If enumeration fails, just try with facingMode
        startCamera(undefined);
      });

    return () => {
      isMountedRef.current = false;
      stopStream();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Switch to next camera
  const handleSwitchCamera = () => {
    if (cameras.length < 2) return;
    const nextIndex = (currentCamIndex + 1) % cameras.length;
    setCurrentCamIndex(nextIndex);
    startCamera(cameras[nextIndex]?.deviceId);
  };

  const handleClose = () => {
    stopStream();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 shrink-0">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-base text-white">Scan Member QR Code</span>
        </div>
        <div className="flex items-center gap-2">
          {cameras.length > 1 && (
            <button
              onClick={handleSwitchCamera}
              className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
              title="Switch camera"
            >
              <SwitchCamera className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Camera view */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* The actual video element */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />

        {/* Hidden canvas used for jsQR decoding (not shown to user) */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanning overlay: dark edges + bright centre */}
        {scanning && !error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Dark overlay with a transparent cutout in the middle */}
            <div className="absolute inset-0 bg-black/50" style={{
              maskImage: 'radial-gradient(ellipse 220px 220px at center, transparent 0%, black 100%)',
              WebkitMaskImage: 'radial-gradient(ellipse 220px 220px at center, transparent 0%, black 100%)',
            }} />

            {/* Scanning frame */}
            <div className="relative w-56 h-56">
              {/* Corner brackets */}
              <span className="absolute top-0 left-0 w-7 h-7 border-t-[3px] border-l-[3px] border-emerald-400 rounded-tl-md" />
              <span className="absolute top-0 right-0 w-7 h-7 border-t-[3px] border-r-[3px] border-emerald-400 rounded-tr-md" />
              <span className="absolute bottom-0 left-0 w-7 h-7 border-b-[3px] border-l-[3px] border-emerald-400 rounded-bl-md" />
              <span className="absolute bottom-0 right-0 w-7 h-7 border-b-[3px] border-r-[3px] border-emerald-400 rounded-br-md" />
              {/* Animated scan line */}
              <div className="absolute left-0 right-0 h-[2px] bg-emerald-400/80 animate-[scanline_2s_ease-in-out_infinite]" />
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 px-8 text-center">
            <Camera className="w-14 h-14 text-rose-400 mb-4" />
            <p className="text-white font-semibold text-base mb-2">Camera Error</p>
            <p className="text-slate-400 text-sm mb-6">{error}</p>
            <button
              onClick={() => startCamera(cameras[currentCamIndex]?.deviceId)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Bottom hint */}
      <div className="px-5 py-4 text-center shrink-0">
        <p className="text-slate-400 text-xs">
          Align the member&apos;s QR code within the frame to check them in
        </p>
      </div>

      {/* Scan line animation */}
      <style>{`
        @keyframes scanline {
          0%   { top: 0; opacity: 1; }
          50%  { top: calc(100% - 2px); opacity: 1; }
          100% { top: 0; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
