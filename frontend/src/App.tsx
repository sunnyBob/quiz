import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import QuizPage from './pages/QuizPage';
import SummaryPage from './pages/SummaryPage';
import AdminLoginPage from './pages/AdminLoginPage';
import ExamEditorPage from './pages/ExamEditorPage';
import DashboardPage from './pages/DashboardPage';

// Simple Protected Route
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const auth = localStorage.getItem('admin_auth');
  return auth ? children : <Navigate to="/admin" replace />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* User Routes */}
        <Route path="/quiz/:shareId" element={<LandingPage />} />
        <Route path="/quiz/:shareId/take" element={<QuizPage />} />
        <Route path="/quiz/summary" element={<SummaryPage />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route
            path="/admin/create"
            element={
                <ProtectedRoute>
                    <ExamEditorPage />
                </ProtectedRoute>
            }
        />
        <Route
            path="/admin/dashboard"
            element={
                <ProtectedRoute>
                    <DashboardPage />
                </ProtectedRoute>
            }
        />

        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
