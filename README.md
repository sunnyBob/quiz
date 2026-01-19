# Quiz System

一个功能完整的在线考试系统，支持多语言、实时反馈、防作弊等功能。

## 📋 目录

- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [部署方式](#部署方式)
- [功能特性](#功能特性)
- [开发指南](#开发指南)

## 📁 项目结构

```
quiz/
├── frontend/          # React + TypeScript + Vite 前端应用
├── backend/           # Node.js + Express + TypeScript 后端 API
├── docker-compose.yml # Docker Compose 配置
├── QUICK_DEPLOY.md    # 快速部署指南
└── DOCKER_DEPLOYMENT.md # 详细 Docker 部署文档
```

## 🚀 快速开始

### 方式一: Docker 部署 (推荐)

**适用于生产环境，一键部署，5 分钟完成！**

```bash
# 1. 克隆项目
git clone your-repository-url
cd quiz

# 2. 配置环境变量
cat > .env << 'EOF'
MYSQL_ROOT_PASSWORD=YourStrongPassword123!
VITE_ADMIN_PASSWORD=YourAdminPassword123!
TZ=Asia/Shanghai
EOF

# 3. 创建数据目录
sudo mkdir -p /data/quiz/{mysql,backend,uploads}
sudo chown -R $USER:$USER /data/quiz

# 4. 修改 docker-compose.yml 中的数据目录路径
# 将 /volume1/docker/quiz 修改为 /data/quiz

# 5. 启动服务
./deploy-docker.sh
# 或手动启动: docker compose up -d --build
```

**访问地址:**
- 前端: http://your-server-ip:8080
- 管理员: http://your-server-ip:8080/admin
- 后端 API: http://your-server-ip:3000/api

**详细文档:**
- [快速部署指南](./QUICK_DEPLOY.md) - 简明扼要，快速上手
- [完整部署文档](./DOCKER_DEPLOYMENT.md) - 详细说明，包含故障排查

### 方式二: 本地开发

**适用于开发环境**

## Setup Instructions

### Backend Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Configure database:
   - Create `.env` file in `backend/` directory:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=quiz_system
   PORT=3000
   ```

3. Initialize database:
```bash
npm run init-db
```

4. Start backend server:
```bash
npm run dev
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start development server:
```bash
npm run dev
```

## 📦 部署方式

### Docker 部署 (生产环境推荐)

使用 Docker Compose 一键部署所有服务 (MySQL + 后端 + 前端):

```bash
# 快速部署
./deploy-docker.sh

# 常用命令
docker compose ps          # 查看状态
docker compose logs -f     # 查看日志
docker compose restart     # 重启服务
docker compose down        # 停止服务
```

详细文档:
- [快速部署指南 (5分钟)](./QUICK_DEPLOY.md)
- [完整部署文档](./DOCKER_DEPLOYMENT.md)

### 传统部署

如果不使用 Docker，可以手动部署各个服务。参考上面的"本地开发"部分。

## 💻 使用说明

### 考生端
- 访问考试: `http://your-domain/quiz/{shareId}`
- 输入姓名开始考试
- 实时答题反馈
- 查看成绩总结

### 管理员端
- 登录: `http://your-domain/admin`
- 创建考试: `/admin/create`
- 查看成绩: `/admin/dashboard`
- 管理题库: `/admin/questions`

## ✨ 功能特性

✅ User identification (name input)
✅ Exam access via share links
✅ Real-time feedback with answer locking
✅ State recovery on page refresh
✅ Time tracking (per question + total)
✅ Anti-cheating (no copy/select, watermark)
✅ Bilingual support (EN/ZH) with browser language detection
✅ Admin dashboard with statistics
✅ Exam creation and management

### 语言支持
- **自动检测**: 系统自动检测浏览器语言并显示中文或英文界面
- **手动切换**: 用户可以使用右上角的语言切换器手动切换语言
- **偏好保存**: 选择的语言会保存到 localStorage 供下次访问使用
- **支持的语言**: 简体中文 (zh-CN), 英语 (en-US)
- **优先级**: 用户偏好 > 浏览器语言 > 默认语言 (中文)

## 🔧 维护操作

### 查看日志
```bash
docker compose logs -f              # 所有服务
docker compose logs -f backend      # 后端服务
docker compose logs -f frontend     # 前端服务
```

### 数据备份
```bash
# 备份数据库
docker exec quiz-mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} quiz_db > backup.sql

# 备份上传文件
tar -czf uploads_backup.tar.gz /data/quiz/uploads/
```

### 更新应用
```bash
git pull
docker compose up -d --build
```

## 🛡️ 安全建议

1. **修改默认密码**: 在 `.env` 文件中设置强密码
2. **配置防火墙**: 限制端口访问
3. **启用 HTTPS**: 使用 Nginx 或 Caddy 配置 SSL
4. **定期备份**: 自动备份数据库和文件
5. **日志监控**: 定期检查应用日志

## 📚 文档索引

- [快速部署指南](./QUICK_DEPLOY.md) - 5分钟快速部署
- [Docker 部署文档](./DOCKER_DEPLOYMENT.md) - 完整部署说明
- [运行指南](./RUNNING.md) - 运行和测试说明

## 🐛 故障排查

### 常见问题

**服务无法启动:**
```bash
docker compose logs        # 查看错误日志
docker compose ps          # 检查服务状态
```

**数据库连接失败:**
```bash
docker compose exec mysql mysql -u root -p    # 测试数据库连接
docker compose restart backend                 # 重启后端服务
```

**前端无法访问后端:**
```bash
curl http://localhost:3000/api/exams          # 测试后端 API
docker compose restart frontend                # 重启前端服务
```

详细故障排查请参考 [Docker 部署文档](./DOCKER_DEPLOYMENT.md#故障排查)

## 📞 技术支持

如有问题请通过以下方式获取帮助:
- 查看文档: [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)
- 提交 Issue
- 联系项目维护者

## 📝 下一步计划

- 添加更多题型
- 增强管理员认证
- 实现详细分析报告
- 添加 E2E 测试

---

**快速开始部署:** [点击这里查看快速部署指南](./QUICK_DEPLOY.md) 🚀
