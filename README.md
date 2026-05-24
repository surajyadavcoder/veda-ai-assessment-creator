# VedaAI — AI Assessment Creator

I built this project as part of a full stack engineering assignment. The idea was simple — teachers spend a lot of time creating question papers, so why not let AI do the heavy lifting?

VedaAI lets a teacher fill in basic details like subject, grade, number of questions, and difficulty — and within seconds, a fully structured question paper is ready with sections, marks, and difficulty tags on each question.

## What I used

- Next.js and TypeScript for the frontend
- Zustand for state management
- WebSocket for real-time progress updates
- Node.js and Express on the backend
- MongoDB to store assignments and generated papers
- Redis and BullMQ for background job processing
- Groq (Llama 3.3 70B) for AI question generation

## How it works

When a teacher submits the form, the backend creates a job in the BullMQ queue. A separate worker picks it up, builds a structured prompt, calls the Groq API, parses the JSON response, and saves the result to MongoDB. The frontend gets real-time updates via WebSocket and shows a progress bar while generation is happening. Once done, the question paper appears with sections, difficulty badges, and marks — ready to print or download as PDF.

## Project Structure

```
veda-ai/
  backend/
    src/
      index.ts                  - Server entry point
      models/Assignment.ts      - MongoDB schema
      routes/assignment.ts      - API routes
      workers/questionWorker.ts - BullMQ worker
      utils/wsManager.ts        - WebSocket manager
      utils/promptBuilder.ts    - Prompt construction
  frontend/
    app/page.tsx                - Main page
    components/
      AssignmentForm.tsx        - Form with validation
      GeneratingView.tsx        - Progress screen
      QuestionPaperView.tsx     - Output display
    store/assignmentStore.ts    - Zustand store
    lib/websocket.ts            - WS client
```

## Running locally

You will need Node.js 18+, MongoDB, and Redis running locally.

**Backend**

```bash
cd backend
npm install
cp .env.example .env
# Add your GROQ_API_KEY, MONGODB_URI, REDIS_HOST in .env
npm run dev
# In a new terminal:
npm run worker
```

**Frontend**

```bash
cd frontend
npm install
cp .env.example .env.local
# Add NEXT_PUBLIC_API_URL and NEXT_PUBLIC_WS_URL in .env.local
npm run dev
```

Open http://localhost:3000

## API

```
POST /api/assignments       - Create assignment, queue job
GET  /api/assignments       - List assignments
GET  /api/assignments/:id   - Get result
```

## Author

Suraj Yadav
LinkedIn: https://linkedin.com/in/iamsurajyadav
GitHub: https://github.com/surajyadavcoder
