import React, { useState } from 'react';
import type { Question } from './QuestionPreview';
import QuestionPreview from './QuestionPreview';

interface JsonImportProps {
  examId: number;
  onImport: (questions: Question[]) => void;
  onCancel: () => void;
}

const JsonImport: React.FC<JsonImportProps> = ({ examId, onImport, onCancel }) => {
  const [jsonText, setJsonText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<Question[] | null>(null);
  const [error, setError] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  const exampleJson = `[
  {
    "type": "CHOICE",
    "content": {
      "zh-CN": "JavaScript中哪个方法用于数组遍历？",
      "en-US": "Which method is used for array iteration in JavaScript?"
    },
    "options": {
      "zh-CN": ["forEach", "while", "if", "switch"],
      "en-US": ["forEach", "while", "if", "switch"]
    },
    "correct_answer": "A",
    "explanation": {
      "zh-CN": "forEach是数组的遍历方法",
      "en-US": "forEach is the array iteration method"
    }
  },
  {
    "type": "TRUE_FALSE",
    "content": {
      "zh-CN": "JavaScript是一种强类型语言",
      "en-US": "JavaScript is a strongly typed language"
    },
    "correct_answer": "false",
    "explanation": {
      "zh-CN": "JavaScript是弱类型语言",
      "en-US": "JavaScript is a weakly typed language"
    }
  }
]`;

  const validateQuestion = (q: any, index: number): string | null => {
    if (!q.type || !['CHOICE', 'TRUE_FALSE'].includes(q.type)) {
      return `题目 ${index + 1}: type必须是CHOICE或TRUE_FALSE`;
    }
    
    // Content validation: 支持字符串或多语言对象
    const isContentString = typeof q.content === 'string';
    const isContentObject = typeof q.content === 'object' && q.content !== null;
    
    if (!q.content) {
      return `题目 ${index + 1}: content不能为空`;
    }
    
    if (!isContentString && !isContentObject) {
      return `题目 ${index + 1}: content必须是字符串或多语言对象 (如 {"zh-CN": "...", "en-US": "..."})`;
    }
    
    if (isContentObject) {
      const hasZh = q.content['zh-CN'] && typeof q.content['zh-CN'] === 'string' && q.content['zh-CN'].trim();
      const hasEn = q.content['en-US'] && typeof q.content['en-US'] === 'string' && q.content['en-US'].trim();
      if (!hasZh && !hasEn) {
        return `题目 ${index + 1}: content对象至少需要包含 zh-CN 或 en-US 字段且不能为空`;
      }
    } else if (!q.content.trim()) {
      return `题目 ${index + 1}: content字符串不能为空`;
    }
    
    if (q.type === 'CHOICE') {
      // Options validation: 支持数组或多语言对象
      const isOptionsArray = Array.isArray(q.options);
      const isOptionsObject = typeof q.options === 'object' && !Array.isArray(q.options);
      
      if (!q.options) {
        return `题目 ${index + 1}: 选择题必须有options字段`;
      }
      
      if (!isOptionsArray && !isOptionsObject) {
        return `题目 ${index + 1}: options必须是数组或多语言对象`;
      }
      
      if (isOptionsArray) {
        if (q.options.length < 2) {
          return `题目 ${index + 1}: 选择题必须有至少2个选项`;
        }
      } else {
        const hasZhOptions = Array.isArray(q.options['zh-CN']) && q.options['zh-CN'].length >= 2;
        const hasEnOptions = Array.isArray(q.options['en-US']) && q.options['en-US'].length >= 2;
        if (!hasZhOptions && !hasEnOptions) {
          return `题目 ${index + 1}: options对象至少需要包含 zh-CN 或 en-US 数组且至少有2个选项`;
        }
      }
      
      if (!q.correct_answer || !['A', 'B', 'C', 'D'].includes(q.correct_answer)) {
        return `题目 ${index + 1}: 选择题的correct_answer必须是A、B、C或D`;
      }
      
      // Validate answer index
      if (isOptionsArray) {
        const answerIndex = q.correct_answer.charCodeAt(0) - 65;
        if (answerIndex >= q.options.length) {
          return `题目 ${index + 1}: 正确答案${q.correct_answer}超出选项范围`;
        }
      }
    } else {
      if (!['true', 'false'].includes(q.correct_answer)) {
        return `题目 ${index + 1}: 判断题的correct_answer必须是true或false`;
      }
    }
    return null;
  };

  const handleParse = () => {
    setError('');
    setParsedQuestions(null);
    setShowPreview(false);

    if (!jsonText.trim()) {
      setError('请输入JSON内容');
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      
      if (!Array.isArray(parsed)) {
        setError('JSON格式错误：必须是数组格式');
        return;
      }

      if (parsed.length === 0) {
        setError('题目列表不能为空');
        return;
      }

      // Validate each question
      for (let i = 0; i < parsed.length; i++) {
        const validationError = validateQuestion(parsed[i], i);
        if (validationError) {
          setError(validationError);
          return;
        }
      }

      // Add exam_id to each question
      const questionsWithExamId = parsed.map(q => {
        const questionData: any = {
          ...q,
          exam_id: examId
        };
        
        // For TRUE_FALSE questions without options, add default options based on content format
        if (q.type === 'TRUE_FALSE' && !q.options) {
          if (typeof q.content === 'string') {
            // Single language format
            questionData.options = ['正确', '错误'];
          } else {
            // Multi-language format
            questionData.options = {
              'zh-CN': ['正确', '错误'],
              'en-US': ['True', 'False']
            };
          }
        }
        
        return questionData;
      });

      setParsedQuestions(questionsWithExamId);
      setShowPreview(true);
    } catch (e) {
      setError(`JSON解析失败: ${e instanceof Error ? e.message : '未知错误'}`);
    }
  };

  const handleConfirmImport = () => {
    if (parsedQuestions) {
      onImport(parsedQuestions);
    }
  };

  const handleUseExample = () => {
    setJsonText(exampleJson);
    setError('');
    setParsedQuestions(null);
    setShowPreview(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">JSON批量导入题目</h3>
        <button
          onClick={handleUseExample}
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          使用示例格式
        </button>
      </div>

      {!showPreview ? (
        <>
          {/* JSON Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              JSON内容
            </label>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              rows={12}
              placeholder="请粘贴JSON格式的题目数据..."
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Format Guide */}
          <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm font-medium text-gray-900 mb-2">JSON格式说明：</p>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>必须是数组格式，包含多个题目对象</li>
              <li><code className="bg-gray-200 px-1 rounded">type</code>: "CHOICE"（选择题）或 "TRUE_FALSE"（判断题）</li>
              <li><code className="bg-gray-200 px-1 rounded">content</code>: 题目内容（字符串或多语言对象 {`{"zh-CN": "...", "en-US": "..."}`}）</li>
              <li><code className="bg-gray-200 px-1 rounded">options</code>: 选项（数组或多语言对象，选择题必填，至少2个）</li>
              <li><code className="bg-gray-200 px-1 rounded">correct_answer</code>: 正确答案（选择题: A/B/C/D，判断题: true/false）</li>
              <li><code className="bg-gray-200 px-1 rounded">explanation</code>: 答案解析（可选，支持字符串或多语言对象）</li>
              <li>💡 <strong>双语支持：</strong>使用多语言对象格式可同时提供中英文内容</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleParse}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
            >
              解析JSON
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              取消
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Preview */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-700">
                成功解析 <span className="font-semibold text-blue-600">{parsedQuestions?.length}</span> 道题目，请确认后导入：
              </p>
              <button
                onClick={() => setShowPreview(false)}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                返回编辑
              </button>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
              {parsedQuestions?.map((question, index) => (
                <QuestionPreview
                  key={index}
                  question={question}
                  questionNumber={index + 1}
                  showAnswer={true}
                />
              ))}
            </div>
          </div>

          {/* Confirm Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleConfirmImport}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
            >
              确认导入 {parsedQuestions?.length} 道题目
            </button>
            <button
              onClick={() => setShowPreview(false)}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              返回编辑
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              取消导入
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default JsonImport;
