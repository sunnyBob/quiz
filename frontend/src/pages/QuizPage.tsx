import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

interface Question {
  id: number;
  content: string;
  type: 'CHOICE' | 'TRUE_FALSE';
  options: string[];
  correct_answer: string;
  explanation: string;
}

interface Answer {
  question_id: number;
  user_answer: string;
  is_correct: boolean;
}

const QuizPage: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { userId, resultId, examId } = location.state || {};

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});

  // Timer States
  const [totalTime, setTotalTime] = useState(0);
  const [questionTime, setQuestionTime] = useState(0);

  const totalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!resultId || !examId) {
      alert('会话无效，请重新开始');
      navigate(`/quiz/${shareId}`);
      return;
    }

    const fetchData = async () => {
      try {
        const qRes = await axios.get(`http://localhost:3000/api/exams/${examId}/questions`);
        const parsedQuestions = qRes.data.map((q: any) => ({
          ...q,
          options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
        }));
        setQuestions(parsedQuestions);

        const aRes = await axios.get(`http://localhost:3000/api/results/${resultId}/answers`);
        const prevAnswers: Record<number, Answer> = {};
        aRes.data.forEach((a: any) => {
          prevAnswers[a.question_id] = {
            question_id: a.question_id,
            user_answer: a.user_answer,
            is_correct: a.is_correct === 1,
          };
        });
        setAnswers(prevAnswers);

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchData();

    totalTimerRef.current = setInterval(() => {
      setTotalTime((prev) => prev + 1);
    }, 1000);

    return () => {
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    };
  }, [examId, resultId, shareId, navigate]);

  useEffect(() => {
    setQuestionTime(0);
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);

    const currentQ = questions[currentQIndex];
    if (currentQ && !answers[currentQ.id]) {
        questionTimerRef.current = setInterval(() => {
            setQuestionTime((prev) => prev + 1);
        }, 1000);
    }

    return () => {
        if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    }
  }, [currentQIndex, questions, answers]);

  const handleAnswer = async (option: string) => {
    const currentQ = questions[currentQIndex];
    if (answers[currentQ.id]) return;

    const isCorrect = option === currentQ.correct_answer;

    const newAnswer: Answer = {
        question_id: currentQ.id,
        user_answer: option,
        is_correct: isCorrect
    };
    setAnswers(prev => ({ ...prev, [currentQ.id]: newAnswer }));

    try {
        await axios.post('http://localhost:3000/api/answers', {
            resultId,
            questionId: currentQ.id,
            userAnswer: option,
            isCorrect,
            duration: questionTime
        });
    } catch (err) {
        console.error("Failed to save answer", err);
    }
  };

  const handleNext = async () => {
    if (currentQIndex < questions.length - 1) {
        setCurrentQIndex(prev => prev + 1);
    } else {
        const correctCount = Object.values(answers).filter(a => a.is_correct).length;

        try {
            await axios.put(`http://localhost:3000/api/results/${resultId}`, {
                score: correctCount,
                totalQuestions: questions.length,
                totalDuration: totalTime
            });

            navigate('/quiz/summary', {
                state: {
                    resultId,
                    score: correctCount,
                    totalQuestions: questions.length,
                    totalDuration: totalTime
                }
            });
        } catch (err) {
            console.error("Failed to submit result", err);
            alert("提交结果失败，请重试");
        }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载考试内容...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">暂无考试题目</h2>
          <p className="text-gray-600">请联系管理员添加题目</p>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQIndex];
  const currentAnswer = answers[currentQ.id];
  const isAnswered = !!currentAnswer;
  const progress = ((currentQIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 select-none" onContextMenu={(e) => e.preventDefault()}>
      {/* Watermark */}
      <div className="fixed inset-0 pointer-events-none opacity-5 flex items-center justify-center overflow-hidden z-0">
         <div className="transform -rotate-45 text-4xl font-bold text-gray-400 whitespace-nowrap">
             考生: {userId} • 考试进行中
         </div>
      </div>

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 relative z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{currentQIndex + 1}</span>
                </div>
                <span className="text-gray-600">/ {questions.length}</span>
              </div>
              <div className="w-48 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-mono">{formatTime(totalTime)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        <div className="card">
          {/* Question */}
          <div className="mb-8">
            <div className="flex items-start space-x-3 mb-6">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mt-1">
                <span className="text-primary-600 text-sm font-medium">Q</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-medium text-gray-900 leading-relaxed">
                  {currentQ.content}
                </h2>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3 ml-9">
              {currentQ.options.map((opt, idx) => {
                let optionClass = "w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ";

                if (isAnswered) {
                  if (opt === currentQ.correct_answer) {
                    optionClass += "bg-success-50 border-success-500 text-success-900";
                  } else if (opt === currentAnswer.user_answer) {
                    optionClass += "bg-danger-50 border-danger-500 text-danger-900";
                  } else {
                    optionClass += "bg-gray-50 border-gray-200 text-gray-500";
                  }
                } else {
                  optionClass += "bg-white border-gray-200 hover:border-primary-300 hover:bg-primary-50 cursor-pointer";
                }

                const optionLabel = String.fromCharCode(65 + idx); // A, B, C, D

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(opt)}
                    disabled={isAnswered}
                    className={optionClass}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                        isAnswered && opt === currentQ.correct_answer
                          ? 'bg-success-500 border-success-500 text-white'
                          : isAnswered && opt === currentAnswer.user_answer && !currentAnswer.is_correct
                          ? 'bg-danger-500 border-danger-500 text-white'
                          : 'border-gray-300 text-gray-600'
                      }`}>
                        {optionLabel}
                      </div>
                      <span className="flex-1 text-left">{opt}</span>
                      {isAnswered && opt === currentQ.correct_answer && (
                        <svg className="w-5 h-5 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {isAnswered && opt === currentAnswer.user_answer && !currentAnswer.is_correct && (
                        <svg className="w-5 h-5 text-danger-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback */}
          {isAnswered && (
            <div className={`rounded-lg p-4 mb-6 ${
              currentAnswer.is_correct
                ? 'bg-success-50 border border-success-200'
                : 'bg-danger-50 border border-danger-200'
            }`}>
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                  currentAnswer.is_correct ? 'bg-success-500' : 'bg-danger-500'
                }`}>
                  {currentAnswer.is_correct ? (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold mb-2 ${
                    currentAnswer.is_correct ? 'text-success-900' : 'text-danger-900'
                  }`}>
                    {currentAnswer.is_correct ? '回答正确！' : '回答错误'}
                  </h3>
                  {currentQ.explanation && (
                    <p className={`text-sm ${
                      currentAnswer.is_correct ? 'text-success-800' : 'text-danger-800'
                    }`}>
                      {currentQ.explanation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              题目 {currentQIndex + 1} / {questions.length}
            </div>

            <button
              onClick={handleNext}
              className="btn-primary"
            >
              {currentQIndex === questions.length - 1 ? (
                <div className="flex items-center">
                  <span>提交答卷</span>
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              ) : (
                <div className="flex items-center">
                  <span>下一题</span>
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
  );
};

export default QuizPage;