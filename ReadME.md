# Stock Price Prediction and Growth Analysis

### Overview
This Python script performs stock price prediction and growth analysis for a selection of S&P 500 stocks across healthcare, technology, consumer goods, and energy sectors. It uses historical stock data from the Alpha Vantage API, calculates various technical indicators, trains a Bidirectional LSTM model to predict the next trading day’s closing price, computes the predicted growth percentage for each stock, and identifies the top 20 stocks with the highest predicted growth. The script is designed to assist in identifying potential investment opportunities based on short-term price predictions.

Note: This script will NOT run to completion if not using a Premium API key. It will break as you have a limited number of API requests.

### Key Features
- **Data Fetching**: Retrieves daily stock data (open, high, low, close, volume) using the Alpha Vantage API.
- **Technical Indicators**: Calculates 10 technical indicators (e.g., SMA, RSI, MACD, Bollinger Bands, ATR, OBV) to enrich the dataset for model training.
- **Machine Learning**: Trains a Bidirectional LSTM model for each stock to predict the next trading day’s closing price.
- **Growth Analysis**: Computes the predicted growth percentage by comparing the predicted price to the most recent closing price.
- **Top 20 Selection**: Identifies the top 20 stocks with the highest predicted growth percentages for the next trading day.

### Stocks Analyzed
The script analyzes 65 S&P 500 stocks, evenly distributed across four sectors:
- **Healthcare**: 16 stocks (e.g., JNJ, PFE, MRK)
- **Technology**: 16 stocks (e.g., AAPL, MSFT, NVDA)
- **Consumer Goods**: 17 stocks (9 Consumer Discretionary, 8 Consumer Staples; e.g., AMZN, PG, KO)
- **Energy**: 16 stocks (e.g., XOM, CVX, KMI)

---

### Prerequisites

#### Python Version
Python 3.7 or higher is recommended.

#### Required Libraries
Install the required libraries using the following pip commands:

```bash
pip install requests
pip install pandas
pip install numpy
pip install scikit-learn
pip install tensorflow
pip install matplotlib
```

**Library Breakdown**:
- `requests`: For making HTTP requests to the Alpha Vantage API.
- `pandas`: For data manipulation and DataFrame operations.
- `numpy`: For numerical computations and array operations.
- `scikit-learn`: For data preprocessing and train-test splitting.
- `tensorflow`: For building and training the Bidirectional LSTM model.
- `matplotlib`: For plotting (used in earlier versions of the script).

---

### Alpha Vantage API Key
You need an API key from Alpha Vantage to fetch stock data. Sign up for a free API key and set it in the script as `API_KEY_ALPHAVANTAGE`.

---

### Installation
1. Clone or download this repository to your local machine.
2. Install the required libraries using the pip commands above.
3. Ensure you have your Alpha Vantage API key ready.

---

### Usage

#### Script Configuration

**Set the API Key**:
Replace `API_KEY_ALPHAVANTAGE` in the script with your key:
```python
API_KEY_ALPHAVANTAGE = 'YOUR_API_KEY_HERE'
```

**Define the Stock Symbols**:
```python
symbols = [
    "JNJ", "PFE", "MRK", "AMGN", "GILD", "ABBV", "LLY", "BMY", "ABT", "MDT", "UNH", "CVS", "CI", "ANTM", "ZTS", "VRTX",
    "AAPL", "MSFT", "NVDA", "GOOGL", "META", "AVGO", "TSLA", "CSCO", "INTC", "AMD", "QCOM", "ORCL", "CRM", "ADBE", "TXN", "IBM",
    "AMZN", "SBUX", "NKE", "MCD", "HD", "LOW", "TJX", "BKNG", "DIS",
    "PG", "KO", "PEP", "WMT", "COST", "CL", "KMB", "GIS",
    "XOM", "CVX", "KMI", "SLB", "COP", "EOG", "MPC", "PSX", "OXY", "VLO", "HES", "WMB", "PXD", "DVN", "HAL", "BKR"
]
```

#### Running the Script
Save the script as `stock_prediction.py` and run:

```bash
python stock_prediction.py
```

The script will:
- Fetch historical data for each stock
- Calculate technical indicators
- Train an LSTM model for each stock
- Predict the next trading day’s closing price
- Compute the predicted growth percentage
- Select and print the top 20 stocks with highest predicted growth

---

### Example Output

```
Most recent date for AAPL: 2025-04-18

Predicted closing price for AAPL on 2025-04-21: $201.13
Current price (most recent before 2025-04-21): $190.00
Predicted growth for AAPL: 5.86%

Top 20 Stocks by Predicted Growth Percentage for the Next Trading Day:
Symbol | Predicted Growth Percentage
----------------------------------------
LLY    | 6.75%
AAPL   | 5.86%
UNH    | 4.92%
NVDA   | 3.46%
...
```

```
Updated predicted_growth (Top 20):
[{'LLY': 6.75}, {'AAPL': 5.858}, {'UNH': 4.92}, {'NVDA': 3.456}, ...]
```

---

### Script Details

#### Workflow

**Data Fetching**:
- Uses Alpha Vantage API (`TIME_SERIES_DAILY`)
- Converts JSON to Pandas DataFrame

**Technical Indicators**:
- Simple Moving Averages (SMA10, SMA50)
- Relative Strength Index (RSI)
- MACD
- Volatility (Daily Range)
- Lagged Returns
- Bollinger Bands
- Stochastic Oscillator (%K)
- Average True Range (ATR)
- On-Balance Volume (OBV)

**Data Preparation**:
- Feature selection and scaling with `MinMaxScaler`
- 30-day sequence windows for training

**Model Training**:
- 3-layer Bidirectional LSTM
- Dropout, batch normalization, L2 regularization
- Trained for 18 epochs, batch size 32

**Prediction**:
- Uses the last 30 days for prediction
- Skips weekends to find the next trading day

**Growth Calculation**:
```text
Growth Percentage = ((Predicted Price - Current Price) / Current Price) × 100
```

**Top 20 Selection**:
- Sort by growth %
- Select top 20 entries

---

### Limitations
- **API Rate Limits**: Free Alpha Vantage accounts are limited to 25 requests a day. Add delays or upgrade your account.
- **Holidays**: Script doesn’t account for market holidays.
- **Data Availability**: Missing data leads to skipping the stock.

---

### Acknowledgments
- **Alpha Vantage**: For stock data API
- **TensorFlow**: For the ML model framework



# 📈 Stock Prediction and Market Data API

This Node.js/Express server provides endpoints to fetch stock predictions, historical data, and S&P 500 performance, along with features to export data as PDF or Excel. It also serves static frontend pages.

---

## 📁 Project Structure

```
project/
├── server.js
├── db.js
├── exportUtils.js
├── index.html
├── about.html
├── history.html
├── performance.html
└── package.json
```

---

## 🚀 Features

- Serves static HTML pages
- RESTful API for:
  - Stock predictions
  - Historical stock data
  - S&P 500 market performance
- PDF and Excel export capabilities
- MongoDB database integration

---

## 🛠️ Getting Started with the Web App

### 1. Clone the Repository

```bash
git clone https://github.com/AdolfArchibald/Final-Year-Project.git
cd WebApp
```

### 2. Install Dependencies

Make sure you have [Node.js](https://nodejs.org/) installed.

```bash
npm install express mongodb pdfkit exceljs
```

> ✅ This installs:
> - `express` – Web framework
> - `mongodb` – MongoDB driver
> - `pdfkit` – PDF generation library
> - `exceljs` – Excel file generation library

### 3. Set Up Environment

Ensure your MongoDB database is running and accessible. Update your MongoDB connection URI inside `db.js`.

### 4. Start the Server

```bash
node server.js
```

The server will run at: [http://localhost:3000](http://localhost:3000)

---

## 📡 API Endpoints

| Endpoint                   | Description                                                  |
|---------------------------|--------------------------------------------------------------|
| `/api/stocks`             | Returns the latest 20 stock predictions from the database    |
| `/api/history`            | Returns historical stock data, sorted by date (ascending)    |
| `/api/market-performance` | Returns S&P 500 performance data, sorted by date (ascending) |
| `/download/pdf`           | Downloads predictions as a PDF file                          |
| `/download/excel`         | Downloads predictions as an Excel file                       |

---

## 🌐 Frontend Routes

| Route           | Page Description         |
|-----------------|--------------------------|
| `/`             | Home Page (`index.html`) |
| `/about`        | About Page               |
| `/history`      | Stock History Page       |
| `/performance`  | Market Performance Page  |

---

## 📦 Dependencies

- [`express`](https://www.npmjs.com/package/express) - Web framework for Node.js
- [`mongodb`](https://www.npmjs.com/package/mongodb) - MongoDB driver
- [`pdfkit`](https://www.npmjs.com/package/pdfkit) - PDF generation
- [`exceljs`](https://www.npmjs.com/package/exceljs) - Excel file generation

### Custom Modules

- `db.js` - Handles MongoDB database connection
- `exportUtils.js` - Generates and serves PDF and Excel files

---

## 📬 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests. Please follow best practices and document your changes thoroughly.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
