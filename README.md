# CompetencyX Frontend

Nuxt 4 frontend for the CompetencyX assessment flow. The app talks to the backend over HTTP using the public runtime config key `NUXT_PUBLIC_API_BASE`.

## Setup

Install dependencies with `pnpm`:

```bash
pnpm install
```

Create a local env file from the example:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

## API Connection

Set the backend base URL in `.env`:

```env
NUXT_PUBLIC_API_BASE=http://localhost:8000
```

The frontend API client prefixes all backend requests with this value. Current endpoints used by the app include:

- `/api/catalog/roles/`
- `/api/catalog/roles/:roleSlug/topics/`
- `/api/assessment-sessions/`
- `/api/assessment-sessions/:sessionId/`
- `/api/assessment-sessions/:sessionId/answers/`
- `/api/assessment-sessions/:sessionId/results/`
- `/api/assessment-sessions/:sessionId/history/`

## Development

Start the frontend on `http://localhost:3000`:

```bash
pnpm dev
```

## Build

Create a production build:

```bash
pnpm build
```

Preview the production build locally:

```bash
pnpm preview
```
