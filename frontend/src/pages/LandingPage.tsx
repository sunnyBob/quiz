import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const LandingPage: React.FC = () => {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleStart = async () => {
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      // Create User
      const userRes = await axios.post('http://localhost:3000/api/users', {
        name: name.trim(),
      });
      const userId = userRes.data.id;

      // Get Exam ID from Share ID
      const examRes = await axios.get(
        `http://localhost:3000/api/exams/${shareId}`
      );
      const examId = examRes.data.id;

      // Init Session
      const sessionRes = await axios.post('http://localhost:3000/api/results', {
        userId,
        examId,
      });
      const resultId = sessionRes.data.resultId;

      navigate(`/quiz/${shareId}/take`, { state: { userId, resultId, examId } });
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert('启动考试失败，请检查考试ID或网络连接');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleStart();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">在线考试系统</h1>
          <p className="text-lg text-gray-600 mb-2">欢迎参加考试</p>
          <p className="text-sm text-gray-500">考试ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{shareId}</span></p>
        </div>

        <div className="card">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                请输入您的姓名
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                className="input-field text-lg"
                placeholder="请输入真实姓名"
                disabled={isLoading}
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-2">
                * 请输入真实姓名，考试结果将以此记录
              </p>
            </div>

            <button
              onClick={handleStart}
              disabled={!name.trim() || isLoading}
              className="btn-primary w-full text-lg py-3"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  正在进入考试...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  开始考试
                </div>
              )}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">考试须知</h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• 考试过程中请勿刷新页面或关闭浏览器</li>
                <li>• 每题答题后将立即显示正确答案和解析</li>
                <li>• 系统会自动记录您的答题时间</li>
                <li>• 请在安静的环境中完成考试</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;