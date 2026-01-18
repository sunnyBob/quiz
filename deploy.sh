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
mkdir -p /volume1/docker/quiz/{mysql,backend,uploads,backups}
chmod -R 755 /volume1/docker/quiz

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "❌ .env 文件不存在，请先配置环境变量"
    echo "   cp .env.example .env"
    echo "   nano .env"
    exit 1
fi

# 停止旧容器
echo "🛑 停止旧容器..."
docker-compose down 2>/dev/null || true

# 构建并启动
echo "🏗️  构建并启动服务..."
docker-compose up -d --build

# 等待服务启动
echo "⏳ 等待服务启动（约 60 秒）..."
sleep 60

# 检查状态
echo "✅ 检查服务状态..."
docker-compose ps

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
echo "   docker-compose logs -f"
