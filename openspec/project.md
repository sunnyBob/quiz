# Project Context

## Purpose
创建一个 web 端考题系统，支持响应式设计（Responsive Web），可同时在网页端和手机浏览器访问。

系统包含两个主要部分：
1. **答卷系统**：
   - 考员需输入姓名开始答题。
   - 支持选择、判断等多种题型。
   - 提供即时反馈机制：考员作答后立即显示对错、正确选项及解析。
   - 防作弊手段，不允许复制、截图
2. **数据统计分析后台**：
   - 用于管理员查看答卷情况和统计分析数据。

## Tech Stack
- **Language**: TypeScript
- **Frontend**: React
- **Runtime**: Node.js
- **Database**: MySQL

## Project Conventions

### Code Style
- **Linter/Formatter**: ESLint + Prettier
- **Frontend**: Functional Components with React Hooks
- **Naming**:
  - Components: PascalCase
  - Functions/Variables: camelCase
  - Constants: UPPER_SNAKE_CASE

### Architecture Patterns
- **Frontend**: Component-based architecture
- **Backend**: Layered architecture (Controller / Service / Data Access)

### Testing Strategy
- **E2E Testing**: 端到端测试 (End-to-End Testing) covering critical user flows (exam taking, result submission).
- **Unit Testing**: For complex logic and utilities.

### Git Workflow
- Feature Branch Workflow:
  - `main`: Production-ready code.
  - `feature/*`: New features.
  - `fix/*`: Bug fixes.
  - Pull Requests required for merging to `main`.

## Domain Context
专业知识考试系统 (Professional Knowledge Examination System)
**Subject Matter**: AI Coding Assistants, LLM Tools, and Engineering Best Practices (based on sample quiz data).

## Important Constraints
- **Compatibility**: Must be fully functional on mobile browsers (iOS/Android) and desktop browsers.
- **Performance**: Real-time feedback for answers requires low latency.
- **Security/Anti-Cheating**:
  - Disable text selection and copying (CSS/JS).
  - Implement measures to discourage/prevent screenshots (e.g., digital watermarks, blur on window blur).

## External Dependencies
- (None currently defined)