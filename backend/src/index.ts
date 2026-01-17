import express from 'express';
import cors from 'cors';
import {
  createUser,
  createExam,
  getExamByShareId,
  getQuestionsByExamId,
  createResult,
  saveAnswer,
  getAnswersByResultId,
  createQuestion,
  updateResultStats
} from './dao';
import pool from './db';
import { RowDataPacket } from 'mysql2';

const app = express();
app.use(cors());
app.use(express.json());

// API Routes

// 1. Start Quiz / Enter Name
app.post('/api/users', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const userId = await createUser(name);
    res.json({ id: userId, name });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// 2. Fetch Exam by Share ID
app.get('/api/exams/:shareId', async (req, res) => {
  try {
    const exam = await getExamByShareId(req.params.shareId);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    res.json(exam);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exam' });
  }
});

// 3. Fetch Questions for Exam
app.get('/api/exams/:examId/questions', async (req, res) => {
  try {
    const questions = await getQuestionsByExamId(Number(req.params.examId));
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// 4. Initialize Result (Start Session)
app.post('/api/results', async (req, res) => {
  try {
    const { userId, examId } = req.body;
    const resultId = await createResult(userId, examId);
    res.json({ resultId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start quiz session' });
  }
});

// 5. Submit Answer (Real-time & Persistence)
app.post('/api/answers', async (req, res) => {
  try {
    const { resultId, questionId, userAnswer, isCorrect, duration } = req.body;
    await saveAnswer({
      result_id: resultId,
      question_id: questionId,
      user_answer: userAnswer,
      is_correct: isCorrect,
      duration_seconds: duration,
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save answer' });
  }
});

// 6. Fetch Previous Answers (State Recovery)
app.get('/api/results/:resultId/answers', async (req, res) => {
  try {
    const answers = await getAnswersByResultId(Number(req.params.resultId));
    res.json(answers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch answers' });
  }
});

// 7. Update Result Stats (Finish Quiz)
app.put('/api/results/:resultId', async (req, res) => {
  try {
    const { score, totalQuestions, totalDuration } = req.body;
    await updateResultStats(
      Number(req.params.resultId),
      score,
      totalQuestions,
      totalDuration
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update result stats' });
  }
});

// --- Admin / Dev Utils (To be protected later) ---
app.post('/api/exams', async (req, res) => {
  try {
    const { title, description } = req.body;
    const id = await createExam({ title, description });
    res.json({ id });
  } catch (error) {
    console.error('Error creating exam:', error);
    res.status(500).json({ error: 'Failed to create exam' });
  }
});

app.post('/api/questions', async (req, res) => {
  try {
    const questionData = req.body;
    const id = await createQuestion(questionData);
    res.json({ id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add question' });
  }
});

// 8. Fetch Dashboard Stats (Exam Results)
app.get('/api/admin/exams/:examId/stats', async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT
            r.id,
            u.name as user_name,
            r.score,
            r.total_questions,
            r.total_duration,
            r.completed_at
         FROM results r
         JOIN users u ON r.user_id = u.id
         WHERE r.exam_id = ? AND r.score > 0
         ORDER BY r.completed_at DESC`,
         [req.params.examId]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
