let alarmSound = null;
let snoozeTimeout = null;
let currentReminderId = null;

function playAlarmSound() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    function beep(startTime, duration) {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.value = 880;
        gainNode.gain.setValueAtTime(0.5, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    }
    beep(audioCtx.currentTime, 0.3);
    beep(audioCtx.currentTime + 0.4, 0.3);
    beep(audioCtx.currentTime + 0.8, 0.3);
    alarmSound = audioCtx;
}

function stopAlarmSound() {
    if (alarmSound) {
        alarmSound.close();
        alarmSound = null;
    }
}

function showAlarmPopup(reminder) {
    const cleanDate = reminder.reminder_date ? reminder.reminder_date.split('T')[0] : '';
    currentReminderId = reminder.reminder_id;
    document.getElementById('alarmTime').textContent = reminder.reminder_time;
    document.getElementById('alarmDate').textContent = cleanDate;
    document.getElementById('alarmPopup').style.display = 'flex';
    playAlarmSound();
}

function dismissAlarm(id) {
    stopAlarmSound();
    document.getElementById('alarmPopup').style.display = 'none';
    if (snoozeTimeout) { clearTimeout(snoozeTimeout); snoozeTimeout = null; }
    markDone(id);
}

function snoozeAlarm(id) {
    stopAlarmSound();
    document.getElementById('alarmPopup').style.display = 'none';
    const msg = document.createElement('div');
    msg.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#667eea;color:white;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:600;z-index:9999;box-shadow:0 4px 15px rgba(0,0,0,0.2)';
    msg.textContent = '😴 Snoozed for 5 minutes!';
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
    snoozeTimeout = setTimeout(() => {
        fetch(`${API}/reminders`, {
            headers: { 'authorization': localStorage.getItem('token') }
        })
        .then(res => res.json())
        .then(reminders => {
            const r = reminders.find(r => r.reminder_id === id);
            if (r && r.reminder_status === 'active') showAlarmPopup(r);
        });
    }, 5 * 60 * 1000);
}

async function addReminder() {
    const reminder_time = document.getElementById('reminderTime').value;
    const reminder_date = document.getElementById('reminderDate').value;
    const msg = document.getElementById('reminderMsg');
    if (!reminder_time || !reminder_date) {
        msg.className = 'message error';
        msg.textContent = 'Please select both date and time!';
        return;
    }
    try {
        const res = await fetch(`${API}/reminders/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'authorization': localStorage.getItem('token') },
            body: JSON.stringify({ reminder_time, reminder_date })
        });
        const data = await res.json();
        msg.className = res.ok ? 'message success' : 'message error';
        msg.textContent = data.message;
        if (res.ok) {
            document.getElementById('reminderTime').value = '';
            document.getElementById('reminderDate').value = '';
            await loadReminders();
        }
    } catch {
        msg.className = 'message error';
        msg.textContent = 'Error saving reminder. Make sure backend is running.';
    }
}

async function loadReminders() {
    try {
        const res = await fetch(`${API}/reminders`, {
            headers: { 'authorization': localStorage.getItem('token') }
        });
        const data = await res.json();
        const container = document.getElementById('remindersList');
        document.getElementById('totalReminders').textContent = data.length;
        document.getElementById('activeReminders').textContent = data.filter(r => r.reminder_status === 'active').length;
        if (data.length === 0) {
            container.innerHTML = '<p style="color:#718096">No reminders yet. Set your first reminder!</p>';
            return;
        }
        container.innerHTML = data.map(r => {
            const cleanDate = r.reminder_date ? r.reminder_date.split('T')[0] : '';
            const isActive = r.reminder_status === 'active';
            return `
            <div class="reminder-item" id="reminder-${r.reminder_id}">
                <div style="display:flex;align-items:center;gap:20px">
                    <span style="font-size:30px">${isActive ? '🔔' : '🔕'}</span>
                    <div>
                        <div class="reminder-time" style="color:${isActive ? '#667eea' : '#a0aec0'}">${r.reminder_time}</div>
                        <div class="reminder-date">📅 ${cleanDate}</div>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:10px">
                    <span class="${isActive ? 'badge-active' : 'badge-done'}">${r.reminder_status}</span>
                    ${isActive ? `<button class="btn-done-reminder" onclick="markDone(${r.reminder_id})">✅ Done</button>` : ''}
                    <button class="btn-delete-reminder" onclick="deleteReminder(${r.reminder_id})">🗑️ Delete</button>
                </div>
            </div>`;
        }).join('');
    } catch {
        document.getElementById('remindersList').innerHTML = '<p style="color:red">Error loading reminders.</p>';
    }
}

async function markDone(id) {
    try {
        await fetch(`${API}/reminders/done/${id}`, {
            method: 'PUT',
            headers: { 'authorization': localStorage.getItem('token') }
        });
        await loadReminders();
    } catch { console.error('Error marking reminder done'); }
}

async function deleteReminder(id) {
    if (!confirm('Delete this reminder?')) return;
    try {
        await fetch(`${API}/reminders/${id}`, {
            method: 'DELETE',
            headers: { 'authorization': localStorage.getItem('token') }
        });
        await loadReminders();
    } catch { console.error('Error deleting reminder'); }
}

function startReminderChecker() {
    if (Notification.permission !== 'granted') {
        Notification.requestPermission();
    }
    setInterval(() => {
        const now = new Date();
        const currentDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
        const currentHour = String(now.getHours()).padStart(2, '0');
        const currentMin = String(now.getMinutes()).padStart(2, '0');
        const currentTime = `${currentHour}:${currentMin}`;

        fetch(`${API}/reminders`, {
            headers: { 'authorization': localStorage.getItem('token') }
        })
        .then(res => res.json())
        .then(reminders => {
            reminders.forEach(r => {
                if (r.reminder_status !== 'active') return;
                const d = new Date(r.reminder_date);
                const cleanDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                const reminderTime = r.reminder_time.slice(0, 5);
                if (cleanDate === currentDate && reminderTime === currentTime) {
                    showAlarmPopup(r);
                }
            });
        })
        .catch(() => {});
    }, 60000);
}