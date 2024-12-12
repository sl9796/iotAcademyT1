let xyChart;
let lineChart;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the XY Chart
    const ctxXY = document.getElementById('xyChart').getContext('2d');
    xyChart = new Chart(ctxXY, {
        type: 'line',
        data: {
            datasets: [
                { label: 'Dataset 1', data: [], borderColor: 'red', fill: false },
                { label: 'Dataset 2', data: [], borderColor: 'blue', fill: false },
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: { display: true, text: 'X-Axis (Numeric)' }
                },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Y-Axis' }
                }
            }
        }
    });

    // Initialize the Line Chart
    const ctxLine = document.getElementById('lineChart').getContext('2d');
    lineChart = new Chart(ctxLine, {
        type: 'line',
        data: {
            datasets: [
                { label: 'Dataset 1', data: [], borderColor: 'green', fill: false },
                { label: 'Dataset 2', data: [], borderColor: 'purple', fill: false },
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: { display: true, text: 'X-Axis (Numeric)' }
                },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Y-Axis' }
                }
            }
        }
    });
});
// Function to add data points to the chart
function addLineDataPoint(chart, x, y, set) {
    const dataset = chart.data.datasets[set];

    if (dataset) {
        dataset.data.push({ x, y });
        // Keep the dataset size within the max size (optional)
        if (dataset.data.length > 10) {
            dataset.data.shift();  // Remove the first data point if exceeding max length
        }

        chart.update();  // Update the chart after adding the data
    }
}

// Example: Add mock data points to each chart
const mockDataXY = [
    { x: 73, y: 2.4 },
    { x: 74, y: -0.9 },
    { x: 75, y: 5.1 },
    { x: 76, y: 1.7 },
    { x: 77, y: 2.0 }
];

// Add the data points to the XY chart (Dataset 0)
mockDataXY.forEach((point) => {
    addLineDataPoint(xyChart, point.x, point.y, 0);  // Adding to Dataset 0
});

const mockDataLine = [
    { x: 73, y: 3.4 },
    { x: 74, y: 1.2 },
    { x: 75, y: 2.5 },
    { x: 76, y: 3.0 },
    { x: 77, y: 4.1 }
];

// Add the data points to the Line chart (Dataset 0)
mockDataLine.forEach((point) => {
    addLineDataPoint(lineChart, point.x, point.y, 0);  // Adding to Dataset 0
});

