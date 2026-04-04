# ShExMap Repository

An online platform to store, discover, and explore **ShExMaps** — mappings between RDF shapes defined by [ShEx (Shape Expressions)](http://shex.io).

## Features

- **REST API** (`/api/v1/`) with OpenAPI documentation at `/api/v1/docs`
- **SPARQL 1.1 endpoint** (`/sparql`) backed by [QLever](https://github.com/ad-freiburg/qlever)
- **React web interface** — browse, search, submit, and visualise ShExMaps
- **Mapping graph visualisation** — interactive node-link diagrams of source/target schema relationships
- **Coverage insights** — heatmaps and gap analysis showing which ShEx standards have mappings
- **Optional authentication** — OAuth2/OIDC (GitHub, ORCID, Google) + API keys; disabled by default

## Quick Start

```bash
git clone <repo>
cd shexmap-repository

cp .env.example .env        # review and edit as needed
docker compose up --build
```

Open [http://localhost](http://localhost).

- REST API docs: [http://localhost/api/v1/docs](http://localhost/api/v1/docs)
- SPARQL endpoint: [http://localhost/sparql](http://localhost/sparql)

## Tech Stack

- **Backend**: Node.js + Fastify (TypeScript)
- **Triplestore**: QLever
- **Frontend**: React + Vite + Tailwind CSS
- **Visualisation**: ReactFlow, Recharts
- **Deployment**: Docker + Docker Compose

## Development

QLever must be running locally before starting the API or frontend. Start it with Docker Compose (detached), then run the API and frontend dev servers:

```bash
# 1. Start QLever in the background (only needed once)
docker compose up qlever-perms qlever-init qlever -d

# 2. Set up the .env and symlink it for the API
cp .env.example .env        # uses localhost:7001 for QLever
ln -s ../.env api/.env

# 3. API with hot reload
cd api && npm install && npm run dev

# 4. Frontend dev server (with HMR) — in a separate terminal
cd frontend && npm install && npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

The Vite dev server proxies `/api` → `localhost:3000` and `/sparql` → `localhost:7001`.

## Configuration

All configuration is via environment variables. Copy `.env.example` to `.env`.

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTH_ENABLED` | `false` | Enable OAuth2/OIDC authentication |
| `QLEVER_SPARQL_URL` | `http://localhost:7001/sparql` | QLever SPARQL endpoint |
| `JWT_SECRET` | *(change this)* | Secret for signing JWTs |

## Contributing

Submit ShExMaps via the web UI at `/submit` or via the REST API:

```bash
curl -X POST http://localhost/api/v1/shexmaps \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My ShExMap",
    "content": "...",
    "sourceSchemaUrl": "https://...",
    "targetSchemaUrl": "https://...",
    "tags": ["example"]
  }'
```

## License

Apache 2.0
