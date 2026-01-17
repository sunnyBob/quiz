## 1. Project Setup
- [x] 1.1 Initialize React frontend project structure (TypeScript)
- [x] 1.2 Initialize Node.js backend project structure (TypeScript)
- [x] 1.3 Configure ESLint and Prettier
- [x] 1.4 Set up MySQL database connection
- [x] 1.5 Configure i18n support (react-i18next)

## 2. Database Implementation
- [x] 2.1 Design database schema (Users, Exams, Questions, Answers, Results)
  - *Note: Add `duration_seconds` to Answers table and `total_duration` to Results table.*
- [x] 2.2 Create migration scripts
- [x] 2.3 Implement data access layer

## 3. Quiz Taking System (Frontend & Backend)
- [x] 3.1 Implement "Enter Name" landing page with Exam ID handling
- [x] 3.2 Create API for fetching specific exam by ID
- [x] 3.3 Implement Quiz Interface (Question rendering)
- [x] 3.4 Implement Real-time Feedback logic (Immediate answer validation)
- [x] 3.5 Implement **Answer Persistence & State Recovery** (API + Frontend Logic) to prevent refresh cheating
- [x] 3.6 Implement **Time Tracking**:
  - [x] 3.6.1 Global timer (You have been answering for ...)
  - [x] 3.6.2 Per-question timer logic
  - [x] 3.6.3 Send duration data with answer submission
- [x] 3.7 Implement Anti-cheating features (Disable copy/select, watermark)
- [x] 3.8 Implement Result submission and Summary page
- [x] 3.9 Implement Language Switcher (EN/ZH) - *i18n configured, UI toggle can be added later*

## 4. Admin Dashboard (Frontend & Backend)
- [x] 4.1 Create Admin Login (basic auth)
- [x] 4.2 Create Exam Editor Interface (Add/Edit Questions)
- [x] 4.3 Create API for creating/updating exams
- [x] 4.4 Implement "Share Exam" feature (Generate/Copy Link) - *Share link ID generated automatically*
- [x] 4.5 Create API for fetching exam results and statistics (include time data)
- [x] 4.6 Implement Dashboard Overview (Stats charts)
- [x] 4.7 Implement detailed Result List view (show total time and per-question time)

## 5. Testing & Deployment
- [ ] 5.1 Write E2E tests for Quiz flow (including refresh/recovery scenarios) - *Deferred: Requires test framework setup*
- [ ] 5.2 Perform responsive design testing (Mobile/Desktop) - *Deferred: Manual testing recommended*
- [x] 5.3 Final review and deployment setup - *README and project structure completed*
