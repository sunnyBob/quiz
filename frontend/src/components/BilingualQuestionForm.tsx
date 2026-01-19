import React, { useState, useEffect } from 'react';
import type { Question } from './QuestionPreview';

interface QuestionFormProps {
  examId: number;
  editingQuestion?: Question | null;
  onSave: (question: Partial<Question>) => void;
  onCancel: () => void;
}

// 多语言内容结构
interface BilingualContent {
  'zh-CN': string;
  'en-US': string;
}

interface BilingualOptions {
  'zh-CN': string[];
  'en-US': string[];
}

const BilingualQuestionForm: React.FC<QuestionFormProps> = ({
  examId,
  editingQuestion,
  onSave,
  onCancel,
}) => {
  const [type, setType] = useState<'CHOICE' | 'TRUE_FALSE'>(
    editingQuestion?.type || 'CHOICE'
  );

  // 解析现有题目数据（支持旧格式和新格式）
  const parseContent = (content: any): BilingualContent => {
    if (typeof content === 'string') {
      return { 'zh-CN': content, 'en-US': '' };
    }
    return {
      'zh-CN': content?.['zh-CN'] || '',
      'en-US': content?.['en-US'] || ''
    };
  };

  const parseOptions = (options: any): BilingualOptions => {
    if (Array.isArray(options)) {
      return {
        'zh-CN': options,
        'en-US': ['', '', '', '']
      };
    }
    return {
      'zh-CN': options?.['zh-CN'] || ['', '', '', ''],
      'en-US': options?.['en-US'] || ['', '', '', '']
    };
  };

  const [contentZh, setContentZh] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [optionsZh, setOptionsZh] = useState<string[]>(['', '', '', '']);
  const [optionsEn, setOptionsEn] = useState<string[]>(['', '', '', '']);
  const [correctAnswerZh, setCorrectAnswerZh] = useState('');
  const [correctAnswerEn, setCorrectAnswerEn] = useState('');
  const [explanationZh, setExplanationZh] = useState('');
  const [explanationEn, setExplanationEn] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingQuestion) {
      setType(editingQuestion.type);
      
      const content = parseContent(editingQuestion.content);
      setContentZh(content['zh-CN']);
      setContentEn(content['en-US']);

      const options = parseOptions(editingQuestion.options);
      setOptionsZh(options['zh-CN']);
      setOptionsEn(options['en-US']);

      const correctAnswer = parseContent(editingQuestion.correct_answer);
      setCorrectAnswerZh(correctAnswer['zh-CN']);
      setCorrectAnswerEn(correctAnswer['en-US']);

      const explanation = parseContent(editingQuestion.explanation || '');
      setExplanationZh(explanation['zh-CN']);
      setExplanationEn(explanation['en-US']);
    }
  }, [editingQuestion]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 至少需要一种语言的内容
    if (!contentZh.trim() && !contentEn.trim()) {
      newErrors.content = '题目内容至少需要填写一种语言（中文或英文）';
    }

    if (type === 'CHOICE') {
      // 检查中文选项
      if (contentZh.trim()) {
        const filledOptionsZh = optionsZh.filter(opt => opt.trim());
        if (filledOptionsZh.length < 2) {
          newErrors.optionsZh = '中文至少需要填写2个选项';
        }
        if (!correctAnswerZh) {
          newErrors.correctAnswerZh = '请选择中文正确答案';
        }
      }

      // 检查英文选项
      if (contentEn.trim()) {
        const filledOptionsEn = optionsEn.filter(opt => opt.trim());
        if (filledOptionsEn.length < 2) {
          newErrors.optionsEn = '英文至少需要填写2个选项';
        }
        if (!correctAnswerEn) {
          newErrors.correctAnswerEn = '请选择英文正确答案';
        }
      }
    } else {
      // 判断题
      if (contentZh.trim() && !correctAnswerZh) {
        newErrors.correctAnswerZh = '请选择中文正确答案';
      }
      if (contentEn.trim() && !correctAnswerEn) {
        newErrors.correctAnswerEn = '请选择英文正确答案';
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

    // 构建多语言数据
    const question: Partial<Question> = {
      ...(editingQuestion?.id && { id: editingQuestion.id }),
      exam_id: examId,
      type,
      content: {
        'zh-CN': contentZh.trim(),
        'en-US': contentEn.trim()
      } as any,
      options: type === 'CHOICE' 
        ? {
            'zh-CN': optionsZh,
            'en-US': optionsEn
          } as any
        : {
            'zh-CN': ['正确', '错误'],
            'en-US': ['True', 'False']
          } as any,
      correct_answer: {
        'zh-CN': correctAnswerZh,
        'en-US': correctAnswerEn
      } as any,
      explanation: {
        'zh-CN': explanationZh.trim(),
        'en-US': explanationEn.trim()
      } as any,
    };

    onSave(question);
  };

  const handleOptionChange = (index: number, value: string, language: 'zh-CN' | 'en-US') => {
    if (language === 'zh-CN') {
      const newOptions = [...optionsZh];
      newOptions[index] = value;
      setOptionsZh(newOptions);
    } else {
      const newOptions = [...optionsEn];
      newOptions[index] = value;
      setOptionsEn(newOptions);
    }
  };

  const handleTypeChange = (newType: 'CHOICE' | 'TRUE_FALSE') => {
    setType(newType);
    setCorrectAnswerZh('');
    setCorrectAnswerEn('');
    if (newType === 'TRUE_FALSE') {
      setOptionsZh(['正确', '错误']);
      setOptionsEn(['True', 'False']);
    } else {
      setOptionsZh(['', '', '', '']);
      setOptionsEn(['', '', '', '']);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        {editingQuestion ? '编辑题目（双语）' : '添加新题目（双语）'}
      </h3>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
        <p className="text-sm text-blue-800">
          💡 <strong>双语支持说明：</strong>您可以同时填写中文和英文内容，考生将根据其选择的UI语言看到对应版本。至少需要填写一种语言。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Question Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            题目类型 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                checked={type === 'CHOICE'}
                onChange={() => handleTypeChange('CHOICE')}
                className="w-4 h-4 text-primary-600"
              />
              <span>选择题 / Multiple Choice</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                checked={type === 'TRUE_FALSE'}
                onChange={() => handleTypeChange('TRUE_FALSE')}
                className="w-4 h-4 text-primary-600"
              />
              <span>判断题 / True/False</span>
            </label>
          </div>
        </div>

        {/* Bilingual Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chinese Column */}
          <div className="space-y-4 border-r lg:pr-6">
            <h4 className="text-md font-semibold text-gray-800 flex items-center">
              <span className="mr-2">🇨🇳</span> 中文版本
            </h4>

            {/* Chinese Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                题目内容（中文）
              </label>
              <textarea
                value={contentZh}
                onChange={(e) => setContentZh(e.target.value)}
                className="input-field h-24 resize-none"
                placeholder="请输入题目内容..."
              />
            </div>

            {/* Chinese Options */}
            {type === 'CHOICE' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选项（中文）
                </label>
                <div className="space-y-2">
                  {['A', 'B', 'C', 'D'].map((letter, index) => (
                    <input
                      key={letter}
                      type="text"
                      value={optionsZh[index]}
                      onChange={(e) => handleOptionChange(index, e.target.value, 'zh-CN')}
                      className="input-field"
                      placeholder={`选项 ${letter}`}
                    />
                  ))}
                </div>
                {errors.optionsZh && (
                  <p className="text-sm text-red-600 mt-1">{errors.optionsZh}</p>
                )}
              </div>
            )}

            {/* Chinese Correct Answer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                正确答案（中文）
              </label>
              {type === 'CHOICE' ? (
                <select
                  value={correctAnswerZh}
                  onChange={(e) => setCorrectAnswerZh(e.target.value)}
                  className="input-field"
                >
                  <option value="">请选择...</option>
                  {['A', 'B', 'C', 'D'].map((letter, index) => (
                    optionsZh[index]?.trim() && (
                      <option key={letter} value={letter}>
                        {letter}. {optionsZh[index]}
                      </option>
                    )
                  ))}
                </select>
              ) : (
                <select
                  value={correctAnswerZh}
                  onChange={(e) => setCorrectAnswerZh(e.target.value)}
                  className="input-field"
                >
                  <option value="">请选择...</option>
                  <option value="正确">正确</option>
                  <option value="错误">错误</option>
                </select>
              )}
              {errors.correctAnswerZh && (
                <p className="text-sm text-red-600 mt-1">{errors.correctAnswerZh}</p>
              )}
            </div>

            {/* Chinese Explanation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                答案解析（中文，可选）
              </label>
              <textarea
                value={explanationZh}
                onChange={(e) => setExplanationZh(e.target.value)}
                className="input-field h-20 resize-none"
                placeholder="请输入答案解析..."
              />
            </div>
          </div>

          {/* English Column */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-800 flex items-center">
              <span className="mr-2">🇺🇸</span> English Version
            </h4>

            {/* English Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Content (English)
              </label>
              <textarea
                value={contentEn}
                onChange={(e) => setContentEn(e.target.value)}
                className="input-field h-24 resize-none"
                placeholder="Enter question content..."
              />
            </div>

            {/* English Options */}
            {type === 'CHOICE' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options (English)
                </label>
                <div className="space-y-2">
                  {['A', 'B', 'C', 'D'].map((letter, index) => (
                    <input
                      key={letter}
                      type="text"
                      value={optionsEn[index]}
                      onChange={(e) => handleOptionChange(index, e.target.value, 'en-US')}
                      className="input-field"
                      placeholder={`Option ${letter}`}
                    />
                  ))}
                </div>
                {errors.optionsEn && (
                  <p className="text-sm text-red-600 mt-1">{errors.optionsEn}</p>
                )}
              </div>
            )}

            {/* English Correct Answer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correct Answer (English)
              </label>
              {type === 'CHOICE' ? (
                <select
                  value={correctAnswerEn}
                  onChange={(e) => setCorrectAnswerEn(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select...</option>
                  {['A', 'B', 'C', 'D'].map((letter, index) => (
                    optionsEn[index]?.trim() && (
                      <option key={letter} value={letter}>
                        {letter}. {optionsEn[index]}
                      </option>
                    )
                  ))}
                </select>
              ) : (
                <select
                  value={correctAnswerEn}
                  onChange={(e) => setCorrectAnswerEn(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select...</option>
                  <option value="True">True</option>
                  <option value="False">False</option>
                </select>
              )}
              {errors.correctAnswerEn && (
                <p className="text-sm text-red-600 mt-1">{errors.correctAnswerEn}</p>
              )}
            </div>

            {/* English Explanation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Explanation (English, Optional)
              </label>
              <textarea
                value={explanationEn}
                onChange={(e) => setExplanationEn(e.target.value)}
                className="input-field h-20 resize-none"
                placeholder="Enter explanation..."
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errors.content && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{errors.content}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
          >
            取消 / Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
          >
            {editingQuestion ? '保存 / Save' : '添加 / Add'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BilingualQuestionForm;
