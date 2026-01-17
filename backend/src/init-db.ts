import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const createDatabase = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
  });

  try {
    const dbName = process.env.DB_NAME || 'quiz_system';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`Database '${dbName}' created or already exists`);
  } catch (error) {
    console.error('Error creating database:', error);
  } finally {
    await connection.end();
  }
};

createDatabase().then(() => {
  // Import and run schema initialization
  import('./schema');
});
