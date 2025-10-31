# Stripe Analytics Monorepo

A modern monorepo setup with a React frontend and Hono backend.

## Tech Stack

### Frontend (`packages/frontend`)
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **shadcn/ui** - Component library built on Radix UI
- **MobX** - State management
- **Lucide React** - Icon library

### Backend (`packages/backend`)
- **Hono** - Fast web framework
- **TypeScript** - Type safety
- **Zod** - Schema validation
- **@hono/zod-validator** - Hono integration for Zod

## Project Structure

```
stripe-analytics2/
├── packages/
│   ├── frontend/          # React application
│   │   ├── src/
│   │   │   ├── components/ui/  # shadcn/ui components
│   │   │   ├── stores/         # MobX stores
│   │   │   └── lib/            # Utilities
│   │   └── package.json
│   └── backend/           # Hono API
│       ├── src/
│       │   ├── routes/        # API routes
│       │   └── schemas/       # Zod schemas
│       └── package.json
├── package.json            # Root workspace config
└── README.md
```

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development servers**
   ```bash
   npm run dev
   ```
   
   This will start:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

3. **Build for production**
   ```bash
   npm run build
   ```

## Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend in development
- `npm run dev:frontend` - Start only frontend
- `npm run dev:backend` - Start only backend
- `npm run build` - Build both packages
- `npm run test` - Run tests for all packages
- `npm run lint` - Lint all packages
- `npm run clean` - Clean build artifacts and node_modules

### Frontend
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - ESLint

### Backend
- `npm run dev` - Start server with tsx watch
- `npm run build` - Compile TypeScript
- `npm run start` - Start production server
- `npm run lint` - ESLint

## API Endpoints

- `GET /` - API info
- `GET /health` - Health check
- `GET /api/counter` - Get counter value
- `POST /api/counter` - Update counter (increment/decrement/reset)
- `PUT /api/counter` - Set counter to specific value

## Development Notes

- The frontend proxies `/api` requests to the backend
- Both projects use TypeScript with strict mode enabled
- ESLint is configured for both projects
- The monorepo uses npm workspaces for dependency management
