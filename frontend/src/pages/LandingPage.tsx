import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { apiUrls } from '../config/api';
import NotificationContainer from '../components/NotificationContainer';
import { useNotification } from '../hooks/useNotification';
import LanguageSwitcher from '../components/LanguageSwitcher';

interface ExamInfo {
  id: number;
  title: string;
  description: string;
  time_limit_minutes: number;
  language?: string;
}

const LandingPage: React.FC = () => {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [examInfo, setExamInfo] = useState<ExamInfo | null>(null);
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const { notifications, removeNotification, showError, showWarning } = useNotification();
  const { t } = useTranslation();

  // Fetch exam info on mount
  useEffect(() => {
    const fetchExamInfo = async () => {
      try {
        const examRes = await axios.get(apiUrls.getExamByShareId(shareId!));
        setExamInfo({
          id: examRes.data.id,
          title: examRes.data.title,
          description: examRes.data.description,
          time_limit_minutes: examRes.data.time_limit_minutes || 0
        });
      } catch (error: any) {
        console.error('Error fetching exam info:', error);
        if (error.response?.status === 404) {
          showError(t('landing.examNotFound'));
        }
      }
    };

    if (shareId) {
      fetchExamInfo();
    }
  }, [shareId]);

  const handleStart = async () => {
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      // Get Exam ID from Share ID first
      const examRes = await axios.get(apiUrls.getExamByShareId(shareId!));
      const examId = examRes.data.id;

      // Create or check User with exam context
      const userRes = await axios.post(apiUrls.createUser(), {
        name: name.trim(),
        examId: examId
      });

      const userId = userRes.data.id;
      const canResume = userRes.data.canResume;
      const existingResultId = userRes.data.existingResultId;

      if (canResume && existingResultId) {
        // 用户有未完成的考试，直接跳转继续考试
        navigate(`/quiz/${shareId}/take`, { state: { userId, resultId: existingResultId, examId } });
      } else {
        // 创建新的考试会话
        const sessionRes = await axios.post(apiUrls.createResult(), {
          userId,
          examId,
        });
        const resultId = sessionRes.data.resultId;

        navigate(`/quiz/${shareId}/take`, { state: { userId, resultId, examId } });
      }
    } catch (error: any) {
      console.error('Error starting quiz:', error);
      if (error.response?.status === 409) {
        if (error.response?.data?.error === 'Exam already completed') {
          showError(t('landing.examCompleted'));
        } else {
          showWarning(t('landing.nameExists'));
        }
        setName(''); // 清空输入框
      } else if (error.response?.status === 404) {
        showError(t('landing.examNotFound'));
      } else {
        showError(t('landing.startFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleStart();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Language Switcher - Top Right */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{t('landing.title')}</h1>
          <p className="text-lg text-gray-600 mb-2">{examInfo?.title || t('landing.subtitle')}</p>
          {examInfo?.description && (
            <p className="text-sm text-gray-500 mb-2">{examInfo.description}</p>
          )}
          <p className="text-sm text-gray-500">ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{shareId}</span></p>
        </div>

        <div className="card">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('landing.nameLabel')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                className="input-field text-lg"
                placeholder={t('landing.namePlaceholder')}
                disabled={isLoading}
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-2">
                * {t('landing.nameRequired')}
              </p>
            </div>

            <button
              onClick={handleStart}
              disabled={!name.trim() || isLoading}
              className="btn-primary w-full text-lg py-3"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('common.loading')}
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  {t('landing.startExam')}
                </div>
              )}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            {examInfo && examInfo.time_limit_minutes > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-orange-900 mb-1">{t('quiz.timeRemaining')}</h3>
                    <p className="text-sm text-orange-800">
                      <span className="font-bold text-lg">{examInfo.time_limit_minutes}</span> {t('examEditor.minutes')}
                    </p>
                  </div>
                </div>
              </div>
            )}
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

export default LandingPage;