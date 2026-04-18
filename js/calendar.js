const emojis = ['','😢','😞','😟','😕','😐','🙂','😊','😄','😁','🤩'];
let currentDate = new Date();
let allMoodData = [];

async function loadCalendar() {
    try {
        const res = await fetch(`${API}/mood/history`, {
            headers: { 'authorization': localStorage.getItem('token') }
        });
        allMoodData = await res.json();
        renderCalendar();
    } catch {
        console.error('Error loading calendar');
    }
}

function changeMonth(dir) {
    currentDate.setMonth(currentDate.getMonth() + dir);
    renderCalendar();
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();

    document.getElementById('calendarTitle').textContent =
        currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const moodMap = {};
    allMoodData.forEach(r => {
        const d = new Date(r.recorded_date);
        if (d.getFullYear() === year && d.getMonth() === month) {
            const day = d.getDate();
            if (!moodMap[day]) moodMap[day] = r;
        }
    });

    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';

    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        grid.appendChild(empty);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement('div');
        const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        cell.className = `calendar-day ${moodMap[d] ? 'has-mood' : ''} ${isToday ? 'today' : ''}`;

        if (moodMap[d]) {
            cell.innerHTML = `
                <div class="day-num">${d}</div>
                <div class="mood-emoji">${emojis[moodMap[d].mood_level]}</div>
                <div class="mood-num">${moodMap[d].mood_level}/10</div>
            `;
        } else {
            cell.innerHTML = `<div class="day-num">${d}</div>`;
        }
        grid.appendChild(cell);
    }

    const monthData = allMoodData.filter(r => {
        const d = new Date(r.recorded_date);
        return d.getFullYear() === year && d.getMonth() === month;
    });

    document.getElementById('monthEntries').textContent = monthData.length;
    if (monthData.length > 0) {
        const avg = (monthData.reduce((s, r) => s + r.mood_level, 0) / monthData.length).toFixed(1);
        const best = Math.max(...monthData.map(r => r.mood_level));
        document.getElementById('monthAvg').textContent = avg;
        document.getElementById('monthBest').textContent = best + '/10';
    }
}