// Global variable to track the chart instance
let performanceChart = null;

// Custom plugin for vertical hover line
const verticalLinePlugin = {
    id: 'verticalLine',
    afterDatasetsDraw(chart) {
        const { ctx, chartArea, scales } = chart;
        if (!chart.tooltip || !chart.tooltip._active) return;
        const activeElements = chart.tooltip._active;
        if (activeElements && activeElements.length) {
            const x = activeElements[0].element.x;
            ctx.save();
            ctx.beginPath();

            // Thin, white, dotted line from top to bottom when hovering
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#ffffff';
            ctx.setLineDash([5, 5]);
            ctx.moveTo(x, chartArea.top);
            ctx.lineTo(x, chartArea.bottom);

            ctx.stroke();
            ctx.restore();
        }
    }
};

// Fetch and render the portfolio performance graph
async function generateGraph(initialDeposit, monthlyContribution) {
    try {
        // Fetch market performance data (S&P 500)
        const marketResponse = await fetch('/api/market-performance');
        const marketData = await marketResponse.json();

        // Fetch AI model prediction data (History)
        const historyResponse = await fetch('/api/history');
        const historyData = await historyResponse.json();

        // Extract months and returns for both datasets
        const months = marketData.map(entry => entry.date);
        const marketReturns = marketData.map(entry => entry.percentReturn);
        const historyReturns = historyData.map(entry => entry.percentReturn);

        // Validate that both datasets have the same length and dates
        if (marketData.length !== historyData.length || 
            !marketData.every((entry, i) => entry.date === historyData[i].date)) {
            throw new Error('MarketPerformance and History data must have the same dates and length.');
        }

        // Calculate portfolio value (S&P 500)
        const portfolioValues = [initialDeposit];
        for (let i = 0; i < marketReturns.length; i++) {
            const prevValue = portfolioValues[i];
            const newValue = (prevValue * (1 + marketReturns[i] / 100)) + monthlyContribution;
            portfolioValues.push(newValue);
        }
        portfolioValues.shift();

        // Calculate AI model portfolio value (History)
        const aiPortfolioValues = [initialDeposit];
        for (let i = 0; i < historyReturns.length; i++) {
            const prevValue = aiPortfolioValues[i];
            const newValue = (prevValue * (1 + historyReturns[i] / 100)) + monthlyContribution;
            aiPortfolioValues.push(newValue);
        }
        aiPortfolioValues.shift();

        // Get min and max portfolio values for dynamic scaling (across both datasets)
        const minValue = Math.min(...portfolioValues, ...aiPortfolioValues);
        const maxValue = Math.max(...portfolioValues, ...aiPortfolioValues);

        // Get the canvas and context
        const canvas = document.getElementById('performanceChart');
        const ctx = canvas.getContext('2d');

        // Destroy any existing chart instance
        if (performanceChart) {
            performanceChart.destroy();
            console.log('Destroyed previous chart instance');
        }

        // Create the line chart with two datasets
        performanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                // Use the months as labels
                labels: months,
                // Build the datasets
                datasets: [
                    {
                        label: 'Portfolio Value ($)',                                       // Label for the portfolio dataset
                        data: portfolioValues,                                              // Y-axis data (portfolio values over time)
                        borderColor: portfolioValues.map((v, i) => 
                            i === 0 || v > portfolioValues[i-1] ? '#00CC00' : '#FF3333'),   // Fallback color: green for first point or increase, red for decrease

                        segment: {
                            // Set the border color to green or red based on movement of the line
                            borderColor: ctx => {
                                const y0 = ctx.p0.parsed.y;
                                const y1 = ctx.p1.parsed.y;
                                return y1 > y0 ? '#00CC00' : '#FF3333';
                            }
                        },
                        // Additional configuration to fit in with theme and make it more presentable
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 2, 
                        pointBackgroundColor: '#ffffff',
                        pointRadius: 4,
                        tension: 0.3,
                        fill: false // The fill looks bad when true - don't do it </3
                    },
                    {
                        label: 'AI Model Prediction ($)',                                   // Label for the AI model dataset
                        data: aiPortfolioValues,                                            // Y-axis data (AI model predicted values)
                        borderColor: aiPortfolioValues.map((v, i) => 
                            i === 0 || v > aiPortfolioValues[i-1] ? '#FFD700' : '#FF00FF'), // Fallback color: gold for first point or increase, magenta for decrease

                        segment: {
                            // Set the border color to gold or magenta based on movement of the line
                            borderColor: ctx => {
                                const y0 = ctx.p0.parsed.y;
                                const y1 = ctx.p1.parsed.y;
                                return y1 > y0 ? '#FFD700' : '#FF00FF';
                            }
                        },
                        // Additional configuration to fit in with theme and make it more presentable
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 2,
                        pointBackgroundColor: '#ffffff',
                        pointRadius: 4,
                        tension: 0.3,
                        fill: false
                    }
                ]
            },
            options: {
                // Configure the chart's axes
                scales: {
                    x: {
                        title: { 
                            display: true,                      // Show x-axis title
                            text: 'Month',                      // X-axis label
                            color: '#ffffff',                   // White text
                            font: { size: 16, family: 'Arial' } // Font styling
                        },
                        ticks: { 
                            color: '#ffffff',                   // White tick labels
                            font: { size: 14, family: 'Arial' } // Font styling
                        }
                    },
                    y: {
                        title: { 
                            display: true,                      // Show y-axis title
                            text: 'Portfolio Value ($)',        // Y-axis label
                            color: '#ffffff',                   // White text
                            font: { size: 16, family: 'Arial' } // Font styling
                        },
                        ticks: { 
                            color: '#ffffff',                                               // White tick labels
                            font: { size: 14, family: 'Arial' },                            // Font styling
                            callback: value => `$${value.toLocaleString()}`,                // Format y-axis labels with $ and commas
                            stepSize: Math.ceil((maxValue - minValue) / 5 / 1000) * 1000    // Dynamic tick spacing
                        },
                        // These have to be dynamic seeing as the user can set values
                        suggestedMin: Math.floor(minValue / 1000) * 1000,                   // Dynamic minimum y-axis value 
                        suggestedMax: Math.ceil(maxValue / 1000) * 1000                     // Dynamic maximum y-axis value
                    }
                },
                // Configure chart plugins
                plugins: {
                    legend: { 
                        labels: { 
                            color: '#ffffff',                   // White legend text
                            font: { size: 14, family: 'Arial' } // Font styling
                        } 
                    },
                    tooltip: {
                        enabled: true,                                          // Enable tooltips on hover
                        callbacks: {
                            label: context => `$${context.parsed.y.toFixed(2)}` // Format tooltip values with $ and 2 decimals
                        }
                    }
                },
                // General chart behavior
                responsive: true,           // Make chart responsive to container size
                maintainAspectRatio: false, // Allow stretching without fixed aspect ratio
                animation: false,           // Disable animations for faster rendering
                devicePixelRatio: 2,        // Render at 2x resolution for sharpness
                interaction: {
                    mode: 'nearest',        // Highlight nearest data point on hover
                    intersect: false        // Allow hover even if not directly over a point
                },
                layout: {
                    autoPadding: false      // Disable automatic padding due to an issue that arises if allowed
                }
            },
            // Use the vertical plugin defined at the top
            plugins: [verticalLinePlugin]
        });
        // Log confirmation
        console.log('Rendered chart height:', canvas.offsetHeight, 'px');
        console.log('Chart rendered successfully');
    }
    catch (error) {
        console.error('Error loading performance:', error);
        document.getElementById('performanceChart').outerHTML = '<p class="text-white text-center">Oops, something went wrong!</p>';
    }
}

// Set footer year and handle form submission for the user values
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, starting...');
    document.getElementById('year').textContent = new Date().getFullYear();

    // Handle form submission
    const generateButton = document.getElementById('generateGraph');
    const errorMessage = document.getElementById('errorMessage');

    generateButton.addEventListener('click', () => {
        // Get input values
        const initialDepositInput = document.getElementById('initialDeposit').value;
        const monthlyContributionInput = document.getElementById('monthlyContribution').value;

        // Convert to numbers
        const initialDeposit = parseFloat(initialDepositInput);
        const monthlyContribution = parseFloat(monthlyContributionInput);

        // Reset error message
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';

        // Validate inputs
        if (isNaN(initialDeposit) || initialDeposit < 0) {
            errorMessage.textContent = 'Initial Deposit must be a positive number.';
            errorMessage.style.display = 'block';
            return;
        }
        if (isNaN(monthlyContribution)) {
            errorMessage.textContent = 'Monthly Contribution must be a number.';
            errorMessage.style.display = 'block';
            return;
        }

        // Generate the graph with user inputs
        generateGraph(initialDeposit, monthlyContribution);
    });

    // Generate with default values on page load
    generateGraph(10000, 1000);
});