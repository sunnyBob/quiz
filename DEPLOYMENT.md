# 📘 Quiz System - 群辉 NAS Docker 部署文档

## 目录
- [部署架构](#部署架构)
- [前置要求](#前置要求)
- [快速开始](#快速开始)
- [详细部署步骤](#详细部署步骤)
- [Lucky 反向代理配置](#lucky-反向代理配置)
- [运维管理](#运维管理)
- [故障排查](#故障排查)

---

## 部署架构

```
┌─────────────────────────────────────────────┐
│              Internet / LAN                  │
└─────────────┬───────────────────────────────┘
              │
       ┌──────▼────────┐
       │ Lucky (端口80) │
       │  反向代理/SSL  │
       └──────┬────────┘
              │
    ┌─────────┴──────────┐
    │                    │
┌───▼────┐         ┌────▼─────┐
│Frontend│         │ Backend  │
│ :5173  │────────▶│  :3000   │
│ Nginx  │         │  Node.js │
└────────┘         └────┬─────┘
                        │
                   ┌────▼────┐
                   │  MySQL  │
                   │  :3306  │
                   └─────────┘
```

**服务说明：**
- **MySQL**: 数据库服务，存储所有考试数据
- **Backend**: Node.js/Express API 服务
- **Frontend**: React + Nginx 静态文件服务
- **Lucky**: 群辉上的反向代理服务（可选）

---

## 前置要求

### 群辉 NAS 要求
- **DSM 版本**: 7.0 或更高
- **已安装套件**: 
  - Docker 套件（从套件中心安装）
  - Lucky 反向代理工具（可选，用于域名访问）
- **硬件要求**: 
  - CPU: 双核及以上
  - 内存: 建议 4GB 以上
  - 存储: 至少 5GB 可用空间

### 本地环境
- **SSH 访问**: 需要开启 SSH 服务
  - 控制面板 → 终端机和 SNMP → 启动 SSH 功能
- **管理员权限**: 需要 admin 或有 sudo 权限的账号
- **工具**: SSH 客户端（Windows 用 PuTTY，Mac/Linux 用终端）

---

## 快速开始

### 1. 准备工作

```bash
# SSH 连接到群辉
ssh admin@你的NAS-IP

# 创建项目目录
sudo mkdir -p /volume1/docker/quiz/{mysql,backend,uploads,backups}
sudo chmod -R 755 /volume1/docker/quiz
```

### 2. 上传项目文件

**方法 A: 使用 File Station（推荐）**
1. 打开群辉 File Station
2. 导航到 `/volume1/docker/quiz/`
3. 上传整个项目文件夹

**方法 B: 使用 SCP**
```bash
# 在本地电脑执行
scp -r /path/to/quiz admin@你的NAS-IP:/volume1/docker/
```

### 3. 配置环境变量

```bash
# SSH 进入项目目录
cd /volume1/docker/quiz

# 复制环境变量模板
sudo cp .env.example .env

# 编辑环境变量
sudo nano .env
```

修改以下内容：
```bash
# MySQL 数据库密码（请修改为强密码）
MYSQL_ROOT_PASSWORD=你的数据库密码

# API 地址（替换为你的 NAS IP）
VITE_API_BASE_URL=http://192.168.1.100:3000

# 管理员密码（请修改为强密码）
VITE_ADMIN_PASSWORD=你的管理员密码
```

保存并退出（Ctrl+X, Y, Enter）

### 4. 启动服务

```bash
# 构建并启动所有容器
sudo docker-compose up -d

# 查看启动日志
sudo docker-compose logs -f

# 等待所有服务启动（约 1-2 分钟）
# 按 Ctrl+C 退出日志查看

# 检查服务状态
sudo docker-compose ps
```

**预期输出（所有服务都应该是 healthy）：**
```
NAME            STATE     STATUS                   PORTS
quiz-frontend   running   Up About a minute (healthy)   0.0.0.0:5173->80/tcp
quiz-backend    running   Up About a minute (healthy)   0.0.0.0:3000->3000/tcp
quiz-mysql      running   Up 2 minutes (healthy)        0.0.0.0:3306->3306/tcp
```

### 5. 验证部署

```bash
# 测试后端 API
curl http://localhost:3000/api/exams

# 测试前端（应返回 HTML）
curl http://localhost:5173

# 或在浏览器访问
# http://你的NAS-IP:5173
```

---

## 详细部署步骤

### 步骤 1: 数据库初始化（可选）

如果需要导入已有数据或初始化表结构：

```bash
# 方法 1: 使用初始化脚本
# 将 SQL 文件放在 backend/ 目录下，命名为 init.sql
# 取消 docker-compose.yml 中的注释：
# - ./backend/init.sql:/docker-entrypoint-initdb.d/init.sql

# 方法 2: 手动导入
sudo docker exec -i quiz-mysql mysql -uroot -p你的数据库密码 quiz_db < backup.sql
```

### 步骤 2: 检查网络连通性

```bash
# 检查容器间网络
sudo docker exec quiz-frontend ping -c 3 backend
sudo docker exec quiz-backend ping -c 3 mysql

# 检查端口监听
sudo netstat -tlnp | grep -E '3000|5173|3306'
```

### 步骤 3: 查看应用日志

```bash
# 查看所有服务日志
sudo docker-compose logs

# 查看特定服务日志
sudo docker-compose logs backend
sudo docker-compose logs frontend
sudo docker-compose logs mysql

# 实时跟踪日志
sudo docker-compose logs -f backend
```

### 步骤 4: 访问应用

在浏览器中访问：
- **前端首页**: `http://你的NAS-IP:5173`
- **管理后台**: `http://你的NAS-IP:5173/admin`
- **API 接口**: `http://你的NAS-IP:3000/api/exams`

---

## Lucky 反向代理配置

Lucky 是一个轻量级反向代理工具，可以让你通过域名访问应用，并支持 SSL。

### 前提条件
1. 已安装 Lucky 服务
2. 有自己的域名（可选）
3. 如需 HTTPS，需要 SSL 证书

### 方案 A: HTTP 基础配置（局域网访问）

在 Lucky 管理界面添加以下规则：

#### 规则 1: 前端访问
```
规则名称: Quiz 前端
监听端口: 80
域名: quiz.local（或留空用 IP 访问）
目标地址: http://127.0.0.1:5173
转发方式: 反向代理
启用: 是
```

#### 规则 2: 后端 API
```
规则名称: Quiz API
监听端口: 80
域名: 留空（与前端共享域名）
路径规则: /api/*
目标地址: http://127.0.0.1:3000
转发方式: 反向代理
启用: 是
```

### 方案 B: HTTPS 配置（推荐生产环境）

```
规则名称: Quiz HTTPS
监听端口: 443
域名: quiz.yourdomain.com
SSL 证书: 上传或选择已有证书
目标地址: http://127.0.0.1:5173

高级设置:
- 强制 HTTPS: 开启
- HTTP 自动跳转 HTTPS: 开启
- WebSocket 支持: 开启
```

### 方案 C: 统一端口访问前后端

如果希望通过同一个端口访问前后端（推荐）：

**Lucky 配置：**
```
# 规则 1: 前端
监听: 80
路径: /
目标: http://127.0.0.1:5173

# 规则 2: API
监听: 80
路径: /api/*
目标: http://127.0.0.1:3000
优先级: 高（比前端规则优先）
```

**修改前端配置：**
```bash
# 编辑 .env
sudo nano /volume1/docker/quiz/.env

# 修改 API 地址为相对路径
VITE_API_BASE_URL=/api
```

**重新构建前端：**
```bash
cd /volume1/docker/quiz
sudo docker-compose up -d --build frontend
```

### SSL 证书获取

**免费证书（Let's Encrypt）：**
1. 使用群辉内置的 Let's Encrypt
   - 控制面板 → 安全性 → 证书 → 新增
   - 选择 "从 Let's Encrypt 取得证书"
2. 在 Lucky 中选择该证书

---

## 运维管理

### 日常操作

```bash
# 查看所有容器状态
sudo docker-compose ps

# 查看资源使用情况
sudo docker stats

# 重启服务
sudo docker-compose restart                 # 重启所有
sudo docker-compose restart backend         # 重启后端
sudo docker-compose restart frontend        # 重启前端

# 停止服务
sudo docker-compose stop                    # 停止所有
sudo docker-compose down                    # 停止并删除容器（数据保留）

# 启动服务
sudo docker-compose up -d                   # 启动所有

# 查看日志
sudo docker-compose logs -f --tail=100      # 查看最近 100 行日志
```

### 更新应用

```bash
# 1. 备份数据（重要！）
sudo docker exec quiz-mysql mysqldump -uroot -p你的密码 quiz_db > backup_$(date +%Y%m%d).sql

# 2. 停止服务
sudo docker-compose down

# 3. 更新代码（通过 File Station 或 git pull）

# 4. 重新构建并启动
sudo docker-compose up -d --build

# 5. 检查状态
sudo docker-compose ps
sudo docker-compose logs -f
```

### 数据备份

#### 自动备份脚本

创建备份脚本：
```bash
sudo nano /volume1/docker/quiz/backup.sh
```

内容：
```bash
#!/bin/bash

# 配置
BACKUP_DIR="/volume1/docker/quiz/backups"
DB_PASSWORD="你的数据库密码"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
docker exec quiz-mysql mysqldump -uroot -p$DB_PASSWORD quiz_db > $BACKUP_DIR/quiz_db_$DATE.sql

# 备份上传文件（如果有）
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /volume1/docker/quiz/uploads/

# 保留最近 30 天的备份
find $BACKUP_DIR -name "quiz_db_*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

赋予执行权限：
```bash
sudo chmod +x /volume1/docker/quiz/backup.sh
```

**设置定时任务：**
1. 打开群辉 DSM
2. 控制面板 → 任务计划
3. 新增 → 计划的任务 → 用户定义的脚本
4. 设置：
   - 任务名称: Quiz 数据库备份
   - 用户账号: root
   - 计划: 每天凌晨 2:00
   - 任务设置: `/volume1/docker/quiz/backup.sh`

#### 手动备份

```bash
# 备份数据库
sudo docker exec quiz-mysql mysqldump -uroot -p你的密码 quiz_db > quiz_backup_$(date +%Y%m%d).sql

# 备份配置文件
sudo tar -czf config_backup_$(date +%Y%m%d).tar.gz .env docker-compose.yml
```

#### 恢复数据

```bash
# 恢复数据库
sudo docker exec -i quiz-mysql mysql -uroot -p你的密码 quiz_db < quiz_backup_20260119.sql

# 或从容器外恢复
cat backup.sql | sudo docker exec -i quiz-mysql mysql -uroot -p你的密码 quiz_db
```

### 监控和维护

#### 健康检查脚本

```bash
sudo nano /volume1/docker/quiz/healthcheck.sh
```

内容：
```bash
#!/bin/bash

CONTAINERS="quiz-mysql quiz-backend quiz-frontend"
ALL_HEALTHY=true

echo "=== Quiz System Health Check ==="
echo "Time: $(date)"
echo ""

for container in $CONTAINERS; do
    if docker ps | grep -q $container; then
        STATUS=$(docker inspect -f '{{.State.Health.Status}}' $container 2>/dev/null)
        if [ "$STATUS" = "healthy" ]; then
            echo "✓ $container: healthy"
        else
            echo "✗ $container: $STATUS"
            ALL_HEALTHY=false
        fi
    else
        echo "✗ $container: not running"
        ALL_HEALTHY=false
    fi
done

echo ""
if [ "$ALL_HEALTHY" = true ]; then
    echo "All services are healthy!"
    exit 0
else
    echo "Some services need attention!"
    exit 1
fi
```

```bash
sudo chmod +x /volume1/docker/quiz/healthcheck.sh

# 运行检查
sudo /volume1/docker/quiz/healthcheck.sh
```

#### 日志管理

日志会自动轮转（最多保留 3 个文件，每个最大 10MB），配置在 `docker-compose.yml` 中。

手动清理日志：
```bash
# 清理所有容器日志
sudo docker-compose down
sudo rm -rf /var/lib/docker/containers/*/*-json.log
sudo docker-compose up -d
```

---

## 故障排查

### 问题 1: 容器无法启动

**症状：** 执行 `docker-compose up -d` 后容器立即退出

**排查步骤：**
```bash
# 1. 查看详细日志
sudo docker-compose logs backend

# 2. 检查配置是否正确
sudo docker-compose config

# 3. 检查端口是否被占用
sudo netstat -tlnp | grep -E '3000|5173|3306'

# 4. 重新构建
sudo docker-compose build --no-cache
sudo docker-compose up -d
```

### 问题 2: 数据库连接失败

**症状：** 后端日志显示 "ECONNREFUSED" 或 "Access denied"

**排查步骤：**
```bash
# 1. 检查 MySQL 是否健康
sudo docker-compose ps
sudo docker logs quiz-mysql

# 2. 测试数据库连接
sudo docker exec quiz-mysql mysqladmin -uroot -p你的密码 ping

# 3. 进入数据库检查
sudo docker exec -it quiz-mysql mysql -uroot -p你的密码
SHOW DATABASES;
USE quiz_db;
SHOW TABLES;
EXIT;

# 4. 检查后端环境变量
sudo docker exec quiz-backend env | grep DB_

# 5. 检查网络连接
sudo docker exec quiz-backend ping mysql
```

**解决方案：**
- 确保 `.env` 文件中的密码正确
- 等待 MySQL 完全启动（health: healthy）
- 检查 `docker-compose.yml` 中的 `depends_on` 配置

### 问题 3: 前端无法访问后端

**症状：** 前端页面显示，但 API 请求失败（403/404/CORS）

**排查步骤：**
```bash
# 1. 检查前端环境变量
sudo docker exec quiz-frontend env | grep VITE_

# 2. 测试后端 API
curl http://localhost:3000/api/exams

# 3. 检查网络连接
sudo docker exec quiz-frontend ping backend

# 4. 查看 nginx 配置
sudo docker exec quiz-frontend cat /etc/nginx/conf.d/default.conf
```

**解决方案：**
- 确保 `.env` 中的 `VITE_API_BASE_URL` 正确
  - 局域网访问: `http://NAS-IP:3000`
  - 通过 Lucky: `http://域名/api` 或 `/api`
- 如果修改了 `.env`，需要重新构建前端：
  ```bash
  sudo docker-compose up -d --build frontend
  ```

### 问题 4: 端口被占用

**症状：** 启动时报错 "port is already allocated"

**排查步骤：**
```bash
# 查看端口占用
sudo netstat -tlnp | grep -E '3000|5173|3306'
sudo lsof -i :3000
```

**解决方案：**

方法 1: 停止占用端口的进程
```bash
sudo kill -9 PID
```

方法 2: 修改映射端口
```bash
# 编辑 docker-compose.yml
sudo nano docker-compose.yml

# 修改端口映射，例如：
# "8080:80" 代替 "5173:80"
# "8000:3000" 代替 "3000:3000"

# 同时修改 .env 中的 API 地址
VITE_API_BASE_URL=http://你的NAS-IP:8000
```

### 问题 5: 权限问题

**症状：** 日志显示 "Permission denied" 或无法写入文件

**解决方案：**
```bash
# 修复数据目录权限
sudo chown -R root:root /volume1/docker/quiz
sudo chmod -R 755 /volume1/docker/quiz

# 特殊目录（需要写入权限）
sudo chmod -R 777 /volume1/docker/quiz/mysql
sudo chmod -R 777 /volume1/docker/quiz/uploads
sudo chmod -R 777 /volume1/docker/quiz/backend
```

### 问题 6: 磁盘空间不足

**排查：**
```bash
# 查看磁盘使用
df -h

# 查看 Docker 磁盘使用
sudo docker system df

# 查看大文件
sudo du -sh /volume1/docker/quiz/*
```

**清理：**
```bash
# 清理未使用的镜像和容器
sudo docker system prune -a

# 清理旧的备份
sudo find /volume1/docker/quiz/backups -mtime +30 -delete

# 清理日志
sudo docker-compose down
sudo rm -rf /var/lib/docker/containers/*/*-json.log
sudo docker-compose up -d
```

### 问题 7: 性能问题

**症状：** 应用响应慢，CPU/内存使用高

**排查：**
```bash
# 查看资源使用
sudo docker stats

# 查看系统资源
top
free -h
```

**优化方案：**

1. 限制容器资源
```yaml
# 在 docker-compose.yml 中添加
services:
  backend:
    mem_limit: 512m
    mem_reservation: 256m
    cpus: 1.0
```

2. 启用 SSD 缓存（如果 NAS 有 SSD）
   - 存储空间管理员 → SSD 缓存 → 创建缓存
   - 选择包含 Docker 数据的存储池

3. 优化数据库
```bash
# 进入 MySQL
sudo docker exec -it quiz-mysql mysql -uroot -p你的密码

# 分析表
USE quiz_db;
ANALYZE TABLE exams, exam_results, user_answers;

# 优化表
OPTIMIZE TABLE exams, exam_results, user_answers;
```

### 常用诊断命令

```bash
# 完整健康检查
sudo docker-compose ps
sudo docker-compose logs --tail=50
sudo docker stats --no-stream
sudo df -h

# 重启所有服务
sudo docker-compose restart

# 完全重建（慎用，会删除容器但保留数据）
sudo docker-compose down
sudo docker-compose up -d --build

# 查看网络
sudo docker network ls
sudo docker network inspect quiz_quiz-network
```

---

## 访问地址总览

| 服务 | 局域网访问 | 通过 Lucky (HTTP) | 通过 Lucky (HTTPS) |
|-----|-----------|------------------|-------------------|
| 前端首页 | `http://NAS-IP:5173` | `http://quiz.domain.com` | `https://quiz.domain.com` |
| 管理后台 | `http://NAS-IP:5173/admin` | `http://quiz.domain.com/admin` | `https://quiz.domain.com/admin` |
| 后端API | `http://NAS-IP:3000/api/` | `http://quiz.domain.com/api/` | `https://quiz.domain.com/api/` |

---

## 安全建议

### 1. 修改默认密码

```bash
# 编辑 .env
sudo nano /volume1/docker/quiz/.env

# 修改以下值为强密码
MYSQL_ROOT_PASSWORD=使用强密码（包含大小写、数字、特殊字符）
VITE_ADMIN_PASSWORD=使用强密码

# 重新部署
sudo docker-compose down
sudo docker-compose up -d
```

### 2. 使用 HTTPS

- 通过 Lucky 配置 SSL 证书
- 强制 HTTPS 访问
- 定期更新证书

### 3. 限制访问

**方法 1: IP 白名单（Lucky）**
- 在 Lucky 规则中添加 IP 限制

**方法 2: 群辉防火墙**
```
控制面板 → 安全性 → 防火墙
- 创建规则限制访问端口 3000, 5173
- 仅允许内网 IP 访问
```

**方法 3: Docker 防火墙**
```bash
# 仅允许本地访问
# 修改 docker-compose.yml 端口映射
ports:
  - "127.0.0.1:3000:3000"  # 仅本机访问
  - "127.0.0.1:5173:80"
```

### 4. 定期更新

```bash
# 更新基础镜像
sudo docker-compose pull
sudo docker-compose up -d

# 更新应用代码
# 通过 git pull 或重新上传

# 重新构建
sudo docker-compose up -d --build
```

### 5. 备份策略

- 每天自动备份数据库
- 每周备份完整配置
- 备份保留 30 天
- 定期测试恢复流程

---

## 性能优化

### 1. 启用 SSD 缓存
- 存储空间管理员 → SSD 缓存
- 为 `/volume1` 启用读写缓存

### 2. 数据库优化
```bash
# 编辑 docker-compose.yml，添加 MySQL 优化参数
command:
  - --default-authentication-plugin=mysql_native_password
  - --character-set-server=utf8mb4
  - --collation-server=utf8mb4_unicode_ci
  - --innodb_buffer_pool_size=256M
  - --max_connections=100
```

### 3. Nginx 缓存优化
- 已在 `nginx.conf` 中配置 gzip 和静态资源缓存
- 如需 CDN，可配置额外的缓存头

---

## 附录

### A. 完整部署脚本

创建一键部署脚本：
```bash
sudo nano /volume1/docker/quiz/deploy.sh
```

内容：
```bash
#!/bin/bash

set -e

echo "🚀 Quiz System 部署脚本"
echo "======================="

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装"
    exit 1
fi

# 创建目录
echo "📁 创建数据目录..."
sudo mkdir -p /volume1/docker/quiz/{mysql,backend,uploads,backups}
sudo chmod -R 755 /volume1/docker/quiz

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "❌ .env 文件不存在，请先配置环境变量"
    echo "   sudo cp .env.example .env"
    echo "   sudo nano .env"
    exit 1
fi

# 停止旧容器
echo "🛑 停止旧容器..."
sudo docker-compose down 2>/dev/null || true

# 构建并启动
echo "🏗️  构建并启动服务..."
sudo docker-compose up -d --build

# 等待服务启动
echo "⏳ 等待服务启动（约 60 秒）..."
sleep 60

# 检查状态
echo "✅ 检查服务状态..."
sudo docker-compose ps

echo ""
echo "🎉 部署完成！"
echo ""
echo "📝 访问地址:"
NAS_IP=$(hostname -I | awk '{print $1}')
echo "   前端: http://$NAS_IP:5173"
echo "   后端: http://$NAS_IP:3000"
echo "   管理: http://$NAS_IP:5173/admin"
echo ""
echo "💡 查看日志:"
echo "   sudo docker-compose logs -f"
```

赋予执行权限并运行：
```bash
sudo chmod +x /volume1/docker/quiz/deploy.sh
sudo ./deploy.sh
```

### B. 卸载脚本

如需完全卸载：
```bash
#!/bin/bash
# uninstall.sh

echo "⚠️  这将删除所有容器和数据！"
read -p "确认继续吗？(yes/no): " confirm

if [ "$confirm" = "yes" ]; then
    # 停止并删除容器
    cd /volume1/docker/quiz
    sudo docker-compose down -v
    
    # 删除数据（可选）
    # sudo rm -rf /volume1/docker/quiz
    
    echo "✅ 卸载完成"
else
    echo "❌ 已取消"
fi
```

### C. 常用命令速查

```bash
# 启动
sudo docker-compose up -d

# 停止
sudo docker-compose down

# 重启
sudo docker-compose restart

# 查看状态
sudo docker-compose ps

# 查看日志
sudo docker-compose logs -f

# 重新构建
sudo docker-compose up -d --build

# 进入容器
sudo docker exec -it quiz-backend sh
sudo docker exec -it quiz-mysql mysql -uroot -p

# 备份数据库
sudo docker exec quiz-mysql mysqldump -uroot -p密码 quiz_db > backup.sql

# 恢复数据库
cat backup.sql | sudo docker exec -i quiz-mysql mysql -uroot -p密码 quiz_db
```

---

## 获取帮助

如遇到问题：
1. 查看本文档的"故障排查"部分
2. 查看容器日志：`sudo docker-compose logs`
3. 检查服务状态：`sudo docker-compose ps`
4. 检查健康检查：`sudo docker inspect quiz-backend`

---

**文档版本**: 1.0  
**更新日期**: 2026-01-19  
**适用环境**: 群辉 NAS DSM 7.0+, Docker 20.10+  
**维护者**: Quiz System Team
