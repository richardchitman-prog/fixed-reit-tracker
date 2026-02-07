# Automatic Update Setup Guide

This guide explains how to set up automatic weekday updates for your High Yield Dashboard.

## Overview

The dashboard can automatically fetch fresh market data and rebuild itself on weekdays (Monday-Friday) after the US stock market closes.

**Default Schedule:** 9:00 PM UTC (4-5 PM ET depending on DST)

---

## Option 1: GitHub Actions (Recommended - Free)

The easiest way to enable automatic updates is using GitHub Actions, which is free for public repositories.

### Setup Steps:

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/high-yield-dashboard.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**
   - Go to Settings → Pages
   - Source: GitHub Actions

3. **The workflow is already configured** in `.github/workflows/daily-update.yml`
   - Runs Monday-Friday at 9:00 PM UTC
   - Fetches fresh data
   - Builds and deploys automatically

4. **Manual trigger**: Go to Actions → Daily Data Update → Run workflow

---

## Option 2: Local Server / VPS (Cron Job)

If you're running this on your own server or VPS:

### Quick Setup:

```bash
# 1. Navigate to the scripts directory
cd scripts

# 2. Make scripts executable
chmod +x *.sh

# 3. Run the setup wizard
bash setup-cron.sh
```

### Manual Cron Setup:

```bash
# Edit crontab
crontab -e

# Add this line for weekdays at 9 PM UTC:
0 21 * * 1-5 /path/to/your/app/scripts/run-daily-update.sh >> /path/to/your/app/logs/cron.log 2>&1

# Save and exit
```

### Verify Cron Job:

```bash
# List all cron jobs
crontab -l

# Check cron service status
sudo systemctl status cron
```

---

## Option 3: Manual Updates

Run the update script manually whenever you want fresh data:

```bash
# Using Python
python3 scripts/fetch_data.py

# Or using the shell script (includes build)
bash scripts/run-daily-update.sh
```

---

## Update Schedule Details

| Day | Update Time (UTC) | Update Time (ET) | Market Status |
|-----|-------------------|------------------|---------------|
| Monday | 9:00 PM | 4:00 PM (EST) / 5:00 PM (EDT) | After close |
| Tuesday | 9:00 PM | 4:00 PM (EST) / 5:00 PM (EDT) | After close |
| Wednesday | 9:00 PM | 4:00 PM (EST) / 5:00 PM (EDT) | After close |
| Thursday | 9:00 PM | 4:00 PM (EST) / 5:00 PM (EDT) | After close |
| Friday | 9:00 PM | 4:00 PM (EST) / 5:00 PM (EDT) | After close |
| Saturday | No update | - | Markets closed |
| Sunday | No update | - | Markets closed |

---

## Files Overview

| File | Purpose |
|------|---------|
| `scripts/fetch_data.py` | Fetches market data from Yahoo Finance |
| `scripts/run-daily-update.sh` | Full update script (fetch + build + deploy) |
| `scripts/setup-cron.sh` | Interactive cron setup wizard |
| `.github/workflows/daily-update.yml` | GitHub Actions workflow |
| `public/data/last_update.json` | Tracks last update time and settings |

---

## Troubleshooting

### Cron job not running?

1. Check cron service:
   ```bash
   sudo systemctl status cron
   sudo systemctl enable cron
   sudo systemctl start cron
   ```

2. Check logs:
   ```bash
   tail -f logs/cron.log
   tail -f logs/daily-update.log
   ```

3. Verify paths in crontab are absolute paths

### Data not updating?

1. Check if markets are open (weekdays only)
2. Verify Yahoo Finance API is accessible
3. Check Python dependencies: `pip install pandas`

### GitHub Actions not working?

1. Check repository has GitHub Pages enabled
2. Verify `GITHUB_TOKEN` has proper permissions
3. Check Actions tab for error messages

---

## Customization

### Change Update Time:

Edit the cron expression or GitHub Actions workflow:

```yaml
# .github/workflows/daily-update.yml
# Current: 0 21 * * 1-5 (9 PM UTC, weekdays)
# Example: 0 18 * * 1-5 (6 PM UTC, weekdays)
```

### Change Which Days:

- `1-5` = Monday-Friday (default)
- `1,3,5` = Monday, Wednesday, Friday
- `*` = Every day

---

## Dashboard Controls

The website includes controls for auto-update:

- **Settings Button** → Toggle Auto-Update ON/OFF
- **Refresh Button** → Manual refresh anytime
- **Status Badges** → Shows auto-update status

---

## Need Help?

- Check logs in `logs/` directory
- Verify all scripts are executable: `chmod +x scripts/*.sh`
- Ensure Node.js and Python are installed
