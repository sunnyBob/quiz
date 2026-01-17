## ADDED Requirements

### Requirement: User Identification
The system SHALL require the user to input their name before starting the quiz.

#### Scenario: Start Quiz
- **WHEN** a user visits the quiz landing page
- **THEN** they see an input field for their name and a "Start" button

### Requirement: Exam Access
The system SHALL load the specific exam based on the URL identifier.

#### Scenario: Load Shared Exam
- **WHEN** a user visits a shared exam link (e.g., `/quiz/123`)
- **THEN** the system loads the title and questions for exam `123`

### Requirement: Question Display
The system SHALL display questions one by one or in a list, supporting Multiple Choice and True/False formats.

#### Scenario: Multiple Choice Question
- **WHEN** a multiple-choice question is displayed
- **THEN** the question text and all options are visible

### Requirement: Time Tracking
The system SHALL track and display the total elapsed time, and record the duration spent on each question.

#### Scenario: Display Elapsed Time
- **WHEN** the user is taking the quiz
- **THEN** a timer is visible showing "You have been answering for X min" (formatted as MM:SS or HH:MM:SS)

#### Scenario: Record Question Duration
- **WHEN** a user submits an answer
- **THEN** the time spent on that specific question is calculated and saved to the server

### Requirement: Real-time Feedback (Answer Locking)
The system SHALL provide immediate feedback after a user selects an answer AND permanently lock that answer to prevent changes.

#### Scenario: Correct Answer Lock
- **WHEN** the user selects the correct option
- **THEN** the answer is saved to the server, the interface locks all options, and a success indicator is shown.

#### Scenario: Incorrect Answer Lock
- **WHEN** the user selects an incorrect option
- **THEN** the answer is saved to the server, the interface locks all options, and the correct answer is highlighted.

### Requirement: State Recovery
The system SHALL restore the user's progress and answer state if the page is reloaded.

#### Scenario: Refresh Page
- **WHEN** a user refreshes the browser during a quiz
- **THEN** the system reloads the current question (or last position) and displays previously submitted answers as locked/graded.

### Requirement: Anti-Cheating
The system SHALL implement measures to discourage copying and screenshotting.

#### Scenario: Prevent Copying
- **WHEN** a user tries to select text or right-click
- **THEN** the action is blocked or disabled

#### Scenario: Watermark
- **WHEN** the quiz is active
- **THEN** a dynamic watermark (e.g., user's name/IP) is visible over the content

### Requirement: Language Support
The system SHALL support both Chinese and English languages for the quiz interface.

#### Scenario: Switch Language
- **WHEN** a user clicks the language toggle button
- **THEN** the interface text updates to the selected language
