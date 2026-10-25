import { App as AntApp, ConfigProvider } from 'antd';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './admin.css';
import { AdminGuard } from './components/AdminGuard';
import { AdminContentPage } from './pages/admin/AdminContentPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminPoiPage } from './pages/admin/AdminPoiPage';
import { TourPage } from './pages/TourPage';
import { WelcomePage } from './pages/WelcomePage';

/**
 * Web Client (PRD 7.1.1, 7.1.2): trang chào ở "/" và màn hình tham quan ở "/tour".
 * Admin Dashboard (PRD 7.1.3, 7.1.4, 7.1.5): "/admin/login", "/admin", "/admin/content".
 * Chỉ dùng light mode, màu chủ đạo #1677ff (PRD 7.3).
 */
function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
          colorSuccess: '#52c41a',
          colorWarning: '#faad14',
          colorError: '#ff4d4f',
          borderRadius: 12,
          fontSize: 16,
        },
      }}
    >
      {/* Bọc App của antd để message/modal nhận theme và ngữ cảnh (antd v6). */}
      <AntApp>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/tour" element={<TourPage />} />

            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              path="/admin"
              element={
                <AdminGuard>
                  <AdminLayout />
                </AdminGuard>
              }
            >
              <Route index element={<AdminPoiPage />} />
              <Route path="content" element={<AdminContentPage />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
