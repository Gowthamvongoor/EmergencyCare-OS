import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/ToastContainer';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EmergencyPatients from './pages/EmergencyPatients';
import PatientRegistration from './pages/PatientRegistration';
import EmergencyQueue from './pages/EmergencyQueue';
import Scheduling from './pages/Scheduling';
import ResourceManagement from './pages/ResourceManagement';
import ResourceAllocation from './pages/ResourceAllocation';
import DeadlockMonitor from './pages/DeadlockMonitor';
import SynchronizationMonitor from './pages/SynchronizationMonitor';
import ProducerConsumer from './pages/ProducerConsumer';
import BedManagement from './pages/BedManagement';
import AmbulanceManagement from './pages/AmbulanceManagement';
import OperationTheatres from './pages/OperationTheatres';
import DoctorManagement from './pages/DoctorManagement';
import PatientRecords from './pages/PatientRecords';
import AccessControl from './pages/AccessControl';
import SystemLogs from './pages/SystemLogs';
import Reports from './pages/Reports';
import OSConcepts from './pages/OSConcepts';
import SystemTesting from './pages/SystemTesting';
import MemoryManagement from './pages/MemoryManagement';
import Settings from './pages/Settings';

// Protected Route Guard with Role and Permission verification
function ProtectedRoute({ children, requiredRoles, requiredPerm }) {
  const { user, loading, hasRole, can } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-teal-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono">Initializing EmergencyCare OS Session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles && !hasRole(requiredRoles)) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="inline-block p-4 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-900">
          <span className="text-3xl">🚫</span>
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Access Denied &bull; Protection Matrix Violation</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Role <strong>{user.role}</strong> does not possess privilege to inspect this administrative module. Required roles: {requiredRoles.join(', ')}.
        </p>
      </div>
    );
  }

  if (requiredPerm && !can(requiredPerm[0], requiredPerm[1])) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="inline-block p-4 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-900">
          <span className="text-3xl">🛡️</span>
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Protection Rights Insufficient</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Access Matrix denies right <strong>{requiredPerm[1]}</strong> on resource <strong>{requiredPerm[0]}</strong> for subject {user.role}.
        </p>
      </div>
    );
  }

  return children;
}

// Master Layout for authenticated application
function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row antialiased">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/emergency-patients" element={<EmergencyPatients />} />
            <Route path="/patient-registration" element={
              <ProtectedRoute requiredPerm={['patient_records', 'WRITE']}>
                <PatientRegistration />
              </ProtectedRoute>
            } />
            <Route path="/emergency-queue" element={<EmergencyQueue />} />
            <Route path="/scheduling" element={<Scheduling />} />
            <Route path="/resource-management" element={<ResourceManagement />} />
            <Route path="/resource-allocation" element={<ResourceAllocation />} />
            <Route path="/deadlock-monitor" element={<DeadlockMonitor />} />
            <Route path="/synchronization-monitor" element={<SynchronizationMonitor />} />
            <Route path="/producer-consumer" element={<ProducerConsumer />} />
            <Route path="/bed-management" element={<BedManagement />} />
            <Route path="/ambulance-management" element={<AmbulanceManagement />} />
            <Route path="/operation-theatres" element={<OperationTheatres />} />
            <Route path="/doctor-management" element={<DoctorManagement />} />
            <Route path="/patient-records" element={
              <ProtectedRoute requiredPerm={['patient_records', 'READ']}>
                <PatientRecords />
              </ProtectedRoute>
            } />
            <Route path="/access-control" element={
              <ProtectedRoute requiredRoles={['Admin']}>
                <AccessControl />
              </ProtectedRoute>
            } />
            <Route path="/system-logs" element={<SystemLogs />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/os-concepts" element={<OSConcepts />} />
            <Route path="/system-testing" element={<SystemTesting />} />
            <Route path="/memory-management" element={<MemoryManagement />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              } />
            </Routes>
            <ToastContainer />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
