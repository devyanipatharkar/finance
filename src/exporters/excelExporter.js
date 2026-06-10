const ExcelJS = require('exceljs');
const path = require('path');

function addHeaderStyle(row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
}

function autoSizeColumns(worksheet) {
  worksheet.columns.forEach((column) => {
    const maxLength = column.values.reduce((max, value) => {
      const length = value ? String(value).length : 10;
      return Math.max(max, length);
    }, 10);
    column.width = Math.min(maxLength + 2, 40);
  });
}

async function exportToExcel(data, outputDir, fileName = `financial_data_${Date.now()}.xlsx`) {
  const workbook = new ExcelJS.Workbook();
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.addRow(['Symbol', 'P/E', 'P/B', 'Current Price', 'Market Cap']);
  addHeaderStyle(summarySheet.getRow(1));

  for (const item of data) {
    summarySheet.addRow([
      item.symbol,
      item.metrics.peRatio,
      item.metrics.pbRatio,
      item.metrics.currentStockPrice,
      item.metrics.marketCap,
    ]);

    const ws = workbook.addWorksheet(item.symbol.slice(0, 31));
    ws.addRow(['Metric', 'Value']);
    addHeaderStyle(ws.getRow(1));

    const metricsRows = [
      ['P/E Ratio', item.metrics.peRatio],
      ['P/B Ratio', item.metrics.pbRatio],
      ['Current Stock Price', item.metrics.currentStockPrice],
      ['Market Cap', item.metrics.marketCap],
      ['Stock Price CAGR 1Y', item.metrics.stockPriceCagr['1Y']],
      ['Stock Price CAGR 3Y', item.metrics.stockPriceCagr['3Y']],
      ['Stock Price CAGR 5Y', item.metrics.stockPriceCagr['5Y']],
      ['Stock Price CAGR 10Y', item.metrics.stockPriceCagr['10Y']],
      ['Compounded Sales Growth TTM', item.metrics.compoundedSalesGrowth.TTM],
      ['Compounded Sales Growth 3Y', item.metrics.compoundedSalesGrowth['3Y']],
      ['Compounded Sales Growth 5Y', item.metrics.compoundedSalesGrowth['5Y']],
      ['Compounded Sales Growth 10Y', item.metrics.compoundedSalesGrowth['10Y']],
      ['Compounded Profit Growth TTM', item.metrics.compoundedProfitGrowth.TTM],
      ['Compounded Profit Growth 3Y', item.metrics.compoundedProfitGrowth['3Y']],
      ['Compounded Profit Growth 5Y', item.metrics.compoundedProfitGrowth['5Y']],
      ['Compounded Profit Growth 10Y', item.metrics.compoundedProfitGrowth['10Y']],
    ];
    ws.addRows(metricsRows);
    autoSizeColumns(ws);
  }

  autoSizeColumns(summarySheet);
  const outputPath = path.resolve(outputDir, fileName);
  await workbook.xlsx.writeFile(outputPath);
  return outputPath;
}

module.exports = {
  exportToExcel,
};
