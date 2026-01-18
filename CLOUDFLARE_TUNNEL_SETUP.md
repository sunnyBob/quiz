# 🌐 Cloudflare Tunnel 配置指南

通过 Cloudflare Tunnel，您可以在只有 IPv6 的 NAS 上实现安全的公网访问，无需公网 IP、端口转发或复杂的网络配置。

---

## 📋 前置要求

1. **Cloudflare 账号**（免费）
2. **一个域名**（已添加到 Cloudflare）
3. **NAS 可以访问互联网**（IPv4 或 IPv6 均可）

---

## 🚀 快速开始（方案 A：使用 Tunnel Token）

### 步骤 1: 创建 Cloudflare Tunnel

**1. 登录 Cloudflare Zero Trust**
- 访问：https://one.dash.cloudflare.com/
- 选择您的账号
- 进入 **Access → Tunnels**

**2. 创建新 Tunnel**
```
点击 "Create a tunnel"
→ 选择 "Cloudflared"
→ 输入名称: quiz-nas-tunnel
→ 点击 "Save tunnel"
```

**3. 安装连接器**
- 选择 **Docker** 选项卡
- 复制显示的 Token（类似：`eyJhIjoiXXXXXX...`）
- 保存这个 Token，稍后会用到

**4. 配置路由**

在 "Public Hostname" 选项卡，添加以下规则：

**规则 1：前端应用**
```
Subdomain: quiz
Domain: yourdomain.com（选择您的域名）
Path: (留空)
Service:
  - Type: HTTP
  - URL: http://frontend:80
```

**规则 2：后端 API**
```
Subdomain: quiz
Domain: yourdomain.com
Path: /api
Service:
  - Type: HTTP
  - URL: http://backend:3000
```

**规则 3（可选）：管理后台**
```
Subdomain: quiz-admin
Domain: yourdomain.com
Path: (留空)
Service:
  - Type: HTTP
  - URL: http://frontend:80
Additional application settings:
  - No TLS Verify: 启用（如果使用自签名证书）
```

**5. 点击 "Save tunnel"**

### 步骤 2: 配置环境变量

编辑 NAS 上的 `.env` 文件：

```bash
# 在 NAS 上执行
cd /volume1/docker/quiz
sudo nano .env
```

添加以下内容：

```bash
# MySQL 配置
MYSQL_ROOT_PASSWORD=你的数据库密码

# Cloudflare Tunnel Token（从上面步骤复制）
CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoiXXXXXXXXXXXX...

# API 地址（使用域名访问）
VITE_API_BASE_URL=https://quiz.yourdomain.com/api

# 管理员密码
VITE_ADMIN_PASSWORD=你的管理员密码
```

### 步骤 3: 启动服务

```bash
# 重新构建前端（因为修改了 API 地址）
sudo docker-compose up -d --build frontend

# 启动 Cloudflare Tunnel
sudo docker-compose up -d cloudflared

# 查看所有服务状态
sudo docker-compose ps

# 查看 Cloudflare Tunnel 日志
sudo docker-compose logs -f cloudflared
```

### 步骤 4: 验证配置

**1. 检查 Tunnel 状态**
- 返回 Cloudflare Zero Trust 面板
- Access → Tunnels
- 确认 tunnel 状态为 "HEALTHY"（绿色）

**2. 测试访问**
```bash
# 测试前端
curl https://quiz.yourdomain.com

# 测试后端 API
curl https://quiz.yourdomain.com/api/exams
```

**3. 浏览器访问**
- 前端：`https://quiz.yourdomain.com`
- 管理后台：`https://quiz.yourdomain.com/admin`
- 或（如果配置了单独子域名）：`https://quiz-admin.yourdomain.com`

---

## 🔧 方案 B：手动配置（使用配置文件）

如果您想更精细地控制 Tunnel 配置，可以使用配置文件方式。

### 步骤 1: 生成 Tunnel 凭证

**在 NAS 上执行：**

```bash
# 安装 cloudflared（如果还没安装）
cd /tmp
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# 登录 Cloudflare
cloudflared tunnel login
# 会打开浏览器，选择您的域名并授权

# 创建 Tunnel
cloudflared tunnel create quiz-nas-tunnel

# 查看 Tunnel ID
cloudflared tunnel list
```

### 步骤 2: 创建配置文件

```bash
# 创建配置目录
sudo mkdir -p /volume1/docker/quiz/cloudflared

# 复制凭证文件
sudo cp ~/.cloudflared/*.json /volume1/docker/quiz/cloudflared/

# 创建配置文件
sudo nano /volume1/docker/quiz/cloudflared/config.yml
```

**config.yml 内容：**

```yaml
tunnel: <你的-tunnel-id>
credentials-file: /etc/cloudflared/credentials.json

ingress:
  # 前端应用
  - hostname: quiz.yourdomain.com
    service: http://frontend:80
  
  # 后端 API（路径匹配）
  - hostname: quiz.yourdomain.com
    path: /api/*
    service: http://backend:3000
  
  # 管理后台（可选，使用独立子域名）
  - hostname: quiz-admin.yourdomain.com
    service: http://frontend:80
  
  # 默认规则（必须）
  - service: http_status:404

# 可选：日志配置
loglevel: info

# 可选：性能优化
metrics: 0.0.0.0:2000
```

### 步骤 3: 修改 docker-compose.yml

使用配置文件方式的 Cloudflare Tunnel：

```yaml
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: quiz-cloudflared
    restart: always
    command: tunnel --config /etc/cloudflared/config.yml run
    volumes:
      - /volume1/docker/quiz/cloudflared/config.yml:/etc/cloudflared/config.yml:ro
      - /volume1/docker/quiz/cloudflared/credentials.json:/etc/cloudflared/credentials.json:ro
    networks:
      - quiz-network
    depends_on:
      - frontend
      - backend
```

### 步骤 4: 配置 DNS

```bash
# 配置 DNS 路由
cloudflared tunnel route dns quiz-nas-tunnel quiz.yourdomain.com
cloudflared tunnel route dns quiz-nas-tunnel quiz-admin.yourdomain.com
```

### 步骤 5: 启动服务

```bash
sudo docker-compose up -d cloudflared
sudo docker-compose logs -f cloudflared
```

---

## 🎯 与 Lucky 集成（可选）

如果您想同时使用 Lucky 和 Cloudflare Tunnel：

### 架构：
```
Internet
  ↓
Cloudflare CDN
  ↓ (Tunnel)
Lucky (本地反向代理 :80)
  ↓
Docker Services
```

### Lucky 配置：

**规则 1: 前端**
```
监听端口: 80
监听地址: 127.0.0.1（只监听本地）
路径: /
目标: http://127.0.0.1:5173
```

**规则 2: API**
```
监听端口: 80
监听地址: 127.0.0.1
路径: ^/api/
目标: http://127.0.0.1:3000
优先级: 高
```

### Cloudflare Tunnel 配置：

```yaml
ingress:
  - hostname: quiz.yourdomain.com
    service: http://host.docker.internal:80
  - service: http_status:404
```

**注意**：需要在 docker-compose.yml 中添加：

```yaml
  cloudflared:
    # ... 其他配置 ...
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

---

## 🔒 安全配置

### 1. 启用 Access 控制（可选）

如果想限制访问，可以在 Cloudflare Zero Trust 中配置：

```
Access → Applications → Add an application
→ Self-hosted
→ Application domain: quiz.yourdomain.com
→ Policy:
  - Allow: 
    - Emails: 指定邮箱
    - IP ranges: 特定 IP 段
    - Countries: 特定国家
```

### 2. 配置 WAF 规则

```
Websites → 选择域名 → Security → WAF
→ Create firewall rule:
  - Field: Hostname
  - Operator: equals
  - Value: quiz.yourdomain.com
  - Action: Managed Challenge（人机验证）
```

### 3. 限制请求速率

```
Websites → 选择域名 → Security → Rate limiting
→ Create rule:
  - If incoming requests match: quiz.yourdomain.com/api/*
  - Then: Block
  - For: 1 minute
  - When rate exceeds: 100 requests per minute
```

---

## 📊 监控和维护

### 查看 Tunnel 状态

```bash
# 查看日志
sudo docker-compose logs -f cloudflared

# 查看连接状态
sudo docker exec quiz-cloudflared cloudflared tunnel info

# 在 Cloudflare 面板查看
# Access → Tunnels → 点击您的 tunnel
```

### 常见状态

```
✅ Status: HEALTHY - 隧道正常运行
⚠️  Status: DOWN - 隧道断开连接
🔄 Status: DEGRADED - 隧道部分可用
```

### 重启 Tunnel

```bash
# 重启服务
sudo docker-compose restart cloudflared

# 查看日志确认
sudo docker-compose logs -f cloudflared
```

---

## 🛠️ 故障排查

### 问题 1: Tunnel 显示 DOWN

**检查步骤：**

```bash
# 1. 查看容器状态
sudo docker-compose ps cloudflared

# 2. 查看详细日志
sudo docker-compose logs --tail=100 cloudflared

# 3. 检查网络连接
sudo docker exec quiz-cloudflared ping -c 3 cloudflare.com

# 4. 检查 Token 是否正确
sudo docker-compose config | grep CLOUDFLARE_TUNNEL_TOKEN
```

**常见原因：**
- Token 错误或过期
- NAS 无法访问互联网
- 防火墙阻止了 Cloudflare 的连接
- DNS 解析问题

### 问题 2: 访问域名返回 404

**检查步骤：**

```bash
# 1. 确认服务可访问
curl http://localhost:5173
curl http://localhost:3000/api/exams

# 2. 检查 Tunnel 配置
# 在 Cloudflare 面板查看 Public Hostname 配置

# 3. 检查 DNS
dig quiz.yourdomain.com
# 应该看到 CNAME 记录指向 .cfargotunnel.com
```

### 问题 3: 前端可以访问，API 不行

**原因**：API 路径配置问题

**解决方案：**

1. 检查 Cloudflare Tunnel 的路径配置
2. 确保 API 规则在前端规则之前（优先级更高）
3. 检查前端的 `VITE_API_BASE_URL` 配置

```bash
# 重新构建前端
sudo docker-compose up -d --build frontend
```

### 问题 4: CORS 错误

**解决方案：**

修改 `VITE_API_BASE_URL` 使用相同域名：

```bash
# .env
VITE_API_BASE_URL=https://quiz.yourdomain.com/api
```

然后重新构建前端。

### 问题 5: 性能慢

**优化建议：**

1. **启用 Argo Smart Routing**（付费，但速度提升明显）
   - Cloudflare 面板 → Traffic → Argo

2. **配置缓存规则**
   - Cloudflare 面板 → Caching → Cache Rules

3. **启用 HTTP/3**
   - Cloudflare 面板 → Network → HTTP/3: 启用

---

## 🎁 额外功能

### 1. 配置自定义错误页面

在 Cloudflare Tunnel 配置中添加：

```yaml
ingress:
  - hostname: quiz.yourdomain.com
    service: http://frontend:80
    originRequest:
      connectTimeout: 30s
      noTLSVerify: false
```

### 2. 添加健康检查

```yaml
ingress:
  - hostname: quiz.yourdomain.com
    service: http://frontend:80
    originRequest:
      httpHostHeader: quiz.yourdomain.com
```

### 3. 配置多个环境

```yaml
# 生产环境
ingress:
  - hostname: quiz.yourdomain.com
    service: http://frontend:80
  
  # 测试环境
  - hostname: quiz-dev.yourdomain.com
    service: http://frontend-dev:80
  
  - service: http_status:404
```

---

## 📝 完整部署清单

- [ ] 注册 Cloudflare 账号
- [ ] 添加域名到 Cloudflare
- [ ] 创建 Cloudflare Tunnel
- [ ] 复制 Tunnel Token
- [ ] 在 NAS 上配置 `.env` 文件
- [ ] 修改 `VITE_API_BASE_URL` 为域名
- [ ] 重新构建前端容器
- [ ] 启动 Cloudflare Tunnel 容器
- [ ] 在 Cloudflare 配置公共主机名
- [ ] 测试访问
- [ ] 配置 SSL/TLS 设置（自动）
- [ ] 配置安全规则（可选）
- [ ] 配置访问控制（可选）

---

## 💰 费用说明

**免费套餐包括：**
- ✅ Cloudflare Tunnel（无限流量）
- ✅ 基础 CDN
- ✅ 自动 SSL 证书
- ✅ DDoS 防护
- ✅ 基础 WAF

**付费功能（可选）：**
- Argo Smart Routing（路由优化）：$5/月
- Zero Trust 高级功能：$7/用户/月
- Load Balancing：$5/月

对于个人项目，免费套餐完全够用！

---

## 🆘 获取帮助

- **Cloudflare 文档**: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- **Cloudflare 社区**: https://community.cloudflare.com/
- **查看日志**: `sudo docker-compose logs -f cloudflared`

---

**配置完成后，您就可以通过 `https://quiz.yourdomain.com` 在任何地方访问您的 Quiz 系统了！**
