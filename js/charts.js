async function loadCharts() {
    try {
        const res = await fetch(`${API}/mood/history`, {
            headers: { 'authorization': localStorage.getItem('token') }
        });
        const data = await res.json();

        if (data.length === 0) {
            document.getElementById('weeklySummary').innerHTML = '<p style="color:#718096">No mood entries yet. Log your first mood!</p>';
            return;
        }

        const avg = (data.reduce((s, r) => s + r.mood_level, 0) / data.length).toFixed(1);
        const best = Math.max(...data.map(r => r.mood_level));
        document.getElementById('totalEntries').textContent = data.length;
        document.getElementById('avgMood').textContent = avg;
        document.getElementById('bestMood').textContent = best + '/10';

        const reversed = [...data].reverse();

        new Chart(document.getElementById('lineChart'), {
            type: 'line',
            data: {
                labels: reversed.map(r => r.recorded_date),
                datasets: [{
                    label: 'Mood Level',
                    data: reversed.map(r => r.mood_level),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102,126,234,0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#667eea'
                }]
            },
            options: {
                scales: { y: { min: 1, max: 10 } },
                plugins: { legend: { display: true } }
            }
        });

        new Chart(document.getElementById('barChart'), {
            type: 'bar',
            data: {
                labels: data.slice(0, 7).reverse().map(r => r.recorded_date),
                datasets: [{
                    label: 'Mood Level',
                    data: data.slice(0, 7).reverse().map(r => r.mood_level),
                    backgroundColor: 'rgba(102,126,234,0.7)',
                    borderColor: '#667eea',
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                scales: { y: { min: 1, max: 10 } },
                plugins: { legend: { display: false } }
            }
        });

        const moodCounts = {
            'Very Bad (1-2)': 0,
            'Bad (3-4)': 0,
            'Neutral (5)': 0,
            'Good (6-7)': 0,
            'Very Good (8-9)': 0,
            'Excellent (10)': 0
        };

        data.forEach(r => {
            if (r.mood_level <= 2) moodCounts['Very Bad (1-2)']++;
            else if (r.mood_level <= 4) moodCounts['Bad (3-4)']++;
            else if (r.mood_level === 5) moodCounts['Neutral (5)']++;
            else if (r.mood_level <= 7) moodCounts['Good (6-7)']++;
            else if (r.mood_level <= 9) moodCounts['Very Good (8-9)']++;
            else moodCounts['Excellent (10)']++;
        });

        new Chart(document.getElementById('pieChart'), {
            type: 'pie',
            data: {
                labels: Object.keys(moodCounts),
                datasets: [{
                    data: Object.values(moodCounts),
                    backgroundColor: [
                        '#fc5c7d', '#f6a623', '#f7dc6f',
                        '#82e0aa', '#5dade2', '#667eea'
                    ]
                }]
            },
            options: {
                plugins: { legend: { position: 'bottom' } }
            }
        });

        const weeks = {};
        data.forEach(r => {
            const date = new Date(r.recorded_date);
            const week = 'Week ' + Math.ceil(date.getDate() / 7) + ' - ' + date.toLocaleString('default', { month: 'short' });
            if (!weeks[week]) weeks[week] = [];
            weeks[week].push(r.mood_level);
        });

        document.getElementById('weeklySummary').innerHTML = Object.entries(weeks).map(function(entry) {
            const week = entry[0];
            const moods = entry[1];
            const avg = (moods.reduce(function(a, b) { return a + b; }, 0) / moods.length).toFixed(1);
            const best = Math.max.apply(null, moods);
            return '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px;border-bottom:1px solid #e2e8f0"><strong>' + week + '</strong><div style="display:flex;gap:20px"><span style="color:#718096">Entries: ' + moods.length + '</span><span style="color:#667eea;font-weight:600">Avg: ' + avg + '</span><span style="color:#48bb78">Best: ' + best + '</span></div></div>';
        }).join('');

    } catch(e) {
        console.error('Error loading charts', e);
    }
}