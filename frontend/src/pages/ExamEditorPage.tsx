import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ExamEditorPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!title.trim()) return;

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:3000/api/exams', {
        title: title.trim(),
        description: description.trim(),
      });

      // Show success message with exam ID
      const examId = res.data.id;
      alert(`考卷创建成功！\n考卷ID: ${examId}\n请记住此ID，用于添加题目和分享`);

      // Reset form
      setTitle('');
      setDescription('');
    } catch (err) {
      console.error(err);
      alert('创建考卷失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">考试管理系统</h1>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="btn-secondary"
              >
                查看统计
              </button>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">创建新考卷</h2>
          <p className="text-gray-600">填写考卷基本信息，创建后可添加题目</p>
        </div>

        <div className="card">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                考卷标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="input-field"
                placeholder="请输入考卷标题，如：JavaScript基础知识测试"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                {title.length}/100 字符
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                考卷描述
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="input-field h-24 resize-none"
                placeholder="请输入考卷描述，如：本测试包含JavaScript基础语法、DOM操作等内容"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {description.length}/500 字符
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-blue-900 mb-1">创建流程说明</h3>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>1. 填写考卷基本信息并创建</li>
                    <li>2. 记录生成的考卷ID</li>
                    <li>3. 使用API添加题目到考卷中</li>
                    <li>4. 分享考卷链接给考生</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleCreate}
                disabled={!title.trim() || loading}
                className="btn-primary flex-1"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    创建中...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    创建考卷
                  </div>
                )}
              </button>

              <button
                onClick={() => navigate('/admin/dashboard')}
                className="btn-secondary"
              >
                取消
              </button>
            </div>
          </div>
        </div>

        {/* API Usage Guide */}
        <div className="mt-8 card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">API 使用指南</h3>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">添加题目到考卷</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <code className="text-sm text-gray-800">
                  POST /api/questions<br/>
                  Content-Type: application/json<br/><br/>
                  {JSON.stringify({
                    exam_id: "考卷ID",
                    type: "CHOICE",
                    content: "题目内容",
                    options: ["选项A", "选项B", "选项C", "选项D"],
                    correct_answer: "选项A",
                    explanation: "答案解析"
                  }, null, 2)}
                </code>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">考卷分享链接格式</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <code className="text-sm text-gray-800">
                  http://localhost:5173/quiz/[share_link_id]
                </code>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                share_link_id 在创建考卷时自动生成
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamEditorPage;