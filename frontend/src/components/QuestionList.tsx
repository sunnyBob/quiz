import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Question } from './QuestionPreview';
import QuestionPreview from './QuestionPreview';

interface QuestionListProps {
  questions: Question[];
  onEdit: (question: Question) => void;
  onDelete: (questionId: number) => void;
}

const QuestionList: React.FC<QuestionListProps> = ({ questions, onEdit, onDelete }) => {
  const { i18n } = useTranslation();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // 辅助函数：获取本地化内容
  const getLocalizedContent = (content: string | { [key: string]: string } | undefined): string => {
    if (!content) return '';
    if (typeof content === 'string') return content;
    return content[i18n.language] || content['zh-CN'] || Object.values(content)[0] || '';
  };

  const handleToggleExpand = (questionId: number) => {
    setExpandedId(expandedId === questionId ? null : questionId);
  };

  const handleDeleteClick = (questionId: number) => {
    setDeletingId(questionId);
  };

  const handleConfirmDelete = (questionId: number) => {
    onDelete(questionId);
    setDeletingId(null);
  };

  const handleCancelDelete = () => {
    setDeletingId(null);
  };

  if (questions.length === 0) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
        <div className="text-gray-400 text-5xl mb-4">📝</div>
        <p className="text-gray-600 text-lg font-medium mb-2">暂无题目</p>
        <p className="text-gray-500 text-sm">使用上方的表单添加题目或通过JSON批量导入</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          题目列表 ({questions.length})
        </h3>
      </div>

      {questions.map((question, index) => {
        const isExpanded = expandedId === question.id;
        const isDeleting = deletingId === question.id;

        return (
          <div
            key={question.id}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden"
          >
            {/* Question Header */}
            <div className="p-4 flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                {index + 1}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    question.type === 'CHOICE' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {question.type === 'CHOICE' ? '选择题' : '判断题'}
                  </span>
                </div>
                <p className="text-gray-900 font-medium line-clamp-2">{getLocalizedContent(question.content)}</p>
              </div>

              <div className="flex-shrink-0 flex items-center gap-2">
                <button
                  onClick={() => handleToggleExpand(question.id!)}
                  className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
                >
                  {isExpanded ? '收起' : '展开'}
                </button>
                <button
                  onClick={() => onEdit(question)}
                  className="px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg font-medium"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleDeleteClick(question.id!)}
                  className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium"
                >
                  删除
                </button>
              </div>
            </div>

            {/* Expanded Preview */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <div className="pt-4">
                  <QuestionPreview
                    question={question}
                    showAnswer={true}
                  />
                </div>
              </div>
            )}

            {/* Delete Confirmation */}
            {isDeleting && (
              <div className="px-4 pb-4 border-t border-red-100 bg-red-50">
                <div className="flex items-center justify-between py-3">
                  <p className="text-red-700 font-medium">确认删除这道题目吗？此操作不可恢复。</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleConfirmDelete(question.id!)}
                      className="px-4 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
                    >
                      确认删除
                    </button>
                    <button
                      onClick={handleCancelDelete}
                      className="px-4 py-1.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm"
                    >
                      取消
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default QuestionList;
