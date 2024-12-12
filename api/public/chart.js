"use strict";

/*
 * async function getData(url);
 *
 * This function will make the fetch() request to the desired URL
 * and return the JSON content from the fetch.
 */
let xyChart;
let lineChart;
let loaded; //variable to keep track whether the DOM is already loaded

/*
 * async function getData(url);
 * 
 * This function will make the fetch() request to the desired URL
 * and return the JSON content from the fetch.
 */
async function getData(url) {
    // get the times table we are interested in
    const response = await fetch(url);

    //extract JSON from the http response
    return await response.json();
}

/*
 * async function updateDashboard();
 *
 * This function will be called upon during interval
 * expiry, fetch API results and update the HTML user interface
 * based on ids we have set up in our coding below.
 */
let count = 0;
async function updateDashboard() {
    // set up our URL for our API -> latest X, Y coordinates
    // of a specific robot
    let u = "./robot3pos?limit=1"
    // make the request
    let results = await getData(u);
    addScatterDataPoint(results.rows[0].position_x, results.rows[0].position_y);
    count++;
    addLineDataPoint(count, results.rows[0].torque_1, 0);
    addLineDataPoint(count, results.rows[0].torque_2, 1);
    addLineDataPoint(count.timestamp, results.rows[0].torque_3, 2);
}

//draw charts as soon as DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    loaded = true;
    const canvas1 = document.getElementById('xyChart').getContext('2d');
    let chartConfig = {
        label: "xYcHaRt",
        borderColor: 'red',
        data: [], //initially empty
        showLine: true
    };

    xyChart = new Chart(canvas1, {
        type: 'scatter', // or any other chart type
        data: {
            datasets: [chartConfig]
        },

        options: {
            animation: {
                duration: 0,
            },
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                xAxes: [
                    {
                        ticks: {
                            beginAtZero: false,
                            stepValue: 100,
                            min: -700,
                            max: 700,
                        },
                    },
                ],
                yAxes: [
                    {
                        ticks: {
                            beginAtZero: false,
                            stepValue: 100,
                            min: -700,
                            max: 700,
                        },
                    },
                ],
                x: {
                    type: "linear",
                    position: "bottom",
                    title: {
                        display: true,
                        text: 'haha you cannot see me'
                    }
                },
            }
        }
    });

    const canvas2 = document.getElementById('lineChart').getContext('2d');
    lineChart = new Chart(canvas2, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'torque_1', // Label for the first line
                    data: [], // Y-axis values for the first line
                    borderColor: 'orange', // Line color for the first dataset
                    fill: false, // Do not fill under the line
                    tension: 0.1 // Smoothness of the line
                },
                {
                    label: 'torque_2', // Label for the second line
                    data: [], // Y-axis values for the second line
                    borderColor: 'blue', // Line color for the second dataset
                    fill: false, // Do not fill under the line
                    tension: 0.1 // Smoothness of the line
                },
                {
                    label: 'torque_3', // Label for the third line
                    data: [], // Y-axis values for the third line
                    borderColor: 'green', // Line color for the third dataset
                    fill: false, // Do not fill under the line
                    tension: 0.1 // Smoothness of the line
                }
            ]
        },
        options: {
            responsive: true,
            //maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',  // Ensure the x-axis is set to linear
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Torque values over time'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Torque'
                    }
                }
            }
        }
    })
})


function addScatterDataPoint(x, y) {
    if (!loaded) {
        return;
    }
    xyChart.data.datasets[0].data.push({ x, y });
    //keep length of data array at 5
    if (xyChart.data.datasets[0].data.length > 5) {
        xyChart.data.datasets[0].data.shift();
    }
    xyChart.update();
}
function addLineDataPoint(x, y, set) {
    if (!loaded) {
        return;
    }
    if (lineChart.data.datasets[set] && lineChart.data.datasets[set].data) {
        lineChart.data.datasets[set].data.push({ x, y });
        //keep length of data array at 5
        if (lineChart.data.datasets[set].data.length > 10) {
            lineChart.data.datasets[set].data.shift();
        }
    }
    lineChart.update();
}

/*
 * async function main();
 *
 * This function will setup our support for a simple web based visualization
 * of our PreSorter Robot system.
 *
 * The approach to making a request, taking JSON data and plugging into
 * our user interface should allow you to build a reasonably attractive
 * basic dashboard without resorting to more expansive tools like
 * Grafana.
 *
 * This example also showcases the use of chart.js to create a simple
 * scatter plot visualization of robot positional data. See comments above
 * for ways to customize this.
 */

// document.querySelectorAll('*')
//     .forEach(element => element.addEventListener('click', e => {
//         addDataPoint((Math.random() * 300), (Math.random() * 300))
//     }))

async function main() {
    setInterval(updateDashboard, 1000);
}

// execute main

main();

