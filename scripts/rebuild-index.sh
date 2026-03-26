#!/usr/bin/env bash
# Force a full QLever index rebuild from current input files.
# WARNING: This stops the qlever service, deletes the index, and rebuilds it.
# Usage: ./scripts/rebuild-index.sh

set -e

echo "Stopping qlever service..."
docker compose stop qlever

echo "Removing old index files..."
docker compose run --rm qlever-init sh -c "rm -f /data/shexmap.index.* /data/shexmap.meta"

echo "Rebuilding index..."
docker compose run --rm qlever-init

echo "Starting qlever..."
docker compose start qlever

echo "Index rebuild complete."
