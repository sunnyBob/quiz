# Anti-Cheat System Specification

## ADDED Requirements

### Requirement: Behavior Monitoring
The system SHALL continuously monitor user behavior during quiz sessions to detect potential cheating attempts.

#### Scenario: Window focus tracking
- **WHEN** user switches away from quiz window
- **THEN** system records focus loss event with timestamp
- **AND** increments risk score based on frequency and duration

#### Scenario: Typing pattern analysis
- **WHEN** user answers questions
- **THEN** system analyzes typing speed and patterns
- **AND** flags unusually fast or robotic input patterns

### Requirement: Risk Assessment
The system SHALL calculate real-time risk scores based on behavioral patterns and trigger appropriate responses.

#### Scenario: Low risk behavior
- **WHEN** user exhibits normal quiz-taking patterns
- **THEN** system maintains baseline risk score
- **AND** continues normal monitoring

#### Scenario: High risk detection
- **WHEN** multiple suspicious behaviors are detected
- **THEN** system escalates risk score above threshold
- **AND** triggers admin notification
- **AND** may flag exam for manual review

### Requirement: Pattern Analysis
The system SHALL use machine learning algorithms to identify cheating patterns and improve detection accuracy over time.

#### Scenario: Answer timing analysis
- **WHEN** analyzing completed quiz sessions
- **THEN** system identifies statistical anomalies in answer timing
- **AND** updates detection models with new patterns

#### Scenario: Consistency checking
- **WHEN** user demonstrates inconsistent knowledge levels
- **THEN** system flags potential external assistance
- **AND** provides detailed analysis to administrators