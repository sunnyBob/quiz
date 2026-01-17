## ADDED Requirements

### Requirement: Dashboard Access
The system SHALL provide a secured interface for administrators to view data.

#### Scenario: Admin Login
- **WHEN** an admin accesses the dashboard URL
- **THEN** they are prompted for credentials

### Requirement: Exam Management
The system SHALL allow administrators to create, edit, and save exams with multiple questions.

#### Scenario: Create Question
- **WHEN** the admin adds a new question to an exam
- **THEN** they can specify the question text, options, correct answer, and explanation

#### Scenario: Save Exam
- **WHEN** the admin saves the exam
- **THEN** the exam is stored in the database and a unique ID is generated

### Requirement: Exam Sharing
The system SHALL generate a shareable link for each published exam.

#### Scenario: Generate Link
- **WHEN** the admin clicks "Share" on an exam
- **THEN** a unique URL (e.g., `/quiz/:examId`) is displayed for copying

### Requirement: Result Analysis
The system SHALL display aggregated statistics and individual results, including time metrics.

#### Scenario: View Statistics
- **WHEN** the admin views the dashboard overview
- **THEN** display total participants, average score, pass rate, and average completion time

#### Scenario: View Individual Results
- **WHEN** the admin selects a specific exam session
- **THEN** show the candidate's name, score, total time taken, and answers provided (with per-question duration)
