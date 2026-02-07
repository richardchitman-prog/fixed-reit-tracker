# 🏆 High Yield REIT & ETF Tracker - FIXED VERSION

## ✅ What's Fixed

This version has been **completely fixed** to work with standard Python libraries instead of Kimi-specific dependencies. Your auto-updates will now work on GitHub Actions!

### Key Changes:
- ✅ Replaced Kimi dependencies with `yfinance` (free Yahoo Finance API)
- ✅ Updated GitHub Actions workflow to install correct dependencies
- ✅ Added `requirements.txt` for easy local testing
- ✅ Enhanced error handling and logging
- ✅ Auto-calculates next update time

---

## 🚀 Quick Setup (5 Minutes)

### Deploy to GitHub Pages (Recommended)

1. **Create a new GitHub repository**
   ```bash
   # On GitHub.com:
   # - Click "New repository"
   # - Name it (e.g., "high-yield-tracker")
   # - Make it PUBLIC (required for free GitHub Pages)
   # - Don't initialize with README
   ```

2. **Push this code to GitHub**
   ```bash
   cd path/to/this/folder
   git init
   git add .
   git commit -m "Initial commit - Fixed auto-update"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

3. **Enable GitHub Pages**
   - Go to Settings → Pages
   - Source: **GitHub Actions**
   - Click Save

4. **Test the auto-update**
   - Go to Actions tab
   - Click "Daily Data Update"
   - Click "Run workflow"
   - Wait 2-3 minutes → Should see ✅

5. **View your live site**
   - Settings → Pages → Click the URL

**Done!** Auto-updates every weekday at 9 PM UTC.

---

## 📅 Auto-Update Schedule

- **When:** Monday-Friday at 9:00 PM UTC (4-5 PM ET)
- **What:** Fresh stock data from Yahoo Finance
- **Cost:** FREE ✅

---

## 🧪 Test Locally (Optional)

```bash
# Install dependencies
pip install -r requirements.txt
npm install

# Fetch data
python scripts/fetch_data.py

# Run dev server
npm run dev

# Open http://localhost:5173
```

---

## 📊 Tracked Securities

**REITs:** AGNC, NLY, ARR, ORC, TWO
**ETFs:** JEPI, QYLD, XYLD, DIVO, SPYD, SDIV, PGX, SPHD, DRIP, REM, MORT, IWM, EWZ, HDVB

Add more in `scripts/fetch_data.py` (lines 18-20)

---

## 🐛 Troubleshooting

**"No module named 'yfinance'"**
```bash
pip install -r requirements.txt
```

**GitHub Action fails**
- Check Actions tab for logs
- Verify Pages is enabled (Settings → Pages)

**Site shows old data**
- Wait 2-3 min after workflow
- Hard refresh (Ctrl+Shift+R)

---

## ⚙️ Customization

**Change update time** (`.github/workflows/daily-update.yml` line 6):
```yaml
- cron: '0 21 * * 1-5'  # 9 PM UTC (current)
- cron: '0 18 * * 1-5'  # 6 PM UTC
```

**Add tickers** (`scripts/fetch_data.py` lines 18-20):
```python
REIT_TICKERS = ['AGNC', 'NLY', 'STWD']  # Add more
ETF_TICKERS = ['JEPI', 'SCHD', 'VYM']   # Add more
```

---

## ✅ Success Checklist

- [ ] Pushed to GitHub
- [ ] Enabled GitHub Pages
- [ ] Workflow runs successfully
- [ ] Site shows current prices
- [ ] "Last Updated" shows today

---

**Your dashboard now auto-updates daily! 🎉**

For detailed docs, see the included markdown files.
"# high-yield-tracker" 
"# high-yield-tracker" 
