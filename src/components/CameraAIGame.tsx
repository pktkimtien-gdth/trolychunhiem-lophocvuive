import React, { useState, useRef, useEffect } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { CAMERA_CHALLENGES } from '../data/initialData';
import { CameraChallenge } from '../types';
import { sounds } from '../utils/audio';
import { soundEffects } from '../utils/soundEffects';
import confetti from 'canvas-confetti';
import {
  Camera,
  Sparkles,
  Award,
  Video,
  VideoOff,
  Flame,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Coins,
  Smile,
  ShieldCheck,
  ChevronRight,
  Hand,
  Volume2
} from 'lucide-react';

export const CameraAIGame: React.FC = () => {
  const { currentStudent, awardCoins } = useClassroom();

  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    isCorrect: boolean;
    feedback: string;
    recognizedAction?: string;
  } | null>(null);

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [motionTiltSide, setMotionTiltSide] = useState<'left' | 'right' | 'center'>('center');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const motionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentChallenge: CameraChallenge = CAMERA_CHALLENGES[currentChallengeIndex];

  // Initialize Camera
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      sounds.playCorrect();
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError(
        'Không thể mở Camera (chưa cấp quyền hoặc không có webcam). Bạn có thể dùng chế độ Giả Lập Tương Tác bên dưới để tiếp tục trải nghiệm!'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (motionIntervalRef.current) clearInterval(motionIntervalRef.current);
    };
  }, []);

  // Motion Detection loop on canvas for Body Tilt / Hand Raise (Optimized with rAF)
  useEffect(() => {
    if (!cameraActive) return;

    let prevFrame: ImageData | null = null;
    let animId: number | null = null;
    let lastProcessedTime = performance.now();

    // Ensure canvas dimensions are initialized once
    if (canvasRef.current) {
      canvasRef.current.width = 160;
      canvasRef.current.height = 120;
    }

    const processMotionFrame = (currentTime: number) => {
      // Throttle analysis to ~6 times/sec (160ms) to avoid hogging CPU/GPU
      if (currentTime - lastProcessedTime >= 160) {
        lastProcessedTime = currentTime;

        if (videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          if (ctx) {
            ctx.drawImage(video, 0, 0, 160, 120);
            const currentFrame = ctx.getImageData(0, 0, 160, 120);

            if (prevFrame) {
              let leftMotion = 0;
              let rightMotion = 0;
              const data1 = prevFrame.data;
              const data2 = currentFrame.data;

              // Step by 16 for high-speed sampling without layout cost
              for (let i = 0; i < data1.length; i += 16) {
                const diff =
                  Math.abs(data1[i] - data2[i]) +
                  Math.abs(data1[i + 1] - data2[i + 1]) +
                  Math.abs(data1[i + 2] - data2[i + 2]);

                if (diff > 45) {
                  const pixelIndex = i / 4;
                  const x = pixelIndex % 160;
                  // Mirrored camera: x < 80 is right in mirrored view
                  if (x < 80) leftMotion++;
                  else rightMotion++;
                }
              }

              if (leftMotion > rightMotion + 15 && leftMotion > 30) {
                setMotionTiltSide('left');
              } else if (rightMotion > leftMotion + 15 && rightMotion > 30) {
                setMotionTiltSide('right');
              } else {
                setMotionTiltSide('center');
              }
            }

            prevFrame = currentFrame;
          }
        }
      }

      animId = requestAnimationFrame(processMotionFrame);
    };

    animId = requestAnimationFrame(processMotionFrame);

    return () => {
      if (animId !== null) {
        cancelAnimationFrame(animId);
      }
    };
  }, [cameraActive]);

  // Capture image and evaluate using AI endpoint
  const evaluateAction = async (forcedAnswerIndex?: number) => {
    if (isEvaluating) return;
    setIsEvaluating(true);
    setEvaluationResult(null);

    // If using simulated answer or if camera is off
    if (!cameraActive || forcedAnswerIndex !== undefined) {
      setTimeout(() => {
        const chosen = forcedAnswerIndex !== undefined ? forcedAnswerIndex : 0;
        const isCorrect = chosen === currentChallenge.correctIndex;

        handleChallengeOutcome(
          isCorrect,
          isCorrect
            ? currentChallenge.explanation
            : 'Động tác chưa chính xác rồi, hãy thử lại cùng câu hỏi này nhé!',
          currentChallenge.options[chosen]
        );
        setIsEvaluating(false);
      }, 700);
      return;
    }

    // Capture Snapshot from Camera
    let base64Image = '';
    if (videoRef.current && canvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 480, 360);
        base64Image = canvas.toDataURL('image/jpeg', 0.8);
      }
    }

    try {
      // Call Server Gemini AI Endpoint
      const response = await fetch('/api/ai/evaluate-snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Image,
          challengeType: currentChallenge.challengeType,
          expectedAnswer: currentChallenge.expectedActionDesc,
          questionContext: currentChallenge.question,
        }),
      });

      const data = await response.json();
      if (data.success && data.result) {
        handleChallengeOutcome(
          data.result.isCorrect,
          data.result.feedback || currentChallenge.explanation,
          data.result.recognizedAction
        );
      } else {
        // Fallback with motion detection heuristic
        let isCorrect = false;
        if (currentChallenge.challengeType === 'body_tilt') {
          isCorrect =
            (currentChallenge.correctIndex === 0 && motionTiltSide === 'left') ||
            (currentChallenge.correctIndex === 1 && motionTiltSide === 'right');
        } else {
          isCorrect = true; // Graceful reward for kid's participation
        }

        handleChallengeOutcome(
          isCorrect,
          isCorrect ? currentChallenge.explanation : 'Hãy giữ yên động tác rõ hơn trước camera nhé!',
          'Nhận diện cử chỉ chuyển động'
        );
      }
    } catch {
      handleChallengeOutcome(true, currentChallenge.explanation, 'Nhận diện nỗ lực của bé');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleChallengeOutcome = (isCorrect: boolean, feedback: string, recognizedAction?: string) => {
    setEvaluationResult({ isCorrect, feedback, recognizedAction });

    if (isCorrect) {
      soundEffects.playBigCoin();
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
      setScore((prev) => prev + 10);
      setStreak((prev) => prev + 1);

      if (currentStudent) {
        awardCoins(currentStudent.id, currentChallenge.rewardCoins || 5, 'Trò chơi Camera AI');
      }
    } else {
      sounds.playWrong();
      setStreak(0);
    }
  };

  const nextChallenge = () => {
    setEvaluationResult(null);
    setCurrentChallengeIndex((prev) => (prev + 1) % CAMERA_CHALLENGES.length);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                Trò Chơi Tương Tác Camera AI
              </h1>
              <span className="bg-cyan-100 text-cyan-800 text-xs font-black px-2.5 py-1 rounded-full flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                <span>Vận Động & Phản Xạ Tư Duy</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Không chỉ click chuột — Bé vận động cơ thể, giơ ngón tay hoặc nghiêng người để trả lời cùng Trợ Lý Camera AI!
            </p>
          </div>

          {/* Gamification Stats */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-2xl">
              <Coins className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-black text-amber-800">
                +{currentChallenge.rewardCoins} Xu / câu đúng
              </span>
            </div>
            <div className="flex items-center space-x-1.5 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-2xl">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-black text-orange-800">
                Streak: {streak} 🔥
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: The Camera View & HUD (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 rounded-3xl p-4 sm:p-6 border-4 border-cyan-400/40 shadow-xl flex flex-col items-center justify-between min-h-[460px] relative overflow-hidden">
          {/* Top Camera Status Bar */}
          <div className="w-full flex items-center justify-between z-20 text-white text-xs font-bold">
            <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  cameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`}
              />
              <span>{cameraActive ? 'Camera AI: Đang Bật' : 'Camera AI: Đang Tắt'}</span>
            </div>

            {currentChallenge.challengeType === 'body_tilt' && cameraActive && (
              <div className="bg-cyan-500/80 text-white px-3 py-1 rounded-full text-xs font-black animate-pulse">
                Hướng nghiêng: {motionTiltSide === 'left' ? '👈 Trái (ĐÚNG)' : motionTiltSide === 'right' ? '👉 Phải (SAI)' : 'Giữa'}
              </div>
            )}
          </div>

          {/* Video Stream & Visual AR Overlays */}
          <div className="relative w-full aspect-4/3 max-w-lg rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center my-3 border-2 border-cyan-500/50 shadow-inner">
            {cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* AR Grid & Zones Overlay for Elementary Children */}
                {currentChallenge.challengeType === 'body_tilt' ? (
                  <div className="absolute inset-0 grid grid-cols-2 pointer-events-none">
                    <div
                      className={`border-r-2 border-dashed border-white/40 flex items-center justify-center transition-colors ${
                        motionTiltSide === 'left' ? 'bg-emerald-500/25' : 'bg-emerald-500/5'
                      }`}
                    >
                      <div className="bg-emerald-600/80 text-white text-xs font-black px-3 py-1.5 rounded-xl">
                        👈 NGHIÊNG TRÁI: ĐÚNG
                      </div>
                    </div>
                    <div
                      className={`flex items-center justify-center transition-colors ${
                        motionTiltSide === 'right' ? 'bg-rose-500/25' : 'bg-rose-500/5'
                      }`}
                    >
                      <div className="bg-rose-600/80 text-white text-xs font-black px-3 py-1.5 rounded-xl">
                        👉 NGHIÊNG PHẢI: SAI
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-52 h-52 border-2 border-dashed border-cyan-300 rounded-3xl animate-pulse flex items-center justify-center bg-cyan-400/5">
                      <span className="text-cyan-200 text-xs font-bold bg-black/60 px-2.5 py-1 rounded-lg">
                        🎯 Vùng nhận diện bàn tay / cử chỉ
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center p-6 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-800 flex items-center justify-center text-cyan-400 border border-slate-700">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-white font-extrabold text-base">
                    Bật Camera Để Trải Nghiệm Tương Tác AI
                  </h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                    Hệ thống nhận diện cử chỉ cơ thể giúp học sinh vừa học vừa vận động hào hứng!
                  </p>
                </div>
                <button
                  onClick={startCamera}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm px-5 py-2.5 rounded-2xl shadow-lg transition-transform active:scale-95"
                >
                  Cho phép & Mở Camera Ngay
                </button>
              </div>
            )}
          </div>

          {/* Camera Controls & Action Button */}
          <div className="w-full flex items-center justify-between gap-3 z-20">
            {cameraActive ? (
              <button
                onClick={stopCamera}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Tắt Camera
              </button>
            ) : (
              <button
                onClick={startCamera}
                className="py-2.5 px-3 rounded-xl bg-cyan-900/60 hover:bg-cyan-900 text-cyan-200 text-xs font-bold border border-cyan-700 transition-colors"
              >
                Mở Camera
              </button>
            )}

            <button
              onClick={() => evaluateAction()}
              disabled={isEvaluating}
              className={`flex-1 py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 shadow-lg transition-all active:scale-95 ${
                isEvaluating
                  ? 'bg-slate-600 text-slate-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/25'
              }`}
            >
              {isEvaluating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI đang phân tích cử chỉ...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Chụp & AI Chấm Động Tác Này!</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Challenge Details & Interactive Options (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Question Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-indigo-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="bg-indigo-100 text-indigo-800 text-xs font-black px-2.5 py-1 rounded-full">
                {currentChallenge.subject} • Câu {currentChallengeIndex + 1}/{CAMERA_CHALLENGES.length}
              </span>
              <button
                onClick={() => sounds.speakVietnamese(currentChallenge.question)}
                title="Đọc câu hỏi cho bé"
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-colors"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-base sm:text-lg font-black text-slate-800 leading-snug">
              {currentChallenge.question}
            </h3>

            {/* Hint Box */}
            <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200/80 text-xs text-amber-900 flex items-start space-x-2">
              <Hand className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold">Cách làm với Camera AI: </span>
                <span className="font-medium text-amber-800">
                  {currentChallenge.expectedActionDesc}
                </span>
              </div>
            </div>

            {/* Options List */}
            <div className="space-y-2">
              <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Các phương án lựa chọn:
              </p>
              {currentChallenge.options.map((opt, idx) => (
                <div
                  key={idx}
                  onClick={() => evaluateAction(idx)}
                  className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between text-xs sm:text-sm font-bold ${
                    evaluationResult && idx === currentChallenge.correctIndex
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                      : 'bg-slate-50 hover:bg-indigo-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <span>{opt}</span>
                  <span className="text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded-md border">
                    Chạm để chọn thử
                  </span>
                </div>
              ))}
            </div>

            {/* AI Evaluation Result Banner */}
            {evaluationResult && (
              <div
                className={`rounded-2xl p-4 border animate-in zoom-in-95 duration-200 ${
                  evaluationResult.isCorrect
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {evaluationResult.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                  )}
                  <h4 className="font-black text-sm">
                    {evaluationResult.isCorrect ? 'Tuyệt Vời! Động Tác Chính Xác!' : 'Chưa Chính Xác Rồi!'}
                  </h4>
                </div>
                <p className="text-xs mt-1.5 leading-relaxed font-medium">
                  {evaluationResult.feedback}
                </p>
                {evaluationResult.isCorrect && (
                  <p className="text-xs font-black text-amber-700 mt-2 flex items-center space-x-1">
                    <span>🪙 Đã thưởng +{currentChallenge.rewardCoins} Xu vào tài khoản!</span>
                  </p>
                )}
              </div>
            )}

            {/* Next Challenge Button */}
            <button
              onClick={nextChallenge}
              className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm flex items-center justify-center space-x-2 shadow-md transition-all active:scale-95"
            >
              <span>Thử Thách Tiếp Theo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
