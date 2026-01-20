import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import QuestionForm from '../components/BilingualQuestionForm';
import JsonImport from '../components/JsonImport';
import QuestionList from '../components/QuestionList';
import NotificationContainer from '../components/NotificationContainer';
import { useNotification } from '../hooks/useNotification';
import type { Question } from '../components/QuestionPreview';
import { apiUrls, buildShareUrl } from '../config/api';

interface Exam {
  id: number;
  title: string;
  description?: string;
  share_link_id?: string;
}

const QuestionManagementPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { notifications, removeNotification, showSuccess, showError } = useNotification();
  
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'add' | 'edit' | 'import' | 'json'>('list');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  useEffect(() => {
    fetchExamAndQuestions();
  }, [examId]);

  const fetchExamAndQuestions = async () => {
    try {
      setLoading(true);
      const [examRes, questionsRes] = await Promise.all([
        axios.get(apiUrls.getExamById(Number(examId))),
        axios.get(apiUrls.getAdminExamQuestions(Number(examId)))
      ]);
      setExam(examRes.data);
      setQuestions(questionsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('加载数据失败');
    } finally {
      setLoading(false);
    }
  };


  const handleSaveQuestion = async (question: Partial<Question>) => {
    try {
      if (question.id) {
        // Update existing question
        await axios.put(apiUrls.updateQuestion(question.id), question);
        showSuccess('题目更新成功');
      } else {
        // Create new question
        await axios.post(apiUrls.createQuestion(), question);
        showSuccess('题目添加成功');
      }
      await fetchExamAndQuestions();
      setMode('list');
      setEditingQuestion(null);
    } catch (error) {
      console.error('Error saving question:', error);
      showError('保存题目失败');
    }
  };

  const handleImportQuestions = async (questions: Question[]) => {
    try {
      await axios.post(apiUrls.batchImportQuestions(Number(examId)), { questions });
      showSuccess(`成功导入 ${questions.length} 道题目`);
      await fetchExamAndQuestions();
      setMode('list');
    } catch (error) {
      console.error('Error importing questions:', error);
      showError('批量导入失败');
    }
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setMode('edit');
  };

  const handleDeleteQuestion = async (questionId: number) => {
    try {
      await axios.delete(apiUrls.deleteQuestion(questionId));
      showSuccess('题目删除成功');
      await fetchExamAndQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      showError('删除题目失败');
    }
  };

  const handleCancel = () => {
    setMode('list');
    setEditingQuestion(null);
  };

  const handleExportJson = () => {
    // Export questions as JSON
    const jsonStr = JSON.stringify(questions, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exam_${examId}_questions_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess('JSON导出成功');
  };

  const handleViewJson = () => {
    setMode('json');
  };

  // 创建一个用于显示的JSON，包含所有字段
  const getDisplayJson = () => {
    return questions.map(q => ({
      id: q.id,
      exam_id: q.exam_id,
      type: q.type,
      content: q.content,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
    }));
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isAdmin');
    navigate('/admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">考卷不存在</p>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            返回管理后台
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/manage')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← 返回考卷管理
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
              <p className="text-sm text-gray-600 mt-1">题目管理</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            退出登录
          </button>
        </div>
      </header>


      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Action Buttons - Always visible */}
        <div className="mb-6 flex gap-3 sticky top-20 bg-gray-50 py-2 z-10">
          <button
            onClick={() => setMode('add')}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium shadow-md"
          >
            + 添加单题
          </button>
          <button
            onClick={() => setMode('import')}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium shadow-md"
          >
            📥 JSON批量导入
          </button>
          {questions.length > 0 && (
            <>
              <button
                onClick={handleViewJson}
                className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium shadow-md"
              >
                📄 查看JSON
              </button>
              <button
                onClick={handleExportJson}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium shadow-md"
              >
                📤 导出JSON
              </button>
            </>
          )}
          {mode !== 'list' && (
            <button
              onClick={handleCancel}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              返回列表
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {mode === 'add' && (
            <QuestionForm
              examId={Number(examId)}
              onSave={handleSaveQuestion}
              onCancel={handleCancel}
            />
          )}

          {mode === 'edit' && editingQuestion && (
            <QuestionForm
              examId={Number(examId)}
              editingQuestion={editingQuestion}
              onSave={handleSaveQuestion}
              onCancel={handleCancel}
            />
          )}

          {mode === 'import' && (
            <JsonImport
              examId={Number(examId)}
              onImport={handleImportQuestions}
              onCancel={handleCancel}
            />
          )}

          {mode === 'json' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">JSON 格式试题</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(JSON.stringify(getDisplayJson(), null, 2));
                        showSuccess('已复制到剪贴板');
                      } else {
                        showError('您的浏览器不支持剪贴板功能，请使用 HTTPS 访问或手动复制');
                      }
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                  >
                    📋 复制JSON
                  </button>
                  <button
                    onClick={handleExportJson}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                  >
                    💾 下载JSON
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    共 {questions.length} 道题目 | 文件名: exam_{examId}_questions.json
                  </p>
                </div>
                <pre className="text-sm text-gray-800 overflow-x-auto whitespace-pre-wrap break-words max-h-[600px] overflow-y-auto">
                  {JSON.stringify(getDisplayJson(), null, 2)}
                </pre>
              </div>

              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">使用说明</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 可直接复制此JSON用于备份或迁移</li>
                  <li>• 可下载为JSON文件保存到本地</li>
                  <li>• 使用"JSON批量导入"功能可将此格式的数据导入到其他考卷</li>
                  <li>• <strong>包含完整数据</strong>：题目ID、类型、中英双语内容、选项、<span className="text-green-700 font-semibold">正确答案</span>和解析</li>
                </ul>
              </div>
            </div>
          )}

          {/* Always show question list */}
          {mode === 'list' && (
            <div>
              {questions.length === 0 ? (
                <div className="bg-white p-12 rounded-lg border-2 border-dashed border-gray-300 text-center">
                  <p className="text-gray-500 text-lg mb-4">还没有添加题目</p>
                  <p className="text-gray-400 mb-6">点击上方按钮开始添加题目</p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setMode('add')}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
                    >
                      + 添加单题
                    </button>
                    <button
                      onClick={() => setMode('import')}
                      className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                    >
                      📥 JSON批量导入
                    </button>
                  </div>
                </div>
              ) : (
                <QuestionList
                  questions={questions}
                  onEdit={handleEditQuestion}
                  onDelete={handleDeleteQuestion}
                />
              )}
            </div>
          )}
        </div>

        {/* Summary Footer */}
        {mode === 'list' && questions.length > 0 && (
          <div className="mt-8 p-6 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">
                  共 <span className="text-2xl font-bold text-blue-600">{questions.length}</span> 道题目
                </p>
                {exam.share_link_id && (
                  <p className="text-sm text-gray-500 mt-1">
                    分享链接: {buildShareUrl(exam.share_link_id || '')}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setMode('add')}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
                >
                  + 继续添加
                </button>
                <button
                  onClick={() => navigate('/admin/manage')}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium"
                >
                  返回考卷管理
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  );
};

export default QuestionManagementPage;
