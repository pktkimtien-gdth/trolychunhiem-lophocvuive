import React, { useState, useEffect, useRef } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { Student } from '../types';
import { sounds } from '../utils/audio';
import { soundEffects } from '../utils/soundEffects';
import confetti from 'canvas-confetti';
import {
  Clock,
  Sparkles,
  Award,
  Volume2,
  VolumeX,
  History,
  Play,
  RotateCw,
  Trophy,
  Coins,
  Smile,
  Sliders,
  CheckCircle2
} from 'lucide-react';

export const PendulumPicker: React.FC = () => {
  const { students, awardCoins, callHistory, recordCallHistory } = useClassroom();

  const [mode, setMode] = useState<'pendulum' | 'wheel'>('pendulum');
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Wheel effect style from user screenshot
  const [selectedEffect, setSelectedEffect] = useState<string>(
    'Xoáy tròn – Các quả cầu xoáy quanh tâm lồng cầu như cơn lốc'
  );

  // Pendulum physics & animation state
  const [pendulumAngle, setPendulumAngle] = useState(0);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const [wheelRotation, setWheelRotation] = useState(0);

  const animationFrameRef = useRef<number | null>(null);
  const spinTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Continuous gentle pendulum swing when idle (60fps rAF loop)
  useEffect(() => {
    if (mode === 'pendulum' && !isSpinning) {
      let t = 0;
      let lastTime = performance.now();
      let lastTickAngle = 0;

      const loop = (currentTime: number) => {
        const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
        lastTime = currentTime;
        t += delta * 1.8;

        // Swing -16 deg to +16 deg with smooth sine curve
        const angle = Math.sin(t * 2) * 16;
        setPendulumAngle(angle);

        // Gentle tick tock audio trigger at swing zenith
        if (soundEnabled && Math.abs(angle) < 1.2 && Math.sign(angle) !== Math.sign(lastTickAngle)) {
          sounds.playTickTock(angle > 0);
        }
        lastTickAngle = angle;

        animationFrameRef.current = requestAnimationFrame(loop);
      };

      animationFrameRef.current = requestAnimationFrame(loop);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      };
    }
  }, [mode, isSpinning, soundEnabled]);

  // Clean up timers
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    };
  }, []);

  // Handle Starting the Picker
  const handleStartPick = () => {
    if (isSpinning || students.length === 0) return;
    setIsSpinning(true);
    setSelectedStudent(null);
    setShowWinnerModal(false);

    // Pick random target student
    const randomIndex = Math.floor(Math.random() * students.length);
    const winner = students[randomIndex];

    if (mode === 'pendulum') {
      // Faster pendulum swinging & hopping highlights
      let step = 0;
      const totalSteps = 45;
      let currentIndex = 0;

      const runPendulumAnimation = () => {
        step++;
        currentIndex = (currentIndex + 1) % students.length;
        setHighlightedIndex(currentIndex);

        // Wild swinging angle
        const swingSpeed = Math.max(1, (totalSteps - step) / 4);
        const dynamicAngle = Math.sin(step * 0.45) * 35;
        setPendulumAngle(dynamicAngle);

        if (soundEnabled && step % 2 === 0) {
          sounds.playTickTock(step % 4 === 0);
        }

        if (step < totalSteps) {
          const delay = step > 32 ? (step - 32) * 25 + 40 : 50;
          setTimeout(runPendulumAnimation, delay);
        } else {
          // Finished!
          setHighlightedIndex(randomIndex);
          setPendulumAngle(0);
          finishPick(winner);
        }
      };

      runPendulumAnimation();
    } else {
      // Wheel spin
      const baseRotation = wheelRotation;
      const extraSpins = 5 * 360; // 5 full turns
      const sliceDeg = 360 / students.length;
      const targetDeg = baseRotation + extraSpins + (students.length - randomIndex) * sliceDeg;

      setWheelRotation(targetDeg);

      // Sound ticks during spin
      let tickCount = 0;
      const tickInterval = setInterval(() => {
        tickCount++;
        if (soundEnabled) sounds.playWheelTick();
        if (tickCount > 30) clearInterval(tickInterval);
      }, 100);

      setTimeout(() => {
        clearInterval(tickInterval);
        finishPick(winner);
      }, 3500);
    }
  };

  const finishPick = (winner: Student) => {
    setIsSpinning(false);
    setSelectedStudent(winner);
    setShowWinnerModal(true);

    if (soundEnabled) {
      sounds.playFanfare();
    }
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    recordCallHistory({
      studentId: winner.id,
      studentName: winner.name,
      studentAvatar: winner.avatar,
      mode: mode,
    });
  };

  const handleAwardQuickBonus = (xu: number) => {
    if (!selectedStudent) return;
    awardCoins(selectedStudent.id, xu, 'Thưởng khi gọi tên ngẫu nhiên');
    if (xu >= 5) {
      soundEffects.playBigCoin();
    } else {
      soundEffects.playCoin();
    }
    confetti({ particleCount: 40, spread: 50 });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                {mode === 'pendulum' ? 'Đồng Hồ Quả Lắc Gọi Tên' : 'Vòng Quay May Mắn'}
              </h1>
              <span className="bg-amber-100 text-amber-800 text-xs font-black px-2.5 py-1 rounded-full flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Gọi tên ngẫu nhiên & Tuyên dương</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Mỗi lượt quay mang đến một chuyển động bất ngờ, chọn ngẫu nhiên công bằng học sinh phát biểu hoặc nhận thưởng!
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5 text-indigo-600" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
            </button>

            {/* Mode Switcher */}
            <div className="bg-slate-100 p-1 rounded-2xl flex items-center">
              <button
                onClick={() => setMode('pendulum')}
                className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all ${
                  mode === 'pendulum'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⏰ Quả Lắc Đồng Hồ
              </button>
              <button
                onClick={() => setMode('wheel')}
                className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all ${
                  mode === 'wheel'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🎡 Vòng Quay Lồng Cầu
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left & Center: The Picker Stage */}
        <div className="lg:col-span-2 bg-gradient-to-b from-indigo-50/70 via-white to-purple-50/50 rounded-3xl p-6 sm:p-8 border-2 border-indigo-100 shadow-sm flex flex-col items-center justify-between min-h-[520px] relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-tr from-amber-200/30 via-pink-200/20 to-indigo-200/30 rounded-full blur-3xl pointer-events-none" />

          {/* Top Stage Indicator */}
          <div className="w-full flex items-center justify-between text-xs font-bold text-slate-500 mb-4 z-10">
            <span className="flex items-center space-x-1.5 bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-full border border-indigo-100 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Sẵn sàng quay: {students.length} học sinh</span>
            </span>

            <span className="text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full font-black">
              {mode === 'pendulum' ? '⏳ Nhịp đập công bằng' : `✨ Hiệu ứng: ${selectedEffect.split('–')[0]}`}
            </span>
          </div>

          {/* MODE 1: GRANDFATHER PENDULUM CLOCK */}
          {mode === 'pendulum' ? (
            <div className="flex flex-col items-center my-2 relative z-10">
              {/* Ornate Wooden Clock Housing */}
              <div className="w-64 sm:w-72 bg-gradient-to-b from-amber-900 via-amber-800 to-amber-950 p-4 rounded-[40px] shadow-2xl border-4 border-amber-700/80 text-center relative">
                {/* Clock Face with Roman Numerals & Golden Rim */}
                <div className="w-48 h-48 mx-auto rounded-full bg-gradient-to-b from-amber-50 to-amber-100 border-4 border-amber-400 shadow-inner flex flex-col items-center justify-center relative p-3">
                  <div className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-1">
                    5B.2 VUI VẺ
                  </div>
                  {/* Highlighted Student in Clock Center */}
                  <div className="w-20 h-20 rounded-full bg-white border-2 border-amber-300 p-1 shadow-md flex items-center justify-center overflow-hidden">
                    <img
                      src={students[highlightedIndex]?.avatar || students[0]?.avatar}
                      alt="Student"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <div className="mt-1 font-extrabold text-xs text-amber-950 truncate max-w-[140px]">
                    {students[highlightedIndex]?.name || 'Học sinh may mắn'}
                  </div>
                  <div className="text-[9px] font-bold text-amber-700">
                    🪙 {students[highlightedIndex]?.coins || 0} Xu
                  </div>
                </div>

                {/* Pendulum Chamber Window */}
                <div className="w-36 h-48 mx-auto mt-3 bg-slate-950/70 rounded-3xl border-2 border-amber-600/60 p-2 relative overflow-hidden flex justify-center">
                  {/* Swinging Pendulum Rod & Golden Bob */}
                  <div
                    style={{
                      transform: `rotate(${pendulumAngle}deg) translateZ(0)`,
                      transformOrigin: 'top center',
                      willChange: 'transform',
                      transition: isSpinning ? 'transform 0.05s linear' : 'none',
                    }}
                    className="w-full h-full flex flex-col items-center"
                  >
                    {/* Metal Rod */}
                    <div className="w-2 h-28 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-300 shadow-sm" />
                    {/* Golden Shiny Bob */}
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 border-2 border-amber-200 shadow-xl flex items-center justify-center text-amber-950 font-black text-xs">
                      ⭐ 5B.2
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* MODE 2: THE LUCKY WHEEL (LỒNG CẦU MAY MẮN) */
            <div className="relative my-4 z-10 flex flex-col items-center">
              {/* Pointer indicator at top */}
              <div className="w-8 h-8 -mb-4 z-30 bg-red-600 clip-triangle shadow-lg flex items-center justify-center">
                <span className="text-white text-xs font-black">▼</span>
              </div>

              {/* Spinning Wheel Body */}
              <div
                style={{
                  transform: `rotate(${wheelRotation}deg) translateZ(0)`,
                  willChange: isSpinning ? 'transform' : 'auto',
                  transition: isSpinning ? 'transform 3.5s cubic-bezier(0.15, 0.9, 0.2, 1)' : 'none',
                }}
                className="w-72 h-72 sm:w-80 sm:h-80 rounded-full border-8 border-indigo-500 bg-white shadow-2xl relative overflow-hidden flex items-center justify-center"
              >
                {/* Visual Segments */}
                {students.map((st, idx) => {
                  const deg = (360 / students.length) * idx;
                  const colors = [
                    'bg-pink-400',
                    'bg-amber-400',
                    'bg-emerald-400',
                    'bg-cyan-400',
                    'bg-purple-400',
                    'bg-rose-400',
                    'bg-blue-400',
                  ];
                  const bgColor = colors[idx % colors.length];

                  return (
                    <div
                      key={st.id}
                      style={{
                        transform: `rotate(${deg}deg)`,
                        transformOrigin: '50% 50%',
                      }}
                      className="absolute w-full h-full flex justify-center pt-2 pointer-events-none"
                    >
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full ${bgColor} p-0.5 border border-white shadow-xs`}>
                          <img
                            src={st.avatar}
                            alt={st.name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        </div>
                        <span className="text-[9px] font-black text-slate-800 bg-white/90 px-1 rounded-sm mt-0.5 max-w-[50px] truncate shadow-2xs">
                          {st.name.split(' ').slice(-1)[0]}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Center Hub */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-700 to-purple-600 border-4 border-white shadow-xl flex items-center justify-center text-white font-black text-xs z-20">
                  5B.2
                </div>
              </div>
            </div>
          )}

          {/* Action Trigger Button */}
          <div className="w-full flex justify-center mt-6 z-10">
            <button
              onClick={handleStartPick}
              disabled={isSpinning || students.length === 0}
              className={`w-full max-w-md py-4 px-8 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center space-x-3 shadow-xl transition-all active:scale-95 ${
                isSpinning
                  ? 'bg-slate-400 text-white cursor-not-allowed animate-pulse'
                  : mode === 'pendulum'
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-pink-600 hover:from-amber-600 hover:to-pink-700 text-white shadow-orange-500/30'
                  : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-700 hover:to-pink-600 text-white shadow-indigo-600/30'
              }`}
            >
              {isSpinning ? (
                <>
                  <RotateCw className="w-6 h-6 animate-spin" />
                  <span>Đang lắc quả lắc chọn học sinh...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  <span>
                    {mode === 'pendulum' ? 'LẮC QUẢ LẮC GỌI TÊN NGAY' : 'QUAY NGAY VÒNG QUAY'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Settings & Call History (As in Screenshot 2) */}
        <div className="space-y-6">
          {/* Wheel Effect Settings (Screenshot 2 right side) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-sm sm:text-base text-slate-800">
                  Thiết Lập Hiệu Ứng Lồng Cầu
                </h3>
              </div>
              <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">
                7 hiệu ứng
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Chọn hiệu ứng cố định cho lượt quay:
              </label>
              <select
                value={selectedEffect}
                onChange={(e) => setSelectedEffect(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="Xoáy tròn – Các quả cầu xoáy quanh tâm lồng cầu như cơn lốc">
                  Xoáy tròn – Các quả cầu xoáy quanh tâm lồng cầu...
                </option>
                <option value="Tung nảy – Các quả cầu bị thổi bật nhẹ nhàng, nảy nhịp nhàng">
                  Tung nảy – Các quả cầu bị thổi bật nhẹ nhàng...
                </option>
                <option value="Hút vào tâm – Chạy nhẹ nhàng rồi từ từ bị hút dồn về tâm lồng">
                  Hút vào tâm – Chạy nhẹ nhàng dồn về tâm...
                </option>
                <option value="Bay theo quỹ đạo – Quả cầu di chuyển thành các vòng cung mềm mại">
                  Bay theo quỹ đạo – Di chuyển vòng cung mềm mại...
                </option>
                <option value="Mưa bóng – Các quả cầu nâng lên rồi rơi xuống như mưa bóng">
                  Mưa bóng – Nâng lên rơi xuống rực rỡ...
                </option>
                <option value="Sân khấu ánh sáng – Spotlight quét qua các quả cầu khóa mục tiêu">
                  Sân khấu ánh sáng – Spotlight quét khóa mục tiêu...
                </option>
                <option value="Sóng bồng bềnh – Các quả cầu nhấp nhô theo làn sóng nhịp nhàng">
                  Sóng bồng bềnh – Nhấp nhô làn sóng nhịp nhàng...
                </option>
              </select>
            </div>

            <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200/60 text-xs text-amber-900 flex items-start space-x-2">
              <span className="text-base">💡</span>
              <p className="leading-relaxed">
                Đồng hồ quả lắc giúp tạo không khí hồi hộp, kích thích tư duy phản biện và phản xạ tự giác học tập của học sinh tiểu học!
              </p>
            </div>
          </div>

          {/* Call History (Lịch Sử Quay) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-sm sm:text-base text-slate-800">
                  Lịch Sử Gọi Tên ({callHistory.length})
                </h3>
              </div>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {callHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    <img
                      src={item.studentAvatar}
                      alt={item.studentName}
                      className="w-8 h-8 rounded-full bg-white border border-slate-200"
                    />
                    <div>
                      <h4 className="text-xs font-black text-slate-800">
                        {item.studentName}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-semibold">
                        {item.mode === 'pendulum' ? 'Quả lắc' : 'Vòng quay'} • {item.timestamp}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-md">
                    Đã gọi
                  </span>
                </div>
              ))}

              {callHistory.length === 0 && (
                <div className="py-8 text-center text-slate-400">
                  <Smile className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                  <p className="text-xs font-bold text-slate-500">Chưa có lượt gọi nào</p>
                  <p className="text-[11px] text-slate-400">Bấm nút quay để bắt đầu tiết học nhé!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Winner Celebration Modal */}
      {showWinnerModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in zoom-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-4 border-amber-300 overflow-hidden text-center">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 p-6 text-white relative">
              <span className="text-3xl">🎉</span>
              <h2 className="text-2xl font-black mt-1">Xin Chúc Mừng!</h2>
              <p className="text-xs text-white/90 font-bold">
                {mode === 'pendulum' ? 'Quả lắc đồng hồ đã dừng tại em:' : 'Vòng quay may mắn đã chọn:'}
              </p>
            </div>

            {/* Student Spotlight */}
            <div className="p-6 space-y-4">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-amber-300 to-pink-300 p-1.5 shadow-xl">
                <img
                  src={selectedStudent.avatar}
                  alt={selectedStudent.name}
                  className="w-full h-full object-cover rounded-full bg-white"
                />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {selectedStudent.name}
                </h3>
                <p className="text-xs font-bold text-slate-500 mt-0.5">
                  Lớp 5B.2 Vui Vẻ • Cô Kim Tiến Number Hi! • Bàn {selectedStudent.row ? `Hàng ${selectedStudent.row}` : 'lớp học'}
                </p>
                <div className="inline-flex items-center space-x-1 mt-2 bg-amber-100 text-amber-900 font-black text-xs px-3 py-1 rounded-full border border-amber-200">
                  <span>🪙 Đang có {selectedStudent.coins} xu thưởng</span>
                </div>
              </div>

              {/* Bonus award actions */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                <p className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                  Tuyên dương & Trao thưởng ngay
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAwardQuickBonus(2)}
                    className="py-2.5 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-black text-xs flex items-center justify-center space-x-1 active:scale-95 transition-transform"
                  >
                    <span>⭐ +2 Xu Tự Tin</span>
                  </button>
                  <button
                    onClick={() => handleAwardQuickBonus(5)}
                    className="py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs flex items-center justify-center space-x-1 active:scale-95 transition-transform shadow-sm"
                  >
                    <span>🪙 +5 Xu Trả Lời Tốt</span>
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowWinnerModal(false)}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-md transition-colors"
              >
                Đóng & Tiếp Tục Tiết Học
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
