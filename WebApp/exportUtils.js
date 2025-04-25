// PDF and Ecxel Builder imports
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

// Connection import
const { connectToDatabase } = require('./db');

// Generate PDF with stock predictions
async function generatePDF(res) {
    try {
        // Connect to the MongoDB database, access collection and grab a max. of 20 items
        const db = await connectToDatabase();
        const collection = db.collection('Predictions');
        const stocks = await collection.find({}).limit(20).toArray();

        // Create a new PDF document (A4, 50pt margins all sides)
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        res.setHeader('Content-Disposition', 'attachment; filename="stocks.pdf"');
        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);

        // Add a rectangle covering the full page in dark blue
        doc.rect(0, 0, doc.page.width, doc.page.height).fill('#1a1a2e');

        // Define table layout constants for positioning and sizing
        const tableTop = 100;
        const rowHeight = 20;
        const colWidths = [100, 150, 150];
        const tableLeft = 100;
        const tableWidth = colWidths.reduce((a, b) => a + b, 0);
        const tableBottom = tableTop + rowHeight * (stocks.length + 1);
        const footerY = Math.min(doc.page.height - 50, tableBottom + 30);

        // Add decorative bubbles (20 total) to mimic the website’s background
        const bubbleColors = ['#6480FF', '#FF6496', '#B4FF78', '#A064FF', '#FF9664'];
        const bubbles = [];

        // Save graphics state to isolate bubble opacity settings
        doc.save();

        // Loop to create 20 bubbles
        for (let i = 0; i < 20; i++) {
            let x, y, attempts = 0;
            const maxAttempts = 50;
            do {
                x = Math.random() * (doc.page.width - 100) + 50;
                y = Math.random() * (doc.page.height - 100) + 50;
                attempts++;
            } while (
                y < tableTop + 50 &&
                bubbles.some(b => Math.sqrt((b.x - x) ** 2 + (b.y - y) ** 2) < 40) &&
                attempts < maxAttempts
            );
            if (attempts < maxAttempts) {
                const radius = 10;
                const color = bubbleColors[i % 5];
                doc.circle(x, y, radius).fillOpacity(0.7).fill(color);
                doc.circle(x, y, radius + 5).strokeOpacity(0.3).stroke(color);
                bubbles.push({ x, y });
            }
        }

        // Restore state so bubble opacity doesn’t affect table
        doc.restore();

        // Add the document title with styling
        doc.fillColor('#ffffff');
        doc.fontSize(20).text('Stock Source Predictions', { align: 'center', underline: true });
        doc.moveDown();

        // Draw table header background: a full rectangle in darker blue
        doc.rect(tableLeft, tableTop, tableWidth, rowHeight).fill('#16213e');

        // Add table header text
        doc.fillColor('#ffffff').fontSize(12);
        doc.text('Ticker', tableLeft + 5, tableTop + 5);
        doc.text('Predicted Price ($)', tableLeft + colWidths[0] + 5, tableTop + 5);
        doc.text('Expected Growth (%)', tableLeft + colWidths[0] + colWidths[1] + 5, tableTop + 5);

        // Populate table rows with stock data
        let y = tableTop + rowHeight;
        stocks.forEach((stock, index) => {
            const rowColor = index % 2 === 0 ? '#1e1e36' : '#1a1a2e';
            doc.rect(tableLeft, y, tableWidth, rowHeight).fillOpacity(0.8).fill(rowColor);
            doc.fillColor('#ffffff');
            doc.text(stock.Ticker, tableLeft + 5, y + 5);
            doc.text(stock.PricePredicted.toFixed(2), tableLeft + colWidths[0] + 5, y + 5);
            doc.text((stock.ExpectedGrowth * 100).toFixed(1), tableLeft + colWidths[0] + colWidths[1] + 5, y + 5);
            y += rowHeight;
        });

        // Draw table grid lines
        doc.lineWidth(1).strokeColor('#ffffff');
        let x = tableLeft;
        for (let i = 0; i <= colWidths.length; i++) {
            doc.moveTo(x, tableTop).lineTo(x, tableBottom).stroke();
            if (i < colWidths.length) x += colWidths[i];
        }

        y = tableTop;
        for (let i = 0; i <= stocks.length + 1; i++) {
            doc.moveTo(tableLeft, y).lineTo(tableLeft + tableWidth, y).stroke();
            y += rowHeight;
        }

        // Add footer text
        doc.fillColor('#ffffff').fontSize(10);
        doc.text(`© ${new Date().getFullYear()} Stock Source. All rights reserved.`, 50, footerY, { 
            align: 'center',
            width: doc.page.width - 100
        });

        // Finalize and send the PDF
        doc.end();

    }
    catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Failed to generate PDF');
    }
}

// Generate Excel sheet with stock predictions
async function generateExcel(res) {
    try {
        // Connect to the MongoDB database, access collection and grab a max. of 20 items
        const db = await connectToDatabase();
        const collection = db.collection('Predictions');
        const stocks = await collection.find({}).limit(20).toArray();

        // Make a workbook with a worksheet called 'Predictions'
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Predictions');

        // Headers for the 'table'
        worksheet.columns = [
            { header: 'Ticker', key: 'Ticker', width: 15 },
            { header: 'Predicted Price ($)', key: 'PricePredicted', width: 20 },
            { header: 'Expected Growth (%)', key: 'ExpectedGrowth', width: 20 },
        ];

        // Data (remove $ and % from values)
        stocks.forEach(stock => {
            worksheet.addRow({
                Ticker: stock.Ticker,
                PricePredicted: stock.PricePredicted.toFixed(2),
                ExpectedGrowth: (stock.ExpectedGrowth * 100).toFixed(1),
            });
        });

        // Styling (only the Heading, keeping the excel cleaner)
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A2E' } };
        worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' } };

        res.setHeader('Content-Disposition', 'attachment; filename="stocks.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Write
        await workbook.xlsx.write(res);

        // Finalize
        res.end();
    } catch (error) {
        console.error('Error generating Excel:', error);
        res.status(500).send('Failed to generate Excel');
    }
}

// Export the functions
module.exports = { generatePDF, generateExcel };