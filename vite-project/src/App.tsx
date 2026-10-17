import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TouristLayout from './layouts/TouristLayout';
import AdminLayout from './layouts/AdminLayout';
import Landing from './pages/Landing';
import PlaceDetail from './pages/PlaceDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import AdminCreatePlace from './pages/AdminCreatePlace';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* === GIAO DIỆN KHÁCH DU LỊCH (TOURIST) === */}
        <Route element={<TouristLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/places/:id" element={<PlaceDetail />} />
        </Route>

        {/* === XÁC THỰC (LOGIN / REGISTER) === */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* === GIAO DIỆN QUẢN TRỊ VIÊN / BAN QUẢN LÝ (ADMIN) === */}
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/create" element={<AdminCreatePlace />} />
        </Route>

        {/* Bất kỳ link nào khác đều quay về trang chủ */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
