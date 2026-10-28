#!/usr/bin/env bash
set -e

# 1. Build the ARES'26 app — Vite is configured (ares26/vite.config.js) to
#    output straight into dist/ares26 with base path /ares26/.
cd ares26
npm install
npm run build
cd ..

# 2. Copy the new SRC homepage (static, no build step) into dist/.
mkdir -p dist
cp -r site/* dist/

echo ""
echo "Done. Deploy the dist/ folder:"
echo "  dist/index.html   -> served at  /"
echo "  dist/ares26/...   -> served at  /ares26/"
