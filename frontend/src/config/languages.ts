// 多语言配置
export interface LanguageConfig {
  // 基本信息
  examCompleted: string;
  congratulations: string;
  unfortunately: string;
  passMessage: string;
  failMessage: string;
  
  // 统计信息
  scoreRate: string;
  correctAnswers: string;
  totalQuestions: string;
  timeUsed: string;
  
  // 按钮
  backToHome: string;
  detailedAnalysis: string;
  printReport: string;
  reviewQuestions: string;
  
  // 详细分析
  performanceAnalysis: string;
  answeringSituation: string;
  correctQuestions: string;
  incorrectQuestions: string;
  timeAnalysis: string;
  fastestAnswer: string;
  slowestAnswer: string;
  wrongAnswersReview: string;
  timeUsedLabel: string;
  correctAnswer: string;
  yourAnswer: string;
  explanation: string;
  
  // 学习建议
  learningRecommendations: string;
  excellent: string;
  good: string;
  pass: string;
  needImprovement: string;
  focusOn: string;
  timeManagement: string;
  efficiencyImprovement: string;
  
  // 建议内容
  excellentAdvice: string;
  goodAdvice: string;
  passAdvice: string;
  failAdvice: string;
  wrongAnswersAdvice: string;
  fastAnswerAdvice: string;
  slowAnswerAdvice: string;
  
  // 其他
  autoSaved: string;
  thankYou: string;
  loading: string;
  
  // 时间格式
  hours: string;
  minutes: string;
  seconds: string;
}

export const zhConfig: LanguageConfig = {
  // 基本信息
  examCompleted: "考试完成！",
  congratulations: "恭喜您通过了考试",
  unfortunately: "很遗憾，您未能通过考试",
  passMessage: "您的得分为 {percentage}%，已达到及格标准（60%）。感谢您的参与！",
  failMessage: "您的得分为 {percentage}%，未达到及格标准（60%）。建议您复习相关知识后重新参加考试。",
  
  // 统计信息
  scoreRate: "得分率",
  correctAnswers: "正确题数",
  totalQuestions: "总题数",
  timeUsed: "用时",
  
  // 按钮
  backToHome: "返回首页",
  detailedAnalysis: "详细分析",
  printReport: "打印成绩单",
  reviewQuestions: "查看题目回顾",
  
  // 详细分析
  performanceAnalysis: "📊 成绩分析",
  answeringSituation: "答题情况",
  correctQuestions: "正确题目",
  incorrectQuestions: "错误题目",
  timeAnalysis: "时间分析",
  fastestAnswer: "最快答题",
  slowestAnswer: "最慢答题",
  wrongAnswersReview: "❌ 错题回顾",
  timeUsedLabel: "用时",
  correctAnswer: "✓ 正确答案",
  yourAnswer: "✗ 您的答案",
  explanation: "解析：",
  
  // 学习建议
  learningRecommendations: "💡 学习建议",
  excellent: "优秀！",
  good: "良好！",
  pass: "及格！",
  needImprovement: "需要加强！",
  focusOn: "重点关注：",
  timeManagement: "时间管理：",
  efficiencyImprovement: "效率提升：",
  
  // 建议内容
  excellentAdvice: "您的表现非常出色，继续保持这种学习状态。",
  goodAdvice: "您已经掌握了大部分内容，建议重点复习错题部分。",
  passAdvice: "还有提升空间，建议系统性地复习相关知识点。",
  failAdvice: "建议重新学习相关内容，并多做练习题。",
  wrongAnswersAdvice: "您在 {count} 道题目上出现了错误，建议重点复习这些知识点。",
  fastAnswerAdvice: "您的答题速度较快，建议在保证准确率的前提下适当放慢节奏，仔细审题。",
  slowAnswerAdvice: "建议提高答题效率，加强对知识点的熟练掌握。",
  
  // 其他
  autoSaved: "考试结果已自动保存，感谢您的参与",
  thankYou: "感谢您的参与",
  loading: "加载中...",
  
  // 时间格式
  hours: "小时",
  minutes: "分钟",
  seconds: "秒"
};

export const enConfig: LanguageConfig = {
  // 基本信息
  examCompleted: "Exam Completed!",
  congratulations: "Congratulations! You passed the exam",
  unfortunately: "Unfortunately, you did not pass the exam",
  passMessage: "Your score is {percentage}%, which meets the passing standard (60%). Thank you for your participation!",
  failMessage: "Your score is {percentage}%, which does not meet the passing standard (60%). We recommend reviewing the relevant knowledge before retaking the exam.",
  
  // 统计信息
  scoreRate: "Score Rate",
  correctAnswers: "Correct Answers",
  totalQuestions: "Total Questions",
  timeUsed: "Time Used",
  
  // 按钮
  backToHome: "Back to Home",
  detailedAnalysis: "Detailed Analysis",
  printReport: "Print Report",
  reviewQuestions: "Review Questions",
  
  // 详细分析
  performanceAnalysis: "📊 Performance Analysis",
  answeringSituation: "Answering Situation",
  correctQuestions: "Correct Questions",
  incorrectQuestions: "Incorrect Questions",
  timeAnalysis: "Time Analysis",
  fastestAnswer: "Fastest Answer",
  slowestAnswer: "Slowest Answer",
  wrongAnswersReview: "❌ Wrong Answers Review",
  timeUsedLabel: "Time Used",
  correctAnswer: "✓ Correct Answer",
  yourAnswer: "✗ Your Answer",
  explanation: "Explanation:",
  
  // 学习建议
  learningRecommendations: "💡 Learning Recommendations",
  excellent: "Excellent!",
  good: "Good!",
  pass: "Pass!",
  needImprovement: "Need Improvement!",
  focusOn: "Focus on:",
  timeManagement: "Time Management:",
  efficiencyImprovement: "Efficiency Improvement:",
  
  // 建议内容
  excellentAdvice: "Your performance is outstanding. Keep up this excellent learning attitude.",
  goodAdvice: "You have mastered most of the content. We recommend focusing on reviewing the wrong answers.",
  passAdvice: "There's room for improvement. We recommend systematically reviewing the relevant knowledge points.",
  failAdvice: "We recommend re-learning the relevant content and doing more practice questions.",
  wrongAnswersAdvice: "You made errors on {count} questions. We recommend focusing on reviewing these knowledge points.",
  fastAnswerAdvice: "You answered quickly. We recommend slowing down appropriately while ensuring accuracy and carefully reading the questions.",
  slowAnswerAdvice: "We recommend improving answering efficiency and strengthening your mastery of knowledge points.",
  
  // 其他
  autoSaved: "Exam results have been automatically saved. Thank you for your participation.",
  thankYou: "Thank you for your participation",
  loading: "Loading...",
  
  // 时间格式
  hours: "hours",
  minutes: "minutes",
  seconds: "seconds"
};

// 获取浏览器语言
export const getBrowserLanguage = (): 'zh' | 'en' => {
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith('zh')) {
    return 'zh';
  }
  return 'en';
};

// 获取语言配置
export const getLanguageConfig = (language: 'zh' | 'en' = getBrowserLanguage()): LanguageConfig => {
  return language === 'zh' ? zhConfig : enConfig;
};