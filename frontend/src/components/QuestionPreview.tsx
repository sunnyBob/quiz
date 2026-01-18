import React from 'react';
import { useTranslation } from 'react-i18next';

export interface Question {
  id?: number;
  exam_id: number;
  type: 'CHOICE' | 'TRUE_FALSE';
  content: string | { [key: string]: string }; // 支持多语言
  options: string[] | { [key: string]: string[] }; // 支持多语言
  correct_answer: string | { [key: string]: string }; // 支持多语言
  explanation?: string | { [key: string]: string }; // 支持多语言
  content_en?: string; // 可选的英文内容（旧格式兼容）
  options_en?: string[]; // 可选的英文选项（旧格式兼容）
  correct_answer_en?: string; // 可选的英文答案（旧格式兼容）
  explanation_en?: string; // 可选的英文解析（旧格式兼容）
}

interface QuestionPreviewProps {
  question: Question;
  showAnswer?: boolean;
  questionNumber?: number;
}

const QuestionPreview: React.FC<QuestionPreviewProps> = ({ 
  question, 
  showAnswer = false,
  questionNumber 
}) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  // 辅助函数：获取本地化内容
  const getLocalizedContent = (content: string | { [key: string]: string } | undefined): string => {
    if (!content) return '';
    if (typeof content === 'string') return content;
    return content[currentLang] || content['zh-CN'] || Object.values(content)[0] || '';
  };

  // 辅助函数：获取本地化选项
  const getLocalizedOptions = (options: string[] | { [key: string]: string[] } | undefined): string[] => {
    if (!options) return [];
    if (Array.isArray(options)) return options;
    return options[currentLang] || options['zh-CN'] || Object.values(options)[0] || [];
  };

  // 获取显示用的内容
  const displayContent = getLocalizedContent(question.content);
  const displayOptions = getLocalizedOptions(question.options);
  const displayExplanation = question.explanation ? getLocalizedContent(question.explanation) : '';
  const displayCorrectAnswer = typeof question.correct_answer === 'string' 
    ? question.correct_answer 
    : getLocalizedContent(question.correct_answer);
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      {/* Question Header */}
      <div className="flex items-start gap-3 mb-4">
        {questionNumber && (
          <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
            {questionNumber}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 text-xs font-medium rounded ${
              question.type === 'CHOICE' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              {question.type === 'CHOICE' ? '选择题' : '判断题'}
            </span>
          </div>
          <p className="text-gray-900 text-lg font-medium">{displayContent}</p>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2 ml-11">
        {question.type === 'CHOICE' ? (
          <>
            {displayOptions.map((option, index) => {
              const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
              const isCorrect = showAnswer && displayCorrectAnswer === optionLabel;
              
              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-2 ${
                    isCorrect
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${isCorrect ? 'text-green-700' : 'text-gray-700'}`}>
                      {optionLabel}.
                    </span>
                    <span className={isCorrect ? 'text-green-900' : 'text-gray-900'}>
                      {option}
                    </span>
                    {isCorrect && (
                      <span className="ml-auto text-green-600 text-sm font-medium">✓ 正确答案</span>
                    )}
                  </div>
                </div>
              );
            })}
            {showAnswer && displayCorrectAnswer && (
              <div className="mt-3 p-3 bg-green-100 border-2 border-green-300 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-green-700 font-semibold">✓ 正确答案：</span>
                  <span className="text-green-900 font-medium">{displayCorrectAnswer}</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className={`p-3 rounded-lg border-2 ${
              showAnswer && (displayCorrectAnswer === 'true' || displayCorrectAnswer === '正确' || displayCorrectAnswer === 'True')
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${
                  showAnswer && (displayCorrectAnswer === 'true' || displayCorrectAnswer === '正确' || displayCorrectAnswer === 'True') ? 'text-green-700' : 'text-gray-700'
                }`}>
                  ○
                </span>
                <span className={
                  showAnswer && (displayCorrectAnswer === 'true' || displayCorrectAnswer === '正确' || displayCorrectAnswer === 'True') ? 'text-green-900' : 'text-gray-900'
                }>
                  {currentLang === 'en-US' ? 'True' : '正确'}
                </span>
                {showAnswer && (displayCorrectAnswer === 'true' || displayCorrectAnswer === '正确' || displayCorrectAnswer === 'True') && (
                  <span className="ml-auto text-green-600 text-sm font-medium">✓ {currentLang === 'en-US' ? 'Correct' : '正确答案'}</span>
                )}
              </div>
            </div>
            <div className={`p-3 rounded-lg border-2 ${
              showAnswer && (displayCorrectAnswer === 'false' || displayCorrectAnswer === '错误' || displayCorrectAnswer === 'False')
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${
                  showAnswer && (displayCorrectAnswer === 'false' || displayCorrectAnswer === '错误' || displayCorrectAnswer === 'False') ? 'text-green-700' : 'text-gray-700'
                }`}>
                  ○
                </span>
                <span className={
                  showAnswer && (displayCorrectAnswer === 'false' || displayCorrectAnswer === '错误' || displayCorrectAnswer === 'False') ? 'text-green-900' : 'text-gray-900'
                }>
                  {currentLang === 'en-US' ? 'False' : '错误'}
                </span>
                {showAnswer && (displayCorrectAnswer === 'false' || displayCorrectAnswer === '错误' || displayCorrectAnswer === 'False') && (
                  <span className="ml-auto text-green-600 text-sm font-medium">✓ {currentLang === 'en-US' ? 'Correct' : '正确答案'}</span>
                )}
              </div>
            </div>
            {showAnswer && displayCorrectAnswer && (
              <div className="mt-3 p-3 bg-green-100 border-2 border-green-300 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-green-700 font-semibold">✓ {currentLang === 'en-US' ? 'Correct Answer:' : '正确答案：'}</span>
                  <span className="text-green-900 font-medium">{displayCorrectAnswer}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Explanation */}
      {showAnswer && displayExplanation && (
        <div className="mt-4 ml-11 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex gap-2">
            <span className="text-blue-700 font-medium">💡</span>
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">
                {currentLang === 'en-US' ? 'Explanation' : '解析'}
              </p>
              <p className="text-sm text-blue-800">{displayExplanation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionPreview;
