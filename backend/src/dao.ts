import pool from './db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// --- Types ---
export interface User {
  id?: number;
  name: string;
  exam_id: number;
}

export interface Exam {
  id?: number;
  title: string;
  description?: string;
  share_link_id?: string;
  language?: string; // 'zh-CN' or 'en-US'
  time_limit_minutes?: number;
  enable_copy_prevention?: boolean;
  enable_watermark?: boolean;
  watermark_text?: string;
}

// Multi-language content types
export type MultiLangContent = {
  [key: string]: string; // e.g., { 'zh-CN': '中文', 'en-US': 'English' }
};

export type MultiLangOptions = {
  [key: string]: string[]; // e.g., { 'zh-CN': ['选项A'], 'en-US': ['Option A'] }
};

export interface Question {
  id?: number;
  exam_id: number;
  type: 'CHOICE' | 'TRUE_FALSE';
  content: string | MultiLangContent; // Support both legacy string and new multi-lang
  options: string[] | MultiLangOptions; // Support both formats
  correct_answer: string | MultiLangContent; // Support both formats
  explanation?: string | MultiLangContent; // Support both formats
}

export interface Result {
  id?: number;
  user_id: number;
  exam_id: number;
  score: number;
  total_questions: number;
  total_duration: number;
  current_question_index?: number;
  status?: 'in_progress' | 'completed' | 'expired';
  started_at?: Date;
  completed_at?: Date;
}

export interface Answer {
  id?: number;
  result_id: number;
  question_id: number;
  user_answer: string;
  is_correct: boolean;
  duration_seconds: number;
  question_order?: number;
  status?: 'answered' | 'skipped' | 'flagged';
}

export interface QuestionProgress {
  id?: number;
  result_id: number;
  question_id: number;
  status: 'not_visited' | 'visited' | 'answered' | 'skipped' | 'flagged';
  visit_count: number;
  time_spent: number;
  last_visited?: Date;
}

// --- Data Access Functions ---

// User
export const createUser = async (name: string, examId: number): Promise<number> => {
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO users (name, exam_id) VALUES (?, ?)',
    [name, examId]
  );
  return result.insertId;
};

export const getUserByNameAndExam = async (name: string, examId: number): Promise<User | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM users WHERE name = ? AND exam_id = ?',
    [name, examId]
  );
  return (rows[0] as User) || null;
};

// Keep old function for backward compatibility, but mark as deprecated
/**
 * @deprecated Use getUserByNameAndExam instead. This function doesn't consider exam_id.
 */
export const getUserByName = async (name: string): Promise<User | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM users WHERE name = ? LIMIT 1',
    [name]
  );
  return (rows[0] as User) || null;
};

// Exam
export const getExamByShareId = async (
  shareId: string
): Promise<Exam | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM exams WHERE share_link_id = ?',
    [shareId]
  );
  return (rows[0] as Exam) || null;
};

export const getAllExams = async (): Promise<Exam[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM exams ORDER BY created_at DESC'
  );
  return rows as Exam[];
};

export const getExamById = async (id: number): Promise<Exam | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM exams WHERE id = ?',
    [id]
  );
  return (rows[0] as Exam) || null;
};

export const createExam = async (exam: Exam): Promise<number> => {
  const shareLinkId = Math.random().toString(36).substring(2, 10); // Simple ID gen
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO exams (title, description, share_link_id, language, time_limit_minutes, enable_copy_prevention, enable_watermark, watermark_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      exam.title,
      exam.description,
      shareLinkId,
      exam.language || 'zh-CN',
      exam.time_limit_minutes || 0,
      exam.enable_copy_prevention ?? true,
      exam.enable_watermark ?? true,
      exam.watermark_text || 'Exam in Progress'
    ]
  );
  return result.insertId;
};

export const updateExam = async (id: number, updates: Partial<Exam>): Promise<void> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }
  if (updates.language !== undefined) {
    fields.push('language = ?');
    values.push(updates.language);
  }
  if (updates.time_limit_minutes !== undefined) {
    fields.push('time_limit_minutes = ?');
    values.push(updates.time_limit_minutes);
  }
  if (updates.enable_copy_prevention !== undefined) {
    fields.push('enable_copy_prevention = ?');
    values.push(updates.enable_copy_prevention);
  }
  if (updates.enable_watermark !== undefined) {
    fields.push('enable_watermark = ?');
    values.push(updates.enable_watermark);
  }
  if (updates.watermark_text !== undefined) {
    fields.push('watermark_text = ?');
    values.push(updates.watermark_text);
  }

  if (fields.length === 0) {
    return;
  }

  values.push(id);
  await pool.query(
    `UPDATE exams SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
};

export const deleteExam = async (id: number): Promise<void> => {
  await pool.query('DELETE FROM exams WHERE id = ?', [id]);
};

// Questions
export const getQuestionsByExamId = async (
  examId: number
): Promise<Question[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM questions WHERE exam_id = ?',
    [examId]
  );
  // Parse JSON strings for multi-language fields
  return (rows as Question[]).map(q => ({
    ...q,
    content: typeof q.content === 'string' && q.content.startsWith('{') 
      ? JSON.parse(q.content) 
      : q.content,
    options: typeof q.options === 'string' 
      ? JSON.parse(q.options) 
      : q.options,
    correct_answer: typeof q.correct_answer === 'string' && q.correct_answer.startsWith('{')
      ? JSON.parse(q.correct_answer)
      : q.correct_answer,
    explanation: q.explanation && typeof q.explanation === 'string' && q.explanation.startsWith('{')
      ? JSON.parse(q.explanation)
      : q.explanation,
  }));
};

export const createQuestion = async (question: Question): Promise<number> => {
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO questions (exam_id, type, content, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?)',
    [
      question.exam_id,
      question.type,
      typeof question.content === 'string' ? question.content : JSON.stringify(question.content),
      JSON.stringify(question.options),
      typeof question.correct_answer === 'string' ? question.correct_answer : JSON.stringify(question.correct_answer),
      question.explanation ? (typeof question.explanation === 'string' ? question.explanation : JSON.stringify(question.explanation)) : null,
    ]
  );
  return result.insertId;
};

export const getQuestionById = async (id: number): Promise<Question | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM questions WHERE id = ?',
    [id]
  );
  if (!rows[0]) return null;
  
  const q = rows[0] as Question;
  // Parse JSON strings for multi-language fields
  return {
    ...q,
    content: typeof q.content === 'string' && q.content.startsWith('{') 
      ? JSON.parse(q.content) 
      : q.content,
    options: typeof q.options === 'string' 
      ? JSON.parse(q.options) 
      : q.options,
    correct_answer: typeof q.correct_answer === 'string' && q.correct_answer.startsWith('{')
      ? JSON.parse(q.correct_answer)
      : q.correct_answer,
    explanation: q.explanation && typeof q.explanation === 'string' && q.explanation.startsWith('{')
      ? JSON.parse(q.explanation)
      : q.explanation,
  };
};

export const updateQuestion = async (id: number, updates: Partial<Question>): Promise<void> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.type !== undefined) {
    fields.push('type = ?');
    values.push(updates.type);
  }
  if (updates.content !== undefined) {
    fields.push('content = ?');
    values.push(typeof updates.content === 'string' ? updates.content : JSON.stringify(updates.content));
  }
  if (updates.options !== undefined) {
    fields.push('options = ?');
    values.push(JSON.stringify(updates.options));
  }
  if (updates.correct_answer !== undefined) {
    fields.push('correct_answer = ?');
    values.push(typeof updates.correct_answer === 'string' ? updates.correct_answer : JSON.stringify(updates.correct_answer));
  }
  if (updates.explanation !== undefined) {
    fields.push('explanation = ?');
    values.push(typeof updates.explanation === 'string' ? updates.explanation : JSON.stringify(updates.explanation));
  }

  if (fields.length === 0) {
    return;
  }

  values.push(id);
  await pool.query(
    `UPDATE questions SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
};

export const deleteQuestion = async (id: number): Promise<void> => {
  await pool.query('DELETE FROM questions WHERE id = ?', [id]);
};

export const createQuestionsBatch = async (questions: Question[]): Promise<number[]> => {
  const ids: number[] = [];
  for (const question of questions) {
    // Ensure TRUE_FALSE questions have default options
    let options = question.options;
    
    if (question.type === 'TRUE_FALSE' && !options) {
      // If no options provided for TRUE_FALSE, set default based on content format
      if (typeof question.content === 'string') {
        // Legacy single language format
        options = ['正确', '错误'];
      } else {
        // Multi-language format
        options = {
          'zh-CN': ['正确', '错误'],
          'en-US': ['True', 'False']
        };
      }
    }
    
    const questionWithOptions = {
      ...question,
      options
    };
    const id = await createQuestion(questionWithOptions);
    ids.push(id);
  }
  return ids;
};

// Helper function to extract content for a specific language
export const getLocalizedContent = (
  content: string | MultiLangContent,
  language: string = 'zh-CN'
): string => {
  if (typeof content === 'string') {
    return content; // Legacy format, return as-is
  }
  return content[language] || content['zh-CN'] || Object.values(content)[0] || '';
};

// Helper function to extract options for a specific language
export const getLocalizedOptions = (
  options: string[] | MultiLangOptions,
  language: string = 'zh-CN'
): string[] => {
  if (Array.isArray(options)) {
    return options; // Legacy format, return as-is
  }
  return options[language] || options['zh-CN'] || Object.values(options)[0] || [];
};

// Results & Answers
export const createResult = async (
  userId: number,
  examId: number
): Promise<number> => {
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO results (user_id, exam_id) VALUES (?, ?)',
    [userId, examId]
  );
  return result.insertId;
};

export const updateResultStats = async (
  resultId: number,
  score: number,
  totalQuestions: number,
  duration: number
) => {
  await pool.query(
    'UPDATE results SET score = ?, total_questions = ?, total_duration = ?, status = ?, completed_at = NOW() WHERE id = ?',
    [score, totalQuestions, duration, 'completed', resultId]
  );
};

export const updateResultProgress = async (
  resultId: number,
  currentQuestionIndex: number
) => {
  await pool.query(
    'UPDATE results SET current_question_index = ? WHERE id = ?',
    [currentQuestionIndex, resultId]
  );
};

export const saveAnswer = async (answer: Answer): Promise<void> => {
  await pool.query(
    'INSERT INTO answers (result_id, question_id, user_answer, is_correct, duration_seconds) VALUES (?, ?, ?, ?, ?)',
    [
      answer.result_id,
      answer.question_id,
      answer.user_answer,
      answer.is_correct,
      answer.duration_seconds,
    ]
  );
};

export const getAnswersByResultId = async (
  resultId: number
): Promise<Answer[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM answers WHERE result_id = ?',
    [resultId]
  );
  return rows as Answer[];
};

// Question Progress Functions
export const updateQuestionProgress = async (
  resultId: number,
  questionId: number,
  status: 'not_visited' | 'visited' | 'answered' | 'skipped' | 'flagged',
  timeSpent: number = 0
): Promise<void> => {
  await pool.query(
    `INSERT INTO question_progress (result_id, question_id, status, visit_count, time_spent, last_visited)
     VALUES (?, ?, ?, 1, ?, NOW())
     ON DUPLICATE KEY UPDATE
     status = VALUES(status),
     visit_count = visit_count + 1,
     time_spent = time_spent + VALUES(time_spent),
     last_visited = NOW()`,
    [resultId, questionId, status, timeSpent]
  );
};

export const getQuestionProgressByResultId = async (
  resultId: number
): Promise<QuestionProgress[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM question_progress WHERE result_id = ? ORDER BY question_id',
    [resultId]
  );
  return rows as QuestionProgress[];
};

export const getResultById = async (resultId: number): Promise<Result | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM results WHERE id = ?',
    [resultId]
  );
  return (rows[0] as Result) || null;
};

export const getAnswerByResultAndQuestion = async (
  resultId: number,
  questionId: number
): Promise<Answer | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM answers WHERE result_id = ? AND question_id = ?',
    [resultId, questionId]
  );
  return (rows[0] as Answer) || null;
};

// 考试记录管理函数
export const getResultsByExamId = async (examId: number): Promise<any[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 
      r.id,
      r.user_id,
      r.exam_id,
      r.score,
      r.total_questions,
      r.total_duration,
      r.status,
      r.started_at,
      r.completed_at,
      u.name as user_name
    FROM results r
    JOIN users u ON r.user_id = u.id
    WHERE r.exam_id = ?
    ORDER BY r.started_at DESC`,
    [examId]
  );
  return rows as any[];
};

export const deleteResult = async (resultId: number): Promise<void> => {
  // 删除相关的答案记录
  await pool.query('DELETE FROM answers WHERE result_id = ?', [resultId]);
  
  // 删除相关的题目进度记录
  await pool.query('DELETE FROM question_progress WHERE result_id = ?', [resultId]);
  
  // 删除考试记录
  await pool.query('DELETE FROM results WHERE id = ?', [resultId]);
};

export const deleteResultsByExamId = async (examId: number): Promise<void> => {
  // 获取所有相关的result_id
  const [results] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM results WHERE exam_id = ?',
    [examId]
  );
  
  const resultIds = results.map(r => r.id);
  
  if (resultIds.length > 0) {
    // 删除相关的答案记录
    await pool.query(
      `DELETE FROM answers WHERE result_id IN (${resultIds.map(() => '?').join(',')})`,
      resultIds
    );
    
    // 删除相关的题目进度记录
    await pool.query(
      `DELETE FROM question_progress WHERE result_id IN (${resultIds.map(() => '?').join(',')})`,
      resultIds
    );
    
    // 删除考试记录
    await pool.query('DELETE FROM results WHERE exam_id = ?', [examId]);
  }
};

// 查询用户在特定考卷中是否已有考试记录
export const getResultByUserAndExam = async (
  userId: number,
  examId: number
): Promise<Result | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM results WHERE user_id = ? AND exam_id = ? ORDER BY started_at DESC LIMIT 1',
    [userId, examId]
  );
  return (rows[0] as Result) || null;
};

