# storychain-collaborative-writing-179168-179188

Quick environment wiring:

Backend (Express)
- Copy storychain_backend/.env.example to storychain_backend/.env and adjust:
  - PORT=3001
  - DATABASE_URL=postgres://...
  - JWT_SECRET=...
  - CORS_FRONTEND_ORIGIN=http://localhost:3000 (also set FRONTEND_URL for current code)
  - Optional: OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL

Frontend (React)
- Copy storychain_frontend/.env.example to storychain_frontend/.env and set:
  - REACT_APP_API_BASE_URL=http://localhost:3001

Notes
- The backend currently reads FRONTEND_URL for CORS; .env.example also includes CORS_FRONTEND_ORIGIN as the preferred name going forward.
- Ensure the frontend base URL and backend CORS origin match to avoid CORS errors.