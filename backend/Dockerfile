FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 安装 curl 和 wget 用于健康检查
RUN apk add --no-cache curl wget

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装所有依赖（包括 devDependencies 用于构建）
RUN npm ci

# 复制源代码
COPY . .

# 构建 TypeScript
RUN npm run build

# 构建完成后清理开发依赖
RUN npm prune --production

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/exams || exit 1

# 启动应用
CMD ["node", "dist/index.js"]
