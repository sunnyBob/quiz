import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// 优先使用环境中已有的变量（Docker 注入），如果没有则尝试加载 .env
dotenv.config();

const initDb = async () => {
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'quiz_db';

  console.log(`🚀 Initializing database at ${dbHost}...`);

  // Create connection without database first
  let tempConnection;
  try {
    tempConnection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
    });
  } catch (err: any) {
    console.error('❌ Failed to connect to MySQL server:', err.message);
    throw err;
  }

  // Create database if not exists
  await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await tempConnection.end();

  // Now connect with database
  const pool = mysql.createPool({
    host: dbHost,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  const connection = await pool.getConnection();
  try {
    console.log('📦 Creating tables if not exist...');
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
        language VARCHAR(10) DEFAULT 'zh-CN',
        time_limit_minutes INT DEFAULT 0,
        enable_copy_prevention BOOLEAN DEFAULT TRUE,
        enable_watermark BOOLEAN DEFAULT TRUE,
        watermark_text VARCHAR(255) DEFAULT 'Exam in Progress',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure all columns exist in exams table (for older installations)
    const [columns] = await connection.query("SHOW COLUMNS FROM exams");
    const columnNames = (columns as any[]).map(c => c.Field);

    const requiredColumns = [
      { name: 'language', type: "VARCHAR(10) DEFAULT 'zh-CN' AFTER share_link_id" },
      { name: 'time_limit_minutes', type: "INT DEFAULT 0 AFTER language" },
      { name: 'enable_copy_prevention', type: "BOOLEAN DEFAULT TRUE AFTER time_limit_minutes" },
      { name: 'enable_watermark', type: "BOOLEAN DEFAULT TRUE AFTER enable_copy_prevention" },
      { name: 'watermark_text', type: "VARCHAR(255) DEFAULT 'Exam in Progress' AFTER enable_watermark" }
    ];

    for (const col of requiredColumns) {
      if (!columnNames.includes(col.name)) {
        console.log(`Adding missing column ${col.name} to exams table...`);
        await connection.query(`ALTER TABLE exams ADD COLUMN ${col.name} ${col.type}`);
      }
    }

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

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database tables:', error);
    console.error('Environment:', {
      DB_HOST: process.env.DB_HOST,
      DB_USER: process.env.DB_USER,
      DB_NAME: process.env.DB_NAME,
      hasPassword: !!(process.env.DB_PASSWORD || process.env.MYSQL_ROOT_PASSWORD)
    });
    throw error;  // 继续抛出错误以便上层捕获
  } finally {
    connection.release();
    await pool.end();
  }
};

// 使用 CommonJS 导出以确保兼容性
module.exports = { initDb };

// initDb(); // 移出到 index.ts 中手动调用

