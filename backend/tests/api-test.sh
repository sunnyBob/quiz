#!/bin/bash

# Quiz System API 测试脚本
# 使用方法: ./api-test.sh [BASE_URL]
# 例如: ./api-test.sh http://localhost:3000

BASE_URL=${1:-http://localhost:3000}
PASSED=0
FAILED=0
EXAM_ID=""
USER_ID=""
RESULT_ID=""
QUESTION_ID=""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "Quiz System API 测试"
echo "Base URL: $BASE_URL"
echo "========================================="
echo ""

# 测试函数
test_case() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5
    
    echo -n "Testing: $name ... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" -H "Content-Type: application/json")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" -H "Content-Type: application/json" -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}PASS${NC} (HTTP $http_code)"
        ((PASSED++))
        echo "$body"
        return 0
    else
        echo -e "${RED}FAIL${NC} (Expected HTTP $expected_status, got HTTP $http_code)"
        echo "Response: $body"
        ((FAILED++))
        return 1
    fi
}

# 1. 创建考试
echo "========================================="
echo "1. 考试管理接口测试"
echo "========================================="

test_case "创建考试" "POST" "/api/exams" \
    '{"title":"自动化测试考试","description":"用于API测试","time_limit_minutes":30}' 200

if [ $? -eq 0 ]; then
    EXAM_ID=$(echo "$body" | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
    echo "Created Exam ID: $EXAM_ID"
fi

echo ""

# 2. 获取所有考试
test_case "获取所有考试" "GET" "/api/exams" "" 200
echo ""

# 3. 通过ID获取考试
if [ ! -z "$EXAM_ID" ]; then
    test_case "通过ID获取考试" "GET" "/api/exams/id/$EXAM_ID" "" 200
    echo ""
fi

# 4. 创建题目
echo "========================================="
echo "2. 题目管理接口测试"
echo "========================================="

if [ ! -z "$EXAM_ID" ]; then
    test_case "创建题目" "POST" "/api/questions" \
        "{\"exam_id\":$EXAM_ID,\"type\":\"CHOICE\",\"content\":\"1+1等于几？\",\"options\":[\"1\",\"2\",\"3\",\"4\"],\"correct_answer\":\"2\",\"explanation\":\"基础数学\"}" 200
    
    if [ $? -eq 0 ]; then
        QUESTION_ID=$(echo "$body" | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
        echo "Created Question ID: $QUESTION_ID"
    fi
    echo ""
fi

# 5. 批量导入题目
if [ ! -z "$EXAM_ID" ]; then
    test_case "批量导入题目" "POST" "/api/exams/$EXAM_ID/questions/batch" \
        "{\"questions\":[
            {\"type\":\"CHOICE\",\"content\":\"2+2等于几？\",\"options\":[\"2\",\"3\",\"4\",\"5\"],\"correct_answer\":\"4\",\"explanation\":\"加法\"},
            {\"type\":\"TRUE_FALSE\",\"content\":\"地球是圆的\",\"options\":[\"对\",\"错\"],\"correct_answer\":\"对\",\"explanation\":\"地理知识\"}
        ]}" 200
    echo ""
fi

# 6. 获取考试题目（不含答案）
if [ ! -z "$EXAM_ID" ]; then
    test_case "获取考试题目（考生视角）" "GET" "/api/exams/$EXAM_ID/questions" "" 200
    echo ""
fi

# 7. 创建用户
echo "========================================="
echo "3. 用户和答题接口测试"
echo "========================================="

if [ ! -z "$EXAM_ID" ]; then
    test_case "创建用户" "POST" "/api/users" \
        "{\"name\":\"测试用户_$(date +%s)\",\"examId\":$EXAM_ID}" 200
    
    if [ $? -eq 0 ]; then
        USER_ID=$(echo "$body" | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
        echo "Created User ID: $USER_ID"
    fi
    echo ""
fi

# 8. 创建用户（参数缺失）
test_case "创建用户（缺少name）" "POST" "/api/users" \
    "{\"examId\":1}" 400
echo ""

test_case "创建用户（缺少examId）" "POST" "/api/users" \
    "{\"name\":\"张三\"}" 400
echo ""

# 9. 创建答题会话
if [ ! -z "$USER_ID" ] && [ ! -z "$EXAM_ID" ]; then
    test_case "创建答题会话" "POST" "/api/results" \
        "{\"userId\":$USER_ID,\"examId\":$EXAM_ID}" 200
    
    if [ $? -eq 0 ]; then
        RESULT_ID=$(echo "$body" | grep -o '"resultId":[0-9]*' | grep -o '[0-9]*')
        echo "Created Result ID: $RESULT_ID"
    fi
    echo ""
fi

# 10. 提交答案
if [ ! -z "$RESULT_ID" ] && [ ! -z "$QUESTION_ID" ]; then
    test_case "提交答案" "POST" "/api/answers" \
        "{\"resultId\":$RESULT_ID,\"questionId\":$QUESTION_ID,\"userAnswer\":\"2\",\"duration\":15}" 200
    echo ""
    
    # 11. 重复提交答案（应该失败）
    test_case "防止重复答题" "POST" "/api/answers" \
        "{\"resultId\":$RESULT_ID,\"questionId\":$QUESTION_ID,\"userAnswer\":\"2\",\"duration\":15}" 409
    echo ""
fi

# 12. 获取答案
if [ ! -z "$RESULT_ID" ]; then
    test_case "获取用户答案" "GET" "/api/results/$RESULT_ID/answers" "" 200
    echo ""
fi

# 13. 更新进度
if [ ! -z "$RESULT_ID" ]; then
    test_case "更新答题进度" "PUT" "/api/results/$RESULT_ID/progress" \
        "{\"currentQuestionIndex\":1}" 200
    echo ""
fi

# 14. 获取结果详情
if [ ! -z "$RESULT_ID" ]; then
    test_case "获取结果详情" "GET" "/api/results/$RESULT_ID" "" 200
    echo ""
fi

# 15. 更新结果统计（完成考试）
if [ ! -z "$RESULT_ID" ]; then
    test_case "完成考试并更新统计" "PUT" "/api/results/$RESULT_ID" \
        "{\"score\":1,\"totalQuestions\":3,\"totalDuration\":45}" 200
    echo ""
fi

# 16. 获取完整结果详情（考试完成后）
if [ ! -z "$RESULT_ID" ]; then
    test_case "获取完整结果详情（含答案）" "GET" "/api/results/$RESULT_ID/details" "" 200
    echo ""
fi

# 17. 获取考试统计
echo "========================================="
echo "4. 管理员接口测试"
echo "========================================="

if [ ! -z "$EXAM_ID" ]; then
    test_case "获取考试统计" "GET" "/api/admin/exams/$EXAM_ID/stats" "" 200
    echo ""
fi

# 18. 获取考试记录
if [ ! -z "$EXAM_ID" ]; then
    test_case "获取考试的所有记录" "GET" "/api/exams/$EXAM_ID/results" "" 200
    echo ""
fi

# 19. 边界测试
echo "========================================="
echo "5. 边界条件和错误处理测试"
echo "========================================="

test_case "获取不存在的考试" "GET" "/api/exams/id/99999" "" 404
echo ""

test_case "获取不存在的结果" "GET" "/api/results/99999" "" 404
echo ""

test_case "更新不存在的题目" "PUT" "/api/questions/99999" \
    "{\"content\":\"更新内容\"}" 404
echo ""

test_case "删除不存在的考试" "DELETE" "/api/exams/99999" "" 404
echo ""

# 20. 清理测试数据（可选）
echo ""
echo "========================================="
echo "6. 清理测试数据"
echo "========================================="

read -p "是否删除测试数据？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ ! -z "$EXAM_ID" ]; then
        test_case "删除测试考试" "DELETE" "/api/exams/$EXAM_ID" "" 200
        echo ""
    fi
fi

# 总结
echo ""
echo "========================================="
echo "测试总结"
echo "========================================="
echo -e "通过: ${GREEN}$PASSED${NC}"
echo -e "失败: ${RED}$FAILED${NC}"
echo -e "总计: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}所有测试通过！✓${NC}"
    exit 0
else
    echo -e "${RED}部分测试失败！✗${NC}"
    exit 1
fi
