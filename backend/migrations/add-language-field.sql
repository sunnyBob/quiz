-- 多语言支持 - 手动SQL迁移脚本
-- 如果自动迁移失败，可以手动执行此脚本

-- 为exams表添加language字段
ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'zh-CN' 
COMMENT '考卷内容语言 (zh-CN, en-US)' 
AFTER share_link_id;

-- 验证字段已添加
DESCRIBE exams;

-- 查看现有考卷（应该显示language字段，默认为'zh-CN'）
SELECT id, title, language, created_at FROM exams ORDER BY created_at DESC LIMIT 5;
