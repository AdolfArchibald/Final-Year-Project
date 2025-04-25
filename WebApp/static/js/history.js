// Global variable to track the chart instance
let historyChart = null;

// Custom plugin for vertical hover line (gives clarity)
const verticalLinePlugin = {
    id: 'verticalLine',
    afterDatasetsDraw(chart) {
        const { ctx, chartArea, scales } = chart;
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

// Fetch and render the historical returns graph
async function loadHistory() {
    try {
        // Fetch history data from the server
        const response = await fetch('/api/history');
        const historyData = await response.json();

        // Extract months and returns from array of objects
        const months = historyData.map(entry => entry.date);
        const returns = historyData.map(entry => entry.percentReturn);

        // Grab the canvas and context
        const canvas = document.getElementById('historyChart');
        const ctx = canvas.getContext('2d');

        // Destroy any existing chart instance
        // This is a preventative step due to some interference resulting in glitches
        if (historyChart) {
            historyChart.destroy();
        }

        // Create the line chart with dynamic segment coloring
        historyChart = new Chart(ctx, {
            type: 'line',
            data: {
                // Use the months as labels
                labels: months,
                // Build the dataset
                datasets: [{
                    label: 'Percent Return (%)',
                    data: returns,

                    // Set the border color to green if the returns are positive, else red
                    borderColor: returns.map(r => r > 0 ? '#00CC00' : '#FF3333'),

                    segment: {
                        // Set the border color to green or red based on movement of the line
                        borderColor: ctx => {
                            const y0 = ctx.p0.parsed.y;
                            const y1 = ctx.p1.parsed.y;
                            if (y0 > 0 && y1 > 0) return '#00CC00';
                            if (y0 <= 0 && y1 <= 0) return '#FF3333';
                            return y0 > y1 ? '#FF3333' : '#00CC00';
                        }
                    },

                    // Additional configuration to fit in with theme and make it more presentable
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: '#ffffff',
                    pointRadius: 4,
                    tension: 0.3,
                    fill: false // The fill looks bad when true - don't do it </3
                }]
            },
            options: {
                // Configure the chart's axes
                scales: {
                    // X-axis configuration
                    x: {
                        title: { 
                            display: true,                      // Show the title
                            text: 'Month',                      // Label for the x-axis
                            color: '#ffffff',                   // White text to match the theme
                            font: { size: 16, family: 'Arial' } // Font styling for the title
                        },
                        // X-axis tick settings
                        ticks: { 
                            color: '#ffffff',                   // White tick labels
                            font: { size: 14, family: 'Arial' } // Font styling for ticks
                        }
                    },
                    // Y-axis configuration
                    y: {
                        title: { 
                            display: true,                      // Show the title
                            text: 'Percent Return (%)',         // Label for the y-axis
                            color: '#ffffff',                   // White text to match the theme
                            font: { size: 16, family: 'Arial' } // Font styling for the title
                        },
                        // Y-axis tick settings
                        ticks: { 
                            color: '#ffffff',                   // White tick labels
                            font: { size: 14, family: 'Arial' } // Font styling for ticks
                        },
                        min: -10,               // Minimum y-axis value
                        max: 15,                // Maximum y-axis value
                        beginAtZero: false      // Do not force the y-axis to start at 0
                    }
                },
                // Configure chart plugins
                plugins: {
                    // Legend (key) settings
                    legend: { 
                        labels: { 
                            color: '#ffffff',                   // White text for legend labels
                            font: { size: 14, family: 'Arial' } // Font styling for legend
                        } 
                    },
                    // Tooltip settings
                    tooltip: { 
                        enabled: true // Enable tooltips on hover (especially helpful for mobile users)
                    }
                },
                // General chart behavior
                responsive: true,           // Make the chart responsive to container size
                maintainAspectRatio: false, // Allow the chart to stretch without maintaining aspect ratio
                animation: false,           // Disable animations for faster rendering
                devicePixelRatio: 2,        // Render at 2x resolution for sharper visuals

                // Interaction settings for hover/click
                interaction: {
                    mode: 'nearest', // Highlight the nearest data point on hover
                    intersect: false // Allow hover even if not directly over a point
                }
            },
            // Use the vertical plugin defined at the top
            plugins: [verticalLinePlugin]
        });

        // Confirmation Log
        console.log('Chart rendered successfully');
    }
    catch (error) {
        console.error('Error loading history:', error);
        document.getElementById('historyChart').outerHTML = '<p class="text-white text-center">Oops, something went wrong!</p>';
    }
}

// Set footer year and load the chart
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, starting...');
    document.getElementById('year').textContent = new Date().getFullYear();
    loadHistory();
});