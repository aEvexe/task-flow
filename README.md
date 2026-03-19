# TaskFlow

A full-stack Kanban task management app (mini Trello) with JWT authentication, boards, tasks, and drag-and-drop.

## Tech Stack

- **Backend**: NestJS + TypeScript + MongoDB (Mongoose) + Passport JWT + Swagger
- **Frontend**: React + TypeScript (Vite) + React Router + @hello-pangea/dnd
- **Database**: MongoDB
- **Testing**: Jest (backend) + Vitest (frontend) + Testing Library

## Architecture

```
TaskFlow/
├── backend/           # NestJS API server
│   ├── src/
│   │   ├── auth/      # JWT authentication (register/login)
│   │   ├── boards/    # Board CRUD with ownership
│   │   ├── tasks/     # Task CRUD with Kanban positioning
│   │   ├── users/     # User schema and service
│   │   └── config/    # Environment configuration
│   └── test/          # E2E tests
├── frontend/          # React SPA
│   ├── src/
│   │   ├── api/       # Axios API client
│   │   ├── components/# Reusable UI components
│   │   ├── context/   # Auth context
│   │   ├── pages/     # Route pages
│   │   └── types/     # TypeScript interfaces
│   └── nginx.conf     # Production nginx config
└── docker-compose.yml # Full stack orchestration
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Docker)

### Backend

```bash
cd backend
cp ../.env.example .env    # Edit with your MongoDB URI and JWT secret
npm install
npm run start:dev          # Starts on http://localhost:3000
```

API docs available at: http://localhost:3000/api/docs

### Frontend

```bash
cd frontend
npm install
npm run dev                # Starts on http://localhost:5173
```

### Seed Demo Data

```bash
cd backend
npm run seed               # Creates demo@example.com / password123
```

## Docker

Run the full stack with Docker Compose:

```bash
docker-compose up --build
```

- Frontend: http://localhost
- Backend API: http://localhost:3000
- Swagger docs: http://localhost:3000/api/docs

## Testing

```bash
# Backend unit tests
cd backend && npm test

# Backend E2E tests
cd backend && npm run test:e2e

# Frontend component tests
cd frontend && npm test
```

## API Endpoints

| Method | Endpoint                          | Description        | Auth |
|--------|-----------------------------------|--------------------|------|
| POST   | /auth/register                    | Register user      | No   |
| POST   | /auth/login                       | Login user         | No   |
| GET    | /boards                           | List user's boards | Yes  |
| POST   | /boards                           | Create board       | Yes  |
| GET    | /boards/:id                       | Get board          | Yes  |
| PATCH  | /boards/:id                       | Update board       | Yes  |
| DELETE | /boards/:id                       | Delete board       | Yes  |
| GET    | /boards/:boardId/tasks            | List board tasks   | Yes  |
| POST   | /boards/:boardId/tasks            | Create task        | Yes  |
| PATCH  | /boards/:boardId/tasks/:taskId    | Update task        | Yes  |
| DELETE | /boards/:boardId/tasks/:taskId    | Delete task        | Yes  |
| POST   | /boards/:boardId/tasks/reorder    | Reorder tasks      | Yes  |

## Environment Variables

| Variable     | Default                            | Description          |
|--------------|------------------------------------|----------------------|
| MONGODB_URI  | mongodb://localhost:27017/taskflow  | MongoDB connection   |
| JWT_SECRET   | your-secret-key                    | JWT signing secret   |
| PORT         | 3000                               | Backend server port  |
| VITE_API_URL | http://localhost:3000              | Backend URL (frontend)|
