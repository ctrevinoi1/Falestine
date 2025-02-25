// graphs.js

async function drawDailyFatalitiesChart() {
    try {
        const response = await fetch('/get_acled_data');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // We'll build separate arrays for each column we find, except for the 'date' column.
        // Example columns might be: 'Israel', 'Palestine', 'Egypt', '7_day_avg_all', etc.
        // Also keep track of unique countries.
        const labels = data.map(row => row.date);

        // Identify all columns except 'date'
        const allKeys = Object.keys(data[0]).filter(k => k !== 'date');
        
        // We'll create a dataset for each key (excluding the 7-day average).
        const datasets = allKeys.map(key => {
            // We'll pick some color logic or random color
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

        // We'll highlight the ceasefire from 2023-11-24 to 2023-11-30, plus annotate October 7th as a point.
        // For annotation, include chartjs-plugin-annotation in your HTML or dependencies.
        const ctx = document.getElementById('fatalitiesBarChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets
            },
            options: {
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Fatalities'
                        },
                        suggestedMax: 1400 // from your snippet
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Daily reported fatalities Israel-Palestine conflict',
                        font: { size: 16 }
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
                                    position: 'start'
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
                                    position: 'top'
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

// Initialize the new chart
async function initGraphs() {
    // We no longer do any special logic here, just call our new chart function
    await drawDailyFatalitiesChart();
}

initGraphs();