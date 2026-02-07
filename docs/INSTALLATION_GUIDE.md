# Fixed Auto-Update Setup Guide

## 🎯 What Was Fixed

Your auto-update system has been completely rebuilt to work with standard Python libraries instead of Kimi-specific dependencies. Here's what changed:

### ✅ Fixed Files

1. **`scripts/fetch_data.py`** - Now uses `yfinance` library (standard, free, no API key needed)
2. **`.github/workflows/daily-update.yml`** - Updated to install correct dependencies
3. **`requirements.txt`** - New file listing Python dependencies

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Update Your Files

Replace these files in your project:

```bash
# Copy the new files to your project
cp fetch_data.py your-project/scripts/fetch_data.py
cp daily-update.yml your-project/.github/workflows/daily-update.yml
cp requirements.txt your-project/requirements.txt
```

### Step 2: Test Locally (Optional but Recommended)

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the data fetch script
python scripts/fetch_data.py

# Check that data files were created
ls -lh public/data/
```

You should see output like:
```
[2025-02-06 12:00:00] ✓ Saved AGNC info
[2025-02-06 12:00:05] ✓ Saved AGNC history (126 days)
...
✅ Data Fetch Complete!
REITs processed: 5/5
ETFs processed: 14/14
```

### Step 3: Push to GitHub

```bash
git add .
git commit -m "Fix: Replace Kimi dependencies with yfinance"
git push
```

### Step 4: Enable GitHub Pages

1. Go to your repo → **Settings** → **Pages**
2. Source: **GitHub Actions**
3. Click **Save**

### Step 5: Test the Workflow

1. Go to **Actions** tab
2. Click **Daily Data Update**
3. Click **Run workflow** → **Run workflow**
4. Wait 2-3 minutes
5. Check that it completes successfully ✅

---

## 📅 Auto-Update Schedule

Once set up, your dashboard will automatically update:

- **When:** Monday-Friday at 9:00 PM UTC (4:00-5:00 PM ET)
- **What:** Fetches fresh stock data from Yahoo Finance
- **Where:** Deployed to GitHub Pages automatically

---

## 🔧 What the New Script Does

### Data Sources
- **Yahoo Finance API** (via yfinance library)
- No API key required
- Free tier limits: ~2,000 requests/hour (plenty for this use case)

### Fetched Data
For each stock (REITs and ETFs):
- Current price
- Dividend yield
- 6 months of historical prices
- Company name
- Sector/category

### Generated Files
```
public/data/
├── reits.json              # Current REIT data
├── etfs.json               # Current ETF data
├── reit_histories.json     # REIT price history
├── etf_histories.json      # ETF price history
├── last_update.json        # Update timestamp & schedule
└── [ticker]_info.csv       # Raw data per ticker
```

---

## 🧪 Testing Your Setup

### Manual Test

```bash
# Run the fetch script
python scripts/fetch_data.py
```

Expected output:
```
============================================================
Starting Data Fetch for High Yield Dashboard
============================================================
Data directory: /path/to/public/data

📊 Fetching REIT data...
------------------------------------------------------------
  Fetching info for AGNC...
  ✓ Saved AGNC info
  Fetching history for AGNC...
  ✓ Saved AGNC history (126 days)
...

✅ Data Fetch Complete!
============================================================
REITs processed: 5/5
ETFs processed: 14/14
Last updated: 2025-02-06 12:00:00
Next update: 2025-02-06 21:00:00 UTC
============================================================
```

### Check Generated Files

```bash
# List all JSON files
ls -lh public/data/*.json

# View last update info
cat public/data/last_update.json

# Count REIT entries
cat public/data/reits.json | grep -c "ticker"

# Count ETF entries
cat public/data/etfs.json | grep -c "ticker"
```

### Test GitHub Action

1. Go to **Actions** → **Daily Data Update**
2. Click **Run workflow**
3. Watch the logs to ensure all steps pass
4. Check your GitHub Pages site to see updated data

---

## 🐛 Troubleshooting

### Problem: Script fails with "ModuleNotFoundError: No module named 'yfinance'"

**Solution:**
```bash
pip install yfinance pandas
```

### Problem: GitHub Action fails with "pip: command not found"

**Solution:** The workflow should handle this automatically. Check that you're using the updated `daily-update.yml` file.

### Problem: Data files are empty or missing

**Solution:**
1. Check internet connection (yfinance needs internet)
2. Verify ticker symbols are correct
3. Check if Yahoo Finance is accessible: `python -c "import yfinance; print(yfinance.Ticker('AGNC').info['currentPrice'])"`

### Problem: GitHub Pages shows old data

**Solution:**
1. Check that workflow ran successfully (Actions tab)
2. Wait 2-3 minutes for Pages to rebuild
3. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
4. Check that `dist/data/` folder has updated files

### Problem: Workflow runs but doesn't commit changes

**Solution:** This is normal if the data hasn't changed. The workflow only commits when there are actual changes to the data.

---

## 📊 Monitoring Your Auto-Updates

### Check Last Run

Go to: **Actions** → **Daily Data Update** → Latest run

You'll see:
- ✅ All steps passed
- 📊 Summary showing REITs/ETFs updated
- ⏱️ Time taken (usually 2-3 minutes)

### View Live Data

Your dashboard shows:
- **Last Updated:** timestamp from last successful fetch
- **Next Update:** calculated next scheduled update
- **Auto-Update Status:** ON/OFF badge

### Manual Refresh

Users can click the **Refresh** button to reload data without waiting for the scheduled update.

---

## 🎨 Customization

### Change Update Time

Edit `.github/workflows/daily-update.yml`:

```yaml
on:
  schedule:
    # Current: 9 PM UTC (4-5 PM ET)
    - cron: '0 21 * * 1-5'
    
    # Examples:
    # 6 PM UTC: '0 18 * * 1-5'
    # 10 PM UTC: '0 22 * * 1-5'
    # Noon UTC: '0 12 * * 1-5'
```

### Add More Tickers

Edit `scripts/fetch_data.py`:

```python
# Add to REIT list
REIT_TICKERS = ['AGNC', 'NLY', 'ARR', 'ORC', 'TWO', 'STWD', 'BXMT']

# Add to ETF list
ETF_TICKERS = ['JEPI', 'QYLD', 'XYLD', 'DIVO', 'SPYD', 'SDIV', 'PGX', 
               'SPHD', 'DRIP', 'REM', 'MORT', 'IWM', 'EWZ', 'HDVB', 
               'VYM', 'SCHD']
```

### Change Update Days

```yaml
# Weekdays only (default)
- cron: '0 21 * * 1-5'

# Every day including weekends
- cron: '0 21 * * *'

# Monday, Wednesday, Friday only
- cron: '0 21 * * 1,3,5'
```

---

## 📈 Data Quality & Reliability

### Yahoo Finance API
- ✅ Free, no API key required
- ✅ Real-time market data (15-min delay for free tier)
- ✅ Reliable, used by millions of developers
- ⚠️ Rate limited to ~2,000 requests/hour (sufficient for this app)

### Error Handling
The script includes robust error handling:
- Continues if one ticker fails
- Logs all errors for debugging
- Saves partial data if some tickers succeed
- Gracefully handles network issues

### Data Freshness
- **Market hours:** Data updated after 4 PM ET close
- **Weekends:** No updates (markets closed)
- **Holidays:** No updates (markets closed)
- **After hours:** Uses last closing price

---

## 🔐 Security Notes

- No API keys required (yfinance is free)
- No sensitive data stored
- GitHub Actions uses built-in `GITHUB_TOKEN`
- All data is public market information

---

## 📝 Next Steps

1. ✅ **Replace the files** with the fixed versions
2. ✅ **Test locally** to ensure it works
3. ✅ **Push to GitHub** and enable Pages
4. ✅ **Run workflow manually** to test
5. ✅ **Verify auto-update** works on schedule

---

## 🆘 Need Help?

If you encounter issues:

1. Check the **Actions** tab for error logs
2. Run `python scripts/fetch_data.py` locally to test
3. Verify `yfinance` is installed: `pip show yfinance`
4. Check that Python is 3.11+: `python --version`
5. Ensure GitHub Pages is enabled in Settings

Common issues are usually:
- Missing dependencies (`pip install -r requirements.txt`)
- Wrong file paths (use the exact structure provided)
- GitHub Pages not enabled (Settings → Pages → GitHub Actions)

---

## 🎉 Success Indicators

Your setup is working correctly when you see:

- ✅ GitHub Action runs successfully every weekday at 9 PM UTC
- ✅ `public/data/` folder contains fresh JSON files
- ✅ Website shows updated prices and yields
- ✅ "Last Updated" timestamp is recent
- ✅ Historical charts show 6 months of data

---

**You're all set! Your dashboard will now update automatically every weekday. 🚀**
