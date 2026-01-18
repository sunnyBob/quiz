#!/bin/bash

# Quiz System 健康检查脚本
# 用于监控所有服务的运行状态

CONTAINERS="quiz-mysql quiz-backend quiz-frontend"
ALL_HEALTHY=true

echo "=== Quiz System Health Check ==="
echo "Time: $(date)"
echo ""

for container in $CONTAINERS; do
    if docker ps | grep -q $container; then
        STATUS=$(docker inspect -f '{{.State.Health.Status}}' $container 2>/dev/null)
        if [ -z "$STATUS" ]; then
            # 容器没有健康检查配置
            if [ "$(docker inspect -f '{{.State.Status}}' $container)" = "running" ]; then
                echo "✓ $container: running (no healthcheck)"
            else
                echo "✗ $container: not running"
                ALL_HEALTHY=false
            fi
        elif [ "$STATUS" = "healthy" ]; then
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

# 检查端口监听
echo ""
echo "=== Port Status ==="
for port in 3000 5173 3306; do
    if netstat -tln 2>/dev/null | grep -q ":$port " || ss -tln 2>/dev/null | grep -q ":$port "; then
        echo "✓ Port $port: listening"
    else
        echo "✗ Port $port: not listening"
        ALL_HEALTHY=false
    fi
done

# 检查磁盘空间
echo ""
echo "=== Disk Usage ==="
df -h /volume1/docker/quiz 2>/dev/null || df -h .

# 检查容器资源
echo ""
echo "=== Container Resources ==="
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" $CONTAINERS 2>/dev/null || echo "Unable to get stats"

echo ""
if [ "$ALL_HEALTHY" = true ]; then
    echo "✅ All services are healthy!"
    exit 0
else
    echo "⚠️  Some services need attention!"
    exit 1
fi
