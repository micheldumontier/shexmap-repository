# ShExMap Repository — Project Requirements

## Overview

An online platform to store, discover, view, and retrieve **ShExMaps** — mappings between RDF shapes defined by ShEx (Shape Expressions). The platform provides a REST API, a SPARQL endpoint, a visual web interface, and insights into mapping coverage against ShEx-defined standards.

---

## Core Features

### 1. ShExMap Repository
- Store ShExMaps with metadata (title, description, author, version, license, tags)
- Version history for ShExMaps
- Support for linking ShExMaps to their associated ShEx schemas/shapes
- Full-text and structured search across the repository

### 2. REST API
- CRUD operations for ShExMaps and associated metadata
- Validation of submitted ShExMaps
- Filtering/search endpoints (by author, tags, standard, coverage, etc.)
- Pagination and sorting
- OpenAPI/Swagger documentation

### 3. SPARQL Endpoint
- Expose repository contents as queryable RDF via QLever
- ShExMaps and metadata stored as RDF triples
- Public read access; authenticated write access (when auth is enabled)
- Standard SPARQL 1.1 support

### 4. Web Interface (React SPA)
- Browse and search ShExMaps
- View ShExMap details: source/target shapes, mapping rules, metadata
- Graphical/visual overview of mappings (node-link diagrams, shape graphs)
- Interactive navigation into mapping structure
- Responsive design

### 5. Authentication (Optional)
- Users can use the platform anonymously (read-only) or register/log in
- OAuth2/OIDC support (e.g. GitHub, ORCID, Google)
- API key support for programmatic access
- Role-based access: anonymous, user, admin

### 6. User Dashboard
- Personal profile page
- Contributions: ShExMaps submitted/maintained by the user
- Starred/bookmarked ShExMaps
- Activity feed (recent uploads, edits, stars)

### 7. Coverage Insights
- Track which ShEx standards/shapes have corresponding ShExMaps
- Coverage metrics: % of a standard's shapes that have mappings
- Gap analysis: highlight unmapped or poorly mapped shapes
- Aggregated statistics across the full repository

### 8. Visualization
- Graphical overview of mappings between source and target shapes
- Navigable graph of related ShExMaps and ShEx schemas
- Coverage heatmaps or charts per standard
- Embedding-friendly share views for individual maps

---

## Technical Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js with Express or Fastify |
| Triplestore / SPARQL | QLever |
| Frontend | React (SPA) |
| Authentication | Optional — OAuth2/OIDC + API keys |
| Containerization | Docker + Docker Compose |
| ShEx processing | @shexjs ecosystem |

---

## Non-Functional Requirements

- All services runnable locally via `docker compose up`
- REST API versioned under `/api/v1/`
- SPARQL endpoint accessible at `/sparql`
- Authentication entirely optional — platform usable without login
- ShExMap submissions validated server-side before storage
