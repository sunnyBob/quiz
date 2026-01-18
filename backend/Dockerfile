FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 安装 curl 和 wget 用于健康检查
RUN apk add --no-cache curl wget

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖（生产环境）
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建 TypeScript
RUN npm run build

# 创建数据目录
RUN mkdir -p /app/data /app/uploads

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/exams || exit 1

# 启动应用
CMD ["node", "dist/index.js"]
