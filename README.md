# InspectMate

AI-assisted regulatory inspection PWA for packaged commodities.

## Architecture

InspectMate is divided into two decoupled layers: a React/Vite frontend and an Express/MongoDB backend.

```
InspectMate/
├── frontend/               # React + Vite PWA
│   ├── package.json        # Frontend dependencies
│   ├── vite.config.ts      # Vite build & proxy config
│   ├── src/                # UI Components and pages
│   └── public/             # Static assets
│
├── backend/                # Express + Mongoose API
│   ├── package.json        # Backend dependencies
│   ├── .env                # Database configuration
│   ├── src/                # Express Server, Models, Repositories, Services
│   └── test/               # Integration tests (Vitest)
│
└── package.json            # Root convenience scripts (Optional)
```

## Running Locally

Because the frontend and backend are separate, you must run both for full functionality.

### 1. Database Configuration
1. Open `backend/.env`
2. Add your `MONGODB_URI` connection string (MongoDB Atlas highly recommended for transaction support).

### 2. Start the Backend
```bash
cd backend
npm install
npm run dev
```
*The backend runs on `http://localhost:3001`.*

### 3. Start the Frontend
Open a new terminal tab and run:
```bash
cd frontend
npm install
npm run dev
```
*The frontend runs on `http://localhost:3000`. API calls made to `/api/*` are automatically proxied to the backend.*

## Testing

Backend integration tests use `mongodb-memory-server` to mock transactions and idempotency checks.

```bash
cd backend
npm run test
```
