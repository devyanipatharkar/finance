const path = require('path');
const PptxGenJS = require('pptxgenjs');

function cagrChartData(item) {
  return [
    {
      name: `${item.symbol} Stock CAGR`,
      labels: ['1Y', '3Y', '5Y', '10Y'],
      values: [
        item.metrics.stockPriceCagr['1Y'] ?? 0,
        item.metrics.stockPriceCagr['3Y'] ?? 0,
        item.metrics.stockPriceCagr['5Y'] ?? 0,
        item.metrics.stockPriceCagr['10Y'] ?? 0,
      ],
    },
  ];
}

async function exportToPowerPoint(data, outputDir, fileName = `financial_data_${Date.now()}.pptx`) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';

  const titleSlide = pptx.addSlide();
  titleSlide.addText('Financial Data Extraction Report', {
    x: 0.5,
    y: 1,
    w: 12,
    h: 1,
    fontSize: 30,
    bold: true,
    color: '1F4E78',
  });
  titleSlide.addText(`Generated: ${new Date().toLocaleString()}`, {
    x: 0.5,
    y: 2,
    w: 10,
    h: 0.5,
    fontSize: 14,
    color: '444444',
  });

  for (const item of data) {
    const slide = pptx.addSlide();
    slide.background = { color: 'F8FAFC' };

    slide.addText(`${item.symbol} Financial Snapshot`, {
      x: 0.4,
      y: 0.2,
      w: 12,
      h: 0.6,
      fontSize: 22,
      bold: true,
      color: '1F4E78',
    });

    const details = [
      `P/E Ratio: ${item.metrics.peRatio ?? 'N/A'}`,
      `P/B Ratio: ${item.metrics.pbRatio ?? 'N/A'}`,
      `Current Price: ${item.metrics.currentStockPrice ?? 'N/A'}`,
      `Market Cap: ${item.metrics.marketCap ?? 'N/A'} Cr`,
      `Sales Growth (TTM/3Y/5Y/10Y): ${item.metrics.compoundedSalesGrowth.TTM ?? 'N/A'}% / ${item.metrics.compoundedSalesGrowth['3Y'] ?? 'N/A'}% / ${item.metrics.compoundedSalesGrowth['5Y'] ?? 'N/A'}% / ${item.metrics.compoundedSalesGrowth['10Y'] ?? 'N/A'}%`,
      `Profit Growth (TTM/3Y/5Y/10Y): ${item.metrics.compoundedProfitGrowth.TTM ?? 'N/A'}% / ${item.metrics.compoundedProfitGrowth['3Y'] ?? 'N/A'}% / ${item.metrics.compoundedProfitGrowth['5Y'] ?? 'N/A'}% / ${item.metrics.compoundedProfitGrowth['10Y'] ?? 'N/A'}%`,
    ];

    slide.addText(details.join('\n'), {
      x: 0.5,
      y: 1,
      w: 6,
      h: 4,
      fontSize: 14,
      color: '222222',
      valign: 'top',
    });

    slide.addChart(pptx.ChartType.bar, cagrChartData(item), {
      x: 6.8,
      y: 1.1,
      w: 5.8,
      h: 3.8,
      barDir: 'col',
      showLegend: false,
      catAxisLabelRotate: 0,
      valAxisTitle: 'CAGR %',
      chartColors: ['1F77B4'],
    });
  }

  const outputPath = path.resolve(outputDir, fileName);
  await pptx.writeFile({ fileName: outputPath });
  return outputPath;
}

module.exports = {
  exportToPowerPoint,
};
