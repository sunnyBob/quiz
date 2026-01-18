import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { apiUrls } from '../config/api';
import NotificationContainer from '../components/NotificationContainer';
import { useNotification } from '../hooks/useNotification';

interface ExamResult {
  id: number;
  user_name: string;
  score: number;
  total_questions: number;
  total_duration: number;
  completed_at: string;
}

const LeaderboardPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { notifications, removeNotification, showError } = useNotification();

  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (examId) {
      loadLeaderboard();
    }
  }, [examId]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await axios.get(apiUrls.getExamResults(Number(examId!)));
      console.log('API Response:', response.data); // 调试日志
      const completedResults = response.data.filter(
        (r: any) => r.status === 'completed' || r.status === 'expired'
      );
      
      console.log('Completed Results:', completedResults); // 调试日志
      
      // 排序：分数高的在前，分数相同时用时少的在前
      const sorted = completedResults.sort((a: any, b: any) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.total_duration - b.total_duration;
      });
      
      setResults(sorted);
    } catch (error) {
      console.error('获取排行榜失败:', error);
      showError('获取排行榜失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h}h ${m}m ${s}s`;
    }
    return `${m}m ${s}s`;
  };

  const calculateScore100 = (score: number, total: number) => {
    if (!total || total === 0) return 0;
    return Math.round((score / total) * 100);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg">
          <span className="text-lg">🏆</span>
        </div>
      );
    } else if (rank === 2) {
      return (
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-gray-400 to-slate-400 text-white shadow-lg">
          <span className="text-lg">🥈</span>
        </div>
      );
    } else if (rank === 3) {
      return (
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-lg">
          <span className="text-lg">🥉</span>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-gray-700 font-bold">
        {rank}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-6 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">排行榜</h1>
          </div>
          
          {/* Stats Summary */}
          <div className="bg-white/90 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">参与人数</p>
                  <p className="text-2xl font-bold text-gray-900">{results.length}</p>
                </div>
              </div>
              {results.length > 0 && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">平均分</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {(() => {
                      const avg = Math.round(results.reduce((sum, r) => sum + calculateScore100(r.score, r.total_questions), 0) / results.length);
                      return isNaN(avg) ? 0 : avg;
                    })()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden border border-gray-100">
          {results.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-600 text-lg">暂无考试记录</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {results.map((result, index) => {
                const rank = index + 1;
                const score100 = calculateScore100(result.score, result.total_questions);
                const isPodium = rank <= 3;
                
                return (
                  <div
                    key={result.id}
                    className={`p-4 sm:p-5 transition-all duration-300 ${
                      isPodium
                        ? rank === 1
                          ? 'bg-gradient-to-r from-yellow-50 to-amber-50 hover:from-yellow-100 hover:to-amber-100'
                          : rank === 2
                          ? 'bg-gradient-to-r from-gray-50 to-slate-50 hover:from-gray-100 hover:to-slate-100'
                          : 'bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Rank Badge */}
                      <div className="flex-shrink-0">
                        {getRankBadge(rank)}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold truncate ${
                          isPodium ? 'text-lg' : 'text-base'
                        }`}>
                          {result.user_name}
                        </p>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{result.score || 0}/{result.total_questions || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{formatTime(result.total_duration || 0)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="flex-shrink-0 text-right">
                        <div className={`font-bold ${
                          isPodium
                            ? 'text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                            : 'text-xl text-gray-900'
                        }`}>
                          {isNaN(score100) ? 0 : score100}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">分</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-gradient-to-r from-gray-600 to-slate-600 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
          >
            返回
          </button>
        </div>
      </div>

      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  );
};

export default LeaderboardPage;
