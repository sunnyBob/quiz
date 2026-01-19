import React from 'react';
import { useTranslation } from 'react-i18next';

interface ProgressQuestion {
  id: number;
  content?: string | { [key: string]: string };
}

interface ProgressQuestionStatus {
  id: number;
  status: 'not_visited' | 'visited' | 'answered' | 'skipped' | 'flagged';
}

interface QuizProgressProps {
  questions: ProgressQuestion[];
  currentQuestionIndex: number;
  questionStatuses: ProgressQuestionStatus[];
  onQuestionClick?: (index: number) => void;
  className?: string;
}

const QuizProgress: React.FC<QuizProgressProps> = ({
  questions,
  currentQuestionIndex,
  questionStatuses,
  onQuestionClick,
  className = ''
}) => {
  const { t } = useTranslation();
  
  const getStatusColor = (status: string) => {
    // Priority: answered > flagged > visited/skipped > not_visited
    switch (status) {
      case 'answered':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'flagged':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'skipped':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'visited':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'flagged':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
          </svg>
        );
      case 'skipped':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getQuestionStatus = (questionId: number) => {
    return questionStatuses.find(s => s.id === questionId)?.status || 'not_visited';
  };

  const answeredCount = questionStatuses.filter(s => s.status === 'answered').length;
  const flaggedCount = questionStatuses.filter(s => s.status === 'flagged').length;
  const progressPercentage = (answeredCount / questions.length) * 100;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-3 sm:p-4 ${className}`}>
      {/* Progress Summary */}
      <div className="mb-3 sm:mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs sm:text-sm font-medium text-gray-900">{t('quiz.progress')}</h3>
          <span className="text-xs sm:text-sm text-gray-600">
            {answeredCount}/{questions.length}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2 sm:mb-3">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Status Summary - Only show answered and flagged */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded flex-shrink-0"></div>
            <span className="text-gray-600 whitespace-nowrap">{t('quiz.answered')} {answeredCount}</span>
          </div>
          {flaggedCount > 0 && (
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded flex-shrink-0"></div>
              <span className="text-gray-600 whitespace-nowrap">{t('quiz.flagged')} {flaggedCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Question Grid - Responsive columns */}
      <div className="grid grid-cols-8 sm:grid-cols-5 lg:grid-cols-5 gap-1.5 sm:gap-2">
        {questions.map((question, index) => {
          const status = getQuestionStatus(question.id);
          const isCurrent = index === currentQuestionIndex;
          const statusColor = getStatusColor(status);
          const statusIcon = getStatusIcon(status);

          return (
            <button
              key={question.id}
              onClick={() => onQuestionClick?.(index)}
              className={`
                relative aspect-square w-full rounded-md sm:rounded-lg border-2 text-xs sm:text-sm font-medium transition-all duration-200 active:scale-95
                ${statusColor}
                ${onQuestionClick ? 'sm:hover:scale-105 cursor-pointer' : 'cursor-default'}
                ${isCurrent ? 'ring-2 sm:ring-4 ring-primary-500 ring-opacity-50 scale-105 sm:scale-110 shadow-md sm:shadow-lg' : ''}
              `}
              title={`${t('quiz.question')} ${index + 1} - ${
                status === 'answered' ? t('quiz.status.answered') : 
                status === 'flagged' ? t('quiz.status.flagged') : 
                status === 'skipped' ? t('quiz.status.skipped') : 
                status === 'visited' ? t('quiz.status.visited') : 
                t('quiz.status.notVisited')
              }${isCurrent ? t('quiz.status.current') : ''}`}
            >
              <span className="absolute inset-0 flex items-center justify-center">
                {statusIcon || (index + 1)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Legend - Collapsible on mobile */}
      <div className="mt-3 sm:mt-4 pt-3 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-xs text-gray-600">
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 bg-primary-600 rounded flex-shrink-0"></div>
            <span className="truncate">{t('quiz.legend.currentQuestion')}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded flex-shrink-0"></div>
            <span className="truncate">{t('quiz.legend.completed')}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded flex-shrink-0"></div>
            <span className="truncate">{t('quiz.legend.flagged')}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded flex-shrink-0"></div>
            <span className="truncate">{t('quiz.legend.visited')}</span>
          </div>
        </div>
        
        {/* Help Text - Hide on small screens */}
        <div className="hidden sm:block mt-3 pt-2 border-t border-gray-100 text-xs text-gray-500 space-y-1">
          <p>{t('quiz.help.click')}</p>
          <p>{t('quiz.help.flag')}</p>
          <p>{t('quiz.help.skip')}</p>
        </div>
      </div>
    </div>
  );
};

export default QuizProgress;