"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
const addLanguageSupport = async () => {
    const pool = promise_1.default.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'quiz_system',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    });
    const connection = await pool.getConnection();
    try {
        console.log('Starting i18n migration...');
        // Add language column to exams table if it doesn't exist
        await connection.query(`
      ALTER TABLE exams 
      ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'zh-CN' 
      COMMENT 'Exam content language (zh-CN, en-US)'
      AFTER share_link_id
    `);
        console.log('✓ Added language column to exams table');
        // Note: Questions table content/options/correct_answer/explanation can remain TEXT/JSON
        // The DAO layer will handle both string (legacy) and JSON object (new) formats
        console.log('✓ Questions table supports both legacy (string) and new (JSON) formats');
        console.log('Migration completed successfully!');
    }
    catch (error) {
        // Check if column already exists (some MySQL versions don't support IF NOT EXISTS)
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('✓ Language column already exists, skipping');
        }
        else {
            console.error('Migration error:', error);
            throw error;
        }
    }
    finally {
        connection.release();
        await pool.end();
    }
};
addLanguageSupport();
