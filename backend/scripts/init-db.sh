#!/bin/sh
# Init script - just start the server
# The server handles DB sync and auto-seed internally

echo "🚀 Starting server..."
exec node dist/server.cjs
