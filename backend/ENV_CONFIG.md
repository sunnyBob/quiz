# Environment Variables Configuration

## Backend `.env` 文件配置说明

在 `backend/` 目录下创建 `.env` 文件，配置以下环境变量：

### 必需配置项

```env
# MySQL 数据库配置
DB_HOST=localhost          # 数据库主机地址
DB_USER=root               # 数据库用户名
DB_PASSWORD=your_password  # 数据库密码（请替换为实际密码）
DB_NAME=quiz_system        # 数据库名称

# 服务器端口
PORT=3000                  # 后端 API 服务端口
```

### 配置步骤

1. **复制示例文件**：
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **编辑 `.env` 文件**，修改以下值：
   - `DB_PASSWORD`: 替换为您的 MySQL 实际密码
   - `DB_USER`: 如果不是 root，请修改为您的数据库用户名
   - `DB_HOST`: 如果数据库不在本地，请修改为实际地址
   - `PORT`: 如果 3000 端口被占用，可以改为其他端口（如 3001）

3. **确保 MySQL 服务已启动**：
   ```bash
   # macOS (使用 Homebrew)
   brew services start mysql

   # 或 Linux
   sudo systemctl start mysql
   ```

4. **创建数据库**（可选，系统会自动创建）：
   ```sql
   CREATE DATABASE IF NOT EXISTS quiz_system;
   ```

### 默认值说明

如果 `.env` 文件中未配置某些变量，系统会使用以下默认值：
- `DB_HOST`: `localhost`
- `DB_USER`: `root`
- `DB_PASSWORD`: `password`
- `DB_NAME`: `quiz_system`
- `PORT`: `3000`

### 安全提示

⚠️ **重要**：`.env` 文件包含敏感信息，请确保：
- 不要将 `.env` 文件提交到 Git 仓库
- 生产环境使用更强的密码
- 考虑使用环境变量管理工具（如 AWS Secrets Manager）

