const test = require('node:test');
const assert = require('node:assert/strict');
const { parseCsvSymbols } = require('../src/agent');
const { parseMetricsFromPageText } = require('../src/scraper');

test('parseCsvSymbols reads first column symbols', () => {
  const csv = 'TCS,Tech\nINFY,IT\n\nRELIANCE,Oil';
  assert.deepEqual(parseCsvSymbols(csv), ['TCS', 'INFY', 'RELIANCE']);
});

test('parseMetricsFromPageText extracts core required metrics', () => {
  const sampleText = `
Current Price 1,234
Market Cap 5,678
P/E 20.4
P/B 3.2
Stock Price CAGR 12% 14% 15% 16%
Compounded Sales Growth 8% 9% 10% 11%
Compounded Profit Growth 6% 7% 8% 9%
`;

  const metrics = parseMetricsFromPageText(sampleText);
  assert.equal(metrics.peRatio, 20.4);
  assert.equal(metrics.pbRatio, 3.2);
  assert.equal(metrics.currentStockPrice, 1234);
  assert.equal(metrics.marketCap, 5678);
  assert.equal(metrics.stockPriceCagr['10Y'], 16);
  assert.equal(metrics.compoundedSalesGrowth['5Y'], 10);
  assert.equal(metrics.compoundedProfitGrowth.TTM, 6);
});
