import React, { useState } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { X, UploadCloud, FileText, CheckCircle2, Sparkles, Users, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface StudentListImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudentListImportModal: React.FC<StudentListImportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { bulkImportStudents } = useClassroom();

  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  // Pre-load 42 student names sample template
  const sample42Names = [
    'Nguyễn Gia Huy', 'Trần Gia Hân', 'Lê Hoàng Nam', 'Phạm Minh Khôi', 'Võ Đức Trí',
    'Nguyễn Mai Lan', 'Trần Quốc Bảo', 'Lê Thảo My', 'Phan Mai Anh', 'Đặng Quốc Tuấn',
    'Vũ Hồng Phúc', 'Hoàng Thiên Ân', 'Bùi Chấn Khang', 'Đỗ Bảo Ngọc', 'Huỳnh Thanh Trúc',
    'Ngô Kiến Huy', 'Trịnh Kim Ngân', 'Dương Minh Quân', 'Đoàn Phương Thảo', 'Lý Gia Kiệt',
    'Tạ Nhật Nam', 'Mai Khánh Linh', 'Châu Vĩnh Khang', 'Lâm Gia Tuệ', 'Đinh Trọng Nhân',
    'Lương Yến Nhi', 'Trương Quốc Việt', 'Tôn Nữ Bích Trâm', 'Hà Anh Dũng', 'Chu Diệu Thảo',
    'Giang Thành Long', 'Thạch Minh Triết', 'Nghiêm Thùy Trang', 'Vương Tuấn Kiệt', 'Quách Bảo Trâm',
    'Bạch Hoài An', 'Cao Đăng Khoa', 'La Gia Hưng', 'Ôn Diệu Linh', 'Hứa Vĩnh Phát',
    'Diệp Thảo Quyên', 'Phan Nhật Hoàng'
  ].join('\n');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    const lines = rawText
      .split(/\r?\n|,|;/)
      .map((line) => line.replace(/^\d+[\.\-\s]+/, '').trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) return;

    const res = bulkImportStudents(lines);
    setSuccessCount(res.count);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    setTimeout(() => {
      setSuccessCount(null);
      onClose();
    }, 1800);
  };

  const linesCount = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border-4 border-indigo-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl">
              📁
            </div>
            <div>
              <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider block">
                Lớp 5B.2 Vui Vẻ • Cô Kim Tiến Number Hi!
              </span>
              <h2 className="text-xl font-black">
                Thêm File Danh Sách Học Sinh Cả Lớp
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Upload File Zone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Cách 1: Tải lên file danh sách (.txt, .csv, Word text)
            </label>
            <div className="relative border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 rounded-2xl p-4 text-center cursor-pointer transition-colors group">
              <input
                type="file"
                accept=".txt,.csv,.doc,.docx"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <UploadCloud className="w-8 h-8 mx-auto text-indigo-500 group-hover:scale-110 transition-transform mb-1" />
              <p className="text-xs font-bold text-indigo-900">
                {fileName ? `Đã chọn file: ${fileName}` : 'Bấm vào đây để chọn file từ máy tính'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Hỗ trợ định dạng file văn bản (.txt, .csv, Word text)
              </p>
            </div>
          </div>

          {/* Paste List Zone */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase">
                Cách 2: Hoặc dán danh sách tên học sinh (mỗi bạn 1 dòng)
              </label>
              <button
                type="button"
                onClick={() => setRawText(sample42Names)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline flex items-center space-x-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nạp mẫu chuẩn 42 học sinh 5B.2</span>
              </button>
            </div>
            <textarea
              rows={7}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="1. Nguyễn Gia Huy&#10;2. Trần Gia Hân&#10;3. Lê Hoàng Nam&#10;..."
              className="w-full p-3.5 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-hidden text-xs font-mono font-medium leading-relaxed"
            />
            <div className="flex items-center justify-between mt-1 text-xs text-slate-500 font-medium">
              <span>Đã nhận diện: <strong className="text-indigo-600 font-black">{linesCount} học sinh</strong></span>
              <span>Hệ thống sẽ tự động tạo hình minh họa trang trí và xếp bàn học!</span>
            </div>
          </div>

          {successCount !== null && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center space-x-2 text-xs sm:text-sm font-bold animate-in zoom-in-95">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                Thành công! Đã nạp {successCount} học sinh vào lớp 5B.2 và sắp xếp sơ đồ chỗ ngồi hoàn chỉnh!
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-200 transition-colors"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={linesCount === 0}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs sm:text-sm shadow-md shadow-indigo-600/25 active:scale-95 transition-all disabled:opacity-40"
          >
            Lưu & Cập Nhật {linesCount} Học Sinh Vào Lớp 5B.2
          </button>
        </div>
      </div>
    </div>
  );
};
