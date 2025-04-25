import requests
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, Bidirectional, BatchNormalization
from tensorflow.keras.regularizers import l2
from tensorflow.keras.optimizers import Adam
import matplotlib.pyplot as plt
import seaborn as sns
import shap  
import tensorflow as tf

## THIS FILE TAKES A LONG TIME TO RUN AND IS COMPUTATIONALLY HEAVY.
## ONLY RUN WHEN YOU HAVE TIME AND RESOURCES AVAILABLE OR REDUCE THE LIST SIZE
# Set random seed for reproducibility
np.random.seed(42)
tf.random.set_seed(42)

# Set the API Key
API_KEY_ALPHAVANTAGE = 'TN1RC72EPA9AEL7Y'       # <-- UPDATE THE API KEY TO YOUR OWN

# Get the Stock Data
# Can be changed to any stock (e.g., 'MSFT', 'GOOGL')
symbols = [
    "JNJ", "PFE", "MRK", "AMGN", "GILD", "ABBV", "LLY", "BMY", "ABT", "MDT", "UNH", "CVS", "CI", "ANTM", "ZTS", "VRTX",             # Healthcare
    "AAPL", "MSFT", "NVDA", "GOOGL", "META", "AVGO", "TSLA", "CSCO", "INTC", "AMD", "QCOM", "ORCL", "CRM", "ADBE", "TXN", "IBM",    # Technology
    "AMZN", "SBUX", "NKE", "MCD", "HD", "LOW", "TJX", "BKNG", "DIS",                                                                # Consumer Discretionary
    "PG", "KO", "PEP", "WMT", "COST", "CL", "KMB", "GIS",                                                                           # Consumer Staples
    "XOM", "CVX", "KMI", "SLB", "COP", "EOG", "MPC", "PSX", "OXY", "VLO", "HES", "WMB", "PXD", "DVN", "HAL", "BKR"                  # Energy
]

predicted_growth = []
# Loop through all of the symbols and train a unique ML for each one. 
# Initialize the predicted_growth list
predicted_growth = []

# Loop through all of the symbols and train a unique ML model for each one
for symbol in symbols:
    # Build the url using the stock symbol and api key
    url = f'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={symbol}&outputsize=full&apikey={API_KEY_ALPHAVANTAGE}'

    # Request and parse into JSON
    response = requests.get(url)
    data = response.json()

    # Check if the API call was successful
    if 'Time Series (Daily)' not in data:
        raise ValueError(f"Error fetching data: {data.get('Information', 'Unknown error')}")

    # Convert the stock data to a dataframe
    time_series = data['Time Series (Daily)']
    df = pd.DataFrame.from_dict(time_series, orient='index', dtype=float)
    df.index = pd.to_datetime(df.index)

    # Sort by date (due to stock data being linear, this is of utmost importance)
    df = df.sort_index()

    # Rename columns due to names being difficult to work with
    df = df.rename(columns={
        '1. open': 'open',
        '2. high': 'high',
        '3. low': 'low',
        '4. close': 'close',
        '5. volume': 'volume'
    })

    # Calculate all of the technical indicators
    # 1 SMA
    # Calculate the average for 10 and 50 day periods
    df['sma10'] = df['close'].rolling(window=10).mean()
    df['sma50'] = df['close'].rolling(window=50).mean()

    # 2 RSI
    # Difference between consecutive closing prices
    delta = df['close'].diff()

    # Keep positive changes and replace negative with 0
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()

    # Keep negative changes (negate to make +) and replace positive with 0
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()

    # Calculate rs
    rs = gain / loss

    # Calculate RSI
    df['rsi'] = 100 - (100 / (1 + rs))

    # 3 MACD
    # Calculate Exponential Moving Averages (EMA)
    exp1 = df['close'].ewm(span=12, adjust=False).mean()
    exp2 = df['close'].ewm(span=26, adjust=False).mean()

    # MACD Line is the difference between the 12-day and 26-day EMA
    df['macd'] = exp1 - exp2

    # MACD Signal Line is the 9-day EMA of the MACD line
    df['macd_signal'] = df['macd'].ewm(span=9, adjust=False).mean()

    # 4 Volatility - Daily Range 
    # Take the difference between the 'high' and 'low' values for every day
    df['volatility'] = df['high'] - df['low']

    # 5 Lagged Returns (1-Day)
    # Take the percent change on a daily basis
    df['lag1_return'] = df['close'].pct_change()

    # 6 & 7 Bollinger Bands (Upper and Lower, 20-Day)
    # Calculate the middle band (SMA for 20-day period)
    df['bb_middle'] = df['close'].rolling(window=20).mean()

    # Calculate the Standard Deviation
    df['bb_std'] = df['close'].rolling(window=20).std()

    # Calculate the Upper and Lower Bands using the Middle and the Standard Deviation
    df['bb_upper'] = df['bb_middle'] + 2 * df['bb_std']
    df['bb_lower'] = df['bb_middle'] - 2 * df['bb_std']

    # 8 - Stochastic Oscillator (%K, 14-day)
    # Calculate Highest High and Lowest Low for the 14 day period
    high_14 = df['high'].rolling(window=14).max()
    low_14 = df['low'].rolling(window=14).min()

    # Determine the %K value using the formula
    df['stoch_k'] = 100 * (df['close'] - low_14) / (high_14 - low_14)

    # 9 - Average True Range (ATR, 14-Day)
    # Calculate tr1, the high - low of a stock for a given day
    df['tr1'] = df['high'] - df['low']

    # Calculate tr2, the absolute value of the 'high' - 'close' of the previous day
    df['tr2'] = abs(df['high'] - df['close'].shift())

    # Calculate tr3, the absolute value of the 'low' - 'close' of the previous day
    df['tr3'] = abs(df['low'] - df['close'].shift())

    # Calculate tr, the largest price movement for the day
    df['tr'] = df[['tr1', 'tr2', 'tr3']].max(axis=1)

    # Calculate the ATR for on a day (t)
    df['atr'] = df['tr'].rolling(window=14).mean()

    # 10 - On-Balance Volume (OBV)
    # Calculate obv by taking the sign of the difference of the close price - prev. close price
    # Then multiply it by the volume of the day, and finally summing it all together cumulatively.
    df['obv'] = (np.sign(df['close'].diff()) * df['volume']).cumsum()

    # Fill NA Values with 0 due to the first value (close[i - 1]) not existing
    df['obv'] = df['obv'].fillna(0)

    # Drop the temporary columns
    df = df.drop(columns=['bb_middle', 'bb_std', 'tr1', 'tr2', 'tr3', 'tr'])

    # Dropping of NaN values
    df = df.dropna()

    # MACHINE LEARNING
    # Data Preparation

    # Define features and target
    features = ['open', 'high', 'low', 'close', 'volume', 'sma10', 'sma50', 'rsi', 'macd', 'macd_signal', 
                'volatility', 'lag1_return', 'bb_upper', 'bb_lower', 'stoch_k', 'atr', 'obv']
    target = 'close'

    # Normalize features and target
    scaler_X = MinMaxScaler()
    scaler_y = MinMaxScaler()

    # Scale features
    X_data = df[features].values
    X_scaled = scaler_X.fit_transform(X_data)

    # Scale target
    y_data = df[target].values
    y_scaled = scaler_y.fit_transform(y_data.reshape(-1, 1))

    # Create sequences (use 30 days to predict the next day's closing price)
    def create_sequences(X, y, seq_length):
        X_seq, y_seq = [], []
        for i in range(len(X) - seq_length):
            X_seq.append(X[i:i + seq_length])  # Past 30 days of features
            y_seq.append(y[i + seq_length])    # Next day's close
        return np.array(X_seq), np.array(y_seq)

    seq_length = 30
    X, y = create_sequences(X_scaled, y_scaled, seq_length)

    # Split data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)

    # Model Building
    model = Sequential([
        # First Bidirectional LSTM layer
        Bidirectional(LSTM(units=100, return_sequences=True, input_shape=(seq_length, len(features)))),
        Dropout(0.3),
        
        # Second Bidirectional LSTM layer
        Bidirectional(LSTM(units=100, return_sequences=True)),
        Dropout(0.3),
        
        # Third Bidirectional LSTM layer
        Bidirectional(LSTM(units=50, return_sequences=False)),
        Dropout(0.3),
        
        # Dense layers with regularization and batch normalization
        Dense(units=50, activation='relu', kernel_regularizer=l2(0.01)),
        BatchNormalization(),
        Dropout(0.3),
        
        Dense(units=25, activation='relu', kernel_regularizer=l2(0.01)),
        BatchNormalization(),
        Dense(units=1)  # Output: predicted close price (scaled)
    ])

    # Model Compiling and Training
    # Compile the model
    model.compile(optimizer=Adam(learning_rate=0.001), loss='mean_squared_error')

    # Display model summary
    model.summary()

    # Train the Model
    history = model.fit(
        X_train, y_train,
        epochs=18,
        batch_size=32,
        validation_data=(X_test, y_test),
        verbose=1
    )

    # Predict on training and testing sets
    train_predict = model.predict(X_train)
    test_predict = model.predict(X_test)

    # Inverse transform predictions to original scale
    train_predict_actual = scaler_y.inverse_transform(train_predict)
    y_train_actual = scaler_y.inverse_transform(y_train.reshape(-1, 1))
    test_predict_actual = scaler_y.inverse_transform(test_predict)
    y_test_actual = scaler_y.inverse_transform(y_test.reshape(-1, 1))

    # Predict the next day's closing price (April 14, 2025)
    last_sequence = X_scaled[-seq_length:].copy()  # Shape: (seq_length, n_features)

    # Reshape the sequence for prediction
    current_sequence = last_sequence.reshape(1, seq_length, len(features))

    # Predict the next day's closing price (scaled)
    next_pred = model.predict(current_sequence)
    next_pred_price = next_pred[0][0]               # Predicted close (still scaled)

    # Inverse transform to get the actual price
    predicted_price = scaler_y.inverse_transform([[next_pred_price]])[0][0]

    # Get the most recent date in df and calculate the next trading day
    last_date = df.index[-1]  # Most recent date in the DataFrame
    print(f"Most recent date for {symbol}: {last_date}")

    # Function to get the next trading day (skipping weekends)
    def get_next_trading_day(date):
        next_day = date + pd.Timedelta(days=1)
        # If it's Saturday (weekday 5), add 2 days to get to Monday
        if next_day.weekday() == 5:  # Saturday
            next_day += pd.Timedelta(days=2)
        # If it's Sunday (weekday 6), add 1 day to get to Monday
        elif next_day.weekday() == 6:  # Sunday
            next_day += pd.Timedelta(days=1)
        return next_day

    # Calculate the prediction date (next trading day after the last date)
    prediction_date = get_next_trading_day(last_date)
    recent_data = df[df.index < prediction_date]
    if not recent_data.empty:
        current_price = recent_data['close'].iloc[-1]  # Last available closing price before the prediction
        # Calculate the predicted growth percentage
        growth_percentage = ((predicted_price - current_price) / current_price) * 100

    else:
        print(f"No historical data available for {symbol} before {prediction_date}. Skipping.")
        growth_percentage = None

    # Print the final prediction and growth percentage
    print(f"\nPredicted closing price for {symbol} Tomorrow: ${predicted_price:.2f}")
    if growth_percentage is not None:
        print(f"Current price: ${current_price:.2f}")
        print(f"Predicted growth for {symbol}: {growth_percentage:.2f}%")
        # Append the growth percentage to predicted_growth
        predicted_growth.append({symbol: growth_percentage})
    else:
        print(f"Could not calculate growth percentage for {symbol}")

# Print final list of growth percentages
print("\nPredicted Growth Percentages:")
print(predicted_growth)

# After the loop, sort predicted_growth by growth percentage and select the top 20
# Sort in descending order based on the growth percentage value
predicted_growth_sorted = sorted(predicted_growth, key=lambda x: list(x.values())[0], reverse=True)

# Select the top 20 stocks
top_20_growth = predicted_growth_sorted[:20]

# Print the top 20 stocks with their growth percentages
print("\nTop 20 Stocks by Predicted Growth Percentage for tomorrow:")
print("Symbol | Predicted Growth Percentage")
print("-" * 40)
for stock in top_20_growth:
    symbol = list(stock.keys())[0]
    growth = stock[symbol]
    print(f"{symbol:<6} | {growth:.2f}%")

# Update predicted_growth to contain only the top 20
predicted_growth = top_20_growth

# Print the final predicted_growth list
print("\nUpdated predicted_growth (Top 20):")
print(predicted_growth)