import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const migrateAddLanguageField = async () => {
  const pool = mysql.createPool({
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
    console.log('🚀 Starting language field migration...');

    // 检查language字段是否已存在
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM exams LIKE 'language'"
    );

    if ((columns as any[]).length > 0) {
      console.log('✓ Language field already exists in exams table');
    } else {
      // 添加language字段
      await connection.query(`
        ALTER TABLE exams 
        ADD COLUMN language VARCHAR(10) DEFAULT 'zh-CN' 
        COMMENT 'Exam content language (zh-CN, en-US)' 
        AFTER share_link_id
      `);
      console.log('✓ Successfully added language field to exams table');
    }

    // 验证并显示结果
    const [rows] = await connection.query(
      'SELECT id, title, language, created_at FROM exams ORDER BY created_at DESC LIMIT 5'
    );
    console.log('\n📋 Sample exams with language field:');
    console.table(rows);

    console.log('\n✅ Migration completed successfully!');
  } catch (error: any) {
    console.error('❌ Migration error:', error.message);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
};

migrateAddLanguageField().catch(console.error);
