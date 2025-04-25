// Express and path requirements
const express = require('express');
const path = require('path');

// Import PDF and Excel generation functions
const { generatePDF, generateExcel } = require('./exportUtils');   

// Custom Connection Function
const { connectToDatabase } = require('./db');

const app = express();
const port = 3000;

// Serve static files (HTML, CSS, etc.) from the current directory
app.use(express.static(path.join(__dirname)));

// App routes for the HTML files
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'about.html')));
app.get('/history', (req, res) => res.sendFile(path.join(__dirname, 'history.html')));
app.get('/performance', (req, res) => res.sendFile(path.join(__dirname, 'performance.html')));

// API endpoint to fetch stock data (20 predictions)
app.get('/api/stocks', async (req, res) => {

    // DB Connection
    try {
        const db = await connectToDatabase();

        // Use the Predictions Collection and return 20 predictions
        const collection = db.collection('Predictions');
        const stocks = await collection.find({}).limit(20).toArray();

        // Return
        console.log("Returning stocks!");
        res.json(stocks);

    }
    catch (error) {
        console.error('Error fetching predictions:', error);
        res.status(500).send('Something went wrong!');
    }
});

// API Endpoint to get the history data
app.get('/api/history', async (req, res) => {

    // DB Connection
    try {
        const db = await connectToDatabase();

        // Fetch all documents, sort by date ascending
        const collection = db.collection('History');
        const history = await collection.find({}).sort({ date: 1 }).toArray();

        // Ensure they are present and return
        if (!history.length) throw new Error('No history data found');
        res.json(history);
    }
    catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).send('Something went wrong!');
    }
});

// API market-performance route to get the past S&P500 performance
app.get('/api/market-performance', async (req, res) => {
    // DB Connection
    try {
        const db = await connectToDatabase();

        // Fetch all documents, sort by date ascending
        const collection = db.collection('MarketPerformance');
        const marketData = await collection.find({}).sort({ date: 1 }).toArray();

        // Esnure they are present and return
        if (!marketData.length) throw new Error('No market performance data found');
        res.json(marketData);
    }
    catch (error) {
        console.error('Error fetching market performance:', error);
        res.status(500).send('Something went wrong!');
    }
});

// PDF Download Route
app.get('/download/pdf', async (req, res) => {
    await generatePDF(res);
});

// Excel Download Route
app.get('/download/excel', async (req, res) => {
    await generateExcel(res);
});


// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});