# Change: Create Quiz System

## Why
Currently, there is no system to conduct professional knowledge examinations online with real-time feedback and anti-cheating measures. A dedicated system is needed to assess candidates effectively and analyze results.

## What Changes
- Implement a **Quiz Taking System** for candidates:
  - User identity input.
  - Support for taking specific exams via shared links.
  - Support for multiple question types (Choice, True/False).
  - Real-time feedback on answers.
  - **Time Tracking**: Display elapsed time and record duration per question.
  - Anti-cheating mechanisms (no copy/paste, screenshot prevention).
  - **Bilingual Support**: Interface available in both Chinese and English.
- Implement an **Admin Dashboard** for administrators:
  - Create and manage exams (enter questions).
  - Share exams via unique links.
  - View quiz results (scores and time taken).
  - Statistical analysis of performance.
- Database schema setup for users, quizzes, questions, and results.

## Impact
- **New Capabilities**:
  - `quiz-taking`: The core exam interface for users.
  - `admin-dashboard`: The backend management interface.
- **Affected Code**:
  - Frontend: New React app structure, components for Quiz and Dashboard.
  - Backend: Node.js API services, MySQL database integration.
