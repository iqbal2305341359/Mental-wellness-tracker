const quotes = [
    "Every day is a new beginning. Take a deep breath and start again.",
    "You don't have to be positive all the time. It's perfectly okay to feel sad, angry, or anxious.",
    "Mental health is not a destination, but a process.",
    "You are stronger than you think.",
    "Small steps every day lead to big changes.",
    "Be gentle with yourself, you are a child of the universe.",
    "Your feelings are valid. Your struggles are real. You are not alone."
];

async function loadDashboard() {
    document.getElementById('quote').textContent = quotes[Math.floor(Math.random() * quotes.length)];
    buildMoodButtons();
    await loadHistory();
    await loadStats();
}

function buildMoodButtons() {
    const emojis = ['😢','😞','😟','😕','😐','🙂','😊','😄','😁','🤩'];
    const container = document.getElementById('moodBtns');
    let selected = 0;
    for (let i = 1; i <= 10; i++) {
        const btn = document.createElement('button');
        btn.textContent = `${i} ${emojis[i-1]}`;
        btn.style.cssText = 'padding:8px 12px;border:2px solid #e2e8f0;border-radius:8px;cursor:pointer;background:white;font-size:13px;transition:0.3s';
        btn.onclick = () => {
            document.querySelectorAll('#moodBtns button').forEach(b => {
                b.style.background = 'white';
                b.style.borderColor = '#e2e8f0';
                b.style.color = '#000';
            });
            btn.style.background = 'linear-gradient(135deg,#667eea,#764ba2)';
            btn.style.borderColor = '#667eea';
            btn.style.color = 'white';
            selected = i;
            document.getElementById('selectedMood').textContent = `Selected: ${i}/10 ${emojis[i-1]}`;
        };
        container.appendChild(btn);
    }
    window.getSelectedMood = () => selected;
}

async function quickMoodEntry() {
    const mood_level = window.getSelectedMood();
    const mood_note = document.getElementById('quickNote').value;
    const msg = document.getElementById('moodMsg');

    if (!mood_level) {
        msg.className = 'message error';
        msg.textContent = 'Please select a mood level!';
        return;
    }

    try {
        const res = await fetch(`${API}/mood/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'authorization': localStorage.getItem('token') },
            body: JSON.stringify({ mood_level, mood_note })
        });
        const data = await res.json();
        msg.className = res.ok ? 'message success' : 'message error';
        msg.textContent = data.message;
        if (res.ok) { await loadHistory(); await loadStats(); }
    } catch {
        msg.className = 'message error';
        msg.textContent = 'Error saving mood. Make sure backend is running.';
    }
}

async function loadHistory() {
    try {
        const res = await fetch(`${API}/mood/history`, {
            headers: { 'authorization': localStorage.getItem('token') }
        });
        const data = await res.json();
        const emojis = ['','😢','😞','😟','😕','😐','🙂','😊','😄','😁','🤩'];
        const container = document.getElementById('recentHistory');

        if (data.length === 0) {
            container.innerHTML = '<p style="color:#718096">No mood entries yet. Log your first mood!</p>';
            return;
        }

        container.innerHTML = data.slice(0, 5).map(r => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #e2e8f0">
                <div>
                    <span style="font-size:20px">${emojis[r.mood_level]}</span>
                    <strong style="margin-left:8px">${r.mood_level}/10</strong>
                    <span style="color:#718096;font-size:12px;margin-left:8px">${r.mood_note || ''}</span>
                </div>
                <span style="color:#a0aec0;font-size:12px">${new Date(new Date(r.recorded_date).toLocaleDateString('en-US', {month:'short', day:'numeric'})).toLocaleDateString('en-US', {month:'short', day:'numeric'})}</span>
            </div>
        `).join('');

        document.getElementById('todayMood').textContent = `${data[0].mood_level}/10 ${emojis[data[0].mood_level]}`;
        document.getElementById('totalEntries').textContent = data.length;

        buildWeeklyChart(data.slice(0, 7).reverse());
    } catch {
        document.getElementById('recentHistory').innerHTML = '<p style="color:red">Error loading history.</p>';
    }
}

async function loadStats() {
    try {
        const res = await fetch(`${API}/mood/history`, { headers: { 'authorization': localStorage.getItem('token') } });
        const data = await res.json();
        if (data.length === 0) return;

        const week = data.slice(0, 7);
        const avg = (week.reduce((s, r) => s + r.mood_level, 0) / week.length).toFixed(1);
        document.getElementById('weeklyAvg').textContent = avg;

        let streak = 0;
        const today = new Date();
        for (let i = 0; i < data.length; i++) {
            const d = new Date(data[i].recorded_date);
            const diff = Math.floor((today - d) / (1000 * 60 * 60 * 24));
            if (diff === i) streak++;
            else break;
        }
        document.getElementById('streak').textContent = `${streak} days`;
    } catch {}
}

let weeklyChartInstance = null;
function buildWeeklyChart(data) {
    const ctx = document.getElementById('weeklyChart').getContext('2d');
    if (weeklyChartInstance) weeklyChartInstance.destroy();
    weeklyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(r => new Date(r.recorded_date).toLocaleDateString('en-US', {month:'short', day:'numeric'})),
            datasets: [{
                label: 'Mood Level',
                data: data.map(r => r.mood_level),
                borderColor: '#667eea',
                backgroundColor: 'rgba(102,126,234,0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            scales: { y: { min: 1, max: 10 } },
            plugins: { legend: { display: false } }
        }
    });
}