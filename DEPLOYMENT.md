# 部署说明

## 项目状态

✅ **项目已成功部署到 GitHub**
- 仓库地址：https://github.com/sunnyBob/quiz.git
- 主分支：`main`
- 提交状态：完整的初始版本已推送

## 当前运行状态

### 前端服务器
- **地址**：http://localhost:5175/
- **状态**：✅ 正常运行
- **技术栈**：React + TypeScript + Tailwind CSS + Vite
- **功能**：完整的用户界面，包括考试页面和管理后台

### 后端服务器
- **地址**：http://localhost:3000/
- **状态**：✅ 正常运行
- **技术栈**：Node.js + Express + TypeScript + MySQL
- **功能**：完整的 API 服务，支持所有业务逻辑

### 数据库
- **类型**：MySQL
- **状态**：✅ 已初始化并连接成功
- **表结构**：users, exams, questions, results, answers

## 快速启动

### 1. 克隆项目
```bash
git clone git@github.com:sunnyBob/quiz.git
cd quiz
```

### 2. 安装依赖
```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 3. 配置数据库
```bash
# 在 backend 目录下创建 .env 文件
cd ../backend
cat > .env << EOF
# MySQL Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=你的MySQL密码
DB_NAME=quiz_system

# Server Port
PORT=3000
EOF
```

### 4. 初始化数据库
```bash
# 确保 MySQL 服务已启动
npm run init-db
```

### 5. 启动服务
```bash
# 启动后端服务器（在 backend 目录）
npm run dev

# 启动前端服务器（在 frontend 目录，新终端）
cd ../frontend
npm run dev
```

## 访问地址

- **用户端**：http://localhost:5175/
- **管理后台**：http://localhost:5175/admin
- **API 文档**：http://localhost:3000/api/

## 主要功能

### 用户功能
- ✅ 输入姓名开始考试
- ✅ 多种题型支持（选择题、判断题）
- ✅ 实时答题反馈
- ✅ 防作弊机制（答案锁定、状态持久化）
- ✅ 时间统计（单题和总时长）
- ✅ 考试结果展示
- ✅ 中英双语支持

### 管理功能
- ✅ 考试创建和编辑
- ✅ 题目管理
- ✅ 考试分享（唯一链接）
- ✅ 结果统计和分析
- ✅ 用户答题数据查看

### 技术特性
- ✅ 响应式设计（支持移动端）
- ✅ 现代化 UI（Tailwind CSS）
- ✅ TypeScript 类型安全
- ✅ RESTful API 设计
- ✅ 数据库关系设计
- ✅ 环境变量配置
- ✅ 错误处理和日志

## 开发说明

### 项目结构
```
quiz/
├── frontend/          # React 前端应用
│   ├── src/
│   │   ├── pages/     # 页面组件
│   │   ├── components/# 通用组件
│   │   └── i18n.ts    # 国际化配置
│   ├── tailwind.config.js
│   └── package.json
├── backend/           # Node.js 后端服务
│   ├── src/
│   │   ├── index.ts   # 主服务器文件
│   │   ├── db.ts      # 数据库连接
│   │   ├── dao.ts     # 数据访问层
│   │   └── schema.ts  # 数据库初始化
│   ├── start.js       # 启动脚本
│   └── package.json
├── openspec/          # 项目规范和文档
└── README.md
```

### 环境要求
- Node.js 20.16.0+
- MySQL 8.0+
- npm 或 yarn

## 部署历史

- **2026-01-17**：初始版本部署到 GitHub
  - 完整的前后端实现
  - 数据库设计和初始化
  - 所有核心功能实现
  - UI/UX 优化完成
  - 配置文件和文档完善