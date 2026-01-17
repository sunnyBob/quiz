// 启动脚本，确保环境变量正确加载
require('dotenv').config();

// 验证环境变量
console.log('Environment check:', {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD ? '***' : 'NO PASSWORD',
  database: process.env.DB_NAME || 'quiz_system',
  port: process.env.PORT || '3000'
});

// 启动主应用
require('ts-node/register');
require('./src/index.ts');