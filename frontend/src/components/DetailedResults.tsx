import React from 'react';
import { useTranslation } from 'react-i18next';
import { getLanguageConfig } from '../config/languages';

interface Question {
  id: number;
  content: string | { [key: string]: string }; // Support multilingual
  type: 'CHOICE' | 'TRUE_FALSE';
  options: string[] | { [key: string]: string[] }; // Support multilingual
  correct_answer: string | { [key: string]: string }; // Support multilingual
  explanation: string | { [key: string]: string }; // Support multilingual
}

interface Answer {
  question_id: number;
  user_answer: string;
  is_correct: boolean;
  duration_seconds: number;
}

interface DetailedResultsProps {
  questions: Question[];
  answers: Answer[];
  totalScore: number;
  totalQuestions: number;
  totalDuration: number;
  language?: 'zh' | 'en';
}

const DetailedResults: React.FC<DetailedResultsProps> = ({
  questions,
  answers,
  totalScore,
  totalQuestions,
  totalDuration,
  language = 'zh'
}) => {
  const lang = getLanguageConfig(language);
  const { i18n } = useTranslation();

  // Helper functions for multilingual content
  const getLocalizedContent = (content: string | { [key: string]: string }): string => {
    if (typeof content === 'string') return content;
    return content[i18n.language] || content['zh-CN'] || Object.values(content)[0] || '';
  };

  const getLocalizedOptions = (options: string[] | { [key: string]: string[] }): string[] => {
    if (Array.isArray(options)) return options;
    return options[i18n.language] || options['zh-CN'] || Object.values(options)[0] || [];
  };

  // 获取正确答案的内容
  const getCorrectAnswerContent = (question: Question) => {
    const localizedOptions = getLocalizedOptions(question.options);
    const localizedCorrectAnswer = getLocalizedContent(question.correct_answer);
    
    // 如果 correct_answer 是选项标签 (A, B, C, D)
    if (localizedCorrectAnswer.match(/^[A-D]$/)) {
      const index = localizedCorrectAnswer.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
      return localizedOptions[index];
    }
    // 如果 correct_answer 已经是选项内容
    return localizedCorrectAnswer;
  };
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getPerformanceColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBg = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'bg-green-50 border-green-200';
    if (percentage >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const correctAnswers = answers.filter(a => a.is_correct);
  const incorrectAnswers = answers.filter(a => !a.is_correct);
  const averageTimePerQuestion = totalDuration / totalQuestions;
  const scorePercentage = (totalScore / totalQuestions) * 100;

  return (
    <div className="space-y-6">
      {/* Performance Summary */}
      <div className={`rounded-lg border p-6 ${getPerformanceBg(totalScore, totalQuestions)}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`text-3xl font-bold ${getPerformanceColor(totalScore, totalQuestions)}`}>
              {totalScore}/{totalQuestions}
            </div>
            <div className="text-sm text-gray-600">{language === 'zh' ? '总分' : 'Total Score'}</div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${getPerformanceColor(totalScore, totalQuestions)}`}>
              {scorePercentage.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">{language === 'zh' ? '正确率' : 'Accuracy'}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {formatTime(totalDuration)}
            </div>
            <div className="text-sm text-gray-600">{language === 'zh' ? '总用时' : 'Total Time'}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {formatTime(Math.round(averageTimePerQuestion))}
            </div>
            <div className="text-sm text-gray-600">{language === 'zh' ? '平均用时' : 'Average Time'}</div>
          </div>
        </div>
      </div>

      {/* Performance Analysis */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{lang.performanceAnalysis}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">{lang.answeringSituation}</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-green-600">{lang.correctQuestions}</span>
                <span className="font-medium">{correctAnswers.length} {language === 'zh' ? '题' : 'questions'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600">{lang.incorrectQuestions}</span>
                <span className="font-medium">{incorrectAnswers.length} {language === 'zh' ? '题' : 'questions'}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">{lang.timeAnalysis}</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">{lang.fastestAnswer}</span>
                <span className="font-medium">
                  {formatTime(Math.min(...answers.map(a => a.duration_seconds)))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{lang.slowestAnswer}</span>
                <span className="font-medium">
                  {formatTime(Math.max(...answers.map(a => a.duration_seconds)))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wrong Answers Review */}
      {incorrectAnswers.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{lang.wrongAnswersReview}</h3>
          <div className="space-y-6">
            {incorrectAnswers.map((answer) => {
              const question = questions.find(q => q.id === answer.question_id);
              if (!question) return null;

              return (
                <div key={answer.question_id} className="border-l-4 border-red-400 pl-4">
                  <div className="mb-3">
                    <h4 className="font-medium text-gray-900 mb-2">{getLocalizedContent(question.content)}</h4>
                    <div className="text-sm text-gray-600 mb-2">
                      {lang.timeUsedLabel}: {formatTime(answer.duration_seconds)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {getLocalizedOptions(question.options).map((option, idx) => {
                      const optionLabel = String.fromCharCode(65 + idx);
                      const correctAnswerContent = getCorrectAnswerContent(question);
                      const isCorrect = option === correctAnswerContent;
                      const isUserAnswer = option === answer.user_answer;

                      let className = "p-3 rounded-lg border ";
                      if (isCorrect) {
                        className += "bg-green-50 border-green-200 text-green-800";
                      } else if (isUserAnswer) {
                        className += "bg-red-50 border-red-200 text-red-800";
                      } else {
                        className += "bg-gray-50 border-gray-200 text-gray-600";
                      }

                      return (
                        <div key={idx} className={className}>
                          <div className="flex items-center space-x-3">
                            <span className="font-medium">{optionLabel}.</span>
                            <span className="flex-1">{option}</span>
                            {isCorrect && (
                              <span className="text-green-600 text-sm font-medium">{lang.correctAnswer}</span>
                            )}
                            {isUserAnswer && !isCorrect && (
                              <span className="text-red-600 text-sm font-medium">{lang.yourAnswer}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {question.explanation && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm font-medium text-blue-900 mb-1">{lang.explanation}</div>
                      <div className="text-sm text-blue-800">{getLocalizedContent(question.explanation)}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Learning Recommendations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{lang.learningRecommendations}</h3>
        <div className="space-y-3">
          {scorePercentage >= 90 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-green-800">
                <strong>{lang.excellent}</strong> {lang.excellentAdvice}
              </div>
            </div>
          )}
          {scorePercentage >= 70 && scorePercentage < 90 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-blue-800">
                <strong>{lang.good}</strong> {lang.goodAdvice}
              </div>
            </div>
          )}
          {scorePercentage >= 60 && scorePercentage < 70 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-yellow-800">
                <strong>{lang.pass}</strong> {lang.passAdvice}
              </div>
            </div>
          )}
          {scorePercentage < 60 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-800">
                <strong>{lang.needImprovement}</strong> {lang.failAdvice}
              </div>
            </div>
          )}

          {incorrectAnswers.length > 0 && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-gray-800">
                <strong>{lang.focusOn}</strong> {lang.wrongAnswersAdvice.replace('{count}', incorrectAnswers.length.toString())}
              </div>
            </div>
          )}

          {averageTimePerQuestion < 30 && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="text-orange-800">
                <strong>{lang.timeManagement}</strong> {lang.fastAnswerAdvice}
              </div>
            </div>
          )}

          {averageTimePerQuestion > 120 && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="text-purple-800">
                <strong>{lang.efficiencyImprovement}</strong> {lang.slowAnswerAdvice}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailedResults;