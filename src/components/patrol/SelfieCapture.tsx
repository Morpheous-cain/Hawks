import { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, RotateCcw, CheckCircle, X } from "lucide-react";

interface SelfieCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onCancel: () => void;
  officerName?: string;
}

const SelfieCapture = ({ onCapture, onCancel, officerName }: SelfieCaptureProps) => {
  const [mode, setMode] = useState<"ready" | "camera" | "preview">("ready");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setMode("camera");
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError("Camera access denied. Please enable camera permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw video frame
    ctx.drawImage(video, 0, 0);

    // Add timestamp watermark
    const now = new Date();
    const timestamp = now.toLocaleString();
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
    ctx.fillStyle = "#ffffff";
    ctx.font = "14px monospace";
    ctx.fillText(`${timestamp} | ${officerName || "Officer"}`, 10, canvas.height - 15);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setCapturedImage(dataUrl);
    stopCamera();
    setMode("preview");
  }, [officerName, stopCamera]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const confirmPhoto = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  }, [capturedImage, onCapture]);

  const handleCancel = useCallback(() => {
    stopCamera();
    onCancel();
  }, [stopCamera, onCancel]);

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-sm">Selfie Verification Required</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Take a live selfie to verify your identity. The photo will be timestamped and stored as attendance evidence.
        </p>

        {mode === "ready" && (
          <div className="text-center py-6 border-2 border-dashed border-muted rounded-lg">
            <Camera className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <Button onClick={startCamera}>
              <Camera className="h-4 w-4 mr-2" />
              Open Front Camera
            </Button>
            {cameraError && (
              <p className="text-xs text-destructive mt-2">{cameraError}</p>
            )}
          </div>
        )}

        {mode === "camera" && (
          <div className="space-y-3">
            <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
                style={{ transform: "scaleX(-1)" }}
              />
              <Badge className="absolute top-2 left-2 bg-red-600 animate-pulse">
                ● LIVE
              </Badge>
            </div>
            <Button onClick={capturePhoto} className="w-full" size="lg">
              <Camera className="h-5 w-5 mr-2" />
              Capture Selfie
            </Button>
          </div>
        )}

        {mode === "preview" && capturedImage && (
          <div className="space-y-3">
            <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
              <img
                src={capturedImage}
                alt="Captured selfie"
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
              <Badge className="absolute top-2 left-2 bg-green-600">
                ✓ Captured
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={retake}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake
              </Button>
              <Button onClick={confirmPhoto} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm
              </Button>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  );
};

export default SelfieCapture;
