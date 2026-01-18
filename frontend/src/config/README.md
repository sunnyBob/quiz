# API 配置说明

## 配置方式

### 1. Vite 环境变量配置（推荐）

在项目根目录创建 `.env.local` 文件：

```bash
# API服务器地址
VITE_API_BASE_URL=http://localhost:3000

# 前端应用地址
VITE_FRONTEND_URL=http://localhost:5173

# 环境标识
VITE_ENV=development
```

### 2. 不同环境配置

#### 开发环境 (.env.development)
```bash
VITE_API_BASE_URL=http://localhost:3000
VITE_FRONTEND_URL=http://localhost:5173
VITE_ENV=development
```

#### 生产环境 (.env.production)
```bash
VITE_API_BASE_URL=https://your-api-domain.com
VITE_FRONTEND_URL=https://quiz.yourdomain.com
VITE_ENV=production
```

#### 测试环境 (.env.test)
```bash
VITE_API_BASE_URL=http://test-api.your-domain.com
VITE_FRONTEND_URL=http://test-quiz.your-domain.com
VITE_ENV=test
```

## 使用方式

配置文件 `api.ts` 会自动读取环境变量：

```typescript
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173',
  // ...
};
```

## 注意事项

1. **Vite 环境变量**：必须以 `VITE_` 开头才能在客户端代码中使用
2. **访问方式**：使用 `import.meta.env.VITE_*` 而不是 `process.env.*`
3. **重启服务**：修改环境变量后需要重启开发服务器
4. **版本控制**：`.env.local` 文件不会被提交到版本控制系统
5. **构建时注入**：环境变量在构建时被注入，不是运行时读取

## 环境变量优先级

Vite 按以下顺序加载环境变量文件：

1. `.env.local` (本地配置，优先级最高)
2. `.env.[mode].local` (如 `.env.development.local`)
3. `.env.[mode]` (如 `.env.development`)
4. `.env` (默认配置)