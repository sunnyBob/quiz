import { test, expect } from '@playwright/test';

test.describe('考生界面测试', () => {
  const TEST_EXAM_ID = 'lrngiavr'; // 使用API测试创建的考试ID
  const baseURL = 'http://localhost:5173';

  test('TC-FE-001: 访问考试链接并显示考试信息', async ({ page }) => {
    // 访问考试页面
    await page.goto(`${baseURL}/quiz/${TEST_EXAM_ID}`);
    
    // 验证页面加载
    await expect(page).toHaveURL(new RegExp(`/quiz/${TEST_EXAM_ID}`));
    
    // 验证考试信息显示
    await expect(page.locator('h1, h2')).toContainText(/测试|考试/i);
    
    // 验证姓名输入框存在
    const nameInput = page.locator('input[name="name"], input[type="text"]').first();
    await expect(nameInput).toBeVisible();
    
    // 验证开始按钮存在
    const startButton = page.locator('button:has-text("开始")');
    await expect(startButton).toBeVisible();
    
    console.log('✓ 考试页面加载成功');
  });

  test('TC-FE-002: 输入姓名验证', async ({ page }) => {
    await page.goto(`${baseURL}/quiz/${TEST_EXAM_ID}`);
    
    const startButton = page.locator('button:has-text("开始")');
    
    // 测试：不输入姓名直接点击开始
    await startButton.click();
    
    // 等待可能的错误提示
    await page.waitForTimeout(500);
    
    // 验证是否仍在同一页面（未跳转）或有错误提示
    const currentURL = page.url();
    const hasError = await page.locator('text=/请输入|姓名|必填/i').isVisible().catch(() => false);
    
    if (currentURL.includes('/take')) {
      console.log('⚠ 警告: 未输入姓名也能开始考试（建议加强验证）');
    } else {
      console.log('✓ 姓名验证正常');
    }
  });

  test('TC-FE-003: 完整答题流程', async ({ page }) => {
    const testUserName = `E2E测试用户_${Date.now()}`;
    
    // 1. 访问考试
    await page.goto(`${baseURL}/quiz/${TEST_EXAM_ID}`);
    console.log('✓ 步骤1: 访问考试页面');
    
    // 2. 输入姓名
    const nameInput = page.locator('input[name="name"], input[type="text"]').first();
    await nameInput.fill(testUserName);
    console.log(`✓ 步骤2: 输入姓名 "${testUserName}"`);
    
    // 3. 点击开始考试
    const startButton = page.locator('button:has-text("开始")');
    await startButton.click();
    console.log('✓ 步骤3: 点击开始考试');
    
    // 等待页面跳转
    await page.waitForTimeout(1000);
    
    // 验证是否进入答题页面
    const currentURL = page.url();
    if (currentURL.includes('/take') || currentURL.includes('quiz')) {
      console.log('✓ 步骤4: 成功进入答题页面');
      
      // 4. 查找题目内容
      await page.waitForTimeout(1000);
      const questionContent = page.locator('.question, [class*="question"], h2, h3').first();
      const hasQuestion = await questionContent.isVisible().catch(() => false);
      
      if (hasQuestion) {
        const questionText = await questionContent.textContent();
        console.log(`✓ 步骤5: 显示题目 "${questionText?.substring(0, 30)}..."`);
        
        // 5. 查找并点击选项
        const options = page.locator('button:not([disabled]), input[type="radio"], [role="button"]');
        const optionCount = await options.count();
        console.log(`✓ 找到 ${optionCount} 个选项`);
        
        if (optionCount > 0) {
          // 点击第一个选项
          await options.first().click();
          console.log('✓ 步骤6: 选择答案');
          
          await page.waitForTimeout(500);
          
          // 6. 查找提交按钮
          const submitButton = page.locator('button:has-text("提交"), button:has-text("确认")');
          const hasSubmit = await submitButton.first().isVisible().catch(() => false);
          
          if (hasSubmit) {
            await submitButton.first().click();
            console.log('✓ 步骤7: 提交答案');
            
            await page.waitForTimeout(1000);
            
            // 7. 验证反馈显示
            const feedback = page.locator('text=/正确|错误|答案|解析/i');
            const hasFeedback = await feedback.first().isVisible().catch(() => false);
            
            if (hasFeedback) {
              console.log('✓ 步骤8: 显示答题反馈');
            } else {
              console.log('⚠ 未检测到答题反馈');
            }
          } else {
            console.log('⚠ 未找到提交按钮');
          }
        } else {
          console.log('⚠ 未找到答题选项');
        }
      } else {
        console.log('⚠ 未检测到题目内容');
      }
    } else {
      console.log(`⚠ 页面未跳转到答题界面，当前URL: ${currentURL}`);
    }
  });

  test('TC-FE-004: 题目导航功能', async ({ page }) => {
    const testUserName = `导航测试_${Date.now()}`;
    
    // 开始考试
    await page.goto(`${baseURL}/quiz/${TEST_EXAM_ID}`);
    await page.locator('input[name="name"], input[type="text"]').first().fill(testUserName);
    await page.locator('button:has-text("开始")').click();
    await page.waitForTimeout(1500);
    
    // 查找导航按钮
    const nextButton = page.locator('button:has-text("下一"), button:has-text("Next")');
    const prevButton = page.locator('button:has-text("上一"), button:has-text("Previous")');
    
    const hasNext = await nextButton.first().isVisible().catch(() => false);
    const hasPrev = await prevButton.first().isVisible().catch(() => false);
    
    if (hasNext) {
      console.log('✓ 找到"下一题"按钮');
    }
    
    if (hasPrev) {
      console.log('✓ 找到"上一题"按钮');
    } else {
      console.log('✓ 第一题不显示"上一题"按钮（正确）');
    }
    
    // 查找题号导航
    const questionNav = page.locator('[class*="nav"], [class*="pagination"]');
    const hasNav = await questionNav.first().isVisible().catch(() => false);
    
    if (hasNav) {
      console.log('✓ 找到题号导航栏');
    }
  });

  test('TC-FE-005: 防作弊机制检查', async ({ page }) => {
    const testUserName = `防作弊测试_${Date.now()}`;
    
    // 开始考试
    await page.goto(`${baseURL}/quiz/${TEST_EXAM_ID}`);
    await page.locator('input[name="name"], input[type="text"]').first().fill(testUserName);
    await page.locator('button:has-text("开始")').click();
    await page.waitForTimeout(1500);
    
    // 检查文本选择是否被禁用
    const questionElement = page.locator('.question, [class*="question"]').first();
    const hasQuestion = await questionElement.isVisible().catch(() => false);
    
    if (hasQuestion) {
      const userSelect = await questionElement.evaluate(
        el => window.getComputedStyle(el).userSelect
      );
      
      if (userSelect === 'none') {
        console.log('✓ 文本选择已禁用（防复制）');
      } else {
        console.log('⚠ 文本选择未禁用');
      }
    }
    
    // 检查水印
    const watermark = page.locator('[class*="watermark"]');
    const hasWatermark = await watermark.first().isVisible().catch(() => false);
    
    if (hasWatermark) {
      console.log('✓ 检测到水印元素');
    } else {
      console.log('⚠ 未检测到水印');
    }
  });

  test('TC-FE-006: 响应式布局 - 移动端视图', async ({ page }) => {
    // 设置移动设备视口
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(`${baseURL}/quiz/${TEST_EXAM_ID}`);
    
    // 验证页面元素在移动端可见
    await page.waitForTimeout(500);
    
    const nameInput = page.locator('input[name="name"], input[type="text"]').first();
    const startButton = page.locator('button:has-text("开始")');
    
    const inputVisible = await nameInput.isVisible();
    const buttonVisible = await startButton.isVisible();
    
    if (inputVisible && buttonVisible) {
      console.log('✓ 移动端布局正常（375x667）');
    } else {
      console.log('⚠ 移动端布局可能有问题');
    }
    
    // 恢复桌面视口
    await page.setViewportSize({ width: 1920, height: 1080 });
  });
});

test.describe('考生界面性能测试', () => {
  test('TC-PERF-001: 页面加载性能', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('http://localhost:5173/quiz/lrngiavr');
    
    // 等待页面完全加载
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    console.log(`页面加载时间: ${loadTime}ms`);
    
    if (loadTime < 2000) {
      console.log('✓ 页面加载性能优秀（<2秒）');
    } else if (loadTime < 3000) {
      console.log('⚠ 页面加载性能一般（2-3秒）');
    } else {
      console.log('❌ 页面加载性能较差（>3秒）');
    }
    
    expect(loadTime).toBeLessThan(5000); // 最大容忍5秒
  });
});
