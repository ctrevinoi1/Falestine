// graphs.js

async function drawDailyFatalitiesChart() {
    try {
        const response = await fetch('/get_acled_data');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        const labels = data.map(row => row.date);
        const allKeys = Object.keys(data[0]).filter(k => k !== 'date');

        const datasets = allKeys.map(key => {
            let color = 'rgba(0,0,0,0.7)';
            let labelName = key;
            if (key.toLowerCase().includes('israel')) {
                color = 'rgba(54, 162, 235, 1)';
            } else if (key.toLowerCase().includes('palestine')) {
                color = 'rgba(255, 99, 132, 1)';
            }
            return {
                label: labelName,
                data: data.map(row => +row[key] || 0),
                borderColor: color,
                backgroundColor: color.replace(',1)', ',0.2)'),
                fill: false,
                tension: 0.3
            };
        });

        const ctx = document.getElementById('fatalitiesBarChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Allow chart to adjust in size
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Date',
                            color: '#555',
                            font: { size: 14 }
                        },
                        ticks: { color: '#666' }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Fatalities',
                            color: '#555',
                            font: { size: 14 }
                        },
                        ticks: { color: '#666' },
                        suggestedMax: 1400
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: '#444', font: { size: 12 } }
                    },
                    title: {
                        display: true,
                        text: 'Daily Reported Fatalities in Israel-Palestine Conflict',
                        font: { size: 18, weight: 'bold' },
                        color: '#333',
                        padding: { bottom: 15 }
                    },
                    annotation: {
                        annotations: {
                            ceasefireSpan: {
                                type: 'box',
                                xMin: '2023-11-24',
                                xMax: '2023-11-30',
                                backgroundColor: 'rgba(255, 0, 0, 0.2)',
                                label: {
                                    content: 'Ceasefire',
                                    enabled: true,
                                    position: 'start',
                                    color: '#555',
                                    font: { size: 12 }
                                }
                            },
                            october7Label: {
                                type: 'point',
                                xValue: '2023-10-07',
                                yValue: 0,
                                backgroundColor: 'rgba(255, 0, 0, 0.8)',
                                radius: 5,
                                label: {
                                    content: 'October 7th',
                                    enabled: true,
                                    position: 'top',
                                    color: '#555',
                                    font: { size: 12 }
                                }
                            }
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error("Error fetching or rendering daily fatalities:", error);
    }
}

async function drawFatalitiesLineChart() {
    try {
        const response = await fetch('/get_acled_data'); // Re-fetch data or reuse if already fetched
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        const labels = data.map(row => row.date);
        const allKeys = Object.keys(data[0]).filter(k => k !== 'date'); // Get all keys again

        const datasets = allKeys.map(key => {
            let color = 'rgba(0,0,0,0.7)';
            let labelName = key;
            if (key.toLowerCase().includes('israel')) {
                color = 'rgba(54, 162, 235, 1)';
            } else if (key.toLowerCase().includes('palestine')) {
                color = 'rgba(255, 99, 132, 1)';
            }
            return {
                label: labelName,
                data: data.map(row => +row[key] || 0),
                borderColor: color,
                backgroundColor: 'transparent', // Line chart, no fill
                borderColor: color,
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHitRadius: 10
            };
        });

        const ctx = document.getElementById('fatalitiesLineChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'month' // Display x-axis in months
                        },
                        title: {
                            display: true,
                            text: 'Date (Monthly Trend)',
                            color: '#555',
                            font: { size: 14 }
                        },
                        ticks: { color: '#666' }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Fatalities',
                            color: '#555',
                            font: { size: 14 }
                        },
                        ticks: { color: '#666' },
                        suggestedMax: 1400
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: '#444', font: { size: 12 } }
                    },
                    title: {
                        display: true,
                        text: 'Monthly Trend of Fatalities',
                        font: { size: 18, weight: 'bold' },
                        color: '#333',
                        padding: { bottom: 15 }
                    }
                }
            }
        });

    } catch (error) {
        console.error("Error fetching or rendering monthly fatalities line chart:", error);
    }
}


// Initialize both charts
async function initGraphs() {
    await drawDailyFatalitiesChart();
    await drawFatalitiesLineChart();
}

initGraphs();