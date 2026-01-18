"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dao_1 = require("./dao");
const db_1 = __importDefault(require("./db"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// API Routes
// 1. Start Quiz / Enter Name
app.post('/api/users', async (req, res) => {
    try {
        const { name, examId } = req.body;
        if (!name)
            return res.status(400).json({ error: 'Name is required' });
        if (!examId)
            return res.status(400).json({ error: 'Exam ID is required' });
        // 验证考试是否存在
        const exam = await (0, dao_1.getExamById)(examId);
        if (!exam) {
            return res.status(404).json({ error: 'Exam not found' });
        }
        // 查找该用户在此考试中的记录（使用 name + exam_id 作为唯一标识）
        let user = await (0, dao_1.getUserByNameAndExam)(name, examId);
        if (!user) {
            // 用户不存在，创建新用户（关联到当前考试）
            const userId = await (0, dao_1.createUser)(name, examId);
            user = { id: userId, name, exam_id: examId };
        }
        // 检查该用户是否已经参加过这个考试
        const existingResult = await (0, dao_1.getResultByUserAndExam)(user.id, examId);
        if (existingResult) {
            if (existingResult.status === 'completed' || existingResult.status === 'expired') {
                // 考试已完成或过期，返回结果ID用于回顾
                return res.json({
                    id: user.id,
                    name: user.name,
                    existingResultId: existingResult.id,
                    canResume: false,
                    isCompleted: true,
                    message: existingResult.status === 'expired'
                        ? '考试时间已到，答卷已自动提交，可以查看成绩和回顾考题'
                        : '考试已完成，可以查看成绩和回顾考题'
                });
            }
            else if (existingResult.status === 'in_progress') {
                // 考试进行中，允许继续
                return res.json({
                    id: user.id,
                    name: user.name,
                    existingResultId: existingResult.id,
                    canResume: true,
                    isCompleted: false,
                    message: '检测到您有未完成的考试，可以继续答题'
                });
            }
            else if (existingResult.status === 'expired') {
                // 考试已过期，返回结果ID用于查看
                return res.json({
                    id: user.id,
                    name: user.name,
                    existingResultId: existingResult.id,
                    canResume: false,
                    isCompleted: true,
                    isExpired: true,
                    message: '考试时间已到，可以查看成绩'
                });
            }
        }
        // 没有记录，可以开始新考试
        res.json({ id: user.id, name: user.name });
    }
    catch (error) {
        console.error('Error creating user:', error);
        // 处理唯一约束冲突（理论上不应该发生，因为我们先查询了）
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                error: 'User already exists for this exam',
                message: '该用户名在此考试中已存在'
            });
        }
        res.status(500).json({ error: 'Failed to create user' });
    }
});
// 2. Fetch Exam by Share ID
app.get('/api/exams/:shareId', async (req, res) => {
    try {
        const exam = await (0, dao_1.getExamByShareId)(req.params.shareId);
        if (!exam)
            return res.status(404).json({ error: 'Exam not found' });
        res.json(exam);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch exam' });
    }
});
// 2b. Fetch Exam by ID (for admin operations)
app.get('/api/exams/id/:examId', async (req, res) => {
    try {
        const examId = Number(req.params.examId);
        const exam = await (0, dao_1.getExamById)(examId);
        if (!exam)
            return res.status(404).json({ error: 'Exam not found' });
        res.json(exam);
    }
    catch (error) {
        console.error('Error fetching exam by ID:', error);
        res.status(500).json({ error: 'Failed to fetch exam' });
    }
});
// 3. Fetch Questions for Exam (不包含答案 - 用于考试)
app.get('/api/exams/:examId/questions', async (req, res) => {
    try {
        const questions = await (0, dao_1.getQuestionsByExamId)(Number(req.params.examId));
        // 移除正确答案和解析，只返回考试所需的信息
        const safeQuestions = questions.map(q => ({
            id: q.id,
            content: q.content,
            type: q.type,
            options: q.options
            // 不包含 correct_answer 和 explanation
        }));
        res.json(safeQuestions);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
});
// 3a. Fetch Questions with Answers (包含答案 - 用于管理后台)
app.get('/api/admin/exams/:examId/questions', async (req, res) => {
    try {
        const questions = await (0, dao_1.getQuestionsByExamId)(Number(req.params.examId));
        // 返回完整的题目信息（包含答案和解析）
        res.json(questions);
    }
    catch (error) {
        console.error('Error fetching questions for admin:', error);
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
});
// 3b. Fetch Questions with Answers (包含答案 - 用于结果展示)
app.get('/api/results/:resultId/questions', async (req, res) => {
    try {
        const resultId = Number(req.params.resultId);
        // 验证考试是否已完成（包括正常完成和过期完成）
        const result = await (0, dao_1.getResultById)(resultId);
        if (!result) {
            return res.status(404).json({ error: 'Result not found' });
        }
        // 允许 'completed' 和 'expired' 状态查看题目和答案
        if (result.status !== 'completed' && result.status !== 'expired') {
            return res.status(403).json({ error: 'Exam not finished yet' });
        }
        // 只有考试完成后才返回包含答案的题目
        const questions = await (0, dao_1.getQuestionsByExamId)(result.exam_id);
        res.json(questions);
    }
    catch (error) {
        console.error('Error fetching questions with answers:', error);
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
});
// 4. Initialize Result (Start Session)
app.post('/api/results', async (req, res) => {
    try {
        const { userId, examId } = req.body;
        const resultId = await (0, dao_1.createResult)(userId, examId);
        res.json({ resultId });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to start quiz session' });
    }
});
// 5. Submit Answer (Real-time & Persistence) - 安全版本
app.post('/api/answers', async (req, res) => {
    try {
        const { resultId, questionId, userAnswer, duration } = req.body;
        // 检查是否已经回答过此题
        const existingAnswer = await (0, dao_1.getAnswerByResultAndQuestion)(resultId, questionId);
        if (existingAnswer) {
            return res.status(409).json({ error: 'Question already answered' });
        }
        // 验证考试会话是否有效（已完成或过期的考试不能再提交答案）
        const result = await (0, dao_1.getResultById)(resultId);
        if (!result) {
            return res.status(404).json({ error: 'Result not found' });
        }
        if (result.status === 'completed' || result.status === 'expired') {
            return res.status(403).json({ error: 'Exam already finished' });
        }
        // 服务端验证答案正确性
        const question = await (0, dao_1.getQuestionById)(questionId);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }
        // 获取所有有效的正确答案（支持多语言）
        const getValidAnswers = (q) => {
            const validAnswers = [];
            // Case 1: correct_answer 是选项索引 (A, B, C, D)
            if (typeof q.correct_answer === 'string' && /^[A-D]$/.test(q.correct_answer)) {
                const index = q.correct_answer.charCodeAt(0) - 65;
                // 1a. 处理传统的单语言数组选项
                if (Array.isArray(q.options)) {
                    if (q.options[index])
                        validAnswers.push(q.options[index]);
                }
                // 1b. 处理多语言对象选项 { "zh-CN": [...], "en-US": [...] }
                else if (typeof q.options === 'object' && q.options !== null) {
                    Object.values(q.options).forEach((opts) => {
                        if (Array.isArray(opts) && opts[index]) {
                            validAnswers.push(opts[index]);
                        }
                    });
                }
            }
            // Case 2: correct_answer 是答案文本本身 (True/False 或直接文本)
            else {
                if (typeof q.correct_answer === 'string') {
                    validAnswers.push(q.correct_answer);
                }
                else if (typeof q.correct_answer === 'object' && q.correct_answer !== null) {
                    // 如果正确答案也是多语言对象，添加所有语言版本
                    validAnswers.push(...Object.values(q.correct_answer));
                }
            }
            return validAnswers;
        };
        const validAnswers = getValidAnswers(question);
        const isCorrect = validAnswers.includes(userAnswer);
        await (0, dao_1.saveAnswer)({
            result_id: resultId,
            question_id: questionId,
            user_answer: userAnswer,
            is_correct: isCorrect,
            duration_seconds: duration,
        });
        // 安全响应：只返回提交成功状态，不返回正确答案
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error saving answer:', error);
        res.status(500).json({ error: 'Failed to save answer' });
    }
});
// 6. Fetch Previous Answers (State Recovery)
app.get('/api/results/:resultId/answers', async (req, res) => {
    try {
        const answers = await (0, dao_1.getAnswersByResultId)(Number(req.params.resultId));
        res.json(answers);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch answers' });
    }
});
// 7. Update Result Stats (Finish Quiz)
app.put('/api/results/:resultId', async (req, res) => {
    try {
        const resultId = Number(req.params.resultId);
        const { score, totalQuestions, totalDuration } = req.body;
        // 验证考试会话（已完成或过期的考试不能再提交）
        const result = await (0, dao_1.getResultById)(resultId);
        if (!result) {
            return res.status(404).json({ error: 'Result not found' });
        }
        if (result.status === 'completed' || result.status === 'expired') {
            return res.status(403).json({ error: 'Exam already finished' });
        }
        // 获取考试配置
        const exam = await (0, dao_1.getExamById)(result.exam_id);
        if (!exam) {
            return res.status(404).json({ error: 'Exam not found' });
        }
        // 验证时间限制
        if (exam.time_limit_minutes && exam.time_limit_minutes > 0) {
            const startedAtMs = new Date(result.started_at).getTime();
            const nowMs = Date.now();
            const actualElapsedSeconds = Math.floor((nowMs - startedAtMs) / 1000);
            const limitSeconds = exam.time_limit_minutes * 60;
            // 检查是否超时
            if (actualElapsedSeconds > limitSeconds) {
                // 标记为过期
                await db_1.default.query('UPDATE results SET status = ?, score = ?, total_questions = ?, total_duration = ?, completed_at = NOW() WHERE id = ?', ['expired', score, totalQuestions, actualElapsedSeconds, resultId]);
                return res.status(403).json({
                    error: 'Time limit exceeded',
                    message: '考试时间已到，答卷已自动提交为过期状态',
                    status: 'expired'
                });
            }
            // 使用实际时间而不是前端传来的时间（防止作弊）
            console.log('Updating result stats:', {
                resultId,
                score,
                totalQuestions,
                actualDuration: actualElapsedSeconds,
                frontendDuration: totalDuration
            });
            await (0, dao_1.updateResultStats)(resultId, score, totalQuestions, actualElapsedSeconds // 使用服务端计算的时间
            );
        }
        else {
            // 无时间限制，使用前端传来的时间
            console.log('Updating result stats:', {
                resultId,
                score,
                totalQuestions,
                totalDuration
            });
            await (0, dao_1.updateResultStats)(resultId, score, totalQuestions, totalDuration);
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error updating result stats:', error);
        res.status(500).json({ error: 'Failed to update result stats' });
    }
});
// 8. Update Result Progress (Current Question Index)
app.put('/api/results/:resultId/progress', async (req, res) => {
    try {
        const resultId = Number(req.params.resultId);
        const { currentQuestionIndex } = req.body;
        // 验证考试会话状态（已完成或过期的考试不能再更新进度）
        const result = await (0, dao_1.getResultById)(resultId);
        if (!result) {
            return res.status(404).json({ error: 'Result not found' });
        }
        if (result.status === 'completed' || result.status === 'expired') {
            return res.status(403).json({ error: 'Exam already finished' });
        }
        await (0, dao_1.updateResultProgress)(resultId, currentQuestionIndex);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({ error: 'Failed to update progress' });
    }
});
// 9. Update Question Progress (Visit/Status Tracking)
app.put('/api/results/:resultId/questions/:questionId/progress', async (req, res) => {
    try {
        const resultId = Number(req.params.resultId);
        const questionId = Number(req.params.questionId);
        const { status, timeSpent } = req.body;
        // 验证考试会话状态（已完成或过期的考试不能再更新题目状态）
        const result = await (0, dao_1.getResultById)(resultId);
        if (!result) {
            return res.status(404).json({ error: 'Result not found' });
        }
        if (result.status === 'completed' || result.status === 'expired') {
            return res.status(403).json({ error: 'Exam already finished' });
        }
        await (0, dao_1.updateQuestionProgress)(resultId, questionId, status, timeSpent || 0);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error updating question progress:', error);
        res.status(500).json({ error: 'Failed to update question progress' });
    }
});
// 10. Get Question Progress
app.get('/api/results/:resultId/progress', async (req, res) => {
    try {
        const progress = await (0, dao_1.getQuestionProgressByResultId)(Number(req.params.resultId));
        res.json(progress);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
});
// 11. Get Result Details
app.get('/api/results/:resultId', async (req, res) => {
    try {
        const result = await (0, dao_1.getResultById)(Number(req.params.resultId));
        if (!result) {
            return res.status(404).json({ error: 'Result not found' });
        }
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch result' });
    }
});
// 11a. Get Time Status (Server-side timing)
app.get('/api/results/:resultId/time-status', async (req, res) => {
    try {
        const resultId = Number(req.params.resultId);
        // 获取考试会话
        const result = await (0, dao_1.getResultById)(resultId);
        if (!result) {
            return res.status(404).json({ error: 'Result not found' });
        }
        // 如果已完成或过期，返回最终状态
        if (result.status === 'completed' || result.status === 'expired') {
            return res.json({
                status: result.status,
                elapsedSeconds: result.total_duration,
                remainingSeconds: 0,
                isExpired: result.status === 'expired',
                startedAt: result.started_at,
                completedAt: result.completed_at
            });
        }
        // 获取考试配置
        const exam = await (0, dao_1.getExamById)(result.exam_id);
        if (!exam) {
            return res.status(404).json({ error: 'Exam not found' });
        }
        // 计算已用时间（秒）
        const startedAtMs = new Date(result.started_at).getTime();
        const nowMs = Date.now();
        const elapsedSeconds = Math.floor((nowMs - startedAtMs) / 1000);
        let remainingSeconds = null;
        let isExpired = false;
        // 如果有时间限制，计算剩余时间
        if (exam.time_limit_minutes && exam.time_limit_minutes > 0) {
            const totalSeconds = exam.time_limit_minutes * 60;
            remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
            isExpired = remainingSeconds === 0;
            // 如果时间已到，自动标记为过期
            if (isExpired && result.status === 'in_progress') {
                await db_1.default.query('UPDATE results SET status = ?, completed_at = NOW(), total_duration = ? WHERE id = ?', ['expired', elapsedSeconds, resultId]);
            }
        }
        res.json({
            status: isExpired ? 'expired' : result.status,
            elapsedSeconds,
            remainingSeconds,
            isExpired,
            startedAt: result.started_at,
            timeLimitMinutes: exam.time_limit_minutes || 0
        });
    }
    catch (error) {
        console.error('Error fetching time status:', error);
        res.status(500).json({ error: 'Failed to fetch time status' });
    }
});
// 11b. Get Complete Result Details (安全版本 - 只在考试完成后返回)
app.get('/api/results/:resultId/details', async (req, res) => {
    try {
        const resultId = Number(req.params.resultId);
        // 验证考试是否已完成（包括正常完成和过期完成）
        const result = await (0, dao_1.getResultById)(resultId);
        if (!result) {
            return res.status(404).json({ error: 'Result not found' });
        }
        // 允许 'completed' 和 'expired' 状态查看详情
        if (result.status !== 'completed' && result.status !== 'expired') {
            return res.status(403).json({ error: 'Exam not finished yet' });
        }
        // 获取完整的题目信息（包含答案）
        const questions = await (0, dao_1.getQuestionsByExamId)(result.exam_id);
        // 获取用户的答案
        const answers = await (0, dao_1.getAnswersByResultId)(resultId);
        // 返回完整的结果详情
        res.json({
            result,
            questions,
            answers
        });
    }
    catch (error) {
        console.error('Error fetching result details:', error);
        res.status(500).json({ error: 'Failed to fetch result details' });
    }
});
// 12. 考试记录管理接口
// 12a. 获取考卷的所有考试记录
app.get('/api/exams/:examId/results', async (req, res) => {
    try {
        const examId = Number(req.params.examId);
        const results = await (0, dao_1.getResultsByExamId)(examId);
        res.json(results);
    }
    catch (error) {
        console.error('Error fetching exam results:', error);
        res.status(500).json({ error: 'Failed to fetch exam results' });
    }
});
// 12b. 删除单个考试记录
app.delete('/api/results/:resultId', async (req, res) => {
    try {
        const resultId = Number(req.params.resultId);
        // 验证考试记录是否存在
        const result = await (0, dao_1.getResultById)(resultId);
        if (!result) {
            return res.status(404).json({ error: 'Result not found' });
        }
        await (0, dao_1.deleteResult)(resultId);
        res.json({ success: true, message: 'Result deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting result:', error);
        res.status(500).json({ error: 'Failed to delete result' });
    }
});
// 12c. 批量删除考卷的所有考试记录
app.delete('/api/exams/:examId/results', async (req, res) => {
    try {
        const examId = Number(req.params.examId);
        await (0, dao_1.deleteResultsByExamId)(examId);
        res.json({ success: true, message: 'All exam results deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting exam results:', error);
        res.status(500).json({ error: 'Failed to delete exam results' });
    }
});
// --- Admin / Dev Utils (To be protected later) ---
// Get all exams for management
app.get('/api/exams', async (req, res) => {
    try {
        const exams = await (0, dao_1.getAllExams)();
        res.json(exams);
    }
    catch (error) {
        console.error('Error fetching exams:', error);
        res.status(500).json({ error: 'Failed to fetch exams' });
    }
});
// Create new exam
app.post('/api/exams', async (req, res) => {
    try {
        const { title, description, language } = req.body;
        const id = await (0, dao_1.createExam)({
            title,
            description,
            language: language || 'zh-CN' // Default to Chinese
        });
        res.json({ id });
    }
    catch (error) {
        console.error('Error creating exam:', error);
        res.status(500).json({ error: 'Failed to create exam' });
    }
});
// Update exam
app.put('/api/exams/:id', async (req, res) => {
    try {
        const examId = Number(req.params.id);
        const updates = req.body;
        // Verify exam exists
        const exam = await (0, dao_1.getExamById)(examId);
        if (!exam) {
            return res.status(404).json({ error: 'Exam not found' });
        }
        await (0, dao_1.updateExam)(examId, updates);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error updating exam:', error);
        res.status(500).json({ error: 'Failed to update exam' });
    }
});
// Delete exam
app.delete('/api/exams/:id', async (req, res) => {
    try {
        const examId = Number(req.params.id);
        // Verify exam exists
        const exam = await (0, dao_1.getExamById)(examId);
        if (!exam) {
            return res.status(404).json({ error: 'Exam not found' });
        }
        await (0, dao_1.deleteExam)(examId);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting exam:', error);
        res.status(500).json({ error: 'Failed to delete exam' });
    }
});
app.post('/api/questions', async (req, res) => {
    try {
        const questionData = req.body;
        const id = await (0, dao_1.createQuestion)(questionData);
        res.json({ id });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to add question' });
    }
});
// Update question
app.put('/api/questions/:id', async (req, res) => {
    try {
        const questionId = Number(req.params.id);
        const updates = req.body;
        // Verify question exists
        const question = await (0, dao_1.getQuestionById)(questionId);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }
        await (0, dao_1.updateQuestion)(questionId, updates);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error updating question:', error);
        res.status(500).json({ error: 'Failed to update question' });
    }
});
// Delete question
app.delete('/api/questions/:id', async (req, res) => {
    try {
        const questionId = Number(req.params.id);
        // Verify question exists
        const question = await (0, dao_1.getQuestionById)(questionId);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }
        await (0, dao_1.deleteQuestion)(questionId);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({ error: 'Failed to delete question' });
    }
});
// Batch import questions
app.post('/api/exams/:id/questions/batch', async (req, res) => {
    try {
        const examId = Number(req.params.id);
        const { questions } = req.body;
        // Verify exam exists
        const exam = await (0, dao_1.getExamById)(examId);
        if (!exam) {
            return res.status(404).json({ error: 'Exam not found' });
        }
        // Validate questions format
        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ error: 'Invalid questions format' });
        }
        // Add exam_id to each question
        const questionsWithExamId = questions.map(q => ({
            ...q,
            exam_id: examId
        }));
        const ids = await (0, dao_1.createQuestionsBatch)(questionsWithExamId);
        res.json({ success: true, count: ids.length, ids });
    }
    catch (error) {
        console.error('Error batch importing questions:', error);
        res.status(500).json({ error: 'Failed to batch import questions' });
    }
});
// 8. Fetch Dashboard Stats (Exam Results)
app.get('/api/admin/exams/:examId/stats', async (req, res) => {
    try {
        const [rows] = await db_1.default.query(`SELECT
            r.id,
            u.name as user_name,
            r.score,
            r.total_questions,
            r.total_duration,
            r.completed_at,
            r.status
         FROM results r
         JOIN users u ON r.user_id = u.id
         WHERE r.exam_id = ? AND r.status IN ('completed', 'expired')
         ORDER BY r.completed_at DESC`, [req.params.examId]);
        res.json(rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
