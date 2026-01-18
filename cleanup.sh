#!/bin/bash

# 清理发布前的无关文档和敏感信息

echo "🧹 开始清理项目..."

# 删除开发文档
echo "📄 删除开发文档..."
rm -f ADMIN_UX_OPTIMIZATION.md
rm -f ANSWER_LOGIC_FIX.md
rm -f ANTI_CHEATING_AND_RANKING_FEATURE.md
rm -f BILINGUAL_FEATURE_SUMMARY.md
rm -f BROWSER_LANGUAGE_DETECTION.md
rm -f BROWSER_LANGUAGE_IMPLEMENTATION.md
rm -f BROWSER_LANGUAGE_QUICK_TEST.md
rm -f CHANGELOG_BROWSER_LANGUAGE.md
rm -f CLEANUP_QUICK_REF.md
rm -f DATABASE_CLEANUP_GUIDE.md
rm -f DESIGN_EVALUATION_REPORT.md
rm -f DUPLICATE_NAME_FIX.md
rm -f DUPLICATE_NAME_QUICK_DEPLOY.md
rm -f E2E_TEST_GUIDE.md
rm -f EXAM_ENTRY_QUICKSTART.md
rm -f EXAM_ENTRY_UX_IMPROVEMENT_PROPOSAL.md
rm -f EXAM_FEEDBACK_FEATURES.md
rm -f EXAM_FEEDBACK_TEST_GUIDE.md
rm -f EXAM_TIME_LIMIT_FEATURE.md
rm -f I18N_IMPLEMENTATION_SUMMARY.md
rm -f I18N_QUICKSTART.md
rm -f I18N_TEST_GUIDE.md
rm -f I18N_TEST_QUICK_GUIDE.md
rm -f JSON_EXPORT_FEATURE.md
rm -f MOTIVATIONAL_FEEDBACK.md
rm -f QUESTION_PREVIEW_BUG_FIX.md
rm -f QUIZ_INTERFACE_OPTIMIZATION.md
rm -f QUIZ_UI_IMPROVEMENTS.md
rm -f SUBMIT_CONFIRMATION_FEATURE.md
rm -f SUMMARY_BROWSER_LANGUAGE.md
rm -f SUMMARY_FEATURES.md
rm -f TEST_PLAN.md
rm -f TESTING_QUICK_REFERENCE.md
rm -f TESTING_README.md
rm -f TIME_LIMIT_IMPLEMENTATION_SUMMARY.md
rm -f quiz-system-feature.md
rm -f quiz.md
rm -f claude_code_knowledge_review.json
rm -f BUG_FIX_STATS_DISPLAY.md
rm -f BILINGUAL_TEST_GUIDE.md
rm -f EXAM_ENTRY_IMPLEMENTATION_SUMMARY.md
rm -f I18N_BUG_FIX.md
rm -f TEST_REPORT_TEMPLATE.md

# 删除 openspec 目录（开发规范文档）
echo "📁 删除 openspec 目录..."
rm -rf openspec/

# 删除 .cursor 目录
echo "📁 删除 .cursor 目录..."
rm -rf .cursor/

# 删除数据库文件（生产环境应该使用专门的数据库）
echo "🗄️ 删除开发数据库..."
rm -f backend/quiz.db

# 删除备份脚本和测试脚本
echo "🔧 删除开发脚本..."
rm -f backend/add-test-answers.js
rm -f backend/add-test-results.js
rm -f backend/backup-db.sh
rm -f backend/clean-database.sql
rm -f backend/clean-db.sh
rm -f backend/migrate-duplicate-name-fix.sh
rm -f backend/migrate-language.js

# 创建 .env.example 文件（不包含真实密码）
echo "📝 创建 .env.example 文件..."
cat > backend/.env.example << 'EOF'
# 数据库配置
DB_HOST=localhost
DB_USER=your_database_user
DB_PASSWORD=your_secure_password_here
DB_NAME=quiz_db

# 服务器配置
PORT=3000

# 前端URL（用于CORS）
FRONTEND_URL=http://localhost:5173
EOF

cat > frontend/.env.example << 'EOF'
# API 基础URL
VITE_API_BASE_URL=http://localhost:3000

# 管理员密码（请修改为安全的密码）
VITE_ADMIN_PASSWORD=your_secure_admin_password_here
EOF

echo "⚠️  请手动修改以下文件中的敏感信息："
echo "  - backend/.env (数据库密码)"
echo "  - frontend/.env (管理员密码)"
echo ""
echo "✅ 清理完成！"
echo "📦 项目已准备好发布"
echo ""
echo "🔐 安全提示："
echo "  1. 请修改 backend/.env 中的 DB_PASSWORD"
echo "  2. 请创建 frontend/.env 并设置 VITE_ADMIN_PASSWORD"
echo "  3. 不要将 .env 文件提交到 Git"
