
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { LINE_A_Y, LINE_B_Y, SPEED_LIMIT, PIXELS_PER_METER, Icons } from '../constants.tsx';
import { Violation } from '../types.ts';
import { performANPR } from '../services/geminiService.ts';

interface LiveCalibrationViewProps {
  onViolation: (v: Omit<Violation, 'id' | 'timestamp'>) => void;
}

const LiveCalibrationView: React.FC<LiveCalibrationViewProps> = ({ onViolation }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevFrameRef = useRef<ImageData | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState<number | null>(null);

  // Tracking State
  const trackingRef = useRef<{ id: number, start: number, end: number | null } | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsPaused(false);
    prevFrameRef.current = null;
    trackingRef.current = null;
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "environment"
        } 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsCameraActive(true);
          setIsPaused(false);
          setError(null);
        };
      }
    } catch (err) {
      setError("کێشەیەک لە دەستگەیشتن بە کامێرا هەیە. تکایە دڵنیابەرەوە لە پێدانی مۆڵەت.");
      console.error(err);
    }
  };

  // دەنگی توووت بۆ کاتی دیاریکردنی تەن (Detection)
  const triggerDetectionBeep = useCallback(() => {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine'; // دەنگێکی سافتر وەک سینساڵ
      oscillator.frequency.setValueAtTime(660, audioCtx.currentTime); // دەنگی E5
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4); // توووتێکی درێژتر (0.4 چرکە)

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn("Audio playback failed:", e);
    }
  }, [isMuted]);

  // دەنگی ئاگادارکردنەوەی تیژڕەوی (Violation)
  const playViolationSound = useCallback(() => {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'square'; // دەنگێکی زبرتر بۆ ئاگادارکردنەوە
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.warn("Audio playback failed:", e);
    }
  }, [isMuted]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  useEffect(() => {
    let animationFrameId: number;

    const processMotion = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      if (isPaused) return null;
      
      const currentFrame = ctx.getImageData(0, 0, width, height);
      if (!prevFrameRef.current) {
        prevFrameRef.current = currentFrame;
        return null;
      }

      let totalX = 0;
      let totalY = 0;
      let count = 0;

      const step = 20; 
      for (let i = 0; i < currentFrame.data.length; i += step * 4) {
        const rDiff = Math.abs(currentFrame.data[i] - prevFrameRef.current.data[i]);
        const gDiff = Math.abs(currentFrame.data[i+1] - prevFrameRef.current.data[i+1]);
        const bDiff = Math.abs(currentFrame.data[i+2] - prevFrameRef.current.data[i+2]);

        if (rDiff + gDiff + bDiff > 100) {
          const pixelIndex = i / 4;
          totalX += pixelIndex % width;
          totalY += Math.floor(pixelIndex / width);
          count++;
        }
      }

      prevFrameRef.current = currentFrame;
      if (count > 30) {
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

        if (canvasRef.current.width !== videoWidth) {
            canvasRef.current.width = videoWidth;
            canvasRef.current.height = videoHeight;
        }

        if (!isPaused) {
          ctx.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
        }

        const motion = isPaused ? null : processMotion(ctx, videoWidth, videoHeight);
        const ay = videoHeight * LINE_A_Y;
        const by = videoHeight * LINE_B_Y;

        // Draw HUD
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#10b981';
        ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(0, ay); ctx.lineTo(videoWidth, ay); ctx.stroke();
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 12px Inter';
        ctx.fillText('ENTRY SENSOR A', 10, ay - 10);

        ctx.strokeStyle = '#f43f5e';
        ctx.beginPath(); ctx.moveTo(0, by); ctx.lineTo(videoWidth, by); ctx.stroke();
        ctx.fillStyle = '#f43f5e';
        ctx.fillText('EXIT SENSOR B', 10, by + 20);
        ctx.setLineDash([]);

        if (motion) {
          ctx.beginPath();
          ctx.arc(motion.x, motion.y, 25, 0, Math.PI * 2);
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 3;
          ctx.stroke();
          
          // کاتێک تەنەکە دەگاتە هێڵی یەکەم (SENSOR A)
          if (motion.y > ay && motion.y < ay + 50 && !trackingRef.current) {
            trackingRef.current = { id: Date.now(), start: Date.now(), end: null };
            // لێرەدا دەنگی توووتەکە بانگ دەکرێت، هەر کە تەنەکە ناسرایەوە
            triggerDetectionBeep();
          }

          if (motion.y > by && motion.y < by + 50 && trackingRef.current && !trackingRef.current.end) {
            trackingRef.current.end = Date.now();
            const durationSec = (trackingRef.current.end - trackingRef.current.start) / 1000;
            const pixelDist = Math.abs(by - ay);
            const meterDist = pixelDist / PIXELS_PER_METER;
            const speedKMH = (meterDist / durationSec) * 3.6;

            setCurrentSpeed(speedKMH);

            if (speedKMH > SPEED_LIMIT && !isProcessing) {
               playViolationSound(); // دەنگی ئاگادارکردنەوەی خێرایی
               handleViolationCapture(speedKMH, ctx);
            }
            
            setTimeout(() => { 
              trackingRef.current = null;
              setCurrentSpeed(null);
            }, 1500);
          }
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isCameraActive, isProcessing, isPaused, playViolationSound, triggerDetectionBeep]);

  const handleViolationCapture = async (speed: number, ctx: CanvasRenderingContext2D) => {
    setIsProcessing(true);
    const imageData = canvasRef.current!.toDataURL('image/jpeg', 0.8);
    
    ctx.fillStyle = 'white';
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
    <div className="p-8 h-full flex flex-col gap-8 max-w-6xl mx-auto">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <span className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><Icons.Camera /></span>
            Sensor Calibration
          </h2>
          <p className="text-zinc-500 mt-1">Live feed analysis for speed enforcement and plate recognition.</p>
        </div>
        
        <div className="flex gap-3">
          {isCameraActive ? (
            <button 
              onClick={stopCamera}
              className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold rounded-xl transition-all border border-zinc-700 flex items-center gap-2"
            >
              <div className="w-2 h-2 bg-rose-500 rounded-full" />
              Shutdown Engine
            </button>
          ) : (
            <button 
              onClick={startCamera}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2"
            >
              <Icons.Camera />
              Initialize Sensor
            </button>
          )}
        </div>
      </header>

      {!isCameraActive ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-zinc-900/50 border-2 border-dashed border-zinc-800 rounded-[2.5rem] gap-6 group transition-all hover:bg-zinc-900 hover:border-emerald-500/30">
          <div className="p-8 bg-zinc-800 rounded-full text-zinc-600 group-hover:text-emerald-500 group-hover:scale-110 transition-all duration-500">
            <Icons.Camera />
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-zinc-300">No Active Stream</h3>
            <p className="text-zinc-500 mt-2 max-w-xs mx-auto text-sm leading-relaxed">
              Connect your local camera to start the traffic monitoring engine and calibrate sensors.
            </p>
          </div>
          {error && (
            <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-sm font-medium flex items-center gap-2 animate-bounce">
              <Icons.Alert />
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
             <div className="relative rounded-[2rem] overflow-hidden bg-black border border-zinc-800 shadow-2xl aspect-video group">
               <video ref={videoRef} autoPlay playsInline muted className="hidden" />
               <canvas ref={canvasRef} className="w-full h-full object-cover" />
               
               {/* Overlays */}
               <div className="absolute top-6 left-6 flex gap-3 z-10">
                  <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-zinc-600' : 'bg-emerald-500 animate-pulse'}`} />
                    <span className="text-[10px] font-black text-white uppercase tracking-tighter">
                      {isPaused ? 'Engine Paused' : 'Live Stream'}
                    </span>
                  </div>
                  {currentSpeed && (
                    <div className="px-3 py-1.5 bg-rose-600 border border-rose-400 rounded-lg flex items-center gap-2 shadow-lg animate-in zoom-in-95">
                      <span className="text-xs font-black text-white">{currentSpeed.toFixed(1)} KM/H</span>
                    </div>
                  )}
               </div>

               {/* Video Controls Overlay */}
               <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0 z-20">
                  <button 
                    onClick={() => setIsPaused(!isPaused)}
                    className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
                    title={isPaused ? "Resume" : "Pause"}
                  >
                    {isPaused ? <Icons.Play /> : <Icons.Pause />}
                  </button>
                  <div className="w-px h-6 bg-white/10" />
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
                    title={isMuted ? "Unmute Alerts" : "Mute Alerts"}
                  >
                    <Icons.Volume muted={isMuted} />
                  </button>
               </div>

               {isProcessing && (
                 <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center flex-col gap-4 animate-in fade-in duration-300 z-30">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-emerald-500/20 rounded-full" />
                      <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-black text-white tracking-[0.2em] uppercase block mb-1">AI Detection Active</span>
                      <span className="text-[10px] text-zinc-500 font-mono">Running Gemini ANPR Engine...</span>
                    </div>
                 </div>
               )}

               {isPaused && !isProcessing && (
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-0">
                    <button 
                      onClick={() => setIsPaused(false)}
                      className="p-6 bg-emerald-500 text-white rounded-full shadow-2xl hover:scale-110 transition-transform"
                    >
                      <Icons.Play />
                    </button>
                 </div>
               )}
             </div>
             
             <div className="grid grid-cols-3 gap-6">
                <MetricCard label="Pixels Per Meter" value={PIXELS_PER_METER.toString()} unit="px/m" />
                <MetricCard label="Resolution" value="1280x720" unit="720p" />
                <MetricCard label="Alerts" value={isMuted ? 'Muted' : 'Active'} unit="Audio" />
             </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-xl">
              <h4 className="font-black text-zinc-100 text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                Engine Params
              </h4>
              <div className="space-y-6">
                <ConfigSlider label="Speed Limit" value={`${SPEED_LIMIT} km/h`} />
                <ConfigSlider label="Calibration PPI" value={`${PIXELS_PER_METER}`} />
                
                <div className="pt-4 border-t border-zinc-800 space-y-3">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-zinc-500 uppercase tracking-tighter">Gate A Pos</span>
                    <span className="text-emerald-400">{(LINE_A_Y * 100).toFixed(0)}% (TOP)</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-zinc-500 uppercase tracking-tighter">Gate B Pos</span>
                    <span className="text-rose-400">{(LINE_B_Y * 100).toFixed(0)}% (BOTTOM)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex flex-col gap-3">
               <h4 className="font-bold text-emerald-400 text-xs uppercase tracking-widest">Calibration Tip</h4>
               <p className="text-[11px] text-zinc-400 leading-relaxed">
                 Use the <span className="text-zinc-100 font-bold">Pause</span> feature to freeze a frame with a known physical object. Measure its pixel height to verify your PPI accuracy.
               </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ label, value, unit }: { label: string, value: string, unit: string }) => (
  <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col group hover:border-zinc-700 transition-colors">
    <span className="text-[10px] text-zinc-500 font-black uppercase mb-2 tracking-widest">{label}</span>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-black text-zinc-100">{value}</span>
      <span className="text-[10px] text-zinc-600 font-bold uppercase">{unit}</span>
    </div>
  </div>
);

const ConfigSlider = ({ label, value }: { label: string, value: string }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-100">{value}</span>
    </div>
    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
      <div className="h-full bg-emerald-500 w-2/3" />
    </div>
  </div>
);

export default LiveCalibrationView;
