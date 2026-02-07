#!/usr/bin/env python3
"""
Data Fetching Script for High Yield Dashboard
Fetches latest REIT and ETF data from Yahoo Finance
Run: python3 scripts/fetch_data.py
"""

import json
import os
from datetime import datetime
import yfinance as yf
import pandas as pd

# Configuration
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'data')
REIT_TICKERS = ['AGNC', 'NLY', 'ARR', 'ORC', 'TWO']
ETF_TICKERS = ['JEPI', 'QYLD', 'XYLD', 'DIVO', 'SPYD', 'SDIV', 'PGX', 'SPHD', 'DRIP', 'REM', 'MORT', 'IWM', 'EWZ', 'HDVB']

def log(message):
    """Print timestamped log message"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"[{timestamp}] {message}")

def fetch_stock_info(ticker):
    """Fetch stock info from Yahoo Finance using yfinance"""
    output_file = os.path.join(DATA_DIR, f"{ticker.lower()}_info.csv")
    try:
        log(f"  Fetching info for {ticker}...")
        stock = yf.Ticker(ticker)
        info = stock.info
        
        # Extract relevant data
        data = {
            'ticker': ticker,
            'longName': info.get('longName', info.get('shortName', ticker)),
            'shortName': info.get('shortName', ticker),
            'currentPrice': info.get('currentPrice', info.get('regularMarketPrice', 0)),
            'regularMarketPrice': info.get('regularMarketPrice', 0),
            'dividendYield': info.get('dividendYield', info.get('yield', 0)),
            'yield': info.get('yield', info.get('dividendYield', 0)),
            'sector': info.get('sector', ''),
            'category': info.get('category', ''),
            'fiftyTwoWeekHigh': info.get('fiftyTwoWeekHigh', 0),
            'fiftyTwoWeekLow': info.get('fiftyTwoWeekLow', 0),
            'volume': info.get('volume', 0),
            'marketCap': info.get('marketCap', 0),
        }
        
        # Save to CSV
        df = pd.DataFrame([data])
        df.to_csv(output_file, index=False)
        log(f"  ✓ Saved {ticker} info")
        return True
        
    except Exception as e:
        log(f"  ✗ Error fetching {ticker} info: {e}")
        return False

def fetch_historical_data(ticker):
    """Fetch historical price data from Yahoo Finance"""
    output_file = os.path.join(DATA_DIR, f"{ticker.lower()}_history.csv")
    try:
        log(f"  Fetching history for {ticker}...")
        stock = yf.Ticker(ticker)
        
        # Get 6 months of daily data
        hist = stock.history(period='6mo', interval='1d')
        
        if hist.empty:
            log(f"  ✗ No historical data for {ticker}")
            return False
        
        # Reset index to make Date a column
        hist.reset_index(inplace=True)
        
        # Save to CSV
        hist.to_csv(output_file, index=False)
        log(f"  ✓ Saved {ticker} history ({len(hist)} days)")
        return True
        
    except Exception as e:
        log(f"  ✗ Error fetching {ticker} history: {e}")
        return False

def parse_csv(file_path):
    """Parse CSV file and return dictionary"""
    try:
        df = pd.read_csv(file_path)
        return df.to_dict('records')[0] if len(df) > 0 else None
    except Exception as e:
        log(f"  ✗ Error parsing {file_path}: {e}")
        return None

def process_stock_data(ticker, is_reit=False):
    """Process stock data from CSV"""
    info_file = os.path.join(DATA_DIR, f"{ticker.lower()}_info.csv")
    data = parse_csv(info_file)
    
    if not data:
        log(f"  ✗ No data found for {ticker}")
        return None
    
    # Get price
    price = 0
    if 'currentPrice' in data and data['currentPrice']:
        price = float(data['currentPrice'])
    elif 'regularMarketPrice' in data and data['regularMarketPrice']:
        price = float(data['regularMarketPrice'])
    
    # Get yield
    yield_val = 0
    if 'dividendYield' in data and data['dividendYield']:
        yield_val = float(data['dividendYield'])
        # If yield is already a percentage (>1), convert to decimal
        if yield_val > 1:
            yield_val = yield_val / 100
    elif 'yield' in data and data['yield']:
        yield_val = float(data['yield'])
        if yield_val > 1:
            yield_val = yield_val / 100
    
    result = {
        'ticker': ticker,
        'name': str(data.get('longName', data.get('shortName', ticker))),
        'price': round(price, 2),
        'yield': round(yield_val * 100, 2),  # Convert to percentage
        'sector': data.get('sector', 'Real Estate' if is_reit else None),
        'category': data.get('category', 'ETF' if not is_reit else None)
    }
    
    log(f"  ✓ Processed {ticker}: ${result['price']:.2f}, Yield: {result['yield']:.2f}%")
    return result

def get_history_data(ticker):
    """Get historical price data from CSV"""
    try:
        history_file = os.path.join(DATA_DIR, f"{ticker.lower()}_history.csv")
        df = pd.read_csv(history_file)
        
        # Sort by date
        df = df.sort_values('Date')
        
        # Convert Date column to string format
        dates = df['Date'].astype(str).tolist()
        prices = df['Close'].round(2).tolist()
        
        return {
            'dates': dates,
            'prices': prices
        }
    except Exception as e:
        log(f"  ✗ Error getting history for {ticker}: {e}")
        return {'dates': [], 'prices': []}

def is_weekday():
    """Check if today is a weekday (Monday-Friday)"""
    return datetime.now().weekday() < 5

def calculate_next_update():
    """Calculate next scheduled update time"""
    now = datetime.now()
    day = now.weekday()  # 0 = Monday, 6 = Sunday
    
    # Next update is at 21:00 UTC (9 PM)
    next_update = now.replace(hour=21, minute=0, second=0, microsecond=0)
    
    # If we're past 21:00 today, move to tomorrow
    if now.hour >= 21:
        next_update = next_update.replace(day=now.day + 1)
    
    # If next update falls on weekend, move to Monday
    next_day = next_update.weekday()
    if next_day == 5:  # Saturday
        next_update = next_update.replace(day=next_update.day + 2)
    elif next_day == 6:  # Sunday
        next_update = next_update.replace(day=next_update.day + 1)
    
    return next_update.isoformat()

def main():
    log("=" * 60)
    log("Starting Data Fetch for High Yield Dashboard")
    log("=" * 60)
    
    # Check if today is a weekday
    if not is_weekday():
        log("⚠ Today is a weekend. Markets are closed.")
        log("Fetching data anyway for testing purposes...")
        # Uncomment the line below to skip weekend fetches in production
        # return
    
    # Ensure data directory exists
    os.makedirs(DATA_DIR, exist_ok=True)
    log(f"Data directory: {DATA_DIR}")
    
    # Fetch REIT data
    log("\n📊 Fetching REIT data...")
    log("-" * 60)
    reit_success = 0
    for ticker in REIT_TICKERS:
        info_success = fetch_stock_info(ticker)
        hist_success = fetch_historical_data(ticker)
        if info_success and hist_success:
            reit_success += 1
    
    log(f"✓ REITs fetched: {reit_success}/{len(REIT_TICKERS)}")
    
    # Fetch ETF data
    log("\n📈 Fetching ETF data...")
    log("-" * 60)
    etf_success = 0
    for ticker in ETF_TICKERS:
        info_success = fetch_stock_info(ticker)
        hist_success = fetch_historical_data(ticker)
        if info_success and hist_success:
            etf_success += 1
    
    log(f"✓ ETFs fetched: {etf_success}/{len(ETF_TICKERS)}")
    
    # Process data
    log("\n🔄 Processing data...")
    log("-" * 60)
    
    # Process REITs
    reits = []
    for ticker in REIT_TICKERS:
        data = process_stock_data(ticker, is_reit=True)
        if data:
            reits.append(data)
    
    # Process ETFs
    etfs = []
    for ticker in ETF_TICKERS:
        data = process_stock_data(ticker, is_reit=False)
        if data:
            etfs.append(data)
    
    # Get histories
    log("\n📉 Compiling historical data...")
    log("-" * 60)
    reit_histories = {}
    for ticker in REIT_TICKERS:
        hist = get_history_data(ticker)
        if hist['dates']:
            reit_histories[ticker] = hist
            log(f"  ✓ {ticker}: {len(hist['dates'])} data points")
    
    etf_histories = {}
    for ticker in ETF_TICKERS:
        hist = get_history_data(ticker)
        if hist['dates']:
            etf_histories[ticker] = hist
            log(f"  ✓ {ticker}: {len(hist['dates'])} data points")
    
    # Save processed data
    log("\n💾 Saving JSON files...")
    log("-" * 60)
    
    with open(os.path.join(DATA_DIR, 'reits.json'), 'w') as f:
        json.dump(reits, f, indent=2)
    log(f"  ✓ Saved reits.json ({len(reits)} items)")
    
    with open(os.path.join(DATA_DIR, 'etfs.json'), 'w') as f:
        json.dump(etfs, f, indent=2)
    log(f"  ✓ Saved etfs.json ({len(etfs)} items)")
    
    with open(os.path.join(DATA_DIR, 'reit_histories.json'), 'w') as f:
        json.dump(reit_histories, f, indent=2)
    log(f"  ✓ Saved reit_histories.json ({len(reit_histories)} tickers)")
    
    with open(os.path.join(DATA_DIR, 'etf_histories.json'), 'w') as f:
        json.dump(etf_histories, f, indent=2)
    log(f"  ✓ Saved etf_histories.json ({len(etf_histories)} tickers)")
    
    # Save last update timestamp
    next_update = calculate_next_update()
    last_update_data = {
        'lastUpdate': datetime.now().isoformat(),
        'autoUpdateEnabled': True,
        'nextScheduledUpdate': next_update,
        'schedule': {
            'days': 'Monday-Friday',
            'time': '9:00 PM UTC',
            'description': '1 hour after US market close'
        }
    }
    
    with open(os.path.join(DATA_DIR, 'last_update.json'), 'w') as f:
        json.dump(last_update_data, f, indent=2)
    log(f"  ✓ Saved last_update.json")
    
    # Summary
    log("\n" + "=" * 60)
    log("✅ Data Fetch Complete!")
    log("=" * 60)
    log(f"REITs processed: {len(reits)}/{len(REIT_TICKERS)}")
    log(f"ETFs processed: {len(etfs)}/{len(ETF_TICKERS)}")
    log(f"Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    log(f"Next update: {datetime.fromisoformat(next_update).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    log("=" * 60)

if __name__ == '__main__':
    main()
