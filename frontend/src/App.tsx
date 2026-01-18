import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import UnifiedLandingPage from './pages/UnifiedLandingPage';
import QuizPage from './pages/QuizPage';
import SummaryPage from './pages/SummaryPage';
import AdminLoginPage from './pages/AdminLoginPage';
import ExamEditorPage from './pages/ExamEditorPage';
import DashboardPage from './pages/DashboardPage';
import ExamManagementPage from './pages/ExamManagementPage';
import QuestionManagementPage from './pages/QuestionManagementPage';
import ExamRecordsPage from './pages/ExamRecordsPage';
import LeaderboardPage from './pages/LeaderboardPage';

// Import i18n configuration
import './i18n/config';

// Simple Protected Route
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const auth = localStorage.getItem('admin_auth');
  return auth ? children : <Navigate to="/admin" replace />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* User Routes - 统一入口 */}
        <Route path="/" element={<UnifiedLandingPage />} />
        <Route path="/quiz/:shareId" element={<UnifiedLandingPage />} />
        <Route path="/exam/:shareId/take" element={<QuizPage />} />
        <Route path="/exam/:shareId/summary/:resultId" element={<SummaryPage />} />
        <Route path="/exam/:examId/leaderboard" element={<LeaderboardPage />} />
        
        {/* Legacy routes - 向后兼容 */}
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
        <Route
            path="/admin/manage"
            element={
                <ProtectedRoute>
                    <ExamManagementPage />
                </ProtectedRoute>
            }
        />
        <Route
            path="/admin/exams/:examId/questions"
            element={
                <ProtectedRoute>
                    <QuestionManagementPage />
                </ProtectedRoute>
            }
        />
        <Route
            path="/admin/exams/:examId/records"
            element={
                <ProtectedRoute>
                    <ExamRecordsPage />
                </ProtectedRoute>
            }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
