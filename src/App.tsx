import React, { useState, Suspense, lazy } from 'react';
import { ClassroomProvider, useClassroom } from './context/ClassroomContext';
import { UIConfigProvider, useUIConfig } from './context/UIConfigContext';
import { Navbar } from './components/Navbar';
import { OfflineStatusBanner } from './components/OfflineStatusBanner';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { SuspenseFallback } from './components/common/SuspenseFallback';
import { Student } from './types';
import { LayoutDashboard } from 'lucide-react';

// Code-split heavy components with React.lazy
const WelcomeAuthScreen = lazy(() => import('./components/WelcomeAuthScreen').then((m) => ({ default: m.WelcomeAuthScreen })));
const WebsiteAdminCustomizer = lazy(() => import('./components/admin/WebsiteAdminCustomizer').then((m) => ({ default: m.WebsiteAdminCustomizer })));
const LMSLayout = lazy(() => import('./components/lms/LMSLayout').then((m) => ({ default: m.LMSLayout })));
const SeatingChart = lazy(() => import('./components/SeatingChart').then((m) => ({ default: m.SeatingChart })));
const WorksheetBank = lazy(() => import('./components/WorksheetBank').then((m) => ({ default: m.WorksheetBank })));
const GiftShop = lazy(() => import('./components/GiftShop').then((m) => ({ default: m.GiftShop })));
const PendulumPicker = lazy(() => import('./components/PendulumPicker').then((m) => ({ default: m.PendulumPicker })));
const CameraAIGame = lazy(() => import('./components/CameraAIGame').then((m) => ({ default: m.CameraAIGame })));
const TeacherAdminPanel = lazy(() => import('./components/TeacherAdminPanel').then((m) => ({ default: m.TeacherAdminPanel })));
const ParentPortalView = lazy(() => import('./components/ParentPortalView').then((m) => ({ default: m.ParentPortalView })));
const ContestDossier = lazy(() => import('./components/ContestDossier').then((m) => ({ default: m.ContestDossier })));
const AIVideoLibrary = lazy(() => import('./components/AIVideoLibrary').then((m) => ({ default: m.AIVideoLibrary })));
const LibraryGallery = lazy(() => import('./components/LibraryGallery').then((m) => ({ default: m.LibraryGallery })));

// Code-split modals
const StudentLoginModal = lazy(() => import('./components/StudentLoginModal').then((m) => ({ default: m.StudentLoginModal })));
const TeacherLoginModal = lazy(() => import('./components/TeacherLoginModal').then((m) => ({ default: m.TeacherLoginModal })));
const ParentModal = lazy(() => import('./components/ParentModal').then((m) => ({ default: m.ParentModal })));
const ClassroomFileManagerModal = lazy(() => import('./components/ClassroomFileManagerModal').then((m) => ({ default: m.ClassroomFileManagerModal })));
const MediaUploadModal = lazy(() => import('./components/MediaUploadModal').then((m) => ({ default: m.MediaUploadModal })));

function MainAppContent() {
  const { role, isAuthenticated, isAdminLoggedIn } = useClassroom();
  const { content } = useUIConfig();
  const [activeTab, setActiveTab] = useState(() => content.defaultLandingTab || 'seating');

  // Modals state
  const [showStudentLogin, setShowStudentLogin] = useState(false);
  const [showTeacherLogin, setShowTeacherLogin] = useState(false);
  const [showParentLogin, setShowParentLogin] = useState(false);
  const [showFileManager, setShowFileManager] = useState(false);
  const [showUploadMedia, setShowUploadMedia] = useState(false);

  const handleSelectStudentFromDesk = (_student: Student) => {
    // Handled inside SeatingChart desk interaction drawer
  };

  // If user is not authenticated, render Welcome & Role Selection Screen
  if (!isAuthenticated) {
    return (
      <ErrorBoundary sectionName="Màn hình Chào mừng & Đăng nhập">
        <Suspense fallback={<SuspenseFallback title="Đang mở Lớp học Vui Đến Trường..." subtitle="Khởi tạo giao diện thân thiện cho học sinh" />}>
          <WelcomeAuthScreen />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // If activeTab is 'lms' and not in parent role, render the desktop-first LMSLayout with its dedicated sidebar
  if (role !== 'parent' && activeTab === 'lms') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col font-['Quicksand',sans-serif] w-full min-w-0 overflow-x-hidden">
        <OfflineStatusBanner />

        <ErrorBoundary sectionName="Hệ thống LMS Quản Trị Chủ Nhiệm">
          <Suspense fallback={<SuspenseFallback title="Đang tải Hệ thống Quản trị LMS..." subtitle="Đang nạp dữ liệu 42 học sinh và sổ nhiệm vụ tuần" />}>
            <LMSLayout
              onOpenToolkitTab={(tabId) => setActiveTab(tabId)}
              onOpenStudentLogin={() => setShowStudentLogin(true)}
              onOpenTeacherLogin={() => setShowTeacherLogin(true)}
              onOpenParentLogin={() => setShowParentLogin(true)}
            />
          </Suspense>
        </ErrorBoundary>

        {/* Code-split Modals loaded on demand */}
        {showStudentLogin && (
          <Suspense fallback={null}>
            <StudentLoginModal
              isOpen={showStudentLogin}
              onClose={() => setShowStudentLogin(false)}
            />
          </Suspense>
        )}

        {showTeacherLogin && (
          <Suspense fallback={null}>
            <TeacherLoginModal
              isOpen={showTeacherLogin}
              onClose={() => setShowTeacherLogin(false)}
              onSuccess={() => setActiveTab('lms')}
            />
          </Suspense>
        )}

        {showParentLogin && (
          <Suspense fallback={null}>
            <ParentModal
              isOpen={showParentLogin}
              onClose={() => setShowParentLogin(false)}
              onSuccess={() => setActiveTab('reports')}
            />
          </Suspense>
        )}

        {showFileManager && (
          <Suspense fallback={null}>
            <ClassroomFileManagerModal
              isOpen={showFileManager}
              onClose={() => setShowFileManager(false)}
            />
          </Suspense>
        )}

        {showUploadMedia && (
          <Suspense fallback={null}>
            <MediaUploadModal
              isOpen={showUploadMedia}
              onClose={() => setShowUploadMedia(false)}
              onOpenVideoLibrary={() => setActiveTab('video-library')}
            />
          </Suspense>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-['Quicksand',sans-serif] w-full min-w-0 overflow-x-hidden">
      <OfflineStatusBanner />

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenStudentLogin={() => setShowStudentLogin(true)}
        onOpenTeacherLogin={() => setShowTeacherLogin(true)}
        onOpenParentLogin={() => setShowParentLogin(true)}
        onOpenFileManager={() => setShowFileManager(true)}
        onOpenUploadMedia={() => setShowUploadMedia(true)}
      />

      {/* Main Container with flex-grow, min-width, and overflow constraints */}
      <main className="flex-1 flex-grow min-w-0 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-x-hidden">
        {/* Urgent Announcement Banner (if configured) */}
        {content.showAnnouncementBanner && content.announcementBanner && (
          <div className="mb-6 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-pink-500/10 border-2 border-amber-300 rounded-3xl p-4 flex items-center space-x-3 shadow-xs">
            <span className="text-2xl shrink-0">📢</span>
            <div className="flex-1 text-xs sm:text-sm font-bold text-amber-950">
              <span className="font-black uppercase tracking-wider text-amber-800 mr-1.5">
                Thông báo dặn dò:
              </span>
              {content.announcementBanner}
            </div>
          </div>
        )}

        {/* Admin Visual Customizer Tab */}
        {role === 'admin' && activeTab === 'admin-customizer' ? (
          <ErrorBoundary sectionName="Trình Quản Trị Website & Giao Diện">
            <Suspense fallback={<SuspenseFallback title="Đang mở Trình Quản Trị Giao Diện..." subtitle="Nạp trình trực quan hóa và bộ phối màu" />}>
              <WebsiteAdminCustomizer onBackToClass={() => setActiveTab(content.defaultLandingTab || 'seating')} />
            </Suspense>
          </ErrorBoundary>
        ) : role === 'parent' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
              <span className="text-xs sm:text-sm font-bold text-emerald-900">
                🌱 Quý phụ huynh đang xem hồ sơ học sinh Lớp 5B.2. Bấm vào các chuyên mục để cùng theo dõi tiến độ học tập và rèn luyện.
              </span>
              <button
                onClick={() => setShowParentLogin(true)}
                className="text-xs bg-white text-emerald-800 font-bold px-3 py-1.5 rounded-xl border border-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer shrink-0 ml-2"
                title="Chuyển sang xem hồ sơ học sinh khác"
              >
                Chuyển hồ sơ học sinh
              </button>
            </div>
            <ErrorBoundary sectionName="Cổng Phụ Huynh Học Sinh">
              <Suspense fallback={<SuspenseFallback title="Đang tải cổng thông tin phụ huynh..." />}>
                <ParentPortalView />
              </Suspense>
            </ErrorBoundary>
          </div>
        ) : (
          <>
            {activeTab === 'seating' && (
              <ErrorBoundary sectionName="Sơ đồ Lớp học 3D & Chỗ ngồi">
                <Suspense fallback={<SuspenseFallback title="Đang tải Sơ đồ Lớp học..." subtitle="Khởi tạo 4 dãy bàn ghế và phân bổ học sinh 5B.2" />}>
                  <SeatingChart onSelectStudent={handleSelectStudentFromDesk} />
                </Suspense>
              </ErrorBoundary>
            )}

            {activeTab === 'video-library' && (
              <ErrorBoundary sectionName="Thư viện Video AI Sinh Động">
                <Suspense fallback={<SuspenseFallback title="Đang tải Thư viện Video AI..." />}>
                  <AIVideoLibrary
                    onOpenWorksheet={() => setActiveTab('worksheets')}
                    onOpenUploadMedia={() => setShowUploadMedia(true)}
                  />
                </Suspense>
              </ErrorBoundary>
            )}

            {activeTab === 'worksheets' && (
              <ErrorBoundary sectionName="Ngân hàng Phiếu Bài Tập Tự Học">
                <Suspense fallback={<SuspenseFallback title="Đang tải Ngân hàng Phiếu Bài Tập..." subtitle="Tải câu hỏi tương tác môn học" />}>
                  <WorksheetBank />
                </Suspense>
              </ErrorBoundary>
            )}

            {activeTab === 'gifts' && (
              <ErrorBoundary sectionName="Cửa hàng Quà Tặng & Đổi Xu">
                <Suspense fallback={<SuspenseFallback title="Đang nạp danh mục Quà thưởng..." />}>
                  <GiftShop onOpenStudentLogin={() => setShowStudentLogin(true)} />
                </Suspense>
              </ErrorBoundary>
            )}

            {activeTab === 'picker' && (
              <ErrorBoundary sectionName="Con Lắc & Vòng Quay Gọi Tên">
                <Suspense fallback={<SuspenseFallback title="Đang khởi tạo Con Lắc Gọi Tên..." subtitle="Nạp mô phỏng vật lý 60fps và hiệu ứng âm thanh" />}>
                  <PendulumPicker />
                </Suspense>
              </ErrorBoundary>
            )}

            {activeTab === 'camera-ai' && (
              <ErrorBoundary sectionName="Trò chơi Tương tác Camera AI">
                <Suspense fallback={<SuspenseFallback title="Đang tải Trò chơi Camera AI..." subtitle="Khởi tạo xử lý thị giác máy tính và webcam" />}>
                  <CameraAIGame />
                </Suspense>
              </ErrorBoundary>
            )}

            {activeTab === 'library' && (
              <ErrorBoundary sectionName="Thư viện Sách Số 3D Lớp 5">
                <Suspense fallback={<SuspenseFallback title="Đang mở Thư viện Sách Số 3D..." />}>
                  <LibraryGallery onBackToLMS={() => setActiveTab('lms')} />
                </Suspense>
              </ErrorBoundary>
            )}

            {activeTab === 'reports' && (
              <ErrorBoundary sectionName="Báo cáo Tổng kết & Sổ Điểm">
                <Suspense fallback={<SuspenseFallback title="Đang tải Báo cáo Tổng kết..." />}>
                  <TeacherAdminPanel />
                </Suspense>
              </ErrorBoundary>
            )}

            {activeTab === 'contest' && (
              <ErrorBoundary sectionName="Hồ sơ Bài giảng & Minh chứng Hội thi">
                <Suspense fallback={<SuspenseFallback title="Đang tải Hồ sơ Bài giảng..." />}>
                  <ContestDossier />
                </Suspense>
              </ErrorBoundary>
            )}
          </>
        )}
      </main>

      {/* Primary School Footer */}
      <footer className="bg-white border-t border-slate-200/90 py-8 px-4 text-center mt-12 text-slate-600 font-medium">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              {content.brandName || 'Vui đến trường'}
            </h3>
            <p className="text-sm font-bold text-blue-700">
              {content.slogans?.[0] || 'Mỗi ngày đến lớp – Mỗi ngày một niềm vui!'}
            </p>
            <p className="text-xs text-slate-500">
              🌈 Học tập tích cực • Sáng tạo mỗi ngày • Yêu thương và sẻ chia
            </p>
          </div>

          <div className="flex items-center justify-center space-x-3 text-xs font-bold text-slate-700 flex-wrap gap-y-1">
            <span>👩‍🏫 Giáo viên chủ nhiệm: <strong>{content.teacherName || 'Cô Kim Tiến'}</strong></span>
            <span>•</span>
            <span>👧👦 Sĩ số: <strong>42 học sinh</strong></span>
            <span>•</span>
            <span>🏫 {content.className || 'Lớp 5B.2'}</span>
          </div>

          <div className="text-[11px] text-slate-400 space-y-0.5">
            <p>Hệ thống Quản lý Học tập & Lớp học Hạnh phúc</p>
            <p>© 2025 - 2026 {content.brandName || 'Vui Đến Trường'} • Phát triển vì niềm vui học tập của học sinh</p>
          </div>
        </div>
      </footer>

      {/* Code-split Modals */}
      {showStudentLogin && (
        <Suspense fallback={null}>
          <StudentLoginModal
            isOpen={showStudentLogin}
            onClose={() => setShowStudentLogin(false)}
          />
        </Suspense>
      )}

      {showTeacherLogin && (
        <Suspense fallback={null}>
          <TeacherLoginModal
            isOpen={showTeacherLogin}
            onClose={() => setShowTeacherLogin(false)}
            onSuccess={() => setActiveTab('lms')}
          />
        </Suspense>
      )}

      {showParentLogin && (
        <Suspense fallback={null}>
          <ParentModal
            isOpen={showParentLogin}
            onClose={() => setShowParentLogin(false)}
            onSuccess={() => setActiveTab('reports')}
          />
        </Suspense>
      )}

      {showFileManager && (
        <Suspense fallback={null}>
          <ClassroomFileManagerModal
            isOpen={showFileManager}
            onClose={() => setShowFileManager(false)}
          />
        </Suspense>
      )}

      {showUploadMedia && (
        <Suspense fallback={null}>
          <MediaUploadModal
            isOpen={showUploadMedia}
            onClose={() => setShowUploadMedia(false)}
            onOpenVideoLibrary={() => setActiveTab('video-library')}
          />
        </Suspense>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ClassroomProvider>
      <UIConfigProvider>
        <MainAppContent />
      </UIConfigProvider>
    </ClassroomProvider>
  );
}
