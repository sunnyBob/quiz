## Context
The goal is to build a responsive web-based quiz system with two distinct user roles: Candidates and Administrators. The system needs to support real-time feedback and ensure exam integrity through anti-cheating measures.

## Goals / Non-Goals
- **Goals**:
  - High availability and responsiveness on mobile and desktop.
  - Immediate feedback loop for learning reinforcement.
  - Secure test environment (within browser limits).
  - Data persistence for post-exam analysis.
  - **Dynamic Exam Management**: Admins can create and distribute distinct exams.
  - **Bilingual Support**: Accessible to both Chinese and English speakers.
  - **Cheating Prevention**: Prevent users from refreshing to retry questions after seeing real-time feedback.
  - **Time Tracking**: Provide visibility into time spent per question and total exam duration for better analytics.
- **Non-Goals**:
  - Complex proctoring (webcam monitoring, AI behavior analysis) - *Out of scope for MVP*.
  - User account management for candidates (just name entry is sufficient for now).

## Decisions
- **Decision**: Use a Single Page Application (SPA) with React.
  - **Rationale**: Provides the smoothest transition for real-time question switching and feedback without page reloads.
- **Decision**: Node.js + Express for Backend.
  - **Rationale**: Unified language (TypeScript) across stack, efficient for I/O bound operations like logging answers.
- **Decision**: Anti-cheating via Client-side restrictions.
  - **Rationale**: CSS `user-select: none`, JS event blocking (contextmenu), and overlay watermarks are sufficient for the "discourage" requirement without invasive software installation.
- **Decision**: URL-based Exam Access.
  - **Rationale**: Accessing exams via `/quiz/:examId` allows for easy sharing via messaging apps without requiring candidate login/registration.
- **Decision**: Internationalization via `react-i18next`.
  - **Rationale**: Standard, robust library for React i18n, supporting dynamic language switching and efficient string management.
- **Decision**: Server-side State Persistence for "Lock-in" Feedback.
  - **Rationale**: To maintain real-time feedback while preventing "refresh cheating", user answers are sent to the server *immediately* upon selection. The server records the answer. If the page is refreshed, the frontend re-fetches the state, sees the question is already answered, and displays the feedback/result in a read-only (locked) state. Retries are disabled.

## Risks / Trade-offs
- **Risk**: Client-side anti-cheating is bypassable by tech-savvy users.
  - **Mitigation**: Accept as a deterrent level; critical exams might require supervised environments.
- **Risk**: Real-time feedback might encourage guessing.
  - **Mitigation**: Questions are locked immediately after selection. The first choice is the final choice.
- **Risk**: Client-side time tracking inaccuracy.
  - **Mitigation**: Acceptable for "analytics" purposes. Server timestamps on submission can be used for verification if needed, but client duration is sufficient for "time spent reading".

## Migration Plan
- Green field project; no migration required.
