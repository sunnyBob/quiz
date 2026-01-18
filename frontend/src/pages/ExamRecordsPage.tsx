import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { apiUrls } from '../config/api';
import NotificationContainer from '../components/NotificationContainer';
import { useNotification } from '../hooks/useNotification';

interface ExamResult {
  id: number;
  user_id: number;
  exam_id: number;
  score: number;
  total_questions: number;
  total_duration: number;
  status: 'in_progress' | 'completed' | 'expired';
  started_at: string;
  completed_at: string | null;
  user_name: string;
}

interface Exam {
  id: number;
  title: string;
  description: string;
}

const ExamRecordsPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { notifications, removeNotification, showSuccess, showError } = useNotification();

  const [exam, setExam] = useState<Exam | null>(null);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingResult, setDeletingResult] = useState<ExamResult | null>(null);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
  const isAdmin = !!localStorage.getItem('admin_auth');

  useEffect(() => {
    if (examId) {
      loadExamAndResults();
    }
  }, [examId]);

  const loadExamAndResults = async () => {
    setLoading(true);
    try {
      // 获取考卷信息
      const examRes = await axios.get(apiUrls.getExamById(Number(examId!)));
      setExam(examRes.data);

      // 获取考试记录
      const resultsRes = await axios.get(apiUrls.getExamResults(Number(examId!)));
      setResults(resultsRes.data);
    } catch (error) {
      console.error('获取考试记录失败:', error);
      showError('获取考试记录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResult = (result: ExamResult) => {
    setDeletingResult(result);
    setShowDeleteModal(true);
  };

  const confirmDeleteResult = async () => {
    if (!deletingResult) return;

    try {
      await axios.delete(apiUrls.deleteResult(deletingResult.id));
      setResults(prev => prev.filter(r => r.id !== deletingResult.id));
      setShowDeleteModal(false);
      setDeletingResult(null);
      showSuccess('考试记录删除成功！');
    } catch (error) {
      console.error('删除考试记录失败:', error);
      showError('删除考试记录失败，请重试');
    }
  };

  const handleBatchDelete = () => {
    setShowBatchDeleteModal(true);
  };

  const confirmBatchDelete = async () => {
    try {
      await axios.delete(apiUrls.deleteExamResults(Number(examId!)));
      setResults([]);
      setShowBatchDeleteModal(false);
      showSuccess('所有考试记录删除成功！');
    } catch (error) {
      console.error('批量删除考试记录失败:', error);
      showError('批量删除考试记录失败，请重试');
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}时${minutes}分${secs}秒`;
    } else if (minutes > 0) {
      return `${minutes}分${secs}秒`;
    } else {
      return `${secs}秒`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'in_progress': return '进行中';
      case 'expired': return '已过期';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'expired': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRankBadge = (rank?: number) => {
    if (!rank) return null;

    if (rank === 1) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-md">
          🏆 第1名
        </span>
      );
    } else if (rank === 2) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-gray-300 to-gray-400 text-white shadow-md">
          🥈 第2名
        </span>
      );
    } else if (rank === 3) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-md">
          🥉 第3名
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          第 {rank} 名
        </span>
      );
    }
  };

  // 对已完成的考试进行排名：按分数降序，分数相同时按用时升序
  const rankedResults = results
    .filter(r => r.status === 'completed')
    .sort((a, b) => {
      // 首先按分数降序
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // 分数相同时按用时升序（用时少的排前面）
      return a.total_duration - b.total_duration;
    })
    .map((result, index) => ({
      ...result,
      rank: index + 1
    }));

  // 创建一个 Map 用于快速查找排名
  const rankMap = new Map(rankedResults.map(r => [r.id, r.rank]));

  const filteredResults = results.filter(result => {
    const matchesSearch = result.user_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || result.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).map(result => ({
    ...result,
    rank: rankMap.get(result.id)
  }));

  const completedResults = results.filter(r => r.status === 'completed');
  const averageScore = completedResults.length > 0
    ? Math.round(completedResults.reduce((sum, r) => sum + (r.score / r.total_questions * 100), 0) / completedResults.length)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  const isAdmin = localStorage.getItem('admin_auth');
                  navigate(isAdmin ? '/admin' : '/');
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="返回"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">考试记录管理</h1>
                {exam && (
                  <p className="text-gray-600 mt-1">
                    考卷：{exam.title}
                  </p>
                )}
              </div>
            </div>

            {isAdmin && results.length > 0 && (
              <button
                onClick={handleBatchDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>清空所有记录</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{results.length}</div>
            <div className="text-gray-600">总考试次数</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-2xl font-bold text-green-600">{completedResults.length}</div>
            <div className="text-gray-600">已完成次数</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-2xl font-bold text-purple-600">{averageScore}%</div>
            <div className="text-gray-600">平均分数</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-2xl font-bold text-orange-600">
              {results.filter(r => r.status === 'in_progress').length}
            </div>
            <div className="text-gray-600">进行中</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <div className="flex flex-col space-y-4">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-blue-900 mb-1">排名规则</h3>
                  <p className="text-sm text-blue-800">
                    排名基于<strong>分数优先，用时次之</strong>的原则：首先按分数从高到低排序，分数相同时按用时从少到多排序。前三名将显示特殊徽章。
                  </p>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="搜索用户名..."
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">所有状态</option>
                  <option value="completed">已完成</option>
                  <option value="in_progress">进行中</option>
                  <option value="expired">已过期</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-2 text-gray-600">加载中...</span>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center shadow-sm">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm || statusFilter !== 'all' ? '未找到匹配的考试记录' : '暂无考试记录'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' ? '尝试调整搜索条件' : '还没有人参加这个考试'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      排名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      用户
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      分数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      用时
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      开始时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      完成时间
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredResults.map((result) => (
                    <tr key={result.id} className={`hover:bg-gray-50 ${result.rank && result.rank <= 3 ? 'bg-yellow-50/30' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result.status === 'completed' ? getRankBadge(result.rank) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {result.user_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {result.user_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(result.status)}`}>
                          {getStatusText(result.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.status === 'completed' ? (
                          <div>
                            <div className="font-medium">
                              {result.score}/{result.total_questions}
                            </div>
                            <div className="text-gray-500">
                              {Math.round((result.score / result.total_questions) * 100)}%
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.total_duration > 0 ? formatDuration(result.total_duration) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(result.started_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.completed_at ? formatDate(result.completed_at) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteResult(result)}
                          className="text-red-600 hover:text-red-900 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          title="删除记录"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Single Result Modal */}
      {showDeleteModal && deletingResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">确认删除</h3>
            <p className="text-gray-600 mb-6">
              确定要删除用户 "<strong>{deletingResult.user_name}</strong>" 的考试记录吗？
              <br />
              <span className="text-red-600 text-sm">此操作无法恢复。</span>
            </p>
            <div className="flex space-x-3">
              <button
                onClick={confirmDeleteResult}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                删除
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingResult(null);
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Delete Modal */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">确认清空所有记录</h3>
            <p className="text-gray-600 mb-6">
              确定要删除这个考卷的所有考试记录吗？
              <br />
              <span className="text-red-600 text-sm">
                将删除 {results.length} 条记录，此操作无法恢复。
              </span>
            </p>
            <div className="flex space-x-3">
              <button
                onClick={confirmBatchDelete}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                清空所有记录
              </button>
              <button
                onClick={() => setShowBatchDeleteModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );
};

export default ExamRecordsPage;