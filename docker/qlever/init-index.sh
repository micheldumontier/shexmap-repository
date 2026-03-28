#!/bin/sh
# Build the QLever index from seed Turtle files.
# Skips rebuild if the index already exists.
# Runs as the qlever-init init container.

set -e

INDEX_FILE="/data/shexmap.index.pos"

if [ -f "$INDEX_FILE" ]; then
    echo "QLever index already exists — skipping rebuild."
    exit 0
fi

echo "Copying seed data into working directory..."
cd /data
rm -f ./*.ttl
cp /sparql-data/ontology/*.ttl .
cp /sparql-data/seed/shexmaps/*.ttl .
cp /sparql-data/seed/pairings/*.ttl .
cp /sparql-data/seed/*.ttl . 2>/dev/null || true

echo "Merging TTL files (prefixes first)..."
# QLever requires all @prefix declarations before any triples in the stream.
# Merge: unique prefix lines first, then all non-prefix lines.
{
  grep -h '^@prefix' ./*.ttl | sort -u
  echo ""
  grep -hv '^@prefix' ./*.ttl | grep -v '^#' | grep -v '^[[:space:]]*$'
} > merged.ttl

echo "Building QLever index..."
qlever index \
    --name shexmap \
    --input-files merged.ttl \
    --cat-input-files "cat merged.ttl" \
    --format ttl \
    --parallel-parsing false \
    --system native \
    --overwrite-existing

echo "Index build complete."
