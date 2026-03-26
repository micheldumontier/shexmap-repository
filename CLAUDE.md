# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

An online repository platform for **ShExMaps** — mappings between RDF shapes defined by ShEx (Shape Expressions). See [REQUIREMENTS.md](REQUIREMENTS.md) for full requirements.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js with Fastify (`api/`) |
| Triplestore / SPARQL | QLever (`docker/qlever/`) |
| Frontend | React SPA with Vite (`frontend/`) |
| Auth | Optional — OAuth2/OIDC + API keys (`AUTH_ENABLED` env var) |
| Deployment | Docker + Docker Compose |
| ShEx processing | `@shexjs/parser`, `@shexjs/core` |
| Visualization | ReactFlow (mapping graphs), Recharts (coverage heatmaps) |

## Commands

```bash
# Start everything
cp .env.example .env
docker compose up --build

# Development (hot reload — starts api + qlever + nginx)
docker compose up

# Run API in dev mode (outside Docker, requires QLever running separately)
cd api && npm install && npm run dev

# Run frontend dev server
cd frontend && npm install && npm run dev

# Type-check API
cd api && npm run typecheck

# Run tests
cd api && npm test
cd frontend && npm test

# Seed QLever with sample data
./scripts/seed-qlever.sh

# Force full QLever index rebuild
./scripts/rebuild-index.sh

# Validate a ShExMap file
npx tsx scripts/validate-shexmap.ts path/to/map.shexmap
```

## Architecture

Services are orchestrated with Docker Compose and communicate over a private `shexmap-net` bridge network. Only nginx is exposed to the host on port 80.

```
Browser → nginx:80
           ├── /api/v1/*  → api:3000   (Fastify REST API)
           ├── /sparql    → api:3000   (proxied to QLever with optional auth)
           └── /*         → static     (React SPA)

api:3000 → qlever:7001  (direct SPARQL queries, not through nginx)
```

### Key Directories

- [api/src/](api/src/) — Fastify server; all `process.env` reads live in [api/src/config.ts](api/src/config.ts)
- [api/src/plugins/](api/src/plugins/) — Fastify plugins (cors, auth, sparqlClient, swagger)
- [api/src/routes/v1/](api/src/routes/v1/) — REST API routes (`/api/v1/shexmaps`, `/coverage`, `/users`, `/auth`)
- [api/src/routes/sparqlProxy.ts](api/src/routes/sparqlProxy.ts) — transparent proxy from `/sparql` to QLever
- [api/src/services/](api/src/services/) — business logic (shexmap CRUD, ShEx validation, SPARQL helpers, coverage)
- [api/src/rdf/](api/src/rdf/) — RDF prefix map and SPARQL query helpers
- [frontend/src/api/](frontend/src/api/) — typed React Query hooks for all API endpoints
- [frontend/src/store/authStore.ts](frontend/src/store/authStore.ts) — Zustand auth state (persisted to localStorage)
- [frontend/src/components/graph/](frontend/src/components/graph/) — ReactFlow mapping visualisation
- [frontend/src/components/coverage/](frontend/src/components/coverage/) — Recharts coverage heatmap
- [sparql/ontology/shexmap.ttl](sparql/ontology/shexmap.ttl) — RDF ontology; defines all vocabulary used in the triplestore
- [sparql/seed/](sparql/seed/) — seed Turtle files loaded into QLever on first start
- [sparql/queries/](sparql/queries/) — reference SPARQL queries (`.rq` = SELECT, `.ru` = UPDATE)
- [docker/nginx/nginx.conf](docker/nginx/nginx.conf) — reverse proxy routing for all services

### Data Model (RDF)

All ShExMap data is stored as RDF in QLever. The ontology is at [sparql/ontology/shexmap.ttl](sparql/ontology/shexmap.ttl).

Core IRI patterns:
- ShExMap: `https://shexmap.example.org/resource/{uuid}`
- User: `https://shexmap.example.org/resource/user/{id}`
- Schema: `https://shexmap.example.org/resource/schema/{id}`

### Authentication

Auth is entirely behind the `AUTH_ENABLED` environment variable (default: `false`).
When disabled, `requireAuth` preHandlers are no-ops and the platform is fully public read+write.
When enabled, the API supports JWT (Bearer token) and API keys (`X-API-Key` header).
OAuth providers: GitHub, ORCID, Google (wired via `@fastify/oauth2`).

### QLever Notes

QLever builds an on-disk index at startup from Turtle files — it is **not** a live-append store like Fuseki. Updates go through SPARQL UPDATE via `config.qlever.updateUrl`. If QLever's UPDATE endpoint is unavailable, the index must be rebuilt via `./scripts/rebuild-index.sh`.

The index build runs in the `qlever-init` init-container and gates all other services via `depends_on: condition: service_completed_successfully`.
