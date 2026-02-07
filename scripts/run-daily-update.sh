#!/bin/bash
# Daily Update Script for High Yield Dashboard
# This script fetches fresh data and rebuilds the website
# Run automatically on weekdays via cron

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$APP_DIR/logs/daily-update.log"

# Create logs directory if needed
mkdir -p "$APP_DIR/logs"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=== Starting Daily Update ==="

# Check if today is a weekday (1-5 = Monday-Friday)
DAY_OF_WEEK=$(date +%u)
if [ "$DAY_OF_WEEK" -gt 5 ]; then
    log "Today is a weekend. Markets closed. Skipping update."
    exit 0
fi

cd "$APP_DIR"

# Step 1: Fetch fresh data
log "Step 1: Fetching fresh market data..."
if command -v python3 &> /dev/null; then
    python3 "$SCRIPT_DIR/fetch_data.py" 2>&1 | tee -a "$LOG_FILE"
elif command -v python &> /dev/null; then
    python "$SCRIPT_DIR/fetch_data.py" 2>&1 | tee -a "$LOG_FILE"
else
    log "ERROR: Python not found!"
    exit 1
fi

# Step 2: Build the website
log "Step 2: Building website..."
npm run build 2>&1 | tee -a "$LOG_FILE"

# Step 3: Copy data files to dist
log "Step 3: Copying data files..."
cp -r "$APP_DIR/public/data" "$APP_DIR/dist/"

# Step 4: Deploy (if deploy script exists)
if [ -f "$SCRIPT_DIR/deploy.sh" ]; then
    log "Step 4: Deploying website..."
    bash "$SCRIPT_DIR/deploy.sh" 2>&1 | tee -a "$LOG_FILE"
fi

log "=== Daily Update Complete ==="
log "Website updated with latest market data!"
