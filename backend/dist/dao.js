"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResultByUserAndExam = exports.deleteResultsByExamId = exports.deleteResult = exports.getResultsByExamId = exports.getAnswerByResultAndQuestion = exports.getResultById = exports.getQuestionProgressByResultId = exports.updateQuestionProgress = exports.getAnswersByResultId = exports.saveAnswer = exports.updateResultProgress = exports.updateResultStats = exports.createResult = exports.getLocalizedOptions = exports.getLocalizedContent = exports.createQuestionsBatch = exports.deleteQuestion = exports.updateQuestion = exports.getQuestionById = exports.createQuestion = exports.getQuestionsByExamId = exports.deleteExam = exports.updateExam = exports.createExam = exports.getExamById = exports.getAllExams = exports.getExamByShareId = exports.getUserByName = exports.getUserByNameAndExam = exports.createUser = void 0;
const db_1 = __importDefault(require("./db"));
// --- Data Access Functions ---
// User
const createUser = async (name, examId) => {
    const [result] = await db_1.default.query('INSERT INTO users (name, exam_id) VALUES (?, ?)', [name, examId]);
    return result.insertId;
};
exports.createUser = createUser;
const getUserByNameAndExam = async (name, examId) => {
    const [rows] = await db_1.default.query('SELECT * FROM users WHERE name = ? AND exam_id = ?', [name, examId]);
    return rows[0] || null;
};
exports.getUserByNameAndExam = getUserByNameAndExam;
// Keep old function for backward compatibility, but mark as deprecated
/**
 * @deprecated Use getUserByNameAndExam instead. This function doesn't consider exam_id.
 */
const getUserByName = async (name) => {
    const [rows] = await db_1.default.query('SELECT * FROM users WHERE name = ? LIMIT 1', [name]);
    return rows[0] || null;
};
exports.getUserByName = getUserByName;
// Exam
const getExamByShareId = async (shareId) => {
    const [rows] = await db_1.default.query('SELECT * FROM exams WHERE share_link_id = ?', [shareId]);
    return rows[0] || null;
};
exports.getExamByShareId = getExamByShareId;
const getAllExams = async () => {
    const [rows] = await db_1.default.query('SELECT * FROM exams ORDER BY created_at DESC');
    return rows;
};
exports.getAllExams = getAllExams;
const getExamById = async (id) => {
    const [rows] = await db_1.default.query('SELECT * FROM exams WHERE id = ?', [id]);
    return rows[0] || null;
};
exports.getExamById = getExamById;
const createExam = async (exam) => {
    const shareLinkId = Math.random().toString(36).substring(2, 10); // Simple ID gen
    const [result] = await db_1.default.query('INSERT INTO exams (title, description, share_link_id, language, time_limit_minutes, enable_copy_prevention, enable_watermark, watermark_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
        exam.title,
        exam.description,
        shareLinkId,
        exam.language || 'zh-CN',
        exam.time_limit_minutes || 0,
        exam.enable_copy_prevention ?? true,
        exam.enable_watermark ?? true,
        exam.watermark_text || 'Exam in Progress'
    ]);
    return result.insertId;
};
exports.createExam = createExam;
const updateExam = async (id, updates) => {
    const fields = [];
    const values = [];
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
    await db_1.default.query(`UPDATE exams SET ${fields.join(', ')} WHERE id = ?`, values);
};
exports.updateExam = updateExam;
const deleteExam = async (id) => {
    await db_1.default.query('DELETE FROM exams WHERE id = ?', [id]);
};
exports.deleteExam = deleteExam;
// Questions
const getQuestionsByExamId = async (examId) => {
    const [rows] = await db_1.default.query('SELECT * FROM questions WHERE exam_id = ?', [examId]);
    // Parse JSON strings for multi-language fields
    return rows.map(q => ({
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
exports.getQuestionsByExamId = getQuestionsByExamId;
const createQuestion = async (question) => {
    const [result] = await db_1.default.query('INSERT INTO questions (exam_id, type, content, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?)', [
        question.exam_id,
        question.type,
        typeof question.content === 'string' ? question.content : JSON.stringify(question.content),
        JSON.stringify(question.options),
        typeof question.correct_answer === 'string' ? question.correct_answer : JSON.stringify(question.correct_answer),
        question.explanation ? (typeof question.explanation === 'string' ? question.explanation : JSON.stringify(question.explanation)) : null,
    ]);
    return result.insertId;
};
exports.createQuestion = createQuestion;
const getQuestionById = async (id) => {
    const [rows] = await db_1.default.query('SELECT * FROM questions WHERE id = ?', [id]);
    if (!rows[0])
        return null;
    const q = rows[0];
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
exports.getQuestionById = getQuestionById;
const updateQuestion = async (id, updates) => {
    const fields = [];
    const values = [];
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
    await db_1.default.query(`UPDATE questions SET ${fields.join(', ')} WHERE id = ?`, values);
};
exports.updateQuestion = updateQuestion;
const deleteQuestion = async (id) => {
    await db_1.default.query('DELETE FROM questions WHERE id = ?', [id]);
};
exports.deleteQuestion = deleteQuestion;
const createQuestionsBatch = async (questions) => {
    const ids = [];
    for (const question of questions) {
        // Ensure TRUE_FALSE questions have default options
        let options = question.options;
        if (question.type === 'TRUE_FALSE' && !options) {
            // If no options provided for TRUE_FALSE, set default based on content format
            if (typeof question.content === 'string') {
                // Legacy single language format
                options = ['正确', '错误'];
            }
            else {
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
        const id = await (0, exports.createQuestion)(questionWithOptions);
        ids.push(id);
    }
    return ids;
};
exports.createQuestionsBatch = createQuestionsBatch;
// Helper function to extract content for a specific language
const getLocalizedContent = (content, language = 'zh-CN') => {
    if (typeof content === 'string') {
        return content; // Legacy format, return as-is
    }
    return content[language] || content['zh-CN'] || Object.values(content)[0] || '';
};
exports.getLocalizedContent = getLocalizedContent;
// Helper function to extract options for a specific language
const getLocalizedOptions = (options, language = 'zh-CN') => {
    if (Array.isArray(options)) {
        return options; // Legacy format, return as-is
    }
    return options[language] || options['zh-CN'] || Object.values(options)[0] || [];
};
exports.getLocalizedOptions = getLocalizedOptions;
// Results & Answers
const createResult = async (userId, examId) => {
    const [result] = await db_1.default.query('INSERT INTO results (user_id, exam_id) VALUES (?, ?)', [userId, examId]);
    return result.insertId;
};
exports.createResult = createResult;
const updateResultStats = async (resultId, score, totalQuestions, duration) => {
    await db_1.default.query('UPDATE results SET score = ?, total_questions = ?, total_duration = ?, status = ?, completed_at = NOW() WHERE id = ?', [score, totalQuestions, duration, 'completed', resultId]);
};
exports.updateResultStats = updateResultStats;
const updateResultProgress = async (resultId, currentQuestionIndex) => {
    await db_1.default.query('UPDATE results SET current_question_index = ? WHERE id = ?', [currentQuestionIndex, resultId]);
};
exports.updateResultProgress = updateResultProgress;
const saveAnswer = async (answer) => {
    await db_1.default.query('INSERT INTO answers (result_id, question_id, user_answer, is_correct, duration_seconds) VALUES (?, ?, ?, ?, ?)', [
        answer.result_id,
        answer.question_id,
        answer.user_answer,
        answer.is_correct,
        answer.duration_seconds,
    ]);
};
exports.saveAnswer = saveAnswer;
const getAnswersByResultId = async (resultId) => {
    const [rows] = await db_1.default.query('SELECT * FROM answers WHERE result_id = ?', [resultId]);
    return rows;
};
exports.getAnswersByResultId = getAnswersByResultId;
// Question Progress Functions
const updateQuestionProgress = async (resultId, questionId, status, timeSpent = 0) => {
    await db_1.default.query(`INSERT INTO question_progress (result_id, question_id, status, visit_count, time_spent, last_visited)
     VALUES (?, ?, ?, 1, ?, NOW())
     ON DUPLICATE KEY UPDATE
     status = VALUES(status),
     visit_count = visit_count + 1,
     time_spent = time_spent + VALUES(time_spent),
     last_visited = NOW()`, [resultId, questionId, status, timeSpent]);
};
exports.updateQuestionProgress = updateQuestionProgress;
const getQuestionProgressByResultId = async (resultId) => {
    const [rows] = await db_1.default.query('SELECT * FROM question_progress WHERE result_id = ? ORDER BY question_id', [resultId]);
    return rows;
};
exports.getQuestionProgressByResultId = getQuestionProgressByResultId;
const getResultById = async (resultId) => {
    const [rows] = await db_1.default.query('SELECT * FROM results WHERE id = ?', [resultId]);
    return rows[0] || null;
};
exports.getResultById = getResultById;
const getAnswerByResultAndQuestion = async (resultId, questionId) => {
    const [rows] = await db_1.default.query('SELECT * FROM answers WHERE result_id = ? AND question_id = ?', [resultId, questionId]);
    return rows[0] || null;
};
exports.getAnswerByResultAndQuestion = getAnswerByResultAndQuestion;
// 考试记录管理函数
const getResultsByExamId = async (examId) => {
    const [rows] = await db_1.default.query(`SELECT 
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
    ORDER BY r.started_at DESC`, [examId]);
    return rows;
};
exports.getResultsByExamId = getResultsByExamId;
const deleteResult = async (resultId) => {
    // 删除相关的答案记录
    await db_1.default.query('DELETE FROM answers WHERE result_id = ?', [resultId]);
    // 删除相关的题目进度记录
    await db_1.default.query('DELETE FROM question_progress WHERE result_id = ?', [resultId]);
    // 删除考试记录
    await db_1.default.query('DELETE FROM results WHERE id = ?', [resultId]);
};
exports.deleteResult = deleteResult;
const deleteResultsByExamId = async (examId) => {
    // 获取所有相关的result_id
    const [results] = await db_1.default.query('SELECT id FROM results WHERE exam_id = ?', [examId]);
    const resultIds = results.map(r => r.id);
    if (resultIds.length > 0) {
        // 删除相关的答案记录
        await db_1.default.query(`DELETE FROM answers WHERE result_id IN (${resultIds.map(() => '?').join(',')})`, resultIds);
        // 删除相关的题目进度记录
        await db_1.default.query(`DELETE FROM question_progress WHERE result_id IN (${resultIds.map(() => '?').join(',')})`, resultIds);
        // 删除考试记录
        await db_1.default.query('DELETE FROM results WHERE exam_id = ?', [examId]);
    }
};
exports.deleteResultsByExamId = deleteResultsByExamId;
// 查询用户在特定考卷中是否已有考试记录
const getResultByUserAndExam = async (userId, examId) => {
    const [rows] = await db_1.default.query('SELECT * FROM results WHERE user_id = ? AND exam_id = ? ORDER BY started_at DESC LIMIT 1', [userId, examId]);
    return rows[0] || null;
};
exports.getResultByUserAndExam = getResultByUserAndExam;
