// API配置
export const API_CONFIG = {
  // 根据环境变量或开发/生产环境设置API基础URL
  // 允许为空字符串（用于相对路径），只有 undefined 时才使用默认值
  BASE_URL: import.meta.env.VITE_API_BASE_URL !== undefined ? import.meta.env.VITE_API_BASE_URL : 'http://localhost:3000',
  
  // 前端应用地址
  FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173',
  
  // API端点
  ENDPOINTS: {
    // 用户相关
    USERS: '/api/users',
    
    // 考试相关
    EXAMS: '/api/exams',
    EXAM_BY_SHARE_ID: (shareId: string) => `/api/exams/${shareId}`,
    EXAM_BY_ID: (examId: number) => `/api/exams/id/${examId}`,
    UPDATE_EXAM: (examId: number) => `/api/exams/${examId}`,
    DELETE_EXAM: (examId: number) => `/api/exams/${examId}`,
    EXAM_QUESTIONS: (examId: number) => `/api/exams/${examId}/questions`,
    ADMIN_EXAM_QUESTIONS: (examId: number) => `/api/admin/exams/${examId}/questions`,
    RESULT_QUESTIONS: (resultId: number) => `/api/results/${resultId}/questions`,
    RESULT_DETAILS: (resultId: number) => `/api/results/${resultId}/details`,
    EXAM_RESULTS: (examId: number) => `/api/exams/${examId}/results`,
    DELETE_RESULT: (resultId: number) => `/api/results/${resultId}`,
    DELETE_EXAM_RESULTS: (examId: number) => `/api/exams/${examId}/results`,
    EXAM_STATS: (examId: number) => `/api/admin/exams/${examId}/stats`,
    EXAM_QUESTIONS_BATCH: (examId: number) => `/api/exams/${examId}/questions/batch`,
    EXPORT_EXAM_CSV: (examId: number) => `/api/exams/${examId}/export-csv`,
    
    // 题目相关
    QUESTIONS: '/api/questions',
    QUESTION_BY_ID: (questionId: number) => `/api/questions/${questionId}`,
    
    // 结果相关
    RESULTS: '/api/results',
    RESULT_BY_ID: (resultId: number) => `/api/results/${resultId}`,
    RESULT_TIME_STATUS: (resultId: number) => `/api/results/${resultId}/time-status`,
    RESULT_ANSWERS: (resultId: number) => `/api/results/${resultId}/answers`,
    RESULT_PROGRESS: (resultId: number) => `/api/results/${resultId}/progress`,
    RESULT_QUESTION_PROGRESS: (resultId: number, questionId: number) => 
      `/api/results/${resultId}/questions/${questionId}/progress`,
    
    // 答案相关
    ANSWERS: '/api/answers'
  }
};

// 构建完整的API URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// 常用的API URL构建函数
export const apiUrls = {
  // 用户
  createUser: () => buildApiUrl(API_CONFIG.ENDPOINTS.USERS),
  
  // 考试
  getAllExams: () => buildApiUrl(API_CONFIG.ENDPOINTS.EXAMS),
  createExam: () => buildApiUrl(API_CONFIG.ENDPOINTS.EXAMS),
  getExamByShareId: (shareId: string) => buildApiUrl(API_CONFIG.ENDPOINTS.EXAM_BY_SHARE_ID(shareId)),
  getExamById: (examId: number) => buildApiUrl(API_CONFIG.ENDPOINTS.EXAM_BY_ID(examId)),
  updateExam: (examId: number) => buildApiUrl(API_CONFIG.ENDPOINTS.UPDATE_EXAM(examId)),
  deleteExam: (examId: number) => buildApiUrl(API_CONFIG.ENDPOINTS.DELETE_EXAM(examId)),
  getExamQuestions: (examId: number) => buildApiUrl(API_CONFIG.ENDPOINTS.EXAM_QUESTIONS(examId)),
  getAdminExamQuestions: (examId: number) => buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_EXAM_QUESTIONS(examId)),
  getExamStats: (examId: number) => buildApiUrl(API_CONFIG.ENDPOINTS.EXAM_STATS(examId)),
  batchImportQuestions: (examId: number) => buildApiUrl(API_CONFIG.ENDPOINTS.EXAM_QUESTIONS_BATCH(examId)),
  
  // 题目
  createQuestion: () => buildApiUrl(API_CONFIG.ENDPOINTS.QUESTIONS),
  updateQuestion: (questionId: number) => buildApiUrl(API_CONFIG.ENDPOINTS.QUESTION_BY_ID(questionId)),
  deleteQuestion: (questionId: number) => buildApiUrl(API_CONFIG.ENDPOINTS.QUESTION_BY_ID(questionId)),
  
  // 结果
  createResult: () => buildApiUrl(API_CONFIG.ENDPOINTS.RESULTS),
  getResultById: (resultId: number) => buildApiUrl(API_CONFIG.ENDPOINTS.RESULT_BY_ID(resultId)),
  getResultTimeStatus: (resultId: number) => buildApiUrl(API_CONFIG.ENDPOINTS.RESULT_TIME_STATUS(resultId)),
  updateResult: (resultId: number) => buildApiUrl(API_CONFIG.ENDPOINTS.RESULT_BY_ID(resultId)),
  getResultAnswers: (resultId: number) => buildApiUrl(API_CONFIG.ENDPOINTS.RESULT_ANSWERS(resultId)),
  getResultProgress: (resultId: number) => buildApiUrl(API_CONFIG.ENDPOINTS.RESULT_PROGRESS(resultId)),
  updateResultProgress: (resultId: number) => buildApiUrl(API_CONFIG.ENDPOINTS.RESULT_PROGRESS(resultId)),
  updateQuestionProgress: (resultId: number, questionId: number) => 
    buildApiUrl(API_CONFIG.ENDPOINTS.RESULT_QUESTION_PROGRESS(resultId, questionId)),
  
  // 答案
  saveAnswer: () => buildApiUrl(API_CONFIG.ENDPOINTS.ANSWERS),
  
  // 安全的结果详情
  getResultDetails: (resultId: number) => buildApiUrl(API_CONFIG.ENDPOINTS.RESULT_DETAILS(resultId)),
  
  // 考试记录管理
  getExamResults: (examId: number) => buildApiUrl(API_CONFIG.ENDPOINTS.EXAM_RESULTS(examId)),
  deleteResult: (resultId: number) => buildApiUrl(API_CONFIG.ENDPOINTS.DELETE_RESULT(resultId)),
  deleteExamResults: (examId: number) => buildApiUrl(API_CONFIG.ENDPOINTS.DELETE_EXAM_RESULTS(examId)),
  exportExamCsv: (examId: number) => buildApiUrl(API_CONFIG.ENDPOINTS.EXPORT_EXAM_CSV(examId))
};

// 构建分享链接
export const buildShareUrl = (shareId: string): string => {
  return `${API_CONFIG.FRONTEND_URL}/quiz/${shareId}`;
};