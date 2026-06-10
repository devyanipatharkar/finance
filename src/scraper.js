const { chromium } = require('playwright');
const { info, warn } = require('./utils/logger');

function normalizeNumber(value) {
  if (value == null) return null;
  const cleaned = String(value).replace(/,/g, '').replace(/₹/g, '').replace(/Cr\.?/gi, '').trim();
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function extractValue(text, labelPatterns) {
  for (const pattern of labelPatterns) {
    const regex = new RegExp(`${pattern}[^\\d-]*(-?[\\d,.]+)`, 'i');
    const match = text.match(regex);
    if (match && match[1]) return normalizeNumber(match[1]);
  }
  return null;
}

function extractPercentByLine(text, linePattern) {
  const lineRegex = new RegExp(`${linePattern}[^\\n]*`, 'i');
  const line = text.match(lineRegex)?.[0] || '';
  const percentages = [...line.matchAll(/-?[\d.]+%/g)].map((m) => Number(m[0].replace('%', '')));
  return percentages;
}

function parseMetricsFromPageText(pageText) {
  const stockCagr = extractPercentByLine(pageText, 'Stock Price CAGR');
  const salesGrowth = extractPercentByLine(pageText, 'Compounded Sales Growth');
  const profitGrowth = extractPercentByLine(pageText, 'Compounded Profit Growth');

  return {
    peRatio: extractValue(pageText, ['P\\/E', 'Price to earnings']),
    pbRatio: extractValue(pageText, ['P\\/B', 'Price to book']),
    currentStockPrice: extractValue(pageText, ['Current Price', 'Stock Price']),
    marketCap: extractValue(pageText, ['Market Cap']),
    stockPriceCagr: {
      '1Y': stockCagr[0] ?? null,
      '3Y': stockCagr[1] ?? null,
      '5Y': stockCagr[2] ?? null,
      '10Y': stockCagr[3] ?? null,
    },
    compoundedSalesGrowth: {
      TTM: salesGrowth[0] ?? null,
      '3Y': salesGrowth[1] ?? null,
      '5Y': salesGrowth[2] ?? null,
      '10Y': salesGrowth[3] ?? null,
    },
    compoundedProfitGrowth: {
      TTM: profitGrowth[0] ?? null,
      '3Y': profitGrowth[1] ?? null,
      '5Y': profitGrowth[2] ?? null,
      '10Y': profitGrowth[3] ?? null,
    },
  };
}

function validateMetrics(metrics) {
  const required = ['peRatio', 'pbRatio', 'currentStockPrice', 'marketCap'];
  for (const key of required) {
    if (metrics[key] == null) return false;
  }
  return true;
}

async function withRetry(task, retries = 3, label = 'task') {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await task(attempt);
    } catch (error) {
      lastError = error;
      warn(`${label} failed (attempt ${attempt}/${retries}): ${error.message}`);
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  throw lastError;
}

async function login(page, email, password) {
  info('Opening Screener.in login page');
  await page.goto('https://www.screener.in/login/', { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="username"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([
    page.waitForURL(/screener\.in\//i, { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);
  info('Login successful');
}

async function scrapeCompany(page, symbol) {
  const url = `https://www.screener.in/company/${encodeURIComponent(symbol)}/`;
  info(`Extracting data for ${symbol} (${url})`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  const pageText = await page.locator('body').innerText();
  const metrics = parseMetricsFromPageText(pageText);
  if (!validateMetrics(metrics)) {
    throw new Error(`Data validation failed for ${symbol}. Missing required metrics.`);
  }
  return {
    symbol,
    url,
    extractedAt: new Date().toISOString(),
    metrics,
  };
}

async function scrapeFinancialData({ symbols, email, password, retryCount = 3, headless = true }) {
  const browser = await chromium.launch({ headless });
  const page = await browser.newPage();

  try {
    await withRetry(() => login(page, email, password), retryCount, 'Login');
    const results = [];

    for (const symbol of symbols) {
      const companyData = await withRetry(
        () => scrapeCompany(page, symbol),
        retryCount,
        `Scrape ${symbol}`,
      );
      results.push(companyData);
    }

    return results;
  } finally {
    await browser.close();
  }
}

module.exports = {
  scrapeFinancialData,
  withRetry,
  parseMetricsFromPageText,
};
