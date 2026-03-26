#!/bin/sh
# Build the QLever index from seed Turtle files.
# Skips rebuild if the index already exists.
# Runs as the qlever-init init container.

set -e

INDEX_FILE="/data/shexmap.index.pos-h-h"

if [ -f "$INDEX_FILE" ]; then
    echo "QLever index already exists — skipping rebuild."
    exit 0
fi

echo "Copying seed data into working directory..."
cd /data
cp /sparql-data/ontology/*.ttl .
cp /sparql-data/seed/*.ttl .

echo "Building QLever index..."
qlever index \
    --name shexmap \
    --input-files "*.ttl" \
    --cat-input-files "cat *.ttl" \
    --format ttl \
    --parallel-parsing false \
    --system native \
    --overwrite-existing

echo "Index build complete."
