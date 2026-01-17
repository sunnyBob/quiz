# 项目运行状态

## ✅ 服务已启动

### 后端服务
- **地址**: http://localhost:3000
- **状态**: 运行中
- **API 文档**:
  - 创建用户: `POST /api/users`
  - 获取考卷: `GET /api/exams/:shareId`
  - 获取题目: `GET /api/exams/:examId/questions`
  - 提交答案: `POST /api/answers`

### 前端服务
- **地址**: http://localhost:5173
- **状态**: 运行中
- **访问路径**:
  - 管理员登录: http://localhost:5173/admin
  - 创建考卷: http://localhost:5173/admin/create
  - 查看统计: http://localhost:5173/admin/dashboard
  - 答题页面: http://localhost:5173/quiz/{shareId}

## 📝 使用说明

### 1. 管理员操作
1. 访问 http://localhost:5173/admin
2. 输入密码: `admin123`
3. 创建考卷并添加题目
4. 获取分享链接（share_link_id）

### 2. 考生操作
1. 访问考卷链接: http://localhost:5173/quiz/{shareId}
2. 输入姓名开始答题
3. 查看实时反馈和统计

## 🔧 停止服务

如需停止服务，在终端中按 `Ctrl+C` 或运行：
```bash
# 查找并停止进程
lsof -ti:3000 | xargs kill  # 后端
lsof -ti:5173 | xargs kill  # 前端
```
