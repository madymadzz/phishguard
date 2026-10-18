"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/layout/BottomNav";
import jsQR from "jsqr";
import {
  ArrowLeft,
  Link as LinkIcon,
  Image as ImageIcon,
  Zap,
  ZapOff,
  Pause,
  Play,
  CameraOff,
  AlertTriangle,
  Loader2,
  Sparkles,
} from "lucide-react";

type CameraState = "idle" | "requesting" | "active" | "permission_denied" | "no_camera" | "insecure_context" | "error";

export default function QrScannerPage() {
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>("requesting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("Align QR code inside the frame");

  // Haptic Feedback helper
  const triggerHaptic = useCallback(() => {
    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([80, 40, 80]);
      }
    } catch {
      // Ignore vibration error
    }
  }, []);

  // Stop camera tracks helper
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
  }, []);

  // Submit decoded payload to /api/scan
  const handleDecodedCode = useCallback(
    async (decodedText: string) => {
      if (isProcessing) return;
      setIsProcessing(true);
      setStatusText("QR Code detected! Inspecting security…");
      triggerHaptic();
      stopCamera();

      try {
        const res = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: decodedText, source: "qr" }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to process QR code payload.");
        }

        router.push(`/scan/result/${data.scanId}`);
      } catch (err) {
        setIsProcessing(false);
        setErrorMessage(
          err instanceof Error ? err.message : "Error analyzing QR code. Please try again."
        );
      }
    },
    [isProcessing, router, stopCamera, triggerHaptic]
  );

  // Scan frame loop
  const scanFrame = useCallback(
    function frameLoop() {
      if (isPaused || isProcessing) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const width = video.videoWidth;
        const height = video.videoHeight;

        if (width > 0 && height > 0) {
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });

          if (ctx) {
            ctx.drawImage(video, 0, 0, width, height);
            const imageData = ctx.getImageData(0, 0, width, height);

            // Fast JS QR decoding
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });

            if (code && code.data && code.data.trim().length > 0) {
              handleDecodedCode(code.data.trim());
              return;
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(frameLoop);
    },
    [handleDecodedCode, isPaused, isProcessing]
  );

  const startCamera = useCallback(async () => {
    stopCamera();
    setErrorMessage(null);

    if (typeof window !== "undefined" && !window.isSecureContext && window.location.hostname !== "localhost") {
      setCameraState("insecure_context");
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState("no_camera");
      return;
    }

    setCameraState("requesting");

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
      }

      // Check torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = (videoTrack.getCapabilities ? videoTrack.getCapabilities() : {}) as {
          torch?: boolean;
        };
        if (capabilities.torch) {
          setHasTorch(true);
        }
      }

      setCameraState("active");
      setStatusText("Align QR code inside the frame");
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    } catch (err: unknown) {
      const error = err as { name?: string; message?: string };
      console.error("Camera access error:", error);

      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setCameraState("permission_denied");
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        setCameraState("no_camera");
      } else {
        setCameraState("error");
        setErrorMessage(error.message || "Failed to initialize camera.");
      }
    }
  }, [scanFrame, stopCamera]);

  // Initial mount
  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      if (typeof window !== "undefined" && !window.isSecureContext && window.location.hostname !== "localhost") {
        if (!cancelled) setCameraState("insecure_context");
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (!cancelled) setCameraState("no_camera");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          await videoRef.current.play();
        }

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const capabilities = (videoTrack.getCapabilities ? videoTrack.getCapabilities() : {}) as {
            torch?: boolean;
          };
          if (capabilities.torch) {
            setHasTorch(true);
          }
        }

        setCameraState("active");
        setStatusText("Align QR code inside the frame");
        animationFrameRef.current = requestAnimationFrame(scanFrame);
      } catch (err: unknown) {
        if (cancelled) return;
        const error = err as { name?: string; message?: string };

        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          setCameraState("permission_denied");
        } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
          setCameraState("no_camera");
        } else {
          setCameraState("error");
          setErrorMessage(error.message || "Failed to initialize camera.");
        }
      }
    }

    initialize();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [scanFrame, stopCamera]);

  // Toggle Torch / Flashlight
  async function toggleTorch() {
    if (!streamRef.current || !hasTorch) return;
    try {
      const track = streamRef.current.getVideoTracks()[0];
      const nextState = !torchOn;
      // applyConstraints with advanced torch option
      await (track as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setTorchOn(nextState);
    } catch (err) {
      console.warn("Failed to toggle torch:", err);
    }
  }

  // Toggle Pause / Resume
  function togglePause() {
    if (isPaused) {
      setIsPaused(false);
      setStatusText("Align QR code inside the frame");
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    } else {
      setIsPaused(true);
      setStatusText("Scanner paused");
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }

  // Gallery Image Upload Decode
  function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setIsProcessing(true);
    setStatusText("Decoding QR code from image…");

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        if (!ctx) {
          setIsProcessing(false);
          setErrorMessage("Failed to read image buffer.");
          return;
        }

        ctx.drawImage(img, 0, 0, img.width, img.height);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });

        if (code && code.data && code.data.trim()) {
          handleDecodedCode(code.data.trim());
        } else {
          setIsProcessing(false);
          setStatusText("Align QR code inside the frame");
          setErrorMessage("No QR code detected in this image. Please select a clearer photo.");
        }
      };

      img.onerror = () => {
        setIsProcessing(false);
        setErrorMessage("Could not load image file.");
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
    // Reset file input so user can pick the same file again if needed
    e.target.value = "";
  }

  return (
    <AppShell
      showHeader={true}
      headerContent={
        <div className="w-full flex items-center justify-between">
          <Link
            href="/home"
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
            QR Scanner
          </span>
          <Link
            href="/scan/url"
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Switch to URL Scanner"
          >
            <LinkIcon className="w-5 h-5" />
          </Link>
        </div>
      }
      footerContent={<BottomNav />}
    >
      <div className="flex-1 px-4 py-3 flex flex-col justify-between space-y-4">
        {/* Error or Alert banner */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="leading-tight">{errorMessage}</span>
          </div>
        )}

        {/* Viewfinder Area */}
        <div className="relative w-full aspect-square max-h-[360px] mx-auto rounded-3xl overflow-hidden bg-black shadow-lg border border-slate-800 flex items-center justify-center">
          {/* Active Camera Video */}
          <video
            ref={videoRef}
            className={`absolute inset-0 w-full h-full object-cover ${
              cameraState === "active" ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Hidden Canvas for Decoding */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Camera Loading State */}
          {cameraState === "requesting" && (
            <div className="flex flex-col items-center justify-center text-center p-6 space-y-2.5 z-10">
              <Loader2 className="w-8 h-8 text-[#0B5FFF] animate-spin" />
              <p className="text-xs font-semibold text-slate-300">
                Opening camera lens…
              </p>
            </div>
          )}

          {/* Permission Denied State */}
          {cameraState === "permission_denied" && (
            <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 z-10 bg-slate-900/90 text-white">
              <CameraOff className="w-10 h-10 text-red-400" />
              <h3 className="text-sm font-bold">Camera Permission Denied</h3>
              <p className="text-[11px] text-slate-300 max-w-xs leading-relaxed">
                Please enable camera access in your browser or device settings, or select a photo from your gallery below.
              </p>
              <button
                onClick={startCamera}
                className="py-1.5 px-3.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* No Camera Found State */}
          {cameraState === "no_camera" && (
            <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 z-10 bg-slate-900/90 text-white">
              <CameraOff className="w-10 h-10 text-amber-400" />
              <h3 className="text-sm font-bold">No Camera Detected</h3>
              <p className="text-[11px] text-slate-300 max-w-xs leading-relaxed">
                No active camera was found on this device. You can upload an image containing a QR code directly from your gallery.
              </p>
            </div>
          )}

          {/* Insecure Context State */}
          {cameraState === "insecure_context" && (
            <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 z-10 bg-slate-900/90 text-white">
              <AlertTriangle className="w-10 h-10 text-amber-400" />
              <h3 className="text-sm font-bold">HTTPS Connection Required</h3>
              <p className="text-[11px] text-slate-300 max-w-xs leading-relaxed">
                Browser security rules require an HTTPS connection to access your camera.
              </p>
            </div>
          )}

          {/* Viewfinder Reticle Overlay (Only when camera active) */}
          {cameraState === "active" && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Outer dark overlay vignette */}
              <div className="absolute inset-0 bg-black/30 backdrop-blur-[0.5px]" />

              {/* Center Target Box */}
              <div className="relative w-56 h-56 rounded-2xl border-2 border-white/20 z-10 flex items-center justify-center overflow-hidden">
                {/* 4 Corner Brackets */}
                <div className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-[#0B5FFF] rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-[#0B5FFF] rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-[#0B5FFF] rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-[#0B5FFF] rounded-br-xl" />

                {/* Animated Laser Scan Line */}
                {!isPaused && !isProcessing && (
                  <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#0B5FFF] to-transparent shadow-[0_0_12px_#0B5FFF] animate-pulse transition-all duration-1000"
                    style={{
                      animation: "scanLine 2.2s ease-in-out infinite alternate",
                    }}
                  />
                )}

                {/* Processing Overlay inside Box */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-[#0B5FFF]/40 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2 z-20">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="text-[11px] font-bold">Inspecting QR Code…</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Live Instruction Pill */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-[#16222E] border border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-[#0B5FFF]" />
            <span>{statusText}</span>
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="w-full bg-white dark:bg-[#16222E] rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
          <div className="grid grid-cols-3 gap-2.5">
            {/* Gallery Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="py-3 px-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <ImageIcon className="w-5 h-5 text-[#0B5FFF]" />
              <span className="text-[10px] font-bold">Gallery</span>
            </button>

            {/* Flash / Torch Toggle */}
            <button
              type="button"
              onClick={toggleTorch}
              disabled={!hasTorch || cameraState !== "active" || isProcessing}
              className={`py-3 px-2 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-colors ${
                torchOn
                  ? "bg-amber-100 dark:bg-amber-950/60 border-amber-300 text-amber-700 dark:text-amber-300"
                  : "bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40"
              }`}
            >
              {torchOn ? <Zap className="w-5 h-5 text-amber-500 fill-amber-500" /> : <ZapOff className="w-5 h-5" />}
              <span className="text-[10px] font-bold">{hasTorch ? (torchOn ? "Torch On" : "Torch") : "No Flash"}</span>
            </button>

            {/* Pause / Resume */}
            <button
              type="button"
              onClick={togglePause}
              disabled={cameraState !== "active" || isProcessing}
              className="py-3 px-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-40"
            >
              {isPaused ? <Play className="w-5 h-5 text-[#22A559]" /> : <Pause className="w-5 h-5" />}
              <span className="text-[10px] font-bold">{isPaused ? "Resume" : "Pause"}</span>
            </button>
          </div>

          {/* Quick link to URL scanner */}
          <Link
            href="/scan/url"
            className="w-full py-2.5 px-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#0B5FFF] hover:bg-blue-100 dark:hover:bg-blue-950/60 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Have a text link instead? Use URL Scanner</span>
          </Link>
        </div>

        {/* Hidden File Input for Gallery Selection */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleGalleryUpload}
          className="hidden"
        />
      </div>

      {/* Global CSS for scan line animation */}
      <style jsx global>{`
        @keyframes scanLine {
          0% {
            top: 8px;
          }
          100% {
            top: calc(100% - 10px);
          }
        }
      `}</style>
    </AppShell>
  );
}
