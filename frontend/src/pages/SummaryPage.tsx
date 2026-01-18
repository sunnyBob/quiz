import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { apiUrls } from '../config/api';
import NotificationContainer from '../components/NotificationContainer';
import { useNotification } from '../hooks/useNotification';
import { getMotivationalQuote } from '../config/motivationalQuotes';
import { getLanguageConfig, getBrowserLanguage } from '../config/languages';

interface Question {
  id: number;
  content: string | { [key: string]: string };
  type: 'CHOICE' | 'TRUE_FALSE';
  options: string[] | { [key: string]: string[] };
  correct_answer: string | { [key: string]: string };
  explanation: string | { [key: string]: string };
}

interface Answer {
  question_id: number;
  user_answer: string;
  is_correct: boolean;
  duration_seconds: number;
}

const SummaryPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { resultId: urlResultId } = useParams<{ resultId?: string }>();
  const { i18n } = useTranslation();
  
  const resultId = urlResultId ? Number(urlResultId) : location.state?.resultId;
  const [examId, setExamId] = useState<number | undefined>(location.state?.examId);
  const [score, setScore] = useState(location.state?.score);
  const [totalQuestions, setTotalQuestions] = useState(location.state?.totalQuestions ?? 0);
  const [totalDuration, setTotalDuration] = useState(location.state?.totalDuration ?? 0);
  
  const { notifications, removeNotification, showError } = useNotification();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<'zh' | 'en'>(getBrowserLanguage());
  const [animatedScore, setAnimatedScore] = useState(0);
  const [rankPercentage, setRankPercentage] = useState<number | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [resultStatus, setResultStatus] = useState<'completed' | 'expired' | null>(null);
  const [reviewFilter, setReviewFilter] = useState<'incorrect' | 'correct' | 'all'>('incorrect'); // 默认显示错题
  const animationRef = useRef<number | null>(null);

  const getLocalizedContent = (content: string | { [key: string]: string }): string => {
    if (typeof content === 'string') return content;
    return content[i18n.language] || content['zh-CN'] || Object.values(content)[0] || '';
  };

  const getLocalizedOptions = (options: string[] | { [key: string]: string[] }): string[] => {
    if (Array.isArray(options)) return options;
    return options[i18n.language] || options['zh-CN'] || Object.values(options)[0] || [];
  };

  useEffect(() => {
    if (!resultId || !examId) {
      navigate('/');
    }
  }, [resultId, examId, navigate]);

  useEffect(() => {
    const fetchResultStatus = async () => {
      if (!resultId) return;
      
      try {
        const response = await axios.get(apiUrls.getResultDetails(resultId));
        const { result } = response.data;
        if (result && result.status) {
          setResultStatus(result.status);
        }
        // 从 result 中获取 examId 和基本数据
        if (result) {
          if (result.exam_id && !examId) {
            setExamId(result.exam_id);
          }
          // 如果没有从 location.state 获取到数据，从API获取
          if (score === undefined && result.score !== undefined) {
            setScore(result.score);
          }
          if (totalQuestions === 0 && result.total_questions !== undefined) {
            setTotalQuestions(result.total_questions);
          }
          if (totalDuration === 0 && result.total_duration !== undefined) {
            setTotalDuration(result.total_duration);
          }
        }
      } catch (err) {
        console.error('Failed to fetch result status:', err);
      }
    };

    fetchResultStatus();
  }, [resultId, examId, score, totalQuestions, totalDuration]);

  useEffect(() => {
    if (totalQuestions === 0 || score === undefined) return;
    
    const targetPercentage = Math.round((score / totalQuestions) * 100);
    const duration = 1500; // 动画时长1.5秒
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 增强的 ease-out 缓动函数：最后阶段更慢
      const easeOut = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(targetPercentage * easeOut);
      
      setAnimatedScore(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [score, totalQuestions]);

  useEffect(() => {
    const fetchRankingData = async () => {
      if (!examId || score === undefined) return;
      
      try {
        const response = await axios.get(apiUrls.getExamResults(examId));
        const completedResults = response.data.filter((r: any) => r.status === 'completed' || r.status === 'expired');
        setTotalParticipants(completedResults.length);
        
        if (completedResults.length > 0) {
          const rankedResults = completedResults.sort((a: any, b: any) => {
            if (b.score !== a.score) {
              return b.score - a.score;
            }
            return a.total_duration - b.total_duration;
          });
          
          const currentResultIndex = rankedResults.findIndex((r: any) => r.id === resultId);
          if (currentResultIndex !== -1) {
            const currentRank = currentResultIndex + 1;
            setRank(currentRank);
            
            const betterThanCount = completedResults.length - currentRank;
            const percentage = Math.round((betterThanCount / completedResults.length) * 100);
            setRankPercentage(percentage);
          }
        }
      } catch (error) {
        console.error('Failed to fetch ranking data:', error);
      }
    };

    if (examId && resultId && score !== undefined && totalQuestions > 0) {
      fetchRankingData();
    }
  }, [examId, resultId, score, totalQuestions]);

  const loadQuestionsData = async () => {
    if (loading || questions.length > 0) return;

    setLoading(true);
    try {
      const response = await axios.get(apiUrls.getResultDetails(resultId));
      const { result, questions: questionsData, answers: answersData } = response.data;
      
      if (result && result.status) {
        setResultStatus(result.status);
      }
      // 从 result 中获取 examId
      if (result && result.exam_id && !examId) {
        setExamId(result.exam_id);
      }
      
      const parsedQuestions = questionsData.map((q: any) => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
      }));
      setQuestions(parsedQuestions);
      setAnswers(answersData);
    } catch (err) {
      console.error('Failed to load questions data:', err);
      const errorMsg = language === 'zh' ? '加载数据失败' : 'Failed to load data';
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const loadReviewQuestions = async () => {
    await loadQuestionsData();
    setShowReview(true);
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

  const toggleLanguage = () => {
    const newLang = language === 'zh' ? 'en' : 'zh';
    setLanguage(newLang);
    // 同步更新 i18n 语言，用于题目内容的本地化
    i18n.changeLanguage(newLang === 'zh' ? 'zh-CN' : 'en-US');
  };

  const percentage = totalQuestions > 0 && score !== undefined ? Math.round((score / totalQuestions) * 100) : 0;
  const score100 = percentage; // 按100分计算的得分
  const isPass = percentage >= 60;
  const lang = getLanguageConfig(language);
  const motivationalQuote = getMotivationalQuote(percentage, language);

  const getPerformanceTag = () => {
    if (totalQuestions === 0) return [];
    const avgTime = totalDuration / totalQuestions;
    const tags = [];

    if (percentage >= 95) {
      tags.push(language === 'zh' ? '🏆 学霸' : '🏆 Top');
    } else if (percentage >= 85) {
      tags.push(language === 'zh' ? '⭐ 优秀' : '⭐ Excellent');
    } else if (percentage >= 75) {
      tags.push(language === 'zh' ? '💪 良好' : '💪 Good');
    } else if (percentage >= 60) {
      tags.push(language === 'zh' ? '📈 及格' : '📈 Pass');
    } else {
      tags.push(language === 'zh' ? '💡 待提升' : '💡 Needs Work');
    }

    if (avgTime < 30) {
      tags.push(language === 'zh' ? '⚡ 快速' : '⚡ Fast');
      if (percentage < 85) {
        tags.push(language === 'zh' ? '⚠️ 粗心' : '⚠️ Hasty');
      }
    } else if (avgTime > 120) {
      tags.push(language === 'zh' ? '🐌 认真' : '🐌 Careful');
    }

    if (percentage >= 90 && avgTime >= 60) {
      tags.push(language === 'zh' ? '🎯 稳健' : '🎯 Steady');
    }

    return tags;
  };

  const performanceTags = getPerformanceTag();

  const getRankSuffix = (rank: number) => {
    if (rank % 10 === 1 && rank % 100 !== 11) return 'st';
    if (rank % 10 === 2 && rank % 100 !== 12) return 'nd';
    if (rank % 10 === 3 && rank % 100 !== 13) return 'rd';
    return 'th';
  };

  const getCorrectAnswerContent = (question: Question) => {
    const localizedOptions = getLocalizedOptions(question.options);
    const localizedCorrectAnswer = getLocalizedContent(question.correct_answer);
    
    if (localizedCorrectAnswer.match(/^[A-D]$/)) {
      const index = localizedCorrectAnswer.charCodeAt(0) - 65;
      return localizedOptions[index];
    }
    return localizedCorrectAnswer;
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-4xl mx-auto py-3 sm:py-6 px-3 sm:px-4">
        {/* Language Toggle - Compact */}
        <div className="flex justify-end mb-3">
          <button
            onClick={toggleLanguage}
            className="group flex items-center space-x-1.5 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 hover:border-indigo-300"
          >
            <span className="text-xs font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
              {language === 'zh' ? '中文' : 'EN'}
            </span>
            <svg className="w-3.5 h-3.5 text-gray-500 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Compact Header */}
          <div className={`relative px-4 sm:px-6 py-4 sm:py-6 ${
            resultStatus === 'expired' 
              ? 'bg-gradient-to-br from-orange-500 via-red-500 to-pink-500'
              : isPass 
                ? 'bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500'
                : 'bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500'
          }`}>
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
              <div className="absolute top-5 left-5 w-20 h-20 bg-white rounded-full blur-2xl"></div>
              <div className="absolute bottom-5 right-5 w-24 h-24 bg-white rounded-full blur-2xl"></div>
            </div>

            <div className="relative flex items-center justify-between text-white">
              <div className="flex items-center space-x-3 sm:space-x-4">
                {/* Compact Status Icon */}
                <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center shadow-lg">
                  {resultStatus === 'expired' ? (
                    <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : isPass ? (
                    <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h1 className="text-base sm:text-xl md:text-2xl font-bold drop-shadow-lg">
                    {resultStatus === 'expired' 
                      ? (language === 'zh' ? '已自动提交' : 'Auto-submitted')
                      : lang.examCompleted
                    }
                  </h1>
                  <p className="text-xs sm:text-sm opacity-90 drop-shadow">
                    {resultStatus === 'expired'
                      ? (language === 'zh' ? '时间到达' : 'Time expired')
                      : (isPass ? lang.congratulations : lang.unfortunately)
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section - Compact */}
          <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
            {/* Score & Ranking Combined Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {/* Score Display - Compact */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  {/* Compact Score Circle */}
                  <div className="relative flex-shrink-0">
                    <svg className="w-20 h-20 sm:w-24 sm:h-24 transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                      <circle
                        cx="50" cy="50" r="42" fill="none"
                        stroke={isPass ? "#10b981" : "#f59e0b"}
                        strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={`${(animatedScore / 100) * 264} 264`}
                        className="transition-all duration-300"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          {animatedScore}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{language === 'zh' ? '分' : 'pts'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex-1 ml-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{language === 'zh' ? '正确' : 'Correct'}</span>
                      <span className="text-lg sm:text-xl font-bold text-green-600">{score ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{language === 'zh' ? '总计' : 'Total'}</span>
                      <span className="text-lg sm:text-xl font-bold text-blue-600">{totalQuestions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{language === 'zh' ? '用时' : 'Time'}</span>
                      <span className="text-sm sm:text-base font-bold text-purple-600">{formatTime(totalDuration)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Performance Tags - Compact */}
                {performanceTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
                    {performanceTags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 text-indigo-800 rounded-full text-xs font-semibold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Ranking Display - Compact */}
              {rank !== null && totalParticipants > 0 ? (
                <div className={`rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 ${
                  rank === 1 
                    ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300'
                    : rank === 2
                    ? 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-300'
                    : rank === 3
                    ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300'
                    : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-indigo-200'
                }`}>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                      {language === 'zh' ? '🏅 排名' : '🏅 Rank'}
                    </p>
                    
                    {/* Compact Rank Badge */}
                    <div className="mb-3">
                      {rank === 1 ? (
                        <div className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg">
                          <span className="text-xl mr-1.5">🏆</span>
                          <span className="text-lg font-black">{language === 'zh' ? '第1名' : '1st'}</span>
                        </div>
                      ) : rank === 2 ? (
                        <div className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-gray-400 to-slate-400 text-white shadow-lg">
                          <span className="text-xl mr-1.5">🥈</span>
                          <span className="text-lg font-black">{language === 'zh' ? '第2名' : '2nd'}</span>
                        </div>
                      ) : rank === 3 ? (
                        <div className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-lg">
                          <span className="text-xl mr-1.5">🥉</span>
                          <span className="text-lg font-black">{language === 'zh' ? '第3名' : '3rd'}</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg">
                          <span className="text-lg font-black">
                            {language === 'zh' ? `第${rank}名` : `${rank}${getRankSuffix(rank)}`}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/50 rounded-lg p-2">
                        <p className="text-gray-600 font-medium">{language === 'zh' ? '超过' : 'Beat'}</p>
                        <p className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          {rankPercentage}%
                        </p>
                      </div>
                      <div className="bg-white/50 rounded-lg p-2">
                        <p className="text-gray-600 font-medium">{language === 'zh' ? '参与' : 'Total'}</p>
                        <p className="text-lg font-bold text-gray-700">{totalParticipants}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 flex items-center justify-center">
                  <p className="text-sm text-gray-500">{language === 'zh' ? '暂无排名数据' : 'No ranking available'}</p>
                </div>
              )}
            </div>

            {/* Motivational Quote */}
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border border-pink-100 p-3">
              <div className="flex items-start space-x-2">
                <span className="text-lg flex-shrink-0">✨</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-800 leading-relaxed font-medium italic">
                    "{motivationalQuote.text}"
                  </p>
                  {motivationalQuote.author && (
                    <p className="text-xs text-gray-500 mt-1.5">— {motivationalQuote.author}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Feedback Badge - Compact */}
            {percentage < 60 && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-amber-900 text-sm mb-1">
                      {language === 'zh' ? '需要加强！' : 'Keep Practicing!'}
                    </h3>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      {language === 'zh' 
                        ? `得分 ${score100} 分未达到60分标准，建议复习后重考。`
                        : `Score ${score100} is below 60. Review and retake recommended.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons - Compact Grid */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                onClick={loadReviewQuestions}
                disabled={loading}
                className="group relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold py-2.5 sm:py-3 px-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                <div className="relative z-10 flex items-center justify-center space-x-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-xs sm:text-sm">{language === 'zh' ? '题目回顾' : 'Review'}</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 to-teal-700 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>

              <button
                onClick={() => {
                  if (examId) {
                    navigate(`/exam/${examId}/leaderboard`);
                  } else {
                    showError(language === 'zh' ? '无法加载考试信息' : 'Failed to load exam info');
                  }
                }}
                disabled={!examId}
                className="group relative overflow-hidden bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-2.5 sm:py-3 px-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="relative z-10 flex items-center justify-center space-x-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-xs sm:text-sm">{language === 'zh' ? '排行榜' : 'Leaderboard'}</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-600 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>

              <button
                onClick={() => navigate('/')}
                className="group relative overflow-hidden bg-gradient-to-r from-gray-600 to-slate-600 text-white font-semibold py-2.5 sm:py-3 px-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 col-span-2"
              >
                <div className="relative z-10 flex items-center justify-center space-x-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="text-xs sm:text-sm">{language === 'zh' ? '返回首页' : 'Back to Home'}</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-slate-700 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Review Questions Modal */}
      {showReview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 px-4 sm:px-5 md:px-6 py-3 sm:py-4 z-10">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                  {language === 'zh' ? '题目回顾' : 'Question Review'}
                </h2>
                <button
                  onClick={() => setShowReview(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-1.5 sm:p-2 transition-colors active:scale-95"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Filter Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setReviewFilter('incorrect')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    reviewFilter === 'incorrect'
                      ? 'bg-white text-emerald-600 shadow-md'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {language === 'zh' ? `❌ 错题 (${answers.filter(a => !a.is_correct).length})` : `❌ Incorrect (${answers.filter(a => !a.is_correct).length})`}
                </button>
                <button
                  onClick={() => setReviewFilter('all')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    reviewFilter === 'all'
                      ? 'bg-white text-emerald-600 shadow-md'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {language === 'zh' ? `全部 (${questions.length})` : `All (${questions.length})`}
                </button>
              </div>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] sm:max-h-[calc(90vh-140px)] p-3 sm:p-4 md:p-6">
              {(() => {
                const filteredQuestions = questions.filter((q) => {
                  const answer = answers.find(a => a.question_id === q.id);
                  if (reviewFilter === 'incorrect') return answer && !answer.is_correct;
                  if (reviewFilter === 'correct') return answer && answer.is_correct;
                  return true; // 'all'
                });

                if (filteredQuestions.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-gray-600 text-lg">
                        {reviewFilter === 'incorrect' 
                          ? (language === 'zh' ? '太棒了！没有错题' : 'Great! No incorrect answers')
                          : (language === 'zh' ? '没有题目' : 'No questions')
                        }
                      </p>
                    </div>
                  );
                }

                return filteredQuestions.map((q) => {
                const answer = answers.find(a => a.question_id === q.id);
                const localizedOptions = getLocalizedOptions(q.options);
                const localizedContent = getLocalizedContent(q.content);
                const localizedExplanation = q.explanation ? getLocalizedContent(q.explanation) : '';
                const originalIndex = questions.findIndex(question => question.id === q.id);

                return (
                  <div key={q.id} className={`mb-4 sm:mb-5 md:mb-6 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border-2 ${
                    !answer 
                      ? 'bg-gray-50 border-gray-200'
                      : answer.is_correct
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-start space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                      <span className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-sm sm:text-base font-bold ${
                        !answer
                          ? 'bg-gray-200 text-gray-700'
                          : answer.is_correct
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                      }`}>
                        {originalIndex + 1}
                      </span>
                      <p className="flex-1 text-sm sm:text-base text-gray-900 font-medium leading-relaxed break-words">{localizedContent}</p>
                    </div>

                    <div className="ml-9 sm:ml-11 space-y-2 mb-3 sm:mb-4">
                      {q.type === 'TRUE_FALSE' ? (
                        // 判断题特殊渲染
                        <>
                          {[
                            { value: language === 'zh' ? '正确' : 'True', label: language === 'zh' ? '正确' : 'True' },
                            { value: language === 'zh' ? '错误' : 'False', label: language === 'zh' ? '错误' : 'False' }
                          ].map((option, optIdx) => {
                            const correctAnswer = getCorrectAnswerContent(q);
                            const normalizeAnswer = (ans?: string) => ans?.toLowerCase().trim() || '';
                            
                            // 判断是否是正确答案选项
                            const isCorrectOption = 
                              normalizeAnswer(correctAnswer) === normalizeAnswer(option.value) ||
                              (normalizeAnswer(correctAnswer) === 'true' && normalizeAnswer(option.value) === 'true') ||
                              (normalizeAnswer(correctAnswer) === 'false' && normalizeAnswer(option.value) === 'false') ||
                              (normalizeAnswer(correctAnswer) === '正确' && normalizeAnswer(option.value) === 'true') ||
                              (normalizeAnswer(correctAnswer) === '错误' && normalizeAnswer(option.value) === 'false') ||
                              (normalizeAnswer(correctAnswer) === 'true' && normalizeAnswer(option.value) === '正确') ||
                              (normalizeAnswer(correctAnswer) === 'false' && normalizeAnswer(option.value) === '错误');
                            
                            // 判断是否是用户选择的选项（必须完全匹配）
                            const isUserAnswer = answer && normalizeAnswer(answer.user_answer) === normalizeAnswer(option.value);
                            
                            // 只有当用户选择了错误选项（非正确答案）时才显示 "Your answer"
                            const isWrongUserAnswer = isUserAnswer && !answer.is_correct && !isCorrectOption;
                            
                            return (
                              <div
                                key={optIdx}
                                className={`p-3 sm:p-4 rounded-lg border-[3px] text-sm sm:text-base ${
                                  isCorrectOption
                                    ? 'bg-green-100 border-green-500 shadow-lg shadow-green-200'
                                    : isWrongUserAnswer
                                      ? 'bg-red-100 border-red-500 shadow-lg shadow-red-200'
                                      : 'bg-white border-gray-300'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className={`break-words font-semibold ${
                                    isCorrectOption ? 'text-green-800' : isWrongUserAnswer ? 'text-red-800' : 'text-gray-700'
                                  }`}>
                                    ○ {option.label}
                                  </span>
                                  <div className="flex items-center gap-2 ml-2">
                                    {isCorrectOption && (
                                      <span className="text-green-700 text-xs sm:text-sm font-bold whitespace-nowrap bg-green-200 px-3 py-1 rounded">
                                        ✓ {language === 'zh' ? '正确答案' : 'Correct'}
                                      </span>
                                    )}
                                    {isWrongUserAnswer && (
                                      <span className="text-red-700 text-xs sm:text-sm font-bold whitespace-nowrap bg-red-200 px-3 py-1 rounded">
                                        ✗ {language === 'zh' ? '您的答案' : 'Your answer'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      ) : (
                        // 选择题渲染
                        localizedOptions.map((opt, optIdx) => {
                          const isCorrectOption = getCorrectAnswerContent(q) === opt;
                          const isUserAnswer = answer && answer.user_answer === opt;
                          // 只有当用户选择了错误选项（非正确答案）时才显示 "Your answer"
                          const isWrongUserAnswer = isUserAnswer && !answer.is_correct && !isCorrectOption;
                          
                          return (
                            <div
                              key={optIdx}
                              className={`p-3 sm:p-4 rounded-lg border-[3px] text-sm sm:text-base ${
                                isCorrectOption
                                  ? 'bg-green-100 border-green-500 shadow-lg shadow-green-200'
                                  : isWrongUserAnswer
                                    ? 'bg-red-100 border-red-500 shadow-lg shadow-red-200'
                                    : 'bg-white border-gray-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`break-words font-semibold ${
                                  isCorrectOption ? 'text-green-800' : isWrongUserAnswer ? 'text-red-800' : 'text-gray-700'
                                }`}>
                                  {String.fromCharCode(65 + optIdx)}. {opt}
                                </span>
                                <div className="flex items-center gap-2 ml-2">
                                  {isCorrectOption && (
                                    <span className="text-green-700 text-xs sm:text-sm font-bold whitespace-nowrap bg-green-200 px-3 py-1 rounded">
                                      ✓ {language === 'zh' ? '正确答案' : 'Correct'}
                                    </span>
                                  )}
                                  {isWrongUserAnswer && (
                                    <span className="text-red-700 text-xs sm:text-sm font-bold whitespace-nowrap bg-red-200 px-3 py-1 rounded">
                                      ✗ {language === 'zh' ? '您的答案' : 'Your answer'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {localizedExplanation && (
                      <div className="ml-9 sm:ml-11 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs sm:text-sm font-semibold text-blue-900 mb-1">
                          {language === 'zh' ? '📖 解析' : '📖 Explanation'}
                        </p>
                        <p className="text-xs sm:text-sm text-blue-800 leading-relaxed break-words">{localizedExplanation}</p>
                      </div>
                    )}

                    {!answer && (
                      <div className="ml-9 sm:ml-11 p-2.5 sm:p-3 bg-gray-100 border border-gray-200 rounded-lg">
                        <p className="text-xs sm:text-sm text-gray-600">
                          {language === 'zh' ? '⚠️ 未作答' : '⚠️ Not answered'}
                        </p>
                      </div>
                    )}
                  </div>
                );
              });
              })()}
            </div>
          </div>
        </div>
      )}

      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SummaryPage;
