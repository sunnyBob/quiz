# 配置管理说明

## 📋 概述

本项目已将所有服务地址配置化，支持不同环境的灵活配置。

## 🔧 配置文件

### 前端配置

**主配置文件：** `frontend/src/config/api.ts`

```typescript
export const API_CONFIG = {
  // API服务器地址
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  
  // 前端应用地址
  FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173',
  
  // API端点配置
  ENDPOINTS: {
    // ... 所有API端点
  }
};
```

## 🌍 环境配置

### 开发环境

创建 `frontend/.env.local` 文件：

```bash
# API服务器地址
VITE_API_BASE_URL=http://localhost:3000

# 前端应用地址  
VITE_FRONTEND_URL=http://localhost:5173

# 环境标识
VITE_ENV=development
```

### 生产环境

```bash
# API服务器地址
VITE_API_BASE_URL=https://api.yourdomain.com

# 前端应用地址
VITE_FRONTEND_URL=https://quiz.yourdomain.com

# 环境标识
VITE_ENV=production
```

### 测试环境

```bash
# API服务器地址
VITE_API_BASE_URL=https://test-api.yourdomain.com

# 前端应用地址
VITE_FRONTEND_URL=https://test-quiz.yourdomain.com

# 环境标识
VITE_ENV=test
```

## 🔄 已配置化的组件

### API调用
- ✅ 所有页面的axios请求
- ✅ 统一的API URL构建
- ✅ 类型安全的端点管理

### 分享链接
- ✅ 考卷分享URL生成
- ✅ 复制分享链接功能
- ✅ 分享链接显示

## 📦 使用方式

### 1. 导入配置

```typescript
import { apiUrls, buildShareUrl } from '../config/api';
```

### 2. 使用API URLs

```typescript
// 获取所有考卷
const response = await axios.get(apiUrls.getAllExams());

// 创建考卷
const result = await axios.post(apiUrls.createExam(), examData);

// 更新考卷
await axios.put(apiUrls.updateExam(examId), updateData);
```

### 3. 生成分享链接

```typescript
const shareUrl = buildShareUrl(shareId);
```

## 🚀 部署配置

### Docker部署

在docker-compose.yml中设置环境变量：

```yaml
services:
  frontend:
    environment:
      - VITE_API_BASE_URL=http://backend:3000
      - VITE_FRONTEND_URL=http://localhost:5173
```

### Vercel/Netlify部署

在部署平台设置环境变量：
- `VITE_API_BASE_URL`
- `VITE_FRONTEND_URL`

## ⚠️ 注意事项

1. **环境变量前缀：** Vite应用中的环境变量必须以 `VITE_` 开头
2. **重启服务：** 修改环境变量后需要重启开发服务器
3. **版本控制：** `.env.local` 文件不会被提交到Git
4. **构建时注入：** 环境变量在构建时被注入，不是运行时读取

## 🔍 调试

查看当前配置：

```typescript
console.log('API Base URL:', API_CONFIG.BASE_URL);
console.log('Frontend URL:', API_CONFIG.FRONTEND_URL);
```

## 📝 更新日志

- ✅ 统一API地址配置
- ✅ 环境变量支持
- ✅ 分享链接配置化
- ✅ 类型安全的API调用
- ✅ 多环境支持