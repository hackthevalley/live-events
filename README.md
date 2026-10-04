# Hack the Valley live events

Public live schedule for Hack the Valley. It reads schedule data from the
`hack-the-back` API and automatically displays the current or next event.

## Local setup

Install dependencies and copy the example environment configuration:

```sh
npm install
cp .env.example .env
npm run dev
```

`VITE_BACKEND_URL` must point to the backend origin without `/api` or a
trailing slash:

```dotenv
VITE_BACKEND_URL=http://localhost:8000
```

The application requests the schedule from
`${VITE_BACKEND_URL}/api/schedule`. When the variable is omitted, local
development defaults to `http://localhost:8000`.

Set `VITE_BACKEND_URL` in the hosting provider's environment variables for
preview and production deployments. Vite embeds this value at build time, so
the site must be rebuilt after it changes.

## Commands

```sh
npm run dev
npm run build
npm run lint
npm run preview
```
