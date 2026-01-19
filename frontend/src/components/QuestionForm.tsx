import React, { useState, useEffect } from 'react';
import type { Question } from './QuestionPreview';

interface QuestionFormProps {
  examId: number;
  editingQuestion?: Question | null;
  onSave: (question: Question) => void;
  onCancel: () => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({
  examId,
  editingQuestion,
  onSave,
  onCancel,
}) => {
  const [type, setType] = useState<'CHOICE' | 'TRUE_FALSE'>(
    editingQuestion?.type || 'CHOICE'
  );
  
  // Helper to extract string content from potentially bilingual fields
  const getStringValue = (val: string | { [key: string]: string } | undefined): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    return val['zh-CN'] || Object.values(val)[0] || '';
  };
  
  const getOptionsValue = (val: string[] | { [key: string]: string[] } | undefined): string[] => {
    if (!val) return ['', '', '', ''];
    if (Array.isArray(val)) return val;
    return val['zh-CN'] || Object.values(val)[0] || ['', '', '', ''];
  };

  const [content, setContent] = useState<string>(getStringValue(editingQuestion?.content));
  const [options, setOptions] = useState<string[]>(
    getOptionsValue(editingQuestion?.options)
  );
  const [correctAnswer, setCorrectAnswer] = useState<string>(
    getStringValue(editingQuestion?.correct_answer)
  );
  const [explanation, setExplanation] = useState<string>(
    getStringValue(editingQuestion?.explanation)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingQuestion) {
      setType(editingQuestion.type);
      setContent(getStringValue(editingQuestion.content));
      setOptions(getOptionsValue(editingQuestion.options));
      setCorrectAnswer(getStringValue(editingQuestion.correct_answer));
      setExplanation(getStringValue(editingQuestion.explanation));
    }
  }, [editingQuestion]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!content.trim()) {
      newErrors.content = '题目内容不能为空';
    }

    if (type === 'CHOICE') {
      const filledOptions = options.filter(opt => opt.trim());
      if (filledOptions.length < 2) {
        newErrors.options = '至少需要填写2个选项';
      }
      if (!correctAnswer) {
        newErrors.correctAnswer = '请选择正确答案';
      }
      const answerIndex = correctAnswer.charCodeAt(0) - 65; // A=0, B=1, etc.
      if (answerIndex >= 0 && answerIndex < 4 && !options[answerIndex]?.trim()) {
        newErrors.correctAnswer = '正确答案对应的选项不能为空';
      }
    } else {
      if (!correctAnswer) {
        newErrors.correctAnswer = '请选择正确答案';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const question: Question = {
      ...(editingQuestion?.id && { id: editingQuestion.id }),
      exam_id: examId,
      type,
      content: content.trim(),
      options: type === 'CHOICE' ? options : ['正确', '错误'],
      correct_answer: correctAnswer,
      explanation: explanation.trim() || undefined,
    };

    onSave(question);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    if (errors.options) {
      setErrors({ ...errors, options: '' });
    }
  };

  const handleTypeChange = (newType: 'CHOICE' | 'TRUE_FALSE') => {
    setType(newType);
    setCorrectAnswer('');
    if (newType === 'TRUE_FALSE') {
      setOptions(['正确', '错误']);
    } else {
      setOptions(['', '', '', '']);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        {editingQuestion ? '编辑题目' : '添加新题目'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Question Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            题目类型 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="CHOICE"
                checked={type === 'CHOICE'}
                onChange={() => handleTypeChange('CHOICE')}
                className="mr-2"
              />
              <span>选择题</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="TRUE_FALSE"
                checked={type === 'TRUE_FALSE'}
                onChange={() => handleTypeChange('TRUE_FALSE')}
                className="mr-2"
              />
              <span>判断题</span>
            </label>
          </div>
        </div>

        {/* Question Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            题目内容 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (errors.content) setErrors({ ...errors, content: '' });
            }}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.content ? 'border-red-500' : 'border-gray-300'
            }`}
            rows={3}
            placeholder="请输入题目内容"
          />
          {errors.content && (
            <p className="text-red-500 text-sm mt-1">{errors.content}</p>
          )}
        </div>

        {/* Options */}
        {type === 'CHOICE' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选项 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700 w-6">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`选项 ${String.fromCharCode(65 + index)}`}
                  />
                </div>
              ))}
            </div>
            {errors.options && (
              <p className="text-red-500 text-sm mt-1">{errors.options}</p>
            )}
          </div>
        ) : null}

        {/* Correct Answer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            正确答案 <span className="text-red-500">*</span>
          </label>
          {type === 'CHOICE' ? (
            <div className="flex gap-4">
              {['A', 'B', 'C', 'D'].map((label, index) => (
                <label key={label} className="flex items-center">
                  <input
                    type="radio"
                    value={label}
                    checked={correctAnswer === label}
                    onChange={(e) => {
                      setCorrectAnswer(e.target.value);
                      if (errors.correctAnswer) setErrors({ ...errors, correctAnswer: '' });
                    }}
                    disabled={!options[index]?.trim()}
                    className="mr-2"
                  />
                  <span className={!options[index]?.trim() ? 'text-gray-400' : ''}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="true"
                  checked={correctAnswer === 'true'}
                  onChange={(e) => {
                    setCorrectAnswer(e.target.value);
                    if (errors.correctAnswer) setErrors({ ...errors, correctAnswer: '' });
                  }}
                  className="mr-2"
                />
                <span>正确</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="false"
                  checked={correctAnswer === 'false'}
                  onChange={(e) => {
                    setCorrectAnswer(e.target.value);
                    if (errors.correctAnswer) setErrors({ ...errors, correctAnswer: '' });
                  }}
                  className="mr-2"
                />
                <span>错误</span>
              </label>
            </div>
          )}
          {errors.correctAnswer && (
            <p className="text-red-500 text-sm mt-1">{errors.correctAnswer}</p>
          )}
        </div>

        {/* Explanation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            答案解析（可选）
          </label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            placeholder="请输入答案解析"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
          >
            {editingQuestion ? '保存修改' : '添加题目'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuestionForm;
