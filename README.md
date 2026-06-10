# Financial Data Extraction Agent

A production-ready Node.js agent that automates financial metric extraction from Screener.in and exports results to JSON, Excel, and PowerPoint.

## Features

- Playwright-based Screener.in login and scraping
- Extracts key metrics:
  - P/E Ratio
  - P/B Ratio
  - Stock Price CAGR (1Y, 3Y, 5Y, 10Y)
  - Compounded Sales Growth (TTM, 3Y, 5Y, 10Y)
  - Compounded Profit Growth (TTM, 3Y, 5Y, 10Y)
  - Current Stock Price
  - Market Cap
- Batch processing with configurable batch size
- Retry logic + validation + progress logs
- Exports to:
  - `.json` (persistence)
  - `.xlsx` (summary + one sheet per stock)
  - `.pptx` (professional slides + CAGR chart)

## Project Structure

- `/index.js` – CLI entry point
- `/src/agent.js` – Main orchestration
- `/src/scraper.js` – Screener.in Playwright scraper
- `/src/exporters/excelExporter.js` – Excel export
- `/src/exporters/powerpointExporter.js` – PowerPoint export
- `/src/utils/logger.js` – Logging utilities
- `/config.json` – Default agent configuration
- `/.env.example` – Required environment variables

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Install Playwright browser:
   ```bash
   npx playwright install chromium
   ```
3. Create environment file:
   ```bash
   cp .env.example .env
   ```
4. Populate credentials in `.env`:
   ```env
   SCREENER_EMAIL=your-email@example.com
   SCREENER_PASSWORD=your-password
   HEADLESS=true
   ```

## Configuration

Edit `/home/runner/work/finance/finance/devyanipatharkar/finance/config.json`:

```json
{
  "symbols": ["TCS", "INFY", "RELIANCE"],
  "batchSize": 2,
  "retryCount": 3,
  "outputDir": "output",
  "headless": true,
  "symbolSource": {
    "type": "inline",
    "path": ""
  }
}
```

### Symbol input modes

- Inline in `symbols`
- JSON file (`--symbols stocks.json`) where content is either:
  - `{"symbols": ["TCS", "INFY"]}`
  - `[` `"TCS", "INFY"` `]`
- CSV file (`--symbols stocks.csv`) first column = symbol

## Usage

### Run full extraction

```bash
npm start
```

### Run with custom config

```bash
node index.js --config config.json
```

### Limit symbols for batch runs

```bash
node index.js --limit 5
```

### Use symbol file

```bash
node index.js --symbols ./stocks.csv
```

### Dry-run (validation without scraping)

```bash
node index.js --dry-run
```

## Outputs

Generated files are created in `output/`:

- `financial_data_<timestamp>.json`
- `financial_data_<timestamp>.xlsx`
- `financial_data_<timestamp>.pptx`

## Notes

- Ensure Screener.in credentials are valid.
- Site UI changes may require selector updates in `/src/scraper.js`.
- For production usage, schedule via cron/CI and archive `output/` artifacts externally.
