# Quiz System

## Project Structure

```
quiz/
├── frontend/          # React + TypeScript + Vite
├── backend/           # Node.js + Express + TypeScript
└── openspec/          # OpenSpec change proposals
```

## Setup Instructions

### Backend Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Configure database:
   - Create `.env` file in `backend/` directory:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=quiz_system
   PORT=3000
   ```

3. Initialize database:
```bash
npm run init-db
```

4. Start backend server:
```bash
npm run dev
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start development server:
```bash
npm run dev
```

## Usage

### For Candidates
- Access quiz via: `http://localhost:5173/quiz/{shareId}`
- Enter name and start quiz
- Answer questions with real-time feedback
- View summary after completion

### For Administrators
- Login: `http://localhost:5173/admin` (password: `admin123`)
- Create exams: `/admin/create`
- View results: `/admin/dashboard`

## Features Implemented

✅ User identification (name input)
✅ Exam access via share links
✅ Real-time feedback with answer locking
✅ State recovery on page refresh
✅ Time tracking (per question + total)
✅ Anti-cheating (no copy/select, watermark)
✅ Bilingual support (EN/ZH) - i18n configured
✅ Admin dashboard with statistics
✅ Exam creation and management

## Next Steps

- Add more question types
- Enhance admin authentication
- Implement detailed analytics
- Add E2E tests
- Deploy to production

