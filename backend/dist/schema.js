"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// 确保从正确的路径加载 .env 文件
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
const initDb = async () => {
    // Create connection without database first
    const tempConnection = await promise_1.default.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'password',
    });
    // Create database if not exists
    const dbName = process.env.DB_NAME || 'quiz_system';
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await tempConnection.end();
    // Now connect with database
    const pool = promise_1.default.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'password',
        database: dbName,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    });
    const connection = await pool.getConnection();
    try {
        // Users table - Users are scoped to specific exams
        await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        exam_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_per_exam (name, exam_id),
        INDEX idx_users_exam_id (exam_id),
        INDEX idx_users_name (name)
      )
    `);
        // Exams table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS exams (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        created_by INT,
        share_link_id VARCHAR(100) UNIQUE,
        language VARCHAR(10) DEFAULT 'zh-CN', -- Exam content language (zh-CN, en-US)
        time_limit_minutes INT DEFAULT 0, -- 0 means no time limit
        enable_copy_prevention BOOLEAN DEFAULT TRUE,
        enable_watermark BOOLEAN DEFAULT TRUE,
        watermark_text VARCHAR(255) DEFAULT 'Exam in Progress',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Add foreign key constraint to users table after exams table is created
        await connection.query(`
      ALTER TABLE users
      ADD CONSTRAINT fk_users_exam
      FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
    `).catch(() => {
            // Ignore error if constraint already exists
        });
        // Questions table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        exam_id INT NOT NULL,
        type ENUM('CHOICE', 'TRUE_FALSE') NOT NULL,
        content TEXT NOT NULL,
        options JSON NOT NULL, -- Storing options as JSON array
        correct_answer VARCHAR(255) NOT NULL,
        explanation TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
      )
    `);
        // Results table (Exam session)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        exam_id INT NOT NULL,
        score INT DEFAULT 0,
        total_questions INT DEFAULT 0,
        total_duration INT DEFAULT 0, -- Total time in seconds
        current_question_index INT DEFAULT 0, -- Progress tracking
        status ENUM('in_progress', 'completed', 'expired') DEFAULT 'in_progress',
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (exam_id) REFERENCES exams(id)
      )
    `);
        // Answers table (Individual question answers)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS answers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        result_id INT NOT NULL,
        question_id INT NOT NULL,
        user_answer VARCHAR(255),
        is_correct BOOLEAN,
        duration_seconds INT DEFAULT 0, -- Time spent on this specific question
        question_order INT DEFAULT 0, -- Order in which question was answered
        status ENUM('answered', 'skipped', 'flagged') DEFAULT 'answered',
        answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (result_id) REFERENCES results(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES questions(id)
      )
    `);
        // Question progress table for navigation state
        await connection.query(`
      CREATE TABLE IF NOT EXISTS question_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        result_id INT NOT NULL,
        question_id INT NOT NULL,
        status ENUM('not_visited', 'visited', 'answered', 'skipped', 'flagged') DEFAULT 'not_visited',
        visit_count INT DEFAULT 0,
        time_spent INT DEFAULT 0, -- Total time spent on this question
        last_visited TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (result_id) REFERENCES results(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES questions(id),
        UNIQUE KEY unique_result_question (result_id, question_id)
      )
    `);
        console.log('Database tables initialized successfully');
    }
    catch (error) {
        console.error('Error initializing database tables:', error);
    }
    finally {
        connection.release();
        await pool.end();
    }
};
initDb();
