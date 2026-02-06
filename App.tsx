
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AssetsPage from './pages/AssetsPage';
import AssetDetailPage from './pages/AssetDetailPage';
import SoftwarePage from './pages/SoftwarePage';
import LicensePage from './pages/LicensePage';
import VerificationPage from './pages/VerificationPage';
import AssetVerificationListPage from './pages/AssetVerificationListPage';
import QuikrLogsPage from './pages/QuikrLogsPage';
import ReportsPage from './pages/ReportsPage';
import UploadPage from './pages/UploadPage';
import FloorMapPage from './pages/FloorMapPage';
import EmployeesPage from './pages/EmployeesPage';
import UserVerificationPage from './pages/UserVerificationPage';
import UserSeatAllocationPage from './pages/UserSeatAllocationPage';
import UsersPage from './pages/UsersPage';
import UserDetailsPage from './pages/UserDetailsPage';
import LicenseDetailPage from './pages/LicenseDetailPage';
import SearchResultsPage from './pages/SearchResultsPage';
import SoftwareVerificationPage from './pages/SoftwareVerificationPage';
import SoftwareVerificationListPage from './pages/SoftwareVerificationListPage';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<DashboardPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/assets/:id" element={<AssetDetailPage />} />
        <Route path="/software" element={<SoftwarePage />} />
        <Route path="/licenses" element={<LicensePage />} />
        <Route path="/licenses/:id" element={<LicenseDetailPage />} />
        <Route path="/verification" element={<VerificationPage />} />
        <Route path="/verification-list" element={<AssetVerificationListPage />} />
        <Route path="/software-verifications" element={<SoftwareVerificationListPage />} />
        <Route path="/quikr-logs" element={<QuikrLogsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/map" element={<FloorMapPage />} />
        <Route path="/employees" element={<EmployeesPage />} />

        {/* /users now redirects to unified employees page */}
        <Route path="/users" element={<Navigate to="/employees" replace />} />
        <Route path="/users/:id" element={<UserDetailsPage />} />

        {/* User Specific Routes */}
        <Route path="/user/verify" element={<UserVerificationPage />} />
        <Route path="/user/seat" element={<UserSeatAllocationPage />} />
        <Route path="/user/software-verify" element={<SoftwareVerificationPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
