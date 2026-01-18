# Quiz System - 快速部署指南

## 📋 部署文件清单

本项目包含以下部署相关文件：

### 核心配置文件
- `docker-compose.yml` - Docker Compose 编排文件
- `.env.example` - 环境变量模板
- `DEPLOYMENT.md` - 完整部署文档

### Docker 文件
- `backend/Dockerfile` - 后端容器构建文件
- `backend/.dockerignore` - 后端 Docker 忽略规则
- `frontend/Dockerfile` - 前端容器构建文件
- `frontend/.dockerignore` - 前端 Docker 忽略规则
- `frontend/nginx.conf` - Nginx 配置文件

### 运维脚本
- `deploy.sh` - 一键部署脚本
- `backup.sh` - 数据备份脚本
- `healthcheck.sh` - 健康检查脚本

---

## 🚀 快速开始（5 分钟部署）

### 1. 准备环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量（必须！）
nano .env
```

修改以下内容：
```bash
# 修改数据库密码（强密码）
MYSQL_ROOT_PASSWORD=你的数据库密码

# 修改 API 地址为你的 NAS IP
VITE_API_BASE_URL=http://192.168.1.100:3000

# 修改管理员密码（强密码）
VITE_ADMIN_PASSWORD=你的管理员密码
```

### 2. 执行部署

```bash
# 赋予执行权限
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

### 3. 访问应用

- 前端: `http://你的NAS-IP:5173`
- 管理后台: `http://你的NAS-IP:5173/admin`
- 后端API: `http://你的NAS-IP:3000/api/exams`

---

## 📚 详细文档

查看完整的部署文档：[DEPLOYMENT.md](./DEPLOYMENT.md)

包含内容：
- 详细部署步骤
- Lucky 反向代理配置
- 运维管理指南
- 故障排查方案
- 安全建议
- 性能优化

---

## 🔧 常用命令

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 健康检查
./healthcheck.sh

# 数据备份
./backup.sh
```

---

## 📦 项目结构

```
quiz/
├── docker-compose.yml      # Docker 编排
├── .env.example            # 环境变量模板
├── deploy.sh               # 部署脚本
├── backup.sh               # 备份脚本
├── healthcheck.sh          # 健康检查
├── DEPLOYMENT.md           # 完整文档
├── backend/
│   ├── Dockerfile          # 后端容器
│   ├── .dockerignore
│   └── src/
└── frontend/
    ├── Dockerfile          # 前端容器
    ├── .dockerignore
    ├── nginx.conf          # Nginx 配置
    └── src/
```

---

## ⚠️ 重要提示

1. **修改默认密码**: 部署前务必修改 `.env` 中的所有密码
2. **备份数据**: 定期运行 `./backup.sh` 备份数据
3. **查看日志**: 如有问题，使用 `docker-compose logs -f` 查看日志
4. **防火墙**: 确保 NAS 防火墙允许相应端口访问

---

## 🆘 获取帮助

遇到问题？按以下顺序操作：

1. 查看日志：`docker-compose logs -f`
2. 检查状态：`docker-compose ps`
3. 运行健康检查：`./healthcheck.sh`
4. 查阅完整文档：[DEPLOYMENT.md](./DEPLOYMENT.md)
5. 查看故障排查章节

---

## 版本信息

- **版本**: 1.0
- **更新日期**: 2026-01-19
- **适用环境**: 群辉 NAS DSM 7.0+, Docker 20.10+
