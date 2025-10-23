# storychain-collaborative-writing-179168-179188

Backend (Express) now exposes:
- GET /               Health
- POST /auth/signup   Signup
- POST /auth/login    Login
- POST /auth/logout   Logout (stateless)
- GET  /auth/me       Current user (Bearer)
- GET  /stories       List stories
- POST /stories       Create story (Bearer)
- GET  /stories/:id   Get story with paragraphs
- PATCH /stories/:id  Update story (Bearer)
- GET  /stories/:storyId/paragraphs       List paragraphs
- POST /stories/:storyId/paragraphs       Add paragraph (Bearer)
- POST /paragraphs/:paragraphId/reactions Add reaction (Bearer)
- DELETE /paragraphs/:paragraphId/reactions Remove reaction (Bearer)
- POST /ai/stories/:storyId/suggest       AI suggestion (uses OPENAI_* if present)
- POST /ai/stories/:storyId/edit          AI edit (uses OPENAI_* if present)

Docs: /docs
OpenAPI: storychain_backend/interfaces/openapi.json

Environment variables used (create a .env in the backend root or copy from .env.example):
- PORT (default 3001)
- FRONTEND_URL (for CORS; currently used by code)
- CORS_FRONTEND_ORIGIN (preferred env var name for CORS; keep in sync with FRONTEND_URL until code is updated)
- DATABASE_URL (Postgres)
- JWT_SECRET, JWT_EXPIRES_IN
- BCRYPT_SALT_ROUNDS
- OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL
- PGSSLMODE (when needed)

To regenerate OpenAPI: npm run openapi from storychain_backend directory.

Frontend wiring:
- Frontend must set REACT_APP_API_BASE_URL to point to this backend (e.g., http://localhost:3001).
- Backend CORS origin should match the frontend URL (CORS_FRONTEND_ORIGIN/FRONTEND_URL).
- See .env.example files in both frontend and backend folders for quick setup.
