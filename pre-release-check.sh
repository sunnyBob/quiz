#!/bin/bash

# Quiz System 发布前检查脚本
# 使用方法: ./pre-release-check.sh

echo "========================================="
echo "Quiz System 发布前检查"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
WARNING=0

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNING++))
}

check_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# 1. 环境检查
echo "========================================="
echo "1. 环境检查"
echo "========================================="

# 检查Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    check_pass "Node.js 已安装: $NODE_VERSION"
else
    check_fail "Node.js 未安装"
fi

# 检查npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    check_pass "npm 已安装: $NPM_VERSION"
else
    check_fail "npm 未安装"
fi

# 检查MySQL
if command -v mysql &> /dev/null; then
    MYSQL_VERSION=$(mysql --version | awk '{print $5}' | sed 's/,//')
    check_pass "MySQL 已安装: $MYSQL_VERSION"
else
    check_warn "MySQL 命令未找到（可能已安装但不在PATH中）"
fi

echo ""

# 2. 项目结构检查
echo "========================================="
echo "2. 项目结构检查"
echo "========================================="

# 检查关键目录
if [ -d "backend" ]; then
    check_pass "backend/ 目录存在"
else
    check_fail "backend/ 目录不存在"
fi

if [ -d "frontend" ]; then
    check_pass "frontend/ 目录存在"
else
    check_fail "frontend/ 目录不存在"
fi

# 检查关键文件
if [ -f "README.md" ]; then
    check_pass "README.md 存在"
else
    check_warn "README.md 不存在"
fi

if [ -f "backend/package.json" ]; then
    check_pass "backend/package.json 存在"
else
    check_fail "backend/package.json 不存在"
fi

if [ -f "frontend/package.json" ]; then
    check_pass "frontend/package.json 存在"
else
    check_fail "frontend/package.json 不存在"
fi

if [ -f "backend/.env" ]; then
    check_pass "backend/.env 配置文件存在"
else
    check_fail "backend/.env 配置文件不存在（请创建并配置）"
fi

echo ""

# 3. 后端检查
echo "========================================="
echo "3. 后端检查"
echo "========================================="

cd backend 2>/dev/null

if [ $? -eq 0 ]; then
    # 检查依赖
    if [ -d "node_modules" ]; then
        check_pass "后端依赖已安装"
    else
        check_fail "后端依赖未安装，请运行: cd backend && npm install"
    fi
    
    # 检查TypeScript编译
    if [ -f "tsconfig.json" ]; then
        check_info "检查TypeScript类型..."
        npx tsc --noEmit 2>&1 | tee /tmp/tsc-output.txt
        if [ ${PIPESTATUS[0]} -eq 0 ]; then
            check_pass "TypeScript类型检查通过"
        else
            check_fail "TypeScript类型错误，请查看上方输出"
        fi
    fi
    
    # 检查关键源文件
    if [ -f "src/index.ts" ]; then
        check_pass "src/index.ts 存在"
    else
        check_fail "src/index.ts 不存在"
    fi
    
    if [ -f "src/dao.ts" ]; then
        check_pass "src/dao.ts 存在"
    else
        check_fail "src/dao.ts 不存在"
    fi
    
    if [ -f "src/schema.ts" ]; then
        check_pass "src/schema.ts 存在"
    else
        check_fail "src/schema.ts 不存在"
    fi
    
    # 检查编译输出
    if [ -d "dist" ]; then
        check_info "dist/ 编译目录存在"
    else
        check_warn "dist/ 目录不存在，请运行: npm run build"
    fi
    
    cd ..
else
    check_fail "无法进入backend目录"
fi

echo ""

# 4. 前端检查
echo "========================================="
echo "4. 前端检查"
echo "========================================="

cd frontend 2>/dev/null

if [ $? -eq 0 ]; then
    # 检查依赖
    if [ -d "node_modules" ]; then
        check_pass "前端依赖已安装"
    else
        check_fail "前端依赖未安装，请运行: cd frontend && npm install"
    fi
    
    # 检查TypeScript编译
    if [ -f "tsconfig.json" ]; then
        check_info "检查前端TypeScript类型..."
        npx tsc --noEmit 2>&1 | tee /tmp/tsc-frontend-output.txt
        if [ ${PIPESTATUS[0]} -eq 0 ]; then
            check_pass "前端TypeScript类型检查通过"
        else
            check_fail "前端TypeScript类型错误，请查看上方输出"
        fi
    fi
    
    # 检查ESLint
    check_info "运行ESLint检查..."
    npm run lint 2>&1 | tee /tmp/eslint-output.txt
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        check_pass "ESLint检查通过"
    else
        check_warn "ESLint发现问题，请查看上方输出"
    fi
    
    # 检查关键文件
    if [ -f "src/App.tsx" ]; then
        check_pass "src/App.tsx 存在"
    else
        check_fail "src/App.tsx 不存在"
    fi
    
    if [ -f "index.html" ]; then
        check_pass "index.html 存在"
    else
        check_fail "index.html 不存在"
    fi
    
    # 检查关键页面
    pages=("LandingPage.tsx" "QuizPage.tsx" "SummaryPage.tsx" "AdminLoginPage.tsx" "DashboardPage.tsx")
    for page in "${pages[@]}"; do
        if [ -f "src/pages/$page" ]; then
            check_pass "src/pages/$page 存在"
        else
            check_fail "src/pages/$page 不存在"
        fi
    done
    
    # 检查构建输出
    if [ -d "dist" ]; then
        check_info "dist/ 构建目录存在"
    else
        check_warn "dist/ 目录不存在，生产部署前需运行: npm run build"
    fi
    
    cd ..
else
    check_fail "无法进入frontend目录"
fi

echo ""

# 5. Git检查
echo "========================================="
echo "5. Git检查"
echo "========================================="

if [ -d ".git" ]; then
    check_pass "Git仓库已初始化"
    
    # 检查当前分支
    BRANCH=$(git branch --show-current)
    check_info "当前分支: $BRANCH"
    
    # 检查未提交的更改
    if [ -z "$(git status --porcelain)" ]; then
        check_pass "没有未提交的更改"
    else
        check_warn "存在未提交的更改"
        git status --short
    fi
    
    # 检查未推送的提交
    UNPUSHED=$(git log origin/$BRANCH..$BRANCH 2>/dev/null | wc -l)
    if [ $UNPUSHED -eq 0 ]; then
        check_pass "所有提交已推送"
    else
        check_warn "有 $UNPUSHED 个未推送的提交"
    fi
else
    check_warn "不是Git仓库"
fi

echo ""

# 6. 数据库检查
echo "========================================="
echo "6. 数据库检查"
echo "========================================="

if [ -f "backend/.env" ]; then
    check_info "读取数据库配置..."
    
    # 读取.env文件
    export $(cat backend/.env | grep -v '^#' | xargs)
    
    if [ ! -z "$DB_NAME" ]; then
        check_pass "数据库名称已配置: $DB_NAME"
    else
        check_fail "DB_NAME未配置"
    fi
    
    if [ ! -z "$DB_HOST" ]; then
        check_pass "数据库主机已配置: $DB_HOST"
    else
        check_fail "DB_HOST未配置"
    fi
    
    if [ ! -z "$DB_USER" ]; then
        check_pass "数据库用户已配置: $DB_USER"
    else
        check_fail "DB_USER未配置"
    fi
    
    # 尝试连接数据库（如果MySQL命令可用）
    if command -v mysql &> /dev/null; then
        check_info "尝试连接数据库..."
        mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -e "USE $DB_NAME;" 2>/dev/null
        if [ $? -eq 0 ]; then
            check_pass "数据库连接成功"
            
            # 检查表是否存在
            TABLES=$(mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -D $DB_NAME -e "SHOW TABLES;" 2>/dev/null | wc -l)
            if [ $TABLES -gt 1 ]; then
                check_pass "数据库表已创建（共 $((TABLES-1)) 张表）"
            else
                check_fail "数据库表未创建，请运行: cd backend && npm run init-db"
            fi
        else
            check_fail "无法连接数据库，请检查配置和MySQL服务"
        fi
    else
        check_warn "无法验证数据库连接（MySQL命令不可用）"
    fi
else
    check_fail "backend/.env文件不存在，无法检查数据库配置"
fi

echo ""

# 7. 安全检查
echo "========================================="
echo "7. 安全检查"
echo "========================================="

# 检查.env文件是否在.gitignore中
if [ -f ".gitignore" ]; then
    if grep -q "\.env" .gitignore; then
        check_pass ".env文件已在.gitignore中"
    else
        check_fail ".env文件未在.gitignore中，可能泄露敏感信息"
    fi
else
    check_warn ".gitignore文件不存在"
fi

# 检查是否有硬编码的密码或密钥
check_info "检查硬编码的敏感信息..."
if grep -r "password.*=.*['\"].*['\"]" --include="*.ts" --include="*.tsx" backend frontend 2>/dev/null | grep -v "node_modules" | grep -v "test" > /dev/null; then
    check_warn "发现可能的硬编码密码，请检查代码"
else
    check_pass "未发现明显的硬编码密码"
fi

echo ""

# 8. 功能完整性检查
echo "========================================="
echo "8. 功能完整性检查"
echo "========================================="

check_info "请手动确认以下功能已测试:"
echo "  - [ ] 用户可以访问考试链接并输入姓名"
echo "  - [ ] 用户可以答题并看到实时反馈"
echo "  - [ ] 答题进度可以保存和恢复"
echo "  - [ ] 时间限制功能正常（如适用）"
echo "  - [ ] 考试完成后可以查看摘要"
echo "  - [ ] 防作弊机制生效（禁止复制、水印等）"
echo "  - [ ] 管理员可以登录并创建考试"
echo "  - [ ] 管理员可以添加和管理题目"
echo "  - [ ] 管理员可以查看统计数据"
echo "  - [ ] 移动端浏览器显示正常"

echo ""

# 9. 文档检查
echo "========================================="
echo "9. 文档检查"
echo "========================================="

docs=("README.md" "TEST_PLAN.md" "DEPLOYMENT.md" "RUNNING.md")
for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        check_pass "$doc 存在"
    else
        check_warn "$doc 不存在（建议创建）"
    fi
done

echo ""

# 10. 性能检查建议
echo "========================================="
echo "10. 性能检查建议"
echo "========================================="

check_info "建议使用以下工具进行性能测试:"
echo "  - Chrome DevTools Lighthouse"
echo "  - 目标指标: Performance > 80, Accessibility > 90"
echo "  - 首页加载时间 < 2秒"
echo "  - API响应时间 < 500ms"

echo ""

# 总结
echo "========================================="
echo "检查总结"
echo "========================================="
echo -e "通过: ${GREEN}$PASSED${NC}"
echo -e "警告: ${YELLOW}$WARNING${NC}"
echo -e "失败: ${RED}$FAILED${NC}"
echo -e "总计: $((PASSED + WARNING + FAILED))"
echo ""

if [ $FAILED -eq 0 ] && [ $WARNING -eq 0 ]; then
    echo -e "${GREEN}========================================="
    echo "✓ 所有检查通过！系统已准备好发布"
    echo "=========================================${NC}"
    exit 0
elif [ $FAILED -eq 0 ]; then
    echo -e "${YELLOW}========================================="
    echo "⚠ 存在 $WARNING 个警告，建议修复后发布"
    echo "=========================================${NC}"
    exit 0
else
    echo -e "${RED}========================================="
    echo "✗ 存在 $FAILED 个失败项，请修复后再发布"
    echo "=========================================${NC}"
    exit 1
fi
