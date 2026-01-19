import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import AntiCheatProvider from '../components/AntiCheatProvider';
import ExamTimer from '../components/ExamTimer';
import QuizProgress from '../components/QuizProgress';
import NotificationContainer from '../components/NotificationContainer';
import ConfirmDialog from '../components/ConfirmDialog';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useNotification } from '../hooks/useNotification';
import { apiUrls } from '../config/api';

interface Question {
  id: number;
  content: string | { [key: string]: string }; // 支持多语言
  type: 'CHOICE' | 'TRUE_FALSE';
  options: string[] | { [key: string]: string[] }; // 支持多语言
  correct_answer: string | { [key: string]: string }; // 支持多语言
  explanation: string | { [key: string]: string }; // 支持多语言
}

interface Answer {
  question_id: number;
  user_answer: string;
  is_answered: boolean;
  is_correct?: boolean;
}

interface QuestionStatus {
  id: number;
  status: 'not_visited' | 'visited' | 'answered' | 'skipped' | 'flagged';
}

interface ExamConfig {
  time_limit_minutes: number;
  enable_copy_prevention: boolean;
  enable_watermark: boolean;
  watermark_text: string;
}

const QuizPage: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { notifications, removeNotification, showError, showWarning } = useNotification();
  const { i18n, t } = useTranslation();

  const { userId, resultId, examId } = location.state || {};

  // 辅助函数：根据当前UI语言获取本地化内容
  const getLocalizedContent = (content: string | { [key: string]: string }): string => {
    if (typeof content === 'string') {
      return content; // 旧格式，直接返回
    }
    const currentLang = i18n.language || 'zh-CN';
    return content[currentLang] || content['zh-CN'] || Object.values(content)[0] || '';
  };

  const getLocalizedOptions = (options: string[] | { [key: string]: string[] }): string[] => {
    if (Array.isArray(options)) {
      return options; // 旧格式，直接返回
    }
    const currentLang = i18n.language || 'zh-CN';
    return options[currentLang] || options['zh-CN'] || Object.values(options)[0] || [];
  };

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [questionStatuses, setQuestionStatuses] = useState<QuestionStatus[]>([]);
  const [examConfig, setExamConfig] = useState<ExamConfig>({
    time_limit_minutes: 0,
    enable_copy_prevention: true,
    enable_watermark: true,
    watermark_text: 'Exam in Progress'
  });

  // Timer States
  const [totalTime, setTotalTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [timeWarnings, setTimeWarnings] = useState<string[]>([]);
  const [isTimeExpired, setIsTimeExpired] = useState(false);
  
  // Confirm Dialog State
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogData, setConfirmDialogData] = useState({
    title: '',
    message: '',
    unansweredCount: 0
  });

  const totalTimerRef = useRef<number | null>(null);
  const serverSyncTimerRef = useRef<number | null>(null);
  const isAutoSubmittingRef = useRef(false);

  // Update page title
  useEffect(() => {
    document.title = `Exam in Progress - Quiz Platform`;
    return () => {
      document.title = 'Quiz Platform';
    };
  }, []);

  useEffect(() => {
    if (!resultId || !examId) {
      showError(t('quiz.sessionInvalid', '会话无效，请重新开始'));
      navigate(`/quiz/${shareId}`);
      return;
    }

    const fetchData = async () => {
      try {
        // 首先检查result状态（使用不受限制的接口）
        const resultRes = await axios.get(apiUrls.getResultById(resultId));
        const resultData = resultRes.data;
        
        // 如果考试已完成（有结束时间），直接跳转到summary页面
        if (resultData.end_time) {
          // 设置标志阻止自动提交
          isAutoSubmittingRef.current = true;
          
          showWarning(t('quiz.examCompleted'), 3000);
          
          // 延迟一点时间让用户看到提示
          setTimeout(() => {
            navigate(`/exam/${shareId}/summary/${resultId}`, {
              state: {
                resultId,
                examId,
                score: resultData.score,
                totalQuestions: resultData.total_questions,
                totalDuration: resultData.total_duration
              }
            });
          }, 500);
          
          return true; // 返回true表示考试已完成
        }
        
        // Fetch exam details
        const examRes = await axios.get(apiUrls.getExamByShareId(shareId!));
        const examData = examRes.data;
        setExamConfig({
          time_limit_minutes: examData.time_limit_minutes || 0,
          enable_copy_prevention: examData.enable_copy_prevention ?? true,
          enable_watermark: examData.enable_watermark ?? true,
          watermark_text: examData.watermark_text || `考生: ${userId} • 考试进行中`
        });

        // Fetch questions
        const qRes = await axios.get(apiUrls.getExamQuestions(examId));
        const parsedQuestions = qRes.data.map((q: any) => ({
          ...q,
          options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
        }));
        setQuestions(parsedQuestions);

        // Fetch previous answers
        const aRes = await axios.get(apiUrls.getResultAnswers(resultId));
        const prevAnswers: Record<number, Answer> = {};
        aRes.data.forEach((a: any) => {
          prevAnswers[a.question_id] = {
            question_id: a.question_id,
            user_answer: a.user_answer,
            is_answered: true,
            is_correct: a.is_correct === 1,
          };
        });
        setAnswers(prevAnswers);

        // Fetch question progress
        const progressRes = await axios.get(apiUrls.getResultProgress(resultId));
        const progressData = progressRes.data.map((p: any) => ({
          id: p.question_id,
          status: p.status
        }));
        setQuestionStatuses(progressData);

        // Initialize question statuses for all questions
        const allStatuses: QuestionStatus[] = parsedQuestions.map((q: Question) => {
          const existingStatus = progressData.find((p: any) => p.id === q.id);
          return existingStatus || { id: q.id, status: 'not_visited' as const };
        });
        setQuestionStatuses(allStatuses);

        setLoading(false);
        return false; // 返回false表示考试未完成，可以继续
      } catch (err) {
        console.error(err);
        setLoading(false);
        return false;
      }
    };

    // 初始化数据并根据结果决定是否启动计时器
    const initializeQuiz = async () => {
      const isCompleted = await fetchData();
      
      // 如果考试已完成，不启动计时器
      if (isCompleted) {
        return;
      }

      // 服务端时间同步（每分钟同步一次）
      const syncTimeWithServer = async () => {
        try {
          const timeRes = await axios.get(apiUrls.getResultTimeStatus(resultId));
          const { elapsedSeconds, remainingSeconds, isExpired } = timeRes.data;
          
          if (isExpired && !isAutoSubmittingRef.current) {
            // 触发自动提交（handleTimeUp会处理标志设置和toast显示）
            await handleTimeUp();
            return;
          }
          
          // 更新时间状态
          setTotalTime(elapsedSeconds);
          if (remainingSeconds !== null) {
            setRemainingTime(remainingSeconds);
          }
        } catch (err) {
          console.error('Failed to sync time with server:', err);
        }
      };

      // 初始同步
      syncTimeWithServer();
      
      // 每分钟同步一次
      serverSyncTimerRef.current = setInterval(syncTimeWithServer, 60000) as unknown as number;
      
      // 本地计时器（每秒更新UI，避免频繁请求服务器）
      totalTimerRef.current = setInterval(() => {
        setTotalTime((prev) => prev + 1);
        if (remainingTime !== null) {
          setRemainingTime((prev) => {
            if (prev === null) return null;
            const newValue = Math.max(0, prev - 1);
            if (newValue === 0 && !isTimeExpired && !isAutoSubmittingRef.current) {
              // 触发自动提交（handleTimeUp会处理标志设置和toast显示）
              handleTimeUp();
            }
            return newValue;
          });
        }
      }, 1000) as unknown as number;
    };

    initializeQuiz();

    return () => {
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
      if (serverSyncTimerRef.current) clearInterval(serverSyncTimerRef.current);
    };
  }, [examId, resultId, shareId, navigate]);

  const handleAnswer = async (option: string) => {
    const currentQ = questions[currentQIndex];
    const existingAnswer = answers[currentQ.id];
    
    // 如果点击的是已选择的答案,不做任何操作
    if (existingAnswer && existingAnswer.user_answer === option) {
      return;
    }

    try {
        // 提交答案到服务端（不返回正确答案）
        await axios.post(apiUrls.saveAnswer(), {
            resultId,
            questionId: currentQ.id,
            userAnswer: option,
            duration: 0
        });

        // Only record answer status, don't show correct/incorrect
        const newAnswer: Answer = {
            question_id: currentQ.id,
            user_answer: option,
            is_answered: true
        };
        setAnswers(prev => ({ ...prev, [currentQ.id]: newAnswer }));

        // Update question status to answered
        await updateQuestionStatus(currentQ.id, 'answered', 0);
    } catch (err: any) {
        console.error("Failed to save answer", err);
        if (err.response?.status === 403) {
            showError(t('quiz.examFinished', '考试已结束，无法修改答案'));
        } else {
            showError(t('quiz.submitFailed'));
        }
    }
  };

  const handleNext = async () => {
    if (currentQIndex < questions.length - 1) {
        await handleQuestionNavigation(currentQIndex + 1);
    } else {
        await handleSubmitQuiz();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleTimeWarning = (minutesLeft: number) => {
    const warning = t('quiz.timeWarning', { minutes: minutesLeft });
    setTimeWarnings(prev => [...prev, warning]);

    // Auto-dismiss warning after 5 seconds
    setTimeout(() => {
      setTimeWarnings(prev => prev.filter(w => w !== warning));
    }, 5000);
  };

  const handleTimeUp = async () => {
    // 如果还未标记为自动提交，先标记并显示提示
    if (!isAutoSubmittingRef.current) {
      isAutoSubmittingRef.current = true;
      setIsTimeExpired(true);
      showWarning(t('quiz.autoSubmitting'), 5000);
    }
    
    // 停止计时器
    if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    if (serverSyncTimerRef.current) clearInterval(serverSyncTimerRef.current);
    
    // 调用提交函数（会跳过确认对话框因为isAutoSubmittingRef已设置）
    try {
      await handleSubmitQuiz();
    } catch (error) {
      console.error('Auto-submit failed:', error);
      showError(t('quiz.autoSubmitFailed'));
    }
  };

  const updateQuestionStatus = async (questionId: number, status: 'visited' | 'answered' | 'skipped' | 'flagged', timeSpent: number = 0) => {
    try {
      await axios.put(apiUrls.updateQuestionProgress(resultId, questionId), {
        status,
        timeSpent
      });

      setQuestionStatuses(prev => {
        const existing = prev.find(s => s.id === questionId);
        if (existing) {
          return prev.map(s => s.id === questionId ? { ...s, status } : s);
        } else {
          return [...prev, { id: questionId, status }];
        }
      });
    } catch (err) {
      console.error('Failed to update question status:', err);
    }
  };

  const updateResultProgress = async (questionIndex: number) => {
    try {
      await axios.put(apiUrls.updateResultProgress(resultId), {
        currentQuestionIndex: questionIndex
      });
    } catch (err) {
      console.error('Failed to update result progress:', err);
    }
  };

  const handleQuestionNavigation = async (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const currentQuestion = questions[currentQIndex];
    if (currentQuestion && !answers[currentQuestion.id]) {
      // Only mark as visited if not flagged (preserve flagged status)
      const currentStatus = questionStatuses.find(s => s.id === currentQuestion.id)?.status;
      if (currentStatus !== 'flagged') {
        await updateQuestionStatus(currentQuestion.id, 'visited', 0);
      }
    }

    setCurrentQIndex(targetIndex);
    await updateResultProgress(targetIndex);

    // Mark target question as visited if not answered and not flagged
    const targetQuestion = questions[targetIndex];
    if (targetQuestion && !answers[targetQuestion.id]) {
      const targetStatus = questionStatuses.find(s => s.id === targetQuestion.id)?.status;
      if (targetStatus !== 'flagged') {
        await updateQuestionStatus(targetQuestion.id, 'visited');
      }
    }
  };

  const handleSubmitQuiz = async () => {
    // 如果是超时自动提交，跳过确认对话框直接提交
    if (isAutoSubmittingRef.current) {
      await submitQuizDirectly();
      return;
    }
    
    // Check for unanswered questions
    const unansweredCount = questions.length - Object.keys(answers).length;
    
    if (unansweredCount > 0) {
      // Find unanswered question numbers
      const unansweredQuestions = questions
        .filter(q => !answers[q.id])
        .map((q) => questions.indexOf(q) + 1);
      
      const currentLang = i18n.language || 'zh-CN';
      const isZh = currentLang.startsWith('zh');
      const numbers = unansweredQuestions.join(isZh ? '、' : ', ');
      
      // Show confirmation dialog
      setConfirmDialogData({
        title: t('quiz.unansweredTitle'),
        message: t('quiz.unansweredMessage', { count: unansweredCount, numbers }),
        unansweredCount
      });
      setShowConfirmDialog(true);
      return; // Wait for user confirmation
    }

    // If all questions answered, submit directly
    await submitQuizDirectly();
  };

  const submitQuizDirectly = async () => {
    try {
      await axios.put(apiUrls.updateResult(resultId), {
        totalQuestions: questions.length,
        totalDuration: totalTime
      });

      navigate('/quiz/summary', {
        state: {
          resultId,
          examId,
          totalQuestions: questions.length,
          totalDuration: totalTime
        }
      });
    } catch (err: any) {
      console.error("Failed to submit result", err);
      
      // 如果是403错误，说明考试已完成或过期，直接跳转到summary
      if (err.response?.status === 403) {
        // 考试已完成，静默跳转到成绩页面
        navigate(`/exam/${shareId}/summary/${resultId}`);
      } else {
        showError(t('quiz.submitFailed'));
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary-600 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">{t('quiz.loadingExam')}</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">📝</div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{t('quiz.noQuestions')}</h2>
          <p className="text-sm sm:text-base text-gray-600">{t('quiz.contactAdmin')}</p>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQIndex];
  const currentAnswer = answers[currentQ.id];
  const isAnswered = !!currentAnswer;
  const progress = ((currentQIndex + 1) / questions.length) * 100;

  return (
    <AntiCheatProvider
      enabled={examConfig.enable_copy_prevention}
      watermarkText={examConfig.watermark_text}
      onViolation={(type, details) => console.warn('Anti-cheat violation:', type, details)}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Time warnings */}
        {timeWarnings.length > 0 && (
          <div className="fixed top-2 sm:top-4 left-2 right-2 sm:left-auto sm:right-4 z-50 space-y-2 max-w-md sm:max-w-sm mx-auto sm:mx-0">
            {timeWarnings.map((warning, index) => (
              <div key={index} className="bg-orange-100 border border-orange-400 text-orange-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-lg animate-pulse text-sm sm:text-base">
                {warning}
              </div>
            ))}
          </div>
        )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 relative z-10">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          {/* Mobile: Stack vertically, Desktop: Side by side */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Question Progress */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm sm:text-base font-bold">{currentQIndex + 1}</span>
                </div>
                <span className="text-gray-600 text-sm sm:text-base whitespace-nowrap">/ {questions.length}</span>
              </div>
              <div className="flex-1 sm:w-32 md:w-48 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Timer and Language Controls */}
            <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-3">
              {/* Language Switcher */}
              <LanguageSwitcher />
              
              {/* Exam Timer - Show only if time limit is set */}
              {examConfig.time_limit_minutes > 0 ? (
                <ExamTimer
                  timeLimitMinutes={examConfig.time_limit_minutes}
                  initialRemainingSeconds={remainingTime ?? undefined}
                  onTimeUp={handleTimeUp}
                  onTimeWarning={handleTimeWarning}
                  className="shadow-md"
                />
              ) : (
                /* Show total time if no time limit */
                <div className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-50 rounded-lg border border-gray-200 text-xs sm:text-sm text-gray-600">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-mono">{formatTime(totalTime)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Progress Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <QuizProgress
              questions={questions}
              currentQuestionIndex={currentQIndex}
              questionStatuses={questionStatuses}
              onQuestionClick={handleQuestionNavigation}
              className="lg:sticky lg:top-4"
            />
          </div>

          {/* Main Quiz Content */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="card relative p-4 sm:p-6">
              
          {/* Question */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-start mb-4 sm:mb-6 gap-2 sm:gap-3">
              <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
                <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-primary-100 rounded-full flex items-center justify-center mt-0.5 sm:mt-1">
                  <span className="text-primary-600 text-xs sm:text-sm font-medium">Q</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-lg font-medium text-gray-900 leading-relaxed break-words">
                    {getLocalizedContent(currentQ.content)}
                  </h2>
                </div>
              </div>
              
              {/* Flag Button - Next to Question Title */}
              {!isAnswered && (
                <button
                  onClick={async () => {
                    const currentStatus = questionStatuses.find(s => s.id === currentQ.id)?.status;
                    if (currentStatus === 'flagged') {
                      await updateQuestionStatus(currentQ.id, 'visited', 0);
                    } else {
                      await updateQuestionStatus(currentQ.id, 'flagged', 0);
                    }
                  }}
                  className={`flex-shrink-0 p-2 rounded-lg transition-all duration-200 active:scale-95 sm:hover:scale-110 self-start ${
                    questionStatuses.find(s => s.id === currentQ.id)?.status === 'flagged'
                      ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                  }`}
                  title={(() => {
                    const isFlagged = questionStatuses.find(s => s.id === currentQ.id)?.status === 'flagged';
                    return isFlagged 
                      ? t('quiz.unflagQuestion')
                      : t('quiz.flagQuestion');
                  })()}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>

            {/* Options */}
            <div className="space-y-2 sm:space-y-3 ml-0 sm:ml-9">
              {getLocalizedOptions(currentQ.options).map((opt, idx) => {
                const isSelected = isAnswered && opt === currentAnswer.user_answer;
                let optionClass = "w-full text-left p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ";

                if (isSelected) {
                  // 用户选择的答案显示为蓝色（已选中状态），但仍可点击修改
                  optionClass += "bg-primary-50 border-primary-500 text-primary-900 hover:border-primary-600 hover:bg-primary-100 active:scale-98";
                } else if (isAnswered) {
                  // 其他选项显示为可选状态
                  optionClass += "bg-white border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50 active:scale-98";
                } else {
                  optionClass += "bg-white border-gray-200 hover:border-primary-300 hover:bg-primary-50 active:scale-98";
                }

                const optionLabel = String.fromCharCode(65 + idx); // A, B, C, D

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(opt)}
                    className={optionClass}
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-primary-500 border-primary-500 text-white'
                          : 'border-gray-300 text-gray-600'
                      }`}>
                        {optionLabel}
                      </div>
                      <span className="flex-1 text-left text-sm sm:text-base">{opt}</span>
                      {isSelected && (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Answer Status */}
          {isAnswered && (
            <div className="rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 bg-blue-50 border border-blue-200">
              <div className="flex items-start sm:items-center space-x-2 sm:space-x-3">
                <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center mt-0.5 sm:mt-0">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-1 text-blue-900 text-sm sm:text-base">
                    {t('quiz.answerSubmitted', '答案已提交')}
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-800 break-words">
                    {t('quiz.yourAnswer', '您的答案')}：{currentAnswer.user_answer}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {t('quiz.canModifyAnswer', 'You can click other options to modify your answer before submitting')}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Navigation */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center pt-4 sm:pt-6 border-t border-gray-200 gap-3 sm:gap-0">
            <div className="flex items-center justify-between sm:justify-start sm:space-x-4 order-2 sm:order-1">
              <div className="text-xs sm:text-sm text-gray-500">
                {t('quiz.question')} {currentQIndex + 1} / {questions.length}
              </div>
              {currentQIndex > 0 && (
                <button
                  onClick={() => handleQuestionNavigation(currentQIndex - 1)}
                  className="btn-secondary text-xs sm:text-sm px-3 py-2"
                >
                  <span className="hidden sm:inline">{t('quiz.previousQuestion')}</span>
                  <span className="sm:hidden">上一题</span>
                </button>
              )}
            </div>

            <button
              onClick={handleNext}
              className="btn-primary text-sm sm:text-base order-1 sm:order-2"
            >
              {currentQIndex === questions.length - 1 ? (
                <div className="flex items-center justify-center">
                  <span>{t('quiz.submitAnswer')}</span>
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span>{t('quiz.nextQuestion')}</span>
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )}
            </button>
          </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
      
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title={confirmDialogData.title}
        message={confirmDialogData.message}
        confirmText={(i18n.language || 'zh-CN').startsWith('zh') ? '确认提交' : 'Confirm Submit'}
        cancelText={(i18n.language || 'zh-CN').startsWith('zh') ? '继续答题' : 'Continue'}
        type="warning"
        onConfirm={() => {
          setShowConfirmDialog(false);
          submitQuizDirectly();
        }}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </AntiCheatProvider>
  );
};

export default QuizPage;