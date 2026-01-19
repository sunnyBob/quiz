# ===== 构建阶段 =====
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖 (使用 npm install 以解决跨平台构建时的 optional dependencies 问题)
RUN npm install

# 复制源代码
COPY . .

# 构建参数
ARG VITE_API_BASE_URL
ARG VITE_ADMIN_PASSWORD

# 设置环境变量
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_ADMIN_PASSWORD=${VITE_ADMIN_PASSWORD}

# 构建应用
RUN npm run build

# ===== 生产阶段 =====
FROM nginx:alpine

# 安装 wget 用于健康检查
RUN apk add --no-cache wget

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80 || exit 1

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
