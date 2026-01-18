import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiUrls } from '../config/api';
import NotificationContainer from '../components/NotificationContainer';
import { useNotification } from '../hooks/useNotification';
import LanguageSwitcher from '../components/LanguageSwitcher';

const ExamEditorPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState(0);
  const [language, setLanguage] = useState('zh-CN'); // Default to Chinese
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { notifications, removeNotification, showSuccess, showError } = useNotification();
  const { t } = useTranslation();

  const handleCreate = async () => {
    if (!title.trim()) return;

    setLoading(true);
    try {
      const res = await axios.post(apiUrls.createExam(), {
        title: title.trim(),
        description: description.trim(),
        time_limit_minutes: timeLimit,
        language: language, // Include language
      });

      // Get the created exam ID
      const examId = res.data.id;
      
      // Show success message and redirect to question management
      showSuccess(t('examEditor.createSuccess') + ` ID: ${examId}`, 4000);
      
      // Navigate to question management page after a short delay
      setTimeout(() => {
        navigate(`/admin/exams/${examId}/questions`);
      }, 2000);
    } catch (err) {
      console.error(err);
      showError(t('examEditor.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    navigate('/admin');
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">考试管理系统</h1>
            </div>

            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="btn-secondary"
              >
                {t('examEditor.viewStats')}
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('examEditor.title')}</h2>
          <p className="text-gray-600">{t('examEditor.subtitle')}</p>
        </div>

        <div className="card">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('examEditor.examTitle')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="input-field"
                placeholder={t('examEditor.examTitlePlaceholder')}
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                {title.length}/100
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('examEditor.examDescription')}
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="input-field h-24 resize-none"
                placeholder={t('examEditor.examDescriptionPlaceholder')}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {description.length}/500
              </p>
            </div>

            {/* Language Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('examEditor.examLanguage')}
              </label>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-blue-800">
                  <strong>双语支持：</strong>本系统支持中英双语题目。创建考卷后，您可以为每道题目同时填写中文和英文内容，考生将根据其选择的UI语言查看对应版本。
                </p>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="language"
                    value="zh-CN"
                    checked={language === 'zh-CN'}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{t('examEditor.languageChinese')} (推荐双语)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="language"
                    value="en-US"
                    checked={language === 'en-US'}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{t('examEditor.languageEnglish')} (Bilingual supported)</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                此选项仅用于标识，实际题目支持同时包含中英文内容
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('examEditor.timeLimit')}
              </label>
              
              {/* Quick Select Buttons */}
              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  { label: t('examEditor.noLimit'), value: 0 },
                  { label: `30 ${t('examEditor.minutes')}`, value: 30 },
                  { label: `45 ${t('examEditor.minutes')}`, value: 45 },
                  { label: `60 ${t('examEditor.minutes')}`, value: 60 },
                  { label: `90 ${t('examEditor.minutes')}`, value: 90 },
                  { label: `120 ${t('examEditor.minutes')}`, value: 120 },
                ].map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setTimeLimit(preset.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      timeLimit === preset.value
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
                <label className="text-sm text-gray-600">{t('examEditor.customTime')}:</label>
                <input
                  type="number"
                  value={timeLimit}
                  onChange={e => setTimeLimit(Math.max(0, Math.min(300, parseInt(e.target.value) || 0)))}
                  className="input-field w-32"
                  min="0"
                  max="300"
                  placeholder="0"
                />
                <span className="text-sm text-gray-600">{t('examEditor.minutes')}</span>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleCreate}
                disabled={!title.trim() || loading}
                className="btn-primary flex-1"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('examEditor.creating')}
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {t('examEditor.createExam')}
                  </div>
                )}
              </button>

              <button
                onClick={() => navigate('/admin/dashboard')}
                className="btn-secondary"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>

        {/* API Usage Guide */}
        <div className="mt-8 card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">API 使用指南</h3>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">添加题目到考卷</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <code className="text-sm text-gray-800">
                  POST /api/questions<br/>
                  Content-Type: application/json<br/><br/>
                  {JSON.stringify({
                    exam_id: "考卷ID",
                    type: "CHOICE",
                    content: "题目内容",
                    options: ["选项A", "选项B", "选项C", "选项D"],
                    correct_answer: "选项A",
                    explanation: "答案解析"
                  }, null, 2)}
                </code>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">考卷分享链接格式</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <code className="text-sm text-gray-800">
                  {import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/quiz/[share_link_id]
                </code>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                share_link_id 在创建考卷时自动生成
              </p>
            </div>
          </div>
        </div>
      </div>
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  );
};

export default ExamEditorPage;