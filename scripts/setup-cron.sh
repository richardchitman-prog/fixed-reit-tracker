#!/bin/bash
# Setup Cron Job for Daily Updates
# Run this script to schedule automatic weekday updates

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
UPDATE_SCRIPT="$SCRIPT_DIR/run-daily-update.sh"

echo "=== High Yield Dashboard - Cron Setup ==="
echo ""

# Make scripts executable
chmod +x "$UPDATE_SCRIPT"
chmod +x "$SCRIPT_DIR/fetch_data.py"

echo "This will set up automatic data updates on weekdays."
echo ""
echo "Choose update time (market closes at 4:00 PM ET):"
echo "1) 5:00 PM ET (1 hour after market close)"
echo "2) 6:00 PM ET (2 hours after market close)"
echo "3) 8:00 PM ET (4 hours after market close)"
echo "4) Custom time"
echo "5) Skip cron setup (manual updates only)"
echo ""
read -p "Enter choice (1-5): " choice

# Convert ET to UTC (ET = UTC-5, or UTC-4 during DST)
# For simplicity, we'll use 5:00 PM ET = 22:00 UTC (winter) or 21:00 UTC (summer)
# We'll use 21:00 UTC as a safe middle ground
case $choice in
    1)
        HOUR=21  # 5 PM ET ≈ 9-10 PM UTC
        MINUTE=0
        ;;
    2)
        HOUR=22  # 6 PM ET ≈ 10-11 PM UTC
        MINUTE=0
        ;;
    3)
        HOUR=0   # 8 PM ET ≈ 12-1 AM UTC (next day)
        MINUTE=0
        ;;
    4)
        read -p "Enter hour (0-23): " HOUR
        read -p "Enter minute (0-59): " MINUTE
        ;;
    5)
        echo ""
        echo "Cron setup skipped. You can manually run:"
        echo "  bash $UPDATE_SCRIPT"
        exit 0
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

# Create cron job (weekdays only: 1-5)
CRON_JOB="$MINUTE $HOUR * * 1-5 $UPDATE_SCRIPT >> $APP_DIR/logs/cron.log 2>&1"

echo ""
echo "Setting up cron job..."
echo "Schedule: $MINUTE:$HOUR UTC, Monday-Friday"
echo "Command: $UPDATE_SCRIPT"
echo ""

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "$UPDATE_SCRIPT"; then
    echo "Cron job already exists. Updating..."
    crontab -l 2>/dev/null | grep -v "$UPDATE_SCRIPT" | crontab -
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "✅ Cron job installed successfully!"
echo ""
echo "To verify, run: crontab -l"
echo ""
echo "To remove the cron job later, run:"
echo "  crontab -l | grep -v '$UPDATE_SCRIPT' | crontab -"
echo ""
echo "To manually update now, run:"
echo "  bash $UPDATE_SCRIPT"
