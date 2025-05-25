// public/js/emotional-trends.js

document.addEventListener('DOMContentLoaded', function () {
    // Get the canvas context and filter element
    const ctx = document.getElementById('moodChart').getContext('2d');
    const timePeriodFilter = document.querySelector('.filter-select');
    let moodChart = null;

    // === Get References to Stats and Distribution Elements (New) ===
    const entriesCountElement = document.querySelector('.stat-card:nth-child(1) .stat-value');
    const averageMoodElement = document.querySelector('.stat-card:nth-child(2) .stat-value');
    // const mostCommonDayElement = document.querySelector('.stat-card:nth-child(3) .stat-value'); // Not used yet

    const positiveBar = document.querySelector('.mood-bar.positive');
    const neutralBar = document.querySelector('.mood-bar.neutral');
    const negativeBar = document.querySelector('.mood-bar.negative');

    const positivePercentage = document.querySelector('.mood-bar.positive + .mood-percentage');
    const neutralPercentage = document.querySelector('.mood-bar.neutral + .mood-percentage');
    const negativePercentage = document.querySelector('.mood-bar.negative + .mood-percentage');

    // Chart configuration
    const config = {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Average Mood Score',
                data: [],
                fill: false,
                borderColor: '#6366f1',
                tension: 0.4,
                pointBackgroundColor: function (context) {
                    const value = context.dataset.data[context.dataIndex];
                    if (value >= 7) return '#22c55e'; // Positive
                    if (value >= 5) return '#f59e0b'; // Neutral
                    return '#ef4444'; // Negative
                },
                pointBorderColor: '#fff',
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: 0,
                    max: 10,
                    ticks: {
                        stepSize: 1
                    },
                    title: {
                        display: true,
                        text: 'Average Mood Score (0-10)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const value = context.parsed.y;
                            let sentiment = 'Neutral';
                            if (value >= 7) sentiment = 'Positive';
                            if (value < 5) sentiment = 'Negative';
                            return `Avg Mood: ${value.toFixed(1)}/10 (${sentiment})`;
                        },
                        title: function (context) {
                            return context[0].label;
                        }
                    }
                }
            }
        }
    };

    // Fetch mood trends from the backend and update chart and stats
    async function fetchAndRenderTrendsChart() {
        const selectedPeriod = timePeriodFilter.value;
        const url = `/api/entries/trends?period=${selectedPeriod}`;
        console.log('Fetching trends data from:', url);

        try {
            const response = await fetch(url);
            if (response.ok) {
                const results = await response.json();
                const dailyTrends = results.dailyTrends;
                const summaryStats = results.summaryStats;

                // === Update Chart ===
                const labels = dailyTrends.map(item => item._id);
                const dataValues = dailyTrends.map(item => item.averageMood);

                config.data.labels = labels;
                config.data.datasets[0].data = dataValues;
                config.options.scales.x.title.text = selectedPeriod === 'week' ? 'Day' : 'Date';

                if (moodChart) {
                    moodChart.update();
                } else {
                    moodChart = new Chart(ctx, config);
                }

                // === Update Stats Cards ===
                if (entriesCountElement) {
                    entriesCountElement.textContent = summaryStats.totalEntries;
                }

                if (averageMoodElement) {
                    const totalCount = summaryStats.totalEntries;
                    let overallAvg = 0;
                    if (totalCount > 0) {
                        overallAvg = (
                            (summaryStats.positiveCount * 8) +
                            (summaryStats.neutralCount * 5) +
                            (summaryStats.negativeCount * 2)
                        ) / totalCount;
                    }

                    let sentimentText = 'Neutral';
                    if (overallAvg >= 7) sentimentText = 'Positive';
                    else if (overallAvg < 5) sentimentText = 'Negative';

                    averageMoodElement.textContent = `${overallAvg.toFixed(1)} (${sentimentText})`;
                }

                // === Update Mood Distribution Bars ===
                const total = summaryStats.totalEntries;
                const posPercent = total > 0 ? (summaryStats.positiveCount / total) * 100 : 0;
                const neuPercent = total > 0 ? (summaryStats.neutralCount / total) * 100 : 0;
                const negPercent = total > 0 ? (summaryStats.negativeCount / total) * 100 : 0;

                if (positiveBar) positiveBar.style.width = `${posPercent}%`;
                if (neutralBar) neutralBar.style.width = `${neuPercent}%`;
                if (negativeBar) negativeBar.style.width = `${negPercent}%`;

                if (positivePercentage) positivePercentage.textContent = `${posPercent.toFixed(0)}%`;
                if (neutralPercentage) neutralPercentage.textContent = `${neuPercent.toFixed(0)}%`;
                if (negativePercentage) negativePercentage.textContent = `${negPercent.toFixed(0)}%`;

            } else {
                const errorData = await response.json();
                console.error('Error fetching trends data:', response.status, errorData);
                showErrorStats();
            }
        } catch (error) {
            console.error('Network error fetching trends data:', error);
            showErrorStats();
        }
    }

    // Handle UI fallback on error
    function showErrorStats() {
        if (entriesCountElement) entriesCountElement.textContent = 'Error';
        if (averageMoodElement) averageMoodElement.textContent = 'Error';
        if (positivePercentage) positivePercentage.textContent = 'Error';
        if (neutralPercentage) neutralPercentage.textContent = 'Error';
        if (negativePercentage) negativePercentage.textContent = 'Error';
    }

    // Initialize chart on load
    fetchAndRenderTrendsChart();

    // Refetch chart data on filter change
    timePeriodFilter.addEventListener('change', fetchAndRenderTrendsChart);
});
