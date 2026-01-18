#!/bin/bash

# Quiz System 数据备份脚本
# 用于定期备份数据库和重要文件

# 配置
BACKUP_DIR="/volume1/docker/quiz/backups"
DB_PASSWORD="${MYSQL_ROOT_PASSWORD:-Quiz@DB2026}"
DATE=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=30

# 创建备份目录
mkdir -p $BACKUP_DIR

echo "=== Quiz System Backup Started ==="
echo "Time: $(date)"
echo "Backup directory: $BACKUP_DIR"
echo ""

# 备份数据库
echo "📦 Backing up database..."
if docker exec quiz-mysql mysqldump -uroot -p$DB_PASSWORD quiz_db > $BACKUP_DIR/quiz_db_$DATE.sql 2>/dev/null; then
    echo "✓ Database backup completed: quiz_db_$DATE.sql"
else
    echo "✗ Database backup failed"
fi

# 备份上传文件（如果存在）
if [ -d "/volume1/docker/quiz/uploads" ] && [ "$(ls -A /volume1/docker/quiz/uploads)" ]; then
    echo "📦 Backing up upload files..."
    tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C /volume1/docker/quiz uploads/ 2>/dev/null
    echo "✓ Upload files backup completed: uploads_$DATE.tar.gz"
fi

# 备份配置文件
echo "📦 Backing up configuration..."
tar -czf $BACKUP_DIR/config_$DATE.tar.gz -C /volume1/docker/quiz .env docker-compose.yml 2>/dev/null
echo "✓ Configuration backup completed: config_$DATE.tar.gz"

# 清理旧备份
echo ""
echo "🧹 Cleaning old backups (older than $KEEP_DAYS days)..."
find $BACKUP_DIR -name "quiz_db_*.sql" -mtime +$KEEP_DAYS -delete
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +$KEEP_DAYS -delete
find $BACKUP_DIR -name "config_*.tar.gz" -mtime +$KEEP_DAYS -delete

# 显示备份大小
echo ""
echo "📊 Backup summary:"
du -sh $BACKUP_DIR/*_$DATE.* 2>/dev/null || echo "No backups created"

echo ""
echo "=== Backup Completed ==="
echo "Backup date: $DATE"
echo "Total backups: $(ls -1 $BACKUP_DIR | wc -l) files"
