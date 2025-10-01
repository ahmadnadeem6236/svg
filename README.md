# Task Manager (Django + React + Vite + Channels)

A full‑stack task management app with JWT auth, realtime updates via WebSockets (Django Channels), and a React (Vite) frontend.

## Prerequisites

- Python 3.11+
- Node.js 18+ and npm/pnpm/yarn
- Redis (for Channels): running at 127.0.0.1:6379 by default

## Monorepo Layout

- `backend/`: Django REST API + Channels
- `frontend/`: Vite + React app

---

## Backend Setup

1. Create and activate a virtualenv

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

2. Install dependencies

```bash
pip install -r requirements.txt
```

3. Environment and settings

- Default settings use SQLite and JWT auth.
- WebSockets require Redis; default host is `127.0.0.1:6379` (see `config/settings.py` `CHANNEL_LAYERS`).
- CORS allows local dev origins: `http://localhost:5173`, `http://localhost:3000`, `http://localhost:8080`.

4. Run migrations and create a superuser (optional)

```bash
python manage.py migrate
python manage.py createsuperuser
```

5. Start the ASGI server (Daphne)

```bash
# Any ASGI server works; Django project already configures Channels
python manage. runserver 0.0.0.0:8000
# or
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

---

## Frontend Setup

1. Install dependencies

```bash
cd frontend
npm install
```

2. Configure API base URL (optional)

- The frontend reads `VITE_API_BASE_URL` for the backend origin.
- Defaults to `http://localhost:8000` if not set.

You can create `.env` in `frontend/`:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

3. Start the dev server

```bash
npm run dev
# Vite dev server runs on http://localhost:8080 (see vite.config.ts)
```

---

## Running Frontend & Backend Together (Local Dev)

- Start Redis locally (e.g., `brew services start redis` on macOS or `docker run -p 6379:6379 redis:7`).
- Start the backend on port 8000.
- Start the frontend on port 8080.
- CORS is already configured; JWT is handled by the frontend `axios` interceptor.

---

## Authentication

- JWT via `djangorestframework-simplejwt`.
- Obtain tokens at `POST /api/auth/login/` and use the `access` token as `Authorization: Bearer <token>`.
- Refresh token via `POST /api/auth/refresh/`.
- Register new users via `POST /api/auth/register/`.

The frontend stores tokens in `localStorage` keys: `taskman_auth` (access) and `taskman_refresh`.

---

## API Reference

Base URL: `http://localhost:8000`

### Auth

- POST `/api/auth/register/`

  - Request JSON:
    ```json
    {
      "username": "user@example.com",
      "email": "user@example.com",
      "password": "secret"
    }
    ```
  - Response: `201 Created` with user object (limited fields per serializer)

- POST `/api/auth/login/`

  - Request JSON:
    ```json
    { "username": "user@example.com", "password": "secret" }
    ```
  - Response:
    ```json
    { "access": "<jwt>", "refresh": "<jwt>" }
    ```

- POST `/api/auth/refresh/`
  - Request JSON:
    ```json
    { "refresh": "<jwt>" }
    ```
  - Response:
    ```json
    { "access": "<new_access_jwt>" }
    ```

### Tasks (Authenticated)

All endpoints require `Authorization: Bearer <access_token>`.

- GET `/api/tasks/`

  - Query params: `status`, `priority`, `due_date`, `search` (title/description)
  - Response: `200 OK` array of tasks owned by the current user.

- POST `/api/tasks/`

  - Request JSON:
    ```json
    {
      "title": "My task",
      "description": "Optional",
      "status": "todo|in_progress|done",
      "priority": "low|medium|high",
      "due_date": "2025-10-01"
    }
    ```
  - Response: `201 Created` task object.

- PATCH `/api/tasks/{id}/`

  - Request JSON (partial updates allowed):
    ```json
    { "title": "Updated title" }
    ```
  - Response: `200 OK` updated task object.

- DELETE `/api/tasks/{id}/`
  - Response: `204 No Content`.

Task object fields (see `tasks/serializers.py`):

```json
{
  "id": 1,
  "title": "string",
  "description": "string",
  "status": "string",
  "priority": "string",
  "due_date": "YYYY-MM-DD",
  "created_at": "ISO-8601",
  "updated_at": "ISO-8601",
  "owner": 1
}
```

---

## Realtime Updates (WebSocket)

- URL: `ws://localhost:8000/ws/tasks/`
- Auth: pass JWT access token via `Authorization: Bearer <token>` header; if not possible (in browsers), append `?token=<access>` in the query string.
- Behavior: After connection, the server subscribes you to your user‑specific group. You will receive messages when your tasks are created/updated/deleted:

```json
{ "action": "created|updated|deleted", "task": {} }
```

---

## Common Dev Commands

Backend:

```bash
# from backend/
python manage.py makemigrations
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

Frontend:

```bash
# from frontend/
npm run dev
npm run build
npm run preview
```

---

## Deployment

- Provision a Redis instance and point `CHANNEL_LAYERS['default']['CONFIG']['hosts']` to it.
- Use an ASGI server (e.g., Daphne/Uvicorn) behind a reverse proxy.
- Set `DEBUG=False`, configure `ALLOWED_HOSTS`, and use a production database.
- Serve the frontend as static assets (e.g., Vite build output) behind a CDN or reverse proxy.

If you have a deployment URL, add it here:

- Deployment: <your-link-here>

---

## Troubleshooting

- WebSocket not connecting: ensure Redis is running and ports are open; check JWT token validity.
- 401 errors from API: verify `Authorization` header and token refresh flow.
- CORS issues: confirm frontend origin is listed in `CORS_ALLOWED_ORIGINS`.
