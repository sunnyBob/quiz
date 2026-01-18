import React from 'react';
import { useTranslation } from 'react-i18next';

interface ExamGuidelinesDialogProps {
  isOpen: boolean;
  examTitle: string;
  timeLimit: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const ExamGuidelinesDialog: React.FC<ExamGuidelinesDialogProps> = ({
  isOpen,
  examTitle,
  timeLimit,
  onConfirm,
  onCancel
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-4 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <h2 className="text-xl font-bold">
                {t('guidelines.title')}
              </h2>
              <p className="text-sm text-blue-100 mt-1">
                {examTitle}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          {/* 考试时间 - 最重要的信息 */}
          {timeLimit > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <svg className="w-8 h-8 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-red-800 font-medium mb-1">
                    {t('guidelines.examTime')}
                  </p>
                  <p className="text-2xl font-bold text-red-900">
                    {timeLimit} {t('examEditor.minutes')}
                  </p>
                  <p className="text-sm text-red-700 mt-2">
                    {t('guidelines.rule1.desc2')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 核心规则 - 简化版 */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-gray-900 mb-1">
                  {t('guidelines.rule1.title')}
                </p>
                <p className="text-sm text-gray-600">
                  {t('guidelines.rule1.desc3')}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-gray-900 mb-1">
                  {t('guidelines.rule4.title')}
                </p>
                <p className="text-sm text-gray-600">
                  {t('guidelines.rule4.desc')}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                  <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-gray-900 mb-1">
                  {t('guidelines.rule5.title')}
                </p>
                <p className="text-sm text-gray-600">
                  {t('guidelines.rule5.desc')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-between items-center border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('guidelines.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
          >
            {t('guidelines.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamGuidelinesDialog;
