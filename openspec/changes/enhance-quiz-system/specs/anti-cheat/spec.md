# Basic Anti-Cheat System Specification

## ADDED Requirements

### Requirement: Copy Prevention
The system SHALL prevent users from copying quiz content through standard methods.

#### Scenario: Text selection disabled
- **WHEN** user attempts to select text on quiz page
- **THEN** system prevents text selection using CSS user-select: none
- **AND** maintains normal quiz functionality

#### Scenario: Right-click menu disabled
- **WHEN** user right-clicks on quiz content
- **THEN** system prevents context menu from appearing
- **AND** blocks access to copy/inspect options

#### Scenario: Keyboard shortcuts blocked
- **WHEN** user presses Ctrl+C, Ctrl+A, Ctrl+S, F12, or other restricted keys
- **THEN** system prevents default browser behavior
- **AND** maintains quiz interaction capabilities

### Requirement: Screenshot Prevention
The system SHALL implement basic measures to discourage screenshot capture.

#### Scenario: Watermark display
- **WHEN** quiz is active
- **THEN** system displays semi-transparent watermark with user ID
- **AND** positions watermark to be visible in screenshots
- **AND** ensures watermark doesn't interfere with quiz readability

#### Scenario: Print protection
- **WHEN** user attempts to print quiz page
- **THEN** system hides quiz content in print view
- **AND** displays message indicating printing is not allowed

### Requirement: Basic Security Measures
The system SHALL implement simple client-side restrictions without complex monitoring.

#### Scenario: Developer tools prevention
- **WHEN** user attempts to open browser developer tools
- **THEN** system blocks common keyboard shortcuts (F12, Ctrl+Shift+I)
- **AND** continues normal quiz operation

#### Scenario: Page source protection
- **WHEN** user attempts to view page source
- **THEN** system blocks Ctrl+U shortcut
- **AND** maintains quiz functionality