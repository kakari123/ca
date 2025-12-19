
import React, { useRef, useEffect, useState } from 'react';
import { LINE_A_Y, LINE_B_Y, SPEED_LIMIT, PIXELS_PER_METER, Icons } from '../constants';
import { Violation } from '../types';
import { performANPR } from '../services/geminiService';

interface LiveCalibrationViewProps {
  onViolation: (v: Omit<Violation, 'id' | 'timestamp'>) => void;
}

const LiveCalibrationView: React.FC<LiveCalibrationViewProps> = ({ onViolation }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevFrameRef = useRef<ImageData | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Tracking State
  const trackingRef = useRef<{ id: number, start: number, end: number | null } | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        setError(null);
      }
    } catch (err) {
      setError("ڕێگری لە کامێرا کرا یان بوونی نییە.");
      console.error(err);
    }
  };

  useEffect(() => {
    let animationFrameId: number;

    const processMotion = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const currentFrame = ctx.getImageData(0, 0, width, height);
      if (!prevFrameRef.current) {
        prevFrameRef.current = currentFrame;
        return null;
      }

      let totalX = 0;
      let totalY = 0;
      let count = 0;

      for (let i = 0; i < currentFrame.data.length; i += 40) { // Sample pixels for performance
        const rDiff = Math.abs(currentFrame.data[i] - prevFrameRef.current.data[i]);
        const gDiff = Math.abs(currentFrame.data[i+1] - prevFrameRef.current.data[i+1]);
        const bDiff = Math.abs(currentFrame.data[i+2] - prevFrameRef.current.data[i+2]);

        if (rDiff + gDiff + bDiff > 80) { // Motion threshold
          const pixelIndex = i / 4;
          totalX += pixelIndex % width;
          totalY += Math.floor(pixelIndex / width);
          count++;
        }
      }

      prevFrameRef.current = currentFrame;
      if (count > 50) { // Minimum pixels to consider as an object
        return { x: totalX / count, y: totalY / count };
      }
      return null;
    };

    const render = () => {
      if (canvasRef.current && videoRef.current && isCameraActive) {
        const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const { videoWidth, videoHeight } = videoRef.current;
        if (videoWidth === 0) {
           animationFrameId = requestAnimationFrame(render);
           return;
        }

        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;

        ctx.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);

        const motion = processMotion(ctx, videoWidth, videoHeight);
        const ay = videoHeight * LINE_A_Y;
        const by = videoHeight * LINE_B_Y;

        // Draw Lines
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#10b981';
        ctx.beginPath(); ctx.moveTo(0, ay); ctx.lineTo(videoWidth, ay); ctx.stroke();
        ctx.strokeStyle = '#f43f5e';
        ctx.beginPath(); ctx.moveTo(0, by); ctx.lineTo(videoWidth, by); ctx.stroke();

        if (motion) {
          // Visual feedback for tracked object
          ctx.beginPath();
          ctx.arc(motion.x, motion.y, 20, 0, Math.PI * 2);
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Detection Logic
          if (motion.y > ay && motion.y < ay + 30 && !trackingRef.current) {
            trackingRef.current = { id: Date.now(), start: Date.now(), end: null };
          }

          if (motion.y > by && motion.y < by + 30 && trackingRef.current && !trackingRef.current.end) {
            trackingRef.current.end = Date.now();
            const durationSec = (trackingRef.current.end - trackingRef.current.start) / 1000;
            const pixelDist = Math.abs(by - ay);
            const meterDist = pixelDist / PIXELS_PER_METER;
            const speedKMH = (meterDist / durationSec) * 3.6;

            if (speedKMH > SPEED_LIMIT && !isProcessing) {
               handleViolationCapture(speedKMH, ctx);
            }
            setTimeout(() => { trackingRef.current = null; }, 2000);
          }
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isCameraActive, isProcessing]);

  const handleViolationCapture = async (speed: number, ctx: CanvasRenderingContext2D) => {
    setIsProcessing(true);
    const imageData = canvasRef.current!.toDataURL('image/jpeg', 0.8);
    
    // UI Feedback for capture
    ctx.fillStyle = 'rgba(244, 63, 94, 0.3)';
    ctx.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);

    try {
      const plate = await performANPR(imageData);
      onViolation({
        plateNumber: plate,
        speed: speed,
        speedLimit: SPEED_LIMIT,
        imagePath: imageData
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col gap-8 max-w-5xl mx-auto">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-white">Sensor Calibration</h2>
          <p className="text-zinc-500 mt-1">Adjust PIXELS_PER_METER based on physical distance measurement.</p>
        </div>
        {isCameraActive && (
          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-xs font-bold text-emerald-400">ACTIVE TRACKING</span>
          </div>
        )}
      </header>

      {!isCameraActive ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-3xl gap-6">
          <div className="p-6 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-500">
            <Icons.Camera />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-zinc-300">Awaiting Sensor Activation</h3>
            <p className="text-zinc-500 mt-2 max-w-sm px-4">Click below to connect your laptop camera as a traffic sensor.</p>
          </div>
          <button 
            onClick={startCamera}
            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl transition-all shadow-lg"
          >
            Activate Camera
          </button>
          {error && <p className="text-rose-500 text-sm font-medium">{error}</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
             <div className="relative rounded-3xl overflow-hidden bg-black border border-zinc-800 shadow-2xl aspect-video">
               <video ref={videoRef} autoPlay playsInline className="hidden" />
               <canvas ref={canvasRef} className="w-full h-full object-cover" />
               {isProcessing && (
                 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center flex-col gap-3">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-bold text-white tracking-widest uppercase">Analyzing Plate...</span>
                 </div>
               )}
             </div>
             
             <div className="grid grid-cols-3 gap-4">
                <MetricCard label="PPI" value={PIXELS_PER_METER.toString()} unit="px/m" />
                <MetricCard label="FPS" value="30" unit="active" />
                <MetricCard label="GATE DIST" value="~1.8" unit="meters" />
             </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl">
              <h4 className="font-bold text-zinc-300 mb-4">Physics Config</h4>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Speed Limit</span>
                  <span className="text-zinc-300 font-bold">{SPEED_LIMIT} km/h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Entry Gate (A)</span>
                  <span className="text-emerald-400 font-bold">{(LINE_A_Y * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Exit Gate (B)</span>
                  <span className="text-rose-400 font-bold">{(LINE_B_Y * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl">
               <h4 className="font-bold text-zinc-300 mb-2">How it works:</h4>
               <p className="text-xs text-zinc-500 leading-relaxed">
                 The system compares consecutive frames to isolate motion. When the centroid of motion passes the Green line, a timer starts. Crossing the Red line finishes the measurement.
               </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ label, value, unit }: { label: string, value: string, unit: string }) => (
  <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col">
    <span className="text-[10px] text-zinc-600 font-bold uppercase mb-1">{label}</span>
    <div className="flex items-baseline gap-1">
      <span className="text-xl font-bold text-zinc-200">{value}</span>
      <span className="text-[10px] text-zinc-600">{unit}</span>
    </div>
  </div>
);

export default LiveCalibrationView;
