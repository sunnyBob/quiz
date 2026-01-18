# 🚀 Cloudflare Tunnel 5 分钟快速配置

只需 5 个步骤，让您的 Quiz 系统通过 Cloudflare Tunnel 实现公网访问（无需公网 IP）。

---

## 📋 准备工作

- ✅ Cloudflare 账号（免费注册：https://dash.cloudflare.com/sign-up）
- ✅ 一个域名（已添加到 Cloudflare）
- ✅ NAS 可以访问互联网

---

## 🎯 5 步快速配置

### 步骤 1: 创建 Cloudflare Tunnel

1. 访问：https://one.dash.cloudflare.com/
2. 选择您的账号
3. 进入 **Access → Tunnels**
4. 点击 **"Create a tunnel"**
5. 选择 **"Cloudflared"**
6. 输入名称：`quiz-nas-tunnel`
7. 点击 **"Save tunnel"**

### 步骤 2: 复制 Token

1. 在安装页面，选择 **Docker** 选项卡
2. 找到类似这样的命令：
   ```bash
   docker run cloudflare/cloudflared:latest tunnel --no-autoupdate run --token eyJhIjoiXXXXXX...
   ```
3. **复制** `--token` 后面的那一长串字符（这就是 Token）
4. 保存这个 Token，马上要用

### 步骤 3: 配置路由

在 "Public Hostname" 选项卡：

**添加路由 1（前端）：**
```
Subdomain: quiz
Domain: yourdomain.com（选择您的域名）
Path: (留空)
Type: HTTP
URL: http://frontend:80
```

**添加路由 2（API）：**
```
Subdomain: quiz
Domain: yourdomain.com
Path: /api
Type: HTTP
URL: http://backend:3000
```

点击 **"Save tunnel"**

### 步骤 4: 配置 NAS

SSH 连接到 NAS：

```bash
# 进入项目目录
cd /volume1/docker/quiz

# 编辑环境变量
sudo nano .env
```

添加以下内容：

```bash
# Cloudflare Tunnel Token（粘贴步骤 2 中复制的 Token）
CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoiXXXXXXXXXXXX...

# API 地址（替换为您的域名）
VITE_API_BASE_URL=https://quiz.yourdomain.com/api
```

保存并退出（Ctrl+X, Y, Enter）

### 步骤 5: 启动服务

```bash
# 重新构建前端（因为修改了 API 地址）
sudo docker-compose up -d --build frontend

# 启动 Cloudflare Tunnel
sudo docker-compose up -d cloudflared

# 查看日志（确认 Tunnel 正常）
sudo docker-compose logs -f cloudflared
```

看到类似这样的日志说明成功：

```
INF Connection registered connIndex=0
INF Connection registered connIndex=1
```

按 Ctrl+C 退出日志查看。

---

## ✅ 验证配置

### 1. 检查 Cloudflare 面板

返回 Cloudflare Zero Trust 面板：
- Access → Tunnels
- 确认 tunnel 状态为 **HEALTHY**（绿色圆点）

### 2. 浏览器访问

打开浏览器，访问：
- **前端**: `https://quiz.yourdomain.com`
- **管理后台**: `https://quiz.yourdomain.com/admin`

---

## 🎉 完成！

恭喜！您的 Quiz 系统现在可以通过域名在任何地方访问了！

**优势：**
- ✅ 自动 HTTPS（SSL 证书自动管理）
- ✅ 无需公网 IP
- ✅ 无需端口转发
- ✅ 免费无限流量
- ✅ 自动 DDoS 防护

---

## 🛠️ 常用命令

```bash
# 查看所有服务状态
sudo docker-compose ps

# 查看 Cloudflare Tunnel 日志
sudo docker-compose logs -f cloudflared

# 重启 Tunnel
sudo docker-compose restart cloudflared

# 停止 Tunnel
sudo docker-compose stop cloudflared
```

---

## ❓ 遇到问题？

### 问题 1: Tunnel 显示 DOWN

**解决方案：**
```bash
# 检查日志
sudo docker-compose logs cloudflared

# 确认 Token 正确
sudo nano .env  # 检查 CLOUDFLARE_TUNNEL_TOKEN

# 重启服务
sudo docker-compose restart cloudflared
```

### 问题 2: 访问域名显示 404

**解决方案：**
1. 确认在 Cloudflare 面板配置了 Public Hostname
2. 等待 1-2 分钟让 DNS 生效
3. 检查服务是否正常：
   ```bash
   curl http://localhost:5173
   curl http://localhost:3000/api/exams
   ```

### 问题 3: API 请求失败（CORS 错误）

**解决方案：**
```bash
# 确认 API 地址使用域名
sudo nano .env
# 确保：VITE_API_BASE_URL=https://quiz.yourdomain.com/api

# 重新构建前端
sudo docker-compose up -d --build frontend
```

---

## 📚 进阶配置

查看完整文档了解更多高级功能：
- [CLOUDFLARE_TUNNEL_SETUP.md](./CLOUDFLARE_TUNNEL_SETUP.md) - 完整配置指南
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 部署文档

---

## 🔐 安全提示

1. **妥善保管 Token**
   - Token 类似密码，不要分享给他人
   - 不要提交到 Git 仓库

2. **配置访问控制（可选）**
   - 在 Cloudflare Zero Trust 中可以设置邮箱白名单
   - 限制特定国家/IP 访问

3. **定期更新**
   ```bash
   # 更新 Cloudflare Tunnel 镜像
   sudo docker-compose pull cloudflared
   sudo docker-compose up -d cloudflared
   ```

---

**🎊 享受您的 Quiz 系统吧！**

任何问题请查看完整文档或检查日志。
