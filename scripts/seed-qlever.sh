#!/usr/bin/env bash
# Copy seed Turtle files into the qlever-input Docker volume and trigger re-index.
# Usage: ./scripts/seed-qlever.sh

set -e

echo "Copying seed data into qlever-input volume..."
docker compose cp sparql/ontology/shexmap.ttl qlever-init:/input/
docker compose cp sparql/seed/known-schemas.ttl qlever-init:/input/
docker compose cp sparql/seed/sample-shexmaps.ttl qlever-init:/input/

echo "Triggering QLever index rebuild..."
docker compose run --rm qlever-init

echo "Done. Restart the qlever service to pick up the new index:"
echo "  docker compose restart qlever"
