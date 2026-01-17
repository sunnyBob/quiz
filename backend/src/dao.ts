import pool from './db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// --- Types ---
export interface User {
  id?: number;
  name: string;
}

export interface Exam {
  id?: number;
  title: string;
  description?: string;
  share_link_id?: string;
}

export interface Question {
  id?: number;
  exam_id: number;
  type: 'CHOICE' | 'TRUE_FALSE';
  content: string;
  options: string[]; // JSON array in DB
  correct_answer: string;
  explanation?: string;
}

export interface Result {
  id?: number;
  user_id: number;
  exam_id: number;
  score: number;
  total_questions: number;
  total_duration: number;
}

export interface Answer {
  id?: number;
  result_id: number;
  question_id: number;
  user_answer: string;
  is_correct: boolean;
  duration_seconds: number;
}

// --- Data Access Functions ---

// User
export const createUser = async (name: string): Promise<number> => {
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO users (name) VALUES (?)',
    [name]
  );
  return result.insertId;
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

export const createExam = async (exam: Exam): Promise<number> => {
  const shareLinkId = Math.random().toString(36).substring(2, 10); // Simple ID gen
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO exams (title, description, share_link_id) VALUES (?, ?, ?)',
    [exam.title, exam.description, shareLinkId]
  );
  return result.insertId;
};

// Questions
export const getQuestionsByExamId = async (
  examId: number
): Promise<Question[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM questions WHERE exam_id = ?',
    [examId]
  );
  return rows as Question[];
};

export const createQuestion = async (question: Question): Promise<number> => {
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO questions (exam_id, type, content, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?)',
    [
      question.exam_id,
      question.type,
      question.content,
      JSON.stringify(question.options),
      question.correct_answer,
      question.explanation,
    ]
  );
  return result.insertId;
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
    'UPDATE results SET score = ?, total_questions = ?, total_duration = ? WHERE id = ?',
    [score, totalQuestions, duration, resultId]
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

