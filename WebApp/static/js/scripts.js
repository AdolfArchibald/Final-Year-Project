// static/js/scripts.js
async function loadStocks() {
    try {
        const response = await fetch('/api/stocks');
        const stocks = await response.json();
        const tableBody = document.getElementById('stockTableBody');
        tableBody.innerHTML = '';

        stocks.forEach(stock => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${stock.Ticker}</td>
                <td>$${stock.PricePredicted.toFixed(2)}</td>
                <td>${(stock.ExpectedGrowth * 100).toFixed(1)}%</td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading stocks:', error);
        document.getElementById('stockTableBody').innerHTML = '<tr><td colspan="3">Oops, something went wrong!</td></tr>';
    }
}

// Button event listeners for index.html
document.getElementById('downloadPdf').addEventListener('click', () => {
    window.location.href = '/download/pdf';
});

document.getElementById('downloadExcel').addEventListener('click', () => {
    window.location.href = '/download/excel';
});

// Load stocks and set year
window.onload = loadStocks;
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('year').textContent = new Date().getFullYear();
});