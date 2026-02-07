#!/usr/bin/env node
/**
 * Data Fetching Script for High Yield Dashboard
 * Fetches latest REIT and ETF data from Yahoo Finance
 * Run: node scripts/fetch-data.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
const REIT_TICKERS = ['AGNC', 'NLY', 'ARR', 'ORC', 'TWO'];
const ETF_TICKERS = ['JEPI', 'QYLD', 'XYLD', 'DIVO', 'SPYD', 'SDIV', 'PGX', 'SPHD', 'DRIP', 'REM', 'MORT'];

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

async function fetchStockInfo(ticker) {
  try {
    const outputFile = path.join(DATA_DIR, `${ticker.toLowerCase()}_info.csv`);
    const command = `python3 -c "
import sys
sys.path.insert(0, '/app/.kimi/skills/webapp-building')
from data_source import get_data_source
get_data_source('yahoo_finance', 'get_stock_info', {'ticker': '${ticker}', 'file_path': '${outputFile}'})
"`;
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    log(`Error fetching ${ticker}: ${error.message}`);
    return false;
  }
}

async function fetchHistoricalData(ticker) {
  try {
    const outputFile = path.join(DATA_DIR, `${ticker.toLowerCase()}_history.csv`);
    const command = `python3 -c "
import sys
sys.path.insert(0, '/app/.kimi/skills/webapp-building')
from data_source import get_data_source
get_data_source('yahoo_finance', 'get_historical_stock_prices', {'ticker': '${ticker}', 'period': '6mo', 'interval': '1d', 'file_path': '${outputFile}'})
"`;
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    log(`Error fetching history for ${ticker}: ${error.message}`);
    return false;
  }
}

function parseCSV(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const values = lines[1].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    
    const result = {};
    headers.forEach((header, i) => {
      result[header] = values[i];
    });
    return result;
  } catch (error) {
    return null;
  }
}

function processStockData(ticker, isREIT = false) {
  const infoFile = path.join(DATA_DIR, `${ticker.toLowerCase()}_info.csv`);
  const data = parseCSV(infoFile);
  
  if (!data) return null;
  
  const price = parseFloat(data.currentPrice || data.regularMarketPrice || 0);
  let yield_val = 0;
  
  if (data.dividendYield) {
    yield_val = parseFloat(data.dividendYield);
    if (yield_val > 1) yield_val = yield_val / 100; // Convert from percentage if needed
  } else if (data.yield) {
    yield_val = parseFloat(data.yield);
  }
  
  return {
    ticker,
    name: data.longName || data.shortName || ticker,
    price,
    yield: yield_val * 100, // Convert to percentage
    sector: data.sector || (isREIT ? 'Real Estate' : undefined),
    category: data.category || (!isREIT ? 'ETF' : undefined)
  };
}

function getHistoryData(ticker) {
  try {
    const historyFile = path.join(DATA_DIR, `${ticker.toLowerCase()}_history.csv`);
    const content = fs.readFileSync(historyFile, 'utf8');
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const dateIndex = headers.indexOf('Date');
    const closeIndex = headers.indexOf('Close');
    
    const dates = [];
    const prices = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values[dateIndex] && values[closeIndex]) {
        dates.push(values[dateIndex]);
        prices.push(parseFloat(values[closeIndex]));
      }
    }
    
    return { dates, prices };
  } catch (error) {
    return { dates: [], prices: [] };
  }
}

async function main() {
  log('=== Starting Data Fetch ===');
  
  const isWeekday = new Date().getDay() >= 1 && new Date().getDay() <= 5;
  if (!isWeekday) {
    log('Today is a weekend. Skipping fetch (markets closed).');
    return;
  }
  
  log('Fetching REIT data...');
  for (const ticker of REIT_TICKERS) {
    log(`Fetching ${ticker}...`);
    await fetchStockInfo(ticker);
    await fetchHistoricalData(ticker);
  }
  
  log('Fetching ETF data...');
  for (const ticker of ETF_TICKERS) {
    log(`Fetching ${ticker}...`);
    await fetchStockInfo(ticker);
    await fetchHistoricalData(ticker);
  }
  
  log('Processing data...');
  
  // Process REITs
  const reits = [];
  for (const ticker of REIT_TICKERS) {
    const data = processStockData(ticker, true);
    if (data) reits.push(data);
  }
  
  // Process ETFs
  const etfs = [];
  for (const ticker of ETF_TICKERS) {
    const data = processStockData(ticker, false);
    if (data) etfs.push(data);
  }
  
  // Get histories
  const reitHistories = {};
  for (const ticker of REIT_TICKERS) {
    reitHistories[ticker] = getHistoryData(ticker);
  }
  
  const etfHistories = {};
  for (const ticker of ETF_TICKERS) {
    etfHistories[ticker] = getHistoryData(ticker);
  }
  
  // Save processed data
  fs.writeFileSync(
    path.join(DATA_DIR, 'reits.json'),
    JSON.stringify(reits, null, 2)
  );
  
  fs.writeFileSync(
    path.join(DATA_DIR, 'etfs.json'),
    JSON.stringify(etfs, null, 2)
  );
  
  fs.writeFileSync(
    path.join(DATA_DIR, 'reit_histories.json'),
    JSON.stringify(reitHistories, null, 2)
  );
  
  fs.writeFileSync(
    path.join(DATA_DIR, 'etf_histories.json'),
    JSON.stringify(etfHistories, null, 2)
  );
  
  // Save last update timestamp
  fs.writeFileSync(
    path.join(DATA_DIR, 'last_update.json'),
    JSON.stringify({ lastUpdate: new Date().toISOString() }, null, 2)
  );
  
  log('=== Data Fetch Complete ===');
  log(`REITs: ${reits.length}`);
  log(`ETFs: ${etfs.length}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
