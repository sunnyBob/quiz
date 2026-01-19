# 群辉 NAS Docker 部署指南 - 学习版

本指南将带你一步步在群辉 NAS 上部署这个考试系统，每个步骤都会解释原理和作用。

## 📋 目录

1. [环境准备](#1-环境准备)
2. [理解项目架构](#2-理解项目架构)
3. [创建数据目录](#3-创建数据目录)
4. [配置环境变量](#4-配置环境变量)
5. [理解 Docker Compose 配置](#5-理解-docker-compose-配置)
6. [构建和启动服务](#6-构建和启动服务)
7. [验证部署](#7-验证部署)
8. [日常运维](#8-日常运维)
9. [故障排查](#9-故障排查)

---

## 1. 环境准备

### 1.1 确认已安装的套件

登录群辉 DSM 管理界面，确认已安装：
- **Container Manager**（或旧版本的 Docker 套件）
- **File Station**

### 1.2 启用 SSH 访问

1. 打开 **控制面板** → **终端机和 SNMP**
2. 勾选 **启动 SSH 功能**
3. 端口默认是 22（可以自定义）
4. 点击应用

### 1.3 SSH 连接到群辉

在你的电脑上打开终端（macOS/Linux）或 PowerShell（Windows）：

```bash
# 替换为你的群辉用户名和 IP 地址
ssh your-username@192.168.x.x
```

输入密码后，你会看到类似这样的提示符：
```
your-username@NAS-Name:~$
```

### 1.4 切换到项目目录

```bash
# 查看你克隆代码的位置，假设在 /volume1/docker/quiz
cd /volume1/docker/quiz

# 确认代码已经拉取
ls -la
```

你应该能看到 `backend/`、`frontend/`、`docker-compose.yml` 等文件。

**💡 学习点：什么是 volume1？**
- 群辉的存储池命名为 volume1、volume2 等
- `/volume1/` 是你的第一个存储池的挂载点
- 通常在 File Station 中看到的根目录就是 `/volume1/`

---

## 2. 理解项目架构

这个项目由三个主要部分组成：

```
┌─────────────────────────────────────────────┐
│            用户浏览器                         │
│         http://nas-ip:8080                   │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │  Frontend 前端   │  (Nginx + React)
         │   容器端口: 80   │  映射到宿主机 8080
         └────────┬─────────┘
                  │ API 调用
                  ▼
         ┌─────────────────┐
         │  Backend 后端    │  (Node.js + Express)
         │   容器端口: 3000 │  映射到宿主机 3000
         └────────┬─────────┘
                  │ 数据库查询
                  ▼
         ┌─────────────────┐
         │  MySQL 数据库    │  (MySQL 8.0)
         │   容器端口: 3306 │  映射到宿主机 3306
         └─────────────────┘
```

**💡 学习点：为什么要三个容器？**
- **前端容器**：静态文件服务，用 Nginx 提供高性能的 HTTP 服务
- **后端容器**：业务逻辑处理，API 接口
- **数据库容器**：数据持久化存储

**💡 学习点：Docker 网络**
- 三个容器通过 `quiz-network` 虚拟网络互相通信
- 容器内部使用服务名（如 `mysql`、`backend`）而不是 IP 地址
- 这样即使容器重启 IP 变化，服务间通信也不会中断

---

## 3. 创建数据目录

### 3.1 为什么需要数据目录？

Docker 容器是临时的，删除容器后数据会丢失。我们需要把重要数据存储在宿主机（群辉）上：

- **mysql/** - 数据库文件

### 3.2 创建目录

```bash
# 在 SSH 终端执行
sudo mkdir -p /volume1/docker/quiz/mysql
```

**💡 学习点：sudo 是什么？**
- `sudo` 表示以管理员权限执行命令
- 创建系统目录需要管理员权限
- 执行后会要求输入密码

### 3.3 设置目录权限

```bash
# 给目录完全的读写权限
sudo chmod -R 777 /volume1/docker/quiz/mysql
```

**💡 学习点：chmod 777 是什么意思？**
- `chmod` 是修改文件权限的命令
- `777` 表示所有人（owner/group/others）都有读写执行权限
- `-R` 表示递归，应用到目录下的所有文件
- 生产环境建议使用更严格的权限，这里为了简化使用 777

### 3.4 验证目录创建

```bash
ls -la /volume1/docker/quiz/
```

你应该看到：
```
drwxrwxrwx  2 root root  4096 Jan 19 10:00 mysql
```

---

## 4. 配置环境变量

### 4.1 为什么需要环境变量？

环境变量用于配置应用的运行参数，比如：
- 数据库密码
- 管理员密码
- 时区设置

这样做的好处：
- ✅ 密码不会出现在代码中
- ✅ 不同环境可以使用不同配置
- ✅ 便于维护和安全管理

### 4.2 创建 .env 文件

```bash
# 确保在项目根目录
cd /volume1/docker/quiz

# 创建环境变量文件
nano .env
```

**💡 学习点：nano 编辑器**
- `nano` 是一个简单的命令行文本编辑器
- 执行命令后会进入编辑界面

### 4.3 输入配置内容

在 nano 编辑器中输入（或复制粘贴）：

```bash
# MySQL 数据库 root 用户密码（请修改为强密码）
MYSQL_ROOT_PASSWORD=YourStrongPassword123!

# 管理员登录密码（请修改为强密码）
VITE_ADMIN_PASSWORD=YourAdminPassword123!

# 时区设置（中国使用 Asia/Shanghai）
TZ=Asia/Shanghai
```

**保存文件：**
1. 按 `Ctrl + O` (WriteOut 写入)
2. 按 `Enter` 确认文件名
3. 按 `Ctrl + X` 退出编辑器

### 4.4 验证文件创建

```bash
cat .env
```

你应该看到刚才输入的内容。

**💡 学习点：密码安全性**
- 建议使用包含大小写字母、数字、特殊字符的密码
- 长度至少 12 位
- 不要使用简单的密码如 "123456"
- `.env` 文件已在 `.gitignore` 中，不会被提交到代码仓库

---

## 5. 理解 Docker Compose 配置

### 5.1 查看 docker-compose.yml

```bash
cat docker-compose.yml
```

让我们逐段理解这个文件：

### 5.2 MySQL 服务配置

```yaml
mysql:
  image: mysql:8.0                    # 使用 MySQL 8.0 官方镜像
  container_name: quiz-mysql          # 容器名称
  restart: always                     # 总是自动重启
  environment:                        # 环境变量
    MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-Quiz@DB2026}  # root 密码
    MYSQL_DATABASE: quiz_db           # 自动创建的数据库名
  volumes:                            # 数据卷映射
    - quiz-mysql-data:/var/lib/mysql  # 数据库文件持久化
  ports:                              # 端口映射
    - "3306:3306"                     # 宿主机:容器
```

**💡 学习点：环境变量语法**
- `${MYSQL_ROOT_PASSWORD:-Quiz@DB2026}` 表示：
  - 如果 `.env` 中定义了 `MYSQL_ROOT_PASSWORD`，使用该值
  - 否则使用默认值 `Quiz@DB2026`

**💡 学习点：volumes 数据卷**
- `quiz-mysql-data:/var/lib/mysql` 表示：
  - 左边：数据卷名称（在文件底部定义）
  - 右边：容器内的路径
  - 实际数据存储在 `/volume1/docker/quiz/mysql`

### 5.3 Backend 服务配置

```yaml
backend:
  build:
    context: ./backend                # Dockerfile 所在目录
    dockerfile: Dockerfile            # Dockerfile 文件名
  environment:
    DB_HOST: mysql                    # 数据库主机（使用服务名）
    DB_USER: root
    DB_PASSWORD: ${MYSQL_ROOT_PASSWORD}  # 从 .env 读取
    DB_NAME: quiz_db
  depends_on:                         # 依赖关系
    mysql:
      condition: service_healthy      # 等待 MySQL 健康检查通过
```

**💡 学习点：为什么 DB_HOST 是 mysql？**
- Docker Compose 会创建一个虚拟网络
- 每个服务可以通过服务名访问其他服务
- `mysql` 是 MySQL 服务的名称，Docker 会自动解析为容器 IP

**💡 学习点：depends_on 依赖**
- 确保 MySQL 先启动并健康运行
- 然后才启动 backend
- 避免后端连接数据库失败

### 5.4 Frontend 服务配置

```yaml
frontend:
  build:
    context: ./frontend
    args:                             # 构建参数
      VITE_API_BASE_URL: ""           # API 基础路径
      VITE_ADMIN_PASSWORD: ${VITE_ADMIN_PASSWORD}
  ports:
    - "8080:80"                       # 前端访问端口
  depends_on:
    - backend                         # 确保后端先启动
```

**💡 学习点：构建参数 vs 环境变量**
- `args` 是在构建镜像时使用的参数
- `environment` 是在运行容器时使用的环境变量
- 前端是静态文件，需要在构建时注入配置

### 5.5 数据卷配置

```yaml
volumes:
  quiz-mysql-data:
    driver: local
    driver_opts:
      type: none
      o: bind                         # bind mount 类型
      device: /volume1/docker/quiz/mysql  # 实际存储路径
```

**💡 学习点：bind mount**
- 将宿主机目录直接挂载到容器
- 数据实际存储在群辉的文件系统中
- 便于备份和管理

---

## 6. 构建和启动服务

### 6.1 第一次构建镜像

```bash
# 确保在项目根目录
cd /volume1/docker/quiz

# 构建并启动所有服务（-d 表示后台运行）
docker-compose up -d --build
```

**💡 学习点：执行过程解析**

这个命令会依次执行：

1. **读取配置文件** - 解析 `docker-compose.yml` 和 `.env`
2. **创建网络** - 创建 `quiz-network` 虚拟网络
3. **拉取基础镜像** - 下载 `mysql:8.0`、`node:20-alpine`、`nginx:alpine`
4. **构建自定义镜像**：
   - Backend：
     - 复制代码到容器
     - 安装 npm 依赖
     - 编译 TypeScript 到 JavaScript
     - 清理开发依赖
   - Frontend：
     - 安装依赖
     - 构建 React 应用（打包成静态文件）
     - 复制到 Nginx 镜像
5. **创建数据卷** - 绑定到群辉目录
6. **启动容器** - 按依赖顺序启动（MySQL → Backend → Frontend）

### 6.2 观察构建过程

第一次构建会比较慢（5-15分钟），你会看到类似输出：

```
[+] Building 234.5s (23/23) FINISHED
 => [backend internal] load build definition
 => [backend] transferring context
 => [backend] npm ci
 => [backend] npm run build
 => [frontend] npm install
 => [frontend] npm run build
```

**💡 学习点：为什么第一次慢？**
- 需要下载基础镜像（几百MB）
- 需要下载所有 npm 依赖包
- 需要编译 TypeScript 和构建前端
- 后续启动会很快，因为镜像已缓存

### 6.3 等待服务启动

```bash
# 实时查看所有服务日志
docker-compose logs -f
```

按 `Ctrl + C` 可以退出日志查看（容器继续运行）。

**等待以下关键日志出现：**

1. **MySQL 就绪**：
   ```
   quiz-mysql | [Server] /usr/sbin/mysqld: ready for connections
   ```

2. **Backend 启动**：
   ```
   quiz-backend | Server running on port 3000
   quiz-backend | Database connected successfully
   ```

3. **Frontend 启动**：
   ```
   quiz-frontend | [notice] 1#1: start worker processes
   ```

---

## 7. 验证部署

### 7.1 检查容器状态

```bash
docker-compose ps
```

你应该看到 3 个容器都是 `Up` 状态：

```
NAME            COMMAND                  SERVICE    STATUS         PORTS
quiz-backend    "node dist/index.js"     backend    Up 2 minutes   0.0.0.0:3000->3000/tcp
quiz-frontend   "nginx -g 'daemon of…"   frontend   Up 2 minutes   0.0.0.0:8080->80/tcp
quiz-mysql      "docker-entrypoint.s…"   mysql      Up 2 minutes   0.0.0.0:3306->3306/tcp
```

**💡 学习点：状态说明**
- `Up 2 minutes` - 运行正常，已运行 2 分钟
- `0.0.0.0:8080->80/tcp` - 宿主机所有网卡的 8080 端口映射到容器 80 端口

### 7.2 测试后端 API

```bash
# 在 SSH 终端测试
curl http://localhost:3000/api/exams
```

如果返回 JSON 数据（即使是空数组 `[]`），说明后端正常：
```json
[]
```

### 7.3 测试数据库连接

```bash
# 进入 MySQL 容器
docker exec -it quiz-mysql bash

# 在容器内连接数据库（输入你设置的密码）
mysql -u root -p

# 输入密码后，执行 SQL 查看数据库
SHOW DATABASES;
USE quiz_db;
SHOW TABLES;

# 退出数据库
exit

# 退出容器
exit
```

你应该看到 `quiz_db` 数据库和相关数据表。

### 7.4 浏览器访问测试

1. **访问前端页面**：
   ```
   http://群辉IP:8080
   ```
   你应该看到考试系统的首页。

2. **访问管理员页面**：
   ```
   http://群辉IP:8080/admin
   ```
   输入你在 `.env` 中设置的 `VITE_ADMIN_PASSWORD`。

3. **测试后端 API**（在浏览器地址栏）：
   ```
   http://群辉IP:3000/api/exams
   ```
   应该返回 JSON 数据。

**💡 学习点：如果无法访问？**
- 检查群辉防火墙是否开放 8080 和 3000 端口
- 控制面板 → 安全性 → 防火墙
- 添加允许规则或临时禁用防火墙测试

---

## 8. 日常运维

### 8.1 查看服务状态

```bash
# 查看所有容器状态
docker-compose ps

# 查看容器详细信息
docker ps

# 查看容器资源使用
docker stats
```

**💡 学习点：docker stats**
- 实时显示 CPU、内存、网络使用情况
- 按 `Ctrl + C` 退出

### 8.2 查看日志

```bash
# 查看所有服务日志（最新 100 行）
docker-compose logs --tail=100

# 实时跟踪所有日志
docker-compose logs -f

# 只看某个服务的日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql

# 查看最近 1 小时的日志
docker-compose logs --since 1h
```

### 8.3 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart backend
docker-compose restart frontend
```

**💡 学习点：restart vs down + up**
- `restart` - 快速重启容器，不重新构建
- `down` + `up` - 完全停止后重新创建容器

### 8.4 停止服务

```bash
# 停止所有服务（不删除容器）
docker-compose stop

# 停止并删除容器（数据卷保留）
docker-compose down

# 停止并删除容器和网络，但保留镜像和数据卷
docker-compose down --volumes
```

**💡 学习点：数据安全**
- `stop` 和 `down` 不会删除数据卷
- 数据库文件在 `/volume1/docker/quiz/mysql` 中，不会丢失
- 除非使用 `--volumes` 参数

### 8.5 更新代码

当代码有更新时：

```bash
# 1. 停止服务
docker-compose down

# 2. 拉取最新代码
git pull

# 3. 重新构建并启动
docker-compose up -d --build
```

**💡 学习点：--build 参数**
- 强制重新构建镜像
- 确保代码更新被应用到镜像中
- 如果代码没变化，可以省略 `--build`

### 8.6 数据库备份

```bash
# 备份数据库到当前目录
docker exec quiz-mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} quiz_db > backup-$(date +%Y%m%d-%H%M%S).sql

# 查看备份文件
ls -lh backup-*.sql
```

**恢复备份：**

```bash
# 恢复数据库（谨慎操作，会覆盖现有数据）
docker exec -i quiz-mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} quiz_db < backup-20260119-100000.sql
```

**💡 学习点：定期备份**
- 建议每天自动备份
- 可以在群辉的任务计划中配置定时任务
- 备份文件可以下载到本地保存

### 8.7 查看容器内部

```bash
# 进入 backend 容器
docker exec -it quiz-backend sh

# 进入后可以执行：
ls -la          # 查看文件
cat dist/index.js   # 查看编译后的代码
env             # 查看环境变量
exit            # 退出容器
```

---

## 9. 故障排查

### 9.1 容器无法启动

**症状：** `docker-compose ps` 显示容器 `Exit 1` 或不断重启

**排查步骤：**

```bash
# 1. 查看容器日志
docker-compose logs backend
docker-compose logs mysql

# 2. 查看最近的错误
docker-compose logs --tail=50 | grep -i error

# 3. 检查容器状态
docker-compose ps
```

**常见原因和解决方法：**

1. **MySQL 启动失败**
   ```bash
   # 检查数据目录权限
   ls -la /volume1/docker/quiz/mysql
   
   # 重置权限
   sudo chmod -R 777 /volume1/docker/quiz/mysql
   
   # 如果数据损坏，删除数据重新初始化（会丢失数据！）
   docker-compose down
   sudo rm -rf /volume1/docker/quiz/mysql/*
   docker-compose up -d
   ```

2. **Backend 连接不上数据库**
   ```bash
   # 检查环境变量
   docker-compose config
   
   # 确认 MySQL 已就绪
   docker-compose logs mysql | grep "ready for connections"
   
   # 手动测试连接
   docker exec -it quiz-mysql mysql -u root -p
   ```

3. **端口冲突**
   ```bash
   # 检查端口占用
   sudo netstat -tulpn | grep 3306
   sudo netstat -tulpn | grep 8080
   
   # 修改 docker-compose.yml 中的端口映射
   # 例如改为 "8081:80" 或 "3001:3000"
   ```

### 9.2 无法访问前端

**症状：** 浏览器显示 "无法访问此网站"

**排查步骤：**

```bash
# 1. 检查 frontend 容器状态
docker-compose ps frontend

# 2. 检查日志
docker-compose logs frontend

# 3. 在 NAS 上测试本地访问
curl http://localhost:8080

# 4. 检查防火墙
# 在 DSM 控制面板 → 安全性 → 防火墙 中检查
```

### 9.3 后端 API 错误

**症状：** 前端可以访问，但功能报错

**排查步骤：**

```bash
# 1. 查看后端日志
docker-compose logs -f backend

# 2. 测试 API
curl http://localhost:3000/api/exams

# 3. 检查数据库连接
docker exec quiz-backend sh -c "env | grep DB_"

# 4. 进入容器检查
docker exec -it quiz-backend sh
ls -la dist/
```

### 9.4 数据丢失

**症状：** 重启后数据消失

**排查步骤：**

```bash
# 1. 检查数据卷配置
docker volume ls | grep quiz

# 2. 检查挂载点
docker inspect quiz-mysql | grep -A 10 Mounts

# 3. 检查实际文件
ls -la /volume1/docker/quiz/mysql/
```

**💡 学习点：数据持久化**
- 数据卷必须正确配置
- 检查 `docker-compose.yml` 中的 volumes 配置
- 确保宿主机目录存在且有权限

### 9.5 性能问题

**症状：** 响应慢，卡顿

**排查步骤：**

```bash
# 1. 查看资源使用
docker stats

# 2. 查看 NAS 整体资源
cat /proc/cpuinfo | grep processor | wc -l   # CPU 核心数
free -h                                       # 内存使用
df -h                                         # 磁盘使用

# 3. 优化建议
# - 限制容器资源使用
# - 升级 NAS 硬件
# - 优化数据库索引
```

### 9.6 完全重置

**如果一切都不工作，可以完全重置：**

```bash
# ⚠️ 警告：以下操作会删除所有数据！

# 1. 停止并删除所有容器
docker-compose down -v

# 2. 删除镜像
docker rmi quiz-backend quiz-frontend

# 3. 清理数据目录
sudo rm -rf /volume1/docker/quiz/mysql/*

# 4. 重新开始
docker-compose up -d --build
```

---

## 10. 进阶配置

### 10.1 配置反向代理

使用群辉自带的反向代理，配置域名访问：

1. 打开 **控制面板** → **登录门户** → **高级** → **反向代理服务器**
2. 点击 **新增**
3. 配置：
   - 来源：`https://quiz.yourdomain.com`, 端口 `443`
   - 目的地：`http://localhost`, 端口 `8080`
4. 保存并应用

### 10.2 启用 HTTPS

1. 在反向代理配置中选择已有的 SSL 证书
2. 或者使用 Let's Encrypt 申请免费证书
3. 配置好后访问 `https://quiz.yourdomain.com`

### 10.3 设置开机自启

Container Manager 默认会自动启动标记为 `restart: always` 的容器，无需额外配置。

验证：
```bash
# 查看重启策略
docker inspect quiz-backend | grep RestartPolicy -A 3
```

### 10.4 配置定时备份

在 **控制面板** → **任务计划** 中创建：

```bash
#!/bin/bash
BACKUP_DIR=/volume1/docker/quiz/backups
mkdir -p $BACKUP_DIR
docker exec quiz-mysql mysqldump -u root -pYourPassword quiz_db > $BACKUP_DIR/backup-$(date +%Y%m%d).sql
# 保留最近 7 天的备份
find $BACKUP_DIR -name "backup-*.sql" -mtime +7 -delete
```

---

## 🎓 学习总结

通过这个部署过程，你学到了：

1. **Docker 基础概念**：
   - 容器、镜像、数据卷的区别
   - Docker Compose 多容器编排
   - 网络和端口映射

2. **Linux 命令行**：
   - SSH 连接和基本操作
   - 文件和目录管理
   - 权限管理

3. **应用架构**：
   - 前后端分离架构
   - 容器化部署优势
   - 数据持久化方案

4. **运维技能**：
   - 日志查看和分析
   - 故障排查思路
   - 数据备份恢复

---

## 📚 延伸学习资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [群辉 Docker 教程](https://www.synology.com/zh-cn/dsm/packages/Docker)
- [MySQL 8.0 文档](https://dev.mysql.com/doc/refman/8.0/en/)

---

## 🆘 需要帮助？

如果遇到问题：
1. 查看本文档的"故障排查"部分
2. 检查日志：`docker-compose logs`
3. 搜索错误信息
4. 提交 Issue 到项目仓库

---

**祝你部署顺利！🚀**
