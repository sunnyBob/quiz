1. Basic Configuration and Specifications

1. In project practice, if it is necessary to define a set of project-level rules (such as code specifications, build instructions) that apply to all team members, which file should be configured first?
- A. ~/.claude.md
- B. claude.local.md
- C. claude.md
- D. settings.local.json
2. Regarding the function of the settings.local.json file, the following description is the most accurate:
- A. Store API Key and account password
- B. Configure system permissions (Permissions) and lifecycle hooks (Hooks)
- C. Define the programming language version of the project
- D. Store all historical conversation records
3. When using Claude Code in VS Code, if you want to execute specific Claude Code commands (such as opening the configuration file), you should use:
- A. Menu Bar Navigation
- B. Ctrl/Cmd + Shift + P to open the command palette
- C. Right-click context menu
- D. Enter the claude command in the terminal

---

2. Operating Mechanism and State Management

4. When facing high-risk logical changes, which mode is recommended to enable in order to review the AI's logical chain and ensure safety before execution?
- A. Auto-accept Mode
- B. Plan Mode
- C. Compact Mode
- D. Interactive Mode
5. When the conversation history is too long, causing Token consumption to be too fast or AI response to slow down, which command does Claude Code recommend using to compress the history through summarization?
- A. /clear
- B. /reset
- C. /compact
- D. /archive
6. When the conversation has filled up the history records, leading to a Token crisis, which of the following impacts should you consider first?
- A. AI may overlook earlier conversation context
- B. Token consumption has increased significantly
- C. The conversation will be forcibly interrupted
- D. You can only start a new conversation.

---

III. Advanced Agent Collaboration and Workflow

7. To obtain multi - perspective solutions to the same problem, the most effective technical means is:
- A. Repeating the same question
- B. Use the Task tool to start multiple subagents in parallel for comparative analysis
- C. Use the "Think step by step" prompt
- D. Increasing Token limits allows AI to output more content
8. To achieve multi-task parallel development and enable Claude to handle multiple branches simultaneously without file conflicts, the best technical approach is:
- A. Git Stash
- B. Git Worktrees
- C. Git Rebase
- D. Git Cherry-pick
9. When performing complex logical analysis, which vocabulary should be explicitly added to the Prompt to help activate the AI's Chain-of-Thought?
- A. "fast fix"
- B. "thinks a lot"
- C. "just code"
- D. "quick answer"
10. In the standard engineering closed-loop after Claude Code completes a task, the most critical step is:
- A. Automatically generate compliant Git commits
- B. Start a new round of conversation immediately
- C. Directly push to the production environment
- D. Force clean the workspace
11. The following description about the configuration of Claude Code Permissions is correct:
- A. Configure permission rules in claude.md.
- B. Define the allowed/denied operation types in the permissions field of settings.local.json
- C. Permissions only restrict file read operations
- D. Permissions cannot be configured, and all operations require manual confirmation

---

4. MCP Expansion and Permission Management

12. If you need to enable AI to query external systems (such as Jira tasks, databases, Elasticsearch) in real time, which of the following mechanisms should be used to achieve this?
- A. SSH Tunneling
- B. MCP（Model Context Protocol）
- C. RESTful API Webhook
- D. OAuth 2.0 Authorization
13. When fixing front-end style bugs, the core role of the Playwright MCP server is:
- A. Replace the unit test framework for logical verification
- B. As a "visual sense", it captures screenshots to help AI establish a mapping between code and rendering effects
- C. Accelerate the compilation process of front-end components
- D. Automatically deploy the repair patch
14. Regarding the permissions system (Permissions) of Claude Code, the following description is correct:
- A. Used to limit the Token consumption of AI
- B. Control the confirmation mechanism before AI executes commands to prevent dangerous operations
- C. Restrict AI access to specific files
- D. Control the output length of AI

---

Reference Answer

1. Basic Configuration and Specifications
1. C - claude.md is used for project-level rules and applies to all team members
2. B - settings.local.json is used to configure system permissions and lifecycle hooks (Hooks)
3. B - Use Ctrl/Cmd + Shift + P in VS Code to open the command palette and execute the Claude Code command
2. Operating Mechanism and State Management
4. B - Plan mode allows for pre-execution review of the AI's logical chain to ensure the safety of high-risk operations
5. C - /compact command is a context compression mechanism specific to Claude Code
6. A - When the token is exhausted, the AI may lose the early conversation context, resulting in context incoherence
III. Advanced Agent Collaboration and Workflow
7. B - Using the Task tool to start multiple subagents in parallel can obtain multi-angle analysis
8. B - Git Worktrees support multiple independent working trees, avoiding file conflicts during parallel development
9. B - "thinks a lot" can activate the Chain-of-Thought of AI
10. A - Automatically generating standardized Git Commits is the key to the engineering closed-loop
11. B - Permissions are configured in the settings.local.json permissions field
4. MCP Expansion and Permission Management
12. B - MCP (Model Context Protocol) enables AI to access external systems
13. B - Playwright, as a visual tool, helps AI understand UI issues through screenshots
14. B - Permission system confirms before AI executes commands to prevent risky operations

一、 基础配置与规范

1. 在项目实践中，若需定义一套对所有团队成员生效的项目级规则（如代码规范、构建指令），应优先配置在哪个文件中？
- A. ~/.claude.md
- B. claude.local.md
- C. claude.md
- D. settings.local.json
2. 关于 settings.local.json 文件的职能，以下描述最为准确的是：
- A. 存储 API Key 和账户密码
- B. 配置系统权限（Permissions）与生命周期钩子（Hooks）
- C. 定义项目的编程语言版本
- D. 存放所有的历史对话记录
3. 在 VS Code 中使用 Claude Code 时，若要执行具体的 Claude Code 命令（如打开配置文件），应使用：
- A. 菜单栏导航
- B. Ctrl/Cmd + Shift + P 打开命令面板
- C. 右键上下文菜单
- D. 终端输入 claude 命令

---

二、 运行机制与状态管理

4. 当面临高风险逻辑改动时，为了在执行前审查 AI 的逻辑链路并确保安全，推荐开启哪种模式？
- A. Auto-accept 模式
- B. Plan 模式
- C. Compact 模式
- D. Interactive 模式
5. 当对话历史过长导致 Token 消耗过快或 AI 响应变慢时，Claude Code 推荐使用哪个命令来通过摘要化压缩历史记录？
- A. /clear
- B. /reset
- C. /compact
- D. /archive
6. 当对话已经排满历史记录导致 Token 危机时，以下哪个影响你应该首先考虑？
- A. AI 可能会忽略较早的对话上下文
- B. Token 消耗大大增加
- C. 对话将被强制中断
- D. 只能重新开启一个新对话

---

三、 高级 Agent 协作与工作流

7. 为了获得针对同一问题的多角度解决方案，最有效的技术手段是：
- A. 重复提问相同问题
- B. 使用 Task 工具并行启动多个 subagent 进行对比分析
- C. 使用 "Think step by step" 提示词
- D. 增加 Token 限制让 AI 输出更多内容
8. 若要实现多任务并行开发，让 Claude 同时处理多个分支而不产生文件冲突，最佳技术手段是：
- A. Git Stash
- B. Git Worktrees
- C. Git Rebase
- D. Git Cherry-pick
9. 在进行复杂逻辑分析时，在 Prompt 中显式添加哪个词汇，有助于激活 AI 的深度思考链条（Chain-of-Thought）？
- A. "fast fix"
- B. "thinks a lot"
- C. "just code"
- D. "quick answer"
10. 在 Claude Code 完成任务后的标准工程闭环中，最关键的一步是：
- A. 自动生成符合规范的 Git 提交（Commit）
- B. 立即开启新一轮对话
- C. 直接推送至生产环境
- D. 强制清理工作区
11. 以下关于 Claude Code Permissions 配置的描述，正确的是：
- A. 在 claude.md 中配置权限规则
- B. 在 settings.local.json 的 permissions 字段中定义允许/拒绝的操作类型
- C. Permissions 仅限制文件读取操作
- D. 无法配置权限，所有操作都需要手动确认

---

四、 MCP 扩展与权限管理

12. 若需让 AI 能够实时查询外部系统（如 Jira 任务、数据库、Elasticsearch），应当通过以下哪种机制实现？
- A. SSH Tunneling
- B. MCP（Model Context Protocol）
- C. RESTful API Webhook
- D. OAuth 2.0 授权
13. 在修复前端样式 Bug 时，Playwright MCP 服务器的核心作用是：
- A. 替代单元测试框架进行逻辑验证
- B. 作为"视觉感官"获取截图，帮助 AI 建立代码与渲染效果的映射
- C. 加速前端组件的编译过程
- D. 自动部署修复补丁
14. 关于 Claude Code 的权限系统（Permissions），以下描述正确的是：
- A. 用于限制 AI 的 Token 消耗
- B. 控制 AI 执行命令前的确认机制，防止危险操作
- C. 限制 AI 访问特定文件
- D. 控制 AI 的输出长度

---

参考答案

一、 基础配置与规范
1. C - claude.md 用于项目级规则，对所有团队成员生效
2. B - settings.local.json 用于配置系统权限和生命周期钩子（Hooks）
3. B - VS Code 中使用 Ctrl/Cmd + Shift + P 打开命令面板执行 Claude Code 命令
二、 运行机制与状态管理
4. B - Plan 模式允许执行前审查 AI 的逻辑链路，确保高风险操作的安全性
5. C - /compact 命令是 Claude Code 特有的上下文压缩机制
6. A - 当 Token 用尽时，AI 可能会丢失早期对话上下文，导致上下文不连贯
三、 高级 Agent 协作与工作流
7. B - 使用 Task 工具并行启动多个 subagent 可获取多角度分析
8. B - Git Worktrees 支持多个独立工作树，避免并行开发时的文件冲突
9. B - "thinks a lot" 可激活 AI 的深度思考链（Chain-of-Thought）
10. A - 自动生成规范化的 Git Commit 是工程闭环的关键
11. B - Permissions 在 settings.local.json 的 permissions 字段中配置
四、 MCP 扩展与权限管理
12. B - MCP（Model Context Protocol）让 AI 能访问外部系统
13. B - Playwright 作为视觉工具，通过截图帮助 AI 理解 UI 问题
14. B - Permission 系统在 AI 执行命令前进行确认，防止风险操作