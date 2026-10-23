import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for offline gradebook and assignment caching
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] Phiên bản mới đã sẵn sàng tải về.');
  },
  onOfflineReady() {
    console.log('[PWA] Ứng dụng đã lưu offline thành công! Bảng điểm và bài tập có thể truy cập không cần mạng.');
  },
});

createRoot(document.getElementById('root')!).render(<App />);

