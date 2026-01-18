import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { apiUrls, buildShareUrl } from '../config/api';
import NotificationContainer from '../components/NotificationContainer';
import { useNotification } from '../hooks/useNotification';

interface Exam {
  id: number;
  title: string;
  description: string;
  share_link_id: string;
  created_at: string;
  time_limit_minutes: number;
  enable_copy_prevention: boolean;
  enable_watermark: boolean;
  watermark_text: string;
}

const ExamManagementPage: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [deletingExam, setDeletingExam] = useState<Exam | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editTimeLimit, setEditTimeLimit] = useState(0);
  const navigate = useNavigate();
  const { notifications, removeNotification, showSuccess, showError } = useNotification();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await axios.get(apiUrls.getAllExams());
      setExams(response.data);
    } catch (error) {
      console.error('获取考卷列表失败:', error);
      showError('获取考卷列表失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    navigate('/admin');
  };

  const filteredExams = exams.filter(exam =>
    exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (exam: Exam) => {
    setEditingExam(exam);
    setEditTimeLimit(exam.time_limit_minutes || 0);
    setShowEditModal(true);
  };

  const handleDelete = (exam: Exam) => {
    setDeletingExam(exam);
    setShowDeleteModal(true);
  };

  const handleCopyShareLink = (shareId: string) => {
    const shareUrl = buildShareUrl(shareId);
    navigator.clipboard.writeText(shareUrl).then(() => {
      showSuccess('分享链接已复制到剪贴板！');
    }).catch(() => {
      showError('复制失败，请手动复制链接');
    });
  };

  const confirmDelete = async () => {
    if (!deletingExam) return;

    try {
      await axios.delete(apiUrls.deleteExam(deletingExam.id));
      setExams(exams.filter(exam => exam.id !== deletingExam.id));
      setShowDeleteModal(false);
      setDeletingExam(null);
      showSuccess('考卷删除成功！');
    } catch (error) {
      console.error('删除考卷失败:', error);
      showError('删除考卷失败，请重试');
    }
  };

  const saveExamEdit = async (updatedExam: Partial<Exam>) => {
    if (!editingExam) return;

    try {
      await axios.put(apiUrls.updateExam(editingExam.id), updatedExam);
      setExams(exams.map(exam => 
        exam.id === editingExam.id ? { ...exam, ...updatedExam } : exam
      ));
      setShowEditModal(false);
      setEditingExam(null);
      showSuccess('考卷更新成功！');
    } catch (error) {
      console.error('更新考卷失败:', error);
      showError('更新考卷失败，请重试');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">考卷管理</h1>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/create')}
                className="btn-primary"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                创建考卷
              </button>
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="btn-secondary"
              >
                查看统计
              </button>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="搜索考卷标题或描述..."
            />
          </div>
        </div>

        {/* Exam List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-2 text-gray-600">加载中...</span>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm ? '未找到匹配的考卷' : '暂无考卷'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? '尝试使用其他关键词搜索' : '开始创建您的第一个考卷'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <button
                  onClick={() => navigate('/admin/create')}
                  className="btn-primary"
                >
                  创建考卷
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredExams.map((exam) => (
              <div key={exam.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {exam.title}
                    </h3>
                    {exam.description && (
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {exam.description}
                      </p>
                    )}
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm">
                      <span className="text-gray-500">
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(exam.created_at)}
                      </span>
                      <span className="text-gray-500">
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        ID: {exam.share_link_id}
                      </span>
                      {exam.time_limit_minutes > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {exam.time_limit_minutes}分钟限时
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          无时间限制
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => navigate(`/admin/exams/${exam.id}/questions`)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="管理题目"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => handleCopyShareLink(exam.share_link_id)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="复制分享链接"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    
                    <div className="w-px h-6 bg-gray-300"></div>
                    
                    <button
                      onClick={() => navigate(`/admin/dashboard?examId=${exam.id}`)}
                      className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="查看考试统计"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => navigate(`/admin/exams/${exam.id}/records`)}
                      className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="查看考试记录"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                    
                    <div className="w-px h-6 bg-gray-300"></div>
                    
                    <button
                      onClick={() => handleEdit(exam)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="编辑考卷"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => handleDelete(exam)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="删除考卷"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">编辑考卷</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              saveExamEdit({
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                time_limit_minutes: editTimeLimit,
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    考卷标题 <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="title"
                    type="text"
                    defaultValue={editingExam.title}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    考卷描述
                  </label>
                  <textarea
                    name="description"
                    defaultValue={editingExam.description}
                    className="input-field h-24 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    考试时间限制
                  </label>
                  
                  {/* Quick Select Buttons */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[
                      { label: '无限制', value: 0 },
                      { label: '30分钟', value: 30 },
                      { label: '45分钟', value: 45 },
                      { label: '60分钟', value: 60 },
                      { label: '90分钟', value: 90 },
                      { label: '120分钟', value: 120 },
                    ].map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setEditTimeLimit(preset.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          editTimeLimit === preset.value
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Input */}
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600">自定义:</label>
                    <input
                      type="number"
                      value={editTimeLimit}
                      onChange={e => setEditTimeLimit(Math.max(0, Math.min(300, parseInt(e.target.value) || 0)))}
                      className="input-field w-32"
                      min="0"
                      max="300"
                      placeholder="0"
                    />
                    <span className="text-sm text-gray-600">分钟</span>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    {editTimeLimit === 0 
                      ? '✓ 考生可以无限时间完成考试' 
                      : `✓ 考生需要在 ${editTimeLimit} 分钟内完成考试，超时将自动提交`
                    }
                  </p>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button type="submit" className="btn-primary flex-1">
                  保存修改
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingExam(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">确认删除</h3>
            </div>
            <p className="text-gray-600 mb-6">
              确定要删除考卷 "<strong>{deletingExam.title}</strong>" 吗？
              <br />
              <span className="text-red-600 text-sm">此操作将同时删除所有相关的题目和考试记录，且无法恢复。</span>
            </p>
            <div className="flex space-x-3">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                确认删除
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingExam(null);
                }}
                className="btn-secondary flex-1"
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

export default ExamManagementPage;