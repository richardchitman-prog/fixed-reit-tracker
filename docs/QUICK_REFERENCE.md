# 🎯 Quick Fix Reference Card

## What You Need to Do

### 1️⃣ Replace These 3 Files

| File to Replace | New Location | Purpose |
|----------------|--------------|---------|
| `scripts/fetch_data.py` | ✅ Provided | Uses yfinance instead of Kimi |
| `.github/workflows/daily-update.yml` | ✅ Provided | Installs correct dependencies |
| `requirements.txt` | ✅ NEW FILE | Lists Python dependencies |

### 2️⃣ Quick Commands

```bash
# 1. Copy files to your project
cp fetch_data.py your-project/scripts/
cp daily-update.yml your-project/.github/workflows/
cp requirements.txt your-project/

# 2. Test locally (optional)
pip install -r requirements.txt
python scripts/fetch_data.py

# 3. Push to GitHub
git add .
git commit -m "Fix: Replace Kimi dependencies with yfinance"
git push

# 4. Go to GitHub → Settings → Pages → Source: "GitHub Actions"

# 5. Go to Actions tab → "Daily Data Update" → "Run workflow"
```

---

## Key Changes

### Before (Broken) ❌
```python
# Old fetch_data.py - Line 14-15
sys.path.insert(0, '/app/.kimi/skills/webapp-building')
from data_source import get_data_source
```

### After (Fixed) ✅
```python
# New fetch_data.py - Line 7
import yfinance as yf
```

---

## What This Fixes

| Issue | Status |
|-------|--------|
| ❌ Data fetch fails (missing Kimi deps) | ✅ Fixed with yfinance |
| ❌ GitHub Actions fails | ✅ Fixed with updated workflow |
| ❌ No auto-updates happening | ✅ Fixed - runs weekdays at 9PM UTC |
| ⚠️ Manual refresh only reloads files | ⚠️ Still needs API endpoint (separate fix) |

---

## Testing Your Fix

### Step 1: Local Test
```bash
python scripts/fetch_data.py
```

**Expected output:**
```
============================================================
Starting Data Fetch for High Yield Dashboard
============================================================
📊 Fetching REIT data...
  ✓ Saved AGNC info
  ✓ Saved AGNC history (126 days)
...
✅ Data Fetch Complete!
REITs processed: 5/5
ETFs processed: 14/14
```

### Step 2: GitHub Actions Test
1. Go to **Actions** tab
2. Click **Daily Data Update**
3. Click **Run workflow** button
4. Wait 2-3 minutes
5. Should see ✅ green checkmark

### Step 3: Verify Auto-Update
- Check your GitHub Pages site
- Look for "Last Updated" timestamp
- Should show current date/time

---

## Auto-Update Schedule

- **Runs:** Monday-Friday at 9:00 PM UTC
- **That's:** 4:00-5:00 PM ET (depending on DST)
- **Fetches:** Fresh data from Yahoo Finance
- **Deploys:** Automatically to GitHub Pages

---

## Dependencies

### Python (installed by workflow)
- `yfinance` - Yahoo Finance API client
- `pandas` - Data processing

### Node.js (already in your project)
- Same as before - no changes needed

---

## File Descriptions

### `fetch_data.py` (NEW VERSION)
- ✅ Uses standard yfinance library
- ✅ No Kimi dependencies
- ✅ Better error handling
- ✅ Detailed logging
- ✅ Auto-calculates next update time
- ✅ Works in any environment

### `daily-update.yml` (UPDATED)
- ✅ Installs yfinance + pandas
- ✅ Proper git configuration
- ✅ Better error messages
- ✅ Summary in Actions tab
- ✅ Only commits when data changes

### `requirements.txt` (NEW)
- ✅ Lists all Python dependencies
- ✅ Makes local testing easier
- ✅ Used by GitHub Actions

---

## Troubleshooting

### "ModuleNotFoundError: No module named 'yfinance'"
```bash
pip install yfinance pandas
```

### "No such file or directory: 'public/data/'"
```bash
mkdir -p public/data
python scripts/fetch_data.py
```

### GitHub Action shows old data
- Wait 2-3 minutes for Pages rebuild
- Hard refresh browser (Ctrl+Shift+R)
- Check Actions tab for latest run

### Workflow doesn't run automatically
- Check: Settings → Pages → Source is "GitHub Actions"
- Check: Workflow file is in `.github/workflows/`
- Wait until next scheduled time (9 PM UTC weekday)

---

## Success Checklist

- [ ] Replaced `scripts/fetch_data.py`
- [ ] Replaced `.github/workflows/daily-update.yml`
- [ ] Added `requirements.txt` to project root
- [ ] Tested locally: `python scripts/fetch_data.py` works
- [ ] Pushed to GitHub
- [ ] Enabled GitHub Pages (Settings → Pages)
- [ ] Manual workflow run succeeds (Actions tab)
- [ ] Website shows updated data

---

## Support

For full details, see `INSTALLATION_GUIDE.md`

**Your dashboard will now auto-update every weekday! 🎉**
