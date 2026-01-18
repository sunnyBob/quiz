import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { apiUrls } from '../config/api';
import NotificationContainer from '../components/NotificationContainer';
import { useNotification } from '../hooks/useNotification';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ExamGuidelinesDialog from '../components/ExamGuidelinesDialog';

interface ExamInfo {
  id: number;
  title: string;
  description: string;
  time_limit_minutes: number;
  language?: string;
}

const UnifiedLandingPage: React.FC = () => {
  const { shareId: urlShareId } = useParams<{ shareId?: string }>();
  const [shareId, setShareId] = useState(urlShareId || '');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingId, setIsValidatingId] = useState(false);
  const [examInfo, setExamInfo] = useState<ExamInfo | null>(null);
  const [idError, setIdError] = useState('');
  const [showGuidelines, setShowGuidelines] = useState(false);
  const navigate = useNavigate();
  const { notifications, removeNotification, showError, showWarning, showSuccess } = useNotification();
  const { t } = useTranslation();

  // 自动从URL加载考卷ID
  useEffect(() => {
    if (urlShareId) {
      setShareId(urlShareId);
      fetchExamInfo(urlShareId);
    }
  }, [urlShareId]);

  const fetchExamInfo = async (id: string) => {
    if (!id || id.length < 6) return;

    setIsValidatingId(true);
    setIdError('');
    try {
      const examRes = await axios.get(apiUrls.getExamByShareId(id));
      setExamInfo({
        id: examRes.data.id,
        title: examRes.data.title,
        description: examRes.data.description,
        time_limit_minutes: examRes.data.time_limit_minutes || 0
      });
      setIdError('');
    } catch (error: any) {
      console.error('Error fetching exam info:', error);
      setExamInfo(null);
      if (error.response?.status === 404) {
        setIdError(t('landing.examNotFound'));
      } else {
        setIdError('验证考卷ID时出错');
      }
    } finally {
      setIsValidatingId(false);
    }
  };

  const handleShareIdChange = (value: string) => {
    const cleanValue = value.trim().toLowerCase();
    setShareId(cleanValue);
    setIdError('');
    
    // 当输入达到合理长度时自动验证
    if (cleanValue.length >= 6) {
      fetchExamInfo(cleanValue);
    } else {
      setExamInfo(null);
    }
  };

  const handleStart = async () => {
    if (!name.trim() || !shareId.trim() || !examInfo) return;

    setIsLoading(true);
    
    try {
      // Get Exam ID from Share ID
      const examRes = await axios.get(apiUrls.getExamByShareId(shareId));
      const examId = examRes.data.id;
      
      // 检查该用户在该考卷下是否已有作答时间（started_at）
      const resultsRes = await axios.get(apiUrls.getExamResults(examId));
      const userResults = resultsRes.data.filter((r: any) => 
        r.user_name === name.trim() && r.started_at !== null
      );
      
      if (userResults.length > 0) {
        // 已有作答记录（说明已经看过考前须知并开始答题），直接开始考试
        await startExam();
      } else {
        // 第一次参加或未开始答题，显示考试须知
        setIsLoading(false);
        setShowGuidelines(true);
      }
    } catch (err) {
      console.error('Failed to check exam history:', err);
      setIsLoading(false);
      showError(t('landing.startFailed'));
    }
  };

  const startExam = async () => {
    if (!name.trim() || !shareId.trim() || !examInfo) return;
    
    setIsLoading(true);
    
    try {
      // Get Exam ID from Share ID
      const examRes = await axios.get(apiUrls.getExamByShareId(shareId));
      const examId = examRes.data.id;

      // Create or check User with exam context
      const userRes = await axios.post(apiUrls.createUser(), {
        name: name.trim(),
        examId: examId
      });
      
      const userId = userRes.data.id;
      const canResume = userRes.data.canResume;
      const isCompleted = userRes.data.isCompleted;
      const isExpired = userRes.data.isExpired;
      const existingResultId = userRes.data.existingResultId;

      if (isCompleted && existingResultId) {
        // 考试已完成或过期，跳转到 Summary 页面回顾
        if (isExpired) {
          showWarning(t('landing.examExpired') || '考试时间已到');
        } else {
          showSuccess('考试已完成，正在加载成绩...');
        }
        
        navigate(`/exam/${shareId}/summary/${existingResultId}`, { 
          state: { userId, resultId: existingResultId, examId } 
        });
      } else if (canResume && existingResultId) {
        // 用户有未完成的考试，直接跳转继续考试
        showSuccess('检测到未完成的考试，正在恢复...');
        navigate(`/exam/${shareId}/take`, { 
          state: { userId, resultId: existingResultId, examId } 
        });
      } else {
        // 创建新的考试会话
        const sessionRes = await axios.post(apiUrls.createResult(), {
          userId,
          examId,
        });
        const resultId = sessionRes.data.resultId;

        navigate(`/exam/${shareId}/take`, { 
          state: { userId, resultId, examId } 
        });
      }
    } catch (error: any) {
      console.error('Error starting quiz:', error);
      if (error.response?.status === 409) {
        showWarning(t('landing.nameExists'));
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

  const handleConfirmStart = async () => {
    setShowGuidelines(false);
    await startExam();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim() && shareId.trim() && examInfo && !isLoading) {
      handleStart();
    }
  };

  const isFromUrl = !!urlShareId;

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
          <p className="text-lg text-gray-600 mb-2">
            {examInfo?.title || t('landing.subtitle')}
          </p>
          {examInfo?.description && (
            <p className="text-sm text-gray-500 mb-2">{examInfo.description}</p>
          )}
        </div>

        <div className="card">
          <div className="space-y-6">
            {/* 考卷ID输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('landing.examIdLabel') || '考卷ID（分享码）'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={shareId}
                  onChange={(e) => handleShareIdChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className={`input-field text-lg pr-10 ${
                    idError ? 'border-red-300 focus:border-red-500' : 
                    examInfo ? 'border-green-300 focus:border-green-500' : ''
                  }`}
                  placeholder={t('landing.examIdPlaceholder') || '请输入考卷ID'}
                  disabled={isFromUrl || isLoading}
                  maxLength={20}
                />
                {isValidatingId && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                  </div>
                )}
                {!isValidatingId && examInfo && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {!isValidatingId && idError && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              {idError && (
                <p className="text-xs text-red-600 mt-2">
                  {idError}
                </p>
              )}
              {examInfo && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-green-800 font-medium">
                        {t('landing.foundExam', { title: examInfo.title })}
                      </span>
                    </div>
                    {examInfo.time_limit_minutes > 0 && (
                      <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded font-medium">
                        {t('landing.timeLimit', { minutes: examInfo.time_limit_minutes })}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {!isFromUrl && (
                <p className="text-xs text-gray-500 mt-2">
                  * {t('landing.examIdRequired') || '请输入由考试管理员提供的考卷ID'}
                </p>
              )}
              {isFromUrl && (
                <p className="text-xs text-blue-600 mt-2 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {t('landing.autoFilledFromLink')}
                </p>
              )}
            </div>

            {/* 姓名输入 */}
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
                disabled={isLoading || !examInfo}
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-2">
                * {t('landing.nameRequired')}
              </p>
            </div>

            <button
              onClick={handleStart}
              disabled={!name.trim() || !shareId.trim() || !examInfo || isLoading || isValidatingId}
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
        </div>
      </div>
      
      {/* 考试须知弹窗 */}
      <ExamGuidelinesDialog
        isOpen={showGuidelines}
        examTitle={examInfo?.title || ''}
        timeLimit={examInfo?.time_limit_minutes || 0}
        onConfirm={handleConfirmStart}
        onCancel={() => setShowGuidelines(false)}
      />
      
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  );
};

export default UnifiedLandingPage;
