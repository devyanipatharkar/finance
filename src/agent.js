const fs = require('fs/promises');
const path = require('path');
const { scrapeFinancialData } = require('./scraper');
const { exportToExcel } = require('./exporters/excelExporter');
const { exportToPowerPoint } = require('./exporters/powerpointExporter');
const { info, warn, error } = require('./utils/logger');

function parseCsvSymbols(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(',')[0].trim())
    .filter(Boolean);
}

async function loadSymbols(config, explicitSymbolPath) {
  const sourcePath = explicitSymbolPath || config.symbolSource?.path;
  if (sourcePath) {
    const ext = path.extname(sourcePath).toLowerCase();
    const content = await fs.readFile(path.resolve(sourcePath), 'utf8');
    if (ext === '.json') {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : parsed.symbols || [];
    }
    if (ext === '.csv') {
      return parseCsvSymbols(content);
    }
    throw new Error(`Unsupported symbol file format: ${ext}`);
  }

  return config.symbols || [];
}

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function ensureOutputDir(outputDir) {
  await fs.mkdir(outputDir, { recursive: true });
}

function validateEnv() {
  const email = process.env.SCREENER_EMAIL;
  const password = process.env.SCREENER_PASSWORD;
  if (!email || !password) {
    throw new Error('Missing SCREENER_EMAIL or SCREENER_PASSWORD in environment variables.');
  }
  return { email, password };
}

async function saveJson(data, outputDir) {
  const filePath = path.resolve(outputDir, `financial_data_${Date.now()}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  return filePath;
}

async function runAgent(options = {}) {
  const configPath = path.resolve(options.configPath || 'config.json');
  const rawConfig = await fs.readFile(configPath, 'utf8');
  const config = JSON.parse(rawConfig);
  const outputDir = path.resolve(config.outputDir || 'output');

  await ensureOutputDir(outputDir);

  const symbols = await loadSymbols(config, options.symbolsPath);
  const requestedCount = Number.isFinite(options.limit) ? options.limit : symbols.length;
  const activeSymbols = symbols.slice(0, requestedCount);

  if (!activeSymbols.length) {
    throw new Error('No stock symbols found in config or source file.');
  }

  info(`Preparing extraction for ${activeSymbols.length} symbols`);

  if (options.dryRun) {
    warn('Dry-run mode enabled: scraper/excel/ppt generation skipped.');
    return { dryRun: true, symbols: activeSymbols };
  }

  const { email, password } = validateEnv();
  const batchSize = Number(config.batchSize) > 0 ? Number(config.batchSize) : 1;
  const retryCount = Number(config.retryCount) > 0 ? Number(config.retryCount) : 3;
  const batches = chunk(activeSymbols, batchSize);
  const allResults = [];

  for (let idx = 0; idx < batches.length; idx += 1) {
    const batch = batches[idx];
    info(`Processing batch ${idx + 1}/${batches.length}: ${batch.join(', ')}`);
    try {
      const result = await scrapeFinancialData({
        symbols: batch,
        email,
        password,
        retryCount,
        headless: config.headless !== false,
      });
      allResults.push(...result);
      info(`Batch ${idx + 1} completed`);
    } catch (err) {
      error(`Batch ${idx + 1} failed: ${err.message}`);
      throw err;
    }
  }

  const [jsonPath, excelPath, pptPath] = await Promise.all([
    saveJson(allResults, outputDir),
    exportToExcel(allResults, outputDir),
    exportToPowerPoint(allResults, outputDir),
  ]);

  info(`JSON saved at: ${jsonPath}`);
  info(`Excel saved at: ${excelPath}`);
  info(`PowerPoint saved at: ${pptPath}`);

  return {
    count: allResults.length,
    files: { jsonPath, excelPath, pptPath },
  };
}

module.exports = {
  runAgent,
  loadSymbols,
  parseCsvSymbols,
};
