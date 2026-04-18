const emojis = ['','😢','😞','😟','😕','😐','🙂','😊','😄','😁','🤩'];
let selectedMood = 0;

function buildMoodGrid() {
    const grid = document.getElementById('moodGrid');
    grid.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
        const btn = document.createElement('button');
        btn.className = 'mood-btn';
        btn.innerHTML = `<div style="font-size:24px">${emojis[i]}</div><div style="font-weight:700">${i}</div>`;
        btn.addEventListener('click', function() {
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            selectedMood = i;
            document.getElementById('selectedMoodText').textContent = `You selected: ${i}/10 ${emojis[i]}`;
        });
        grid.appendChild(btn);
    }
}

async function saveMood() {
    const mood_note = document.getElementById('moodNote').value;
    const msg = document.getElementById('moodMsg');

    if (!selectedMood) {
        msg.className = 'message error';
        msg.textContent = 'Please select a mood level 1-10!';
        return;
    }

    try {
        const res = await fetch(`http://localhost:5000/api/mood/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'authorization': localStorage.getItem('token') },
            body: JSON.stringify({ mood_level: selectedMood, mood_note })
        });
        const data = await res.json();
        msg.className = res.ok ? 'message success' : 'message error';
        msg.textContent = data.message;
        if (res.ok) {
            document.getElementById('moodNote').value = '';
            selectedMood = 0;
            buildMoodGrid();
            document.getElementById('selectedMoodText').textContent = '';
            await loadMoodHistory();
        }
    } catch {
        msg.className = 'message error';
        msg.textContent = 'Error saving mood. Make sure backend is running.';
    }
}

async function loadMoodHistory() {
    try {
        const res = await fetch(`http://localhost:5000/api/mood/history`, {
            headers: { 'authorization': localStorage.getItem('token') }
        });
        const data = await res.json();
        const container = document.getElementById('moodHistory');

        if (data.length === 0) {
            container.innerHTML = '<p style="color:#718096">No mood entries yet. Log your first mood above!</p>';
            return;
        }

        container.innerHTML = data.map(r => `
    <div class="history-item" id="entry-${r.record_id}">
        <div style="display:flex;align-items:center;gap:12px">
            <span style="font-size:28px">${emojis[r.mood_level]}</span>
            <div>
                <strong>${r.mood_level}/10</strong>
                <p style="color:#718096;font-size:13px" id="note-text-${r.record_id}">${r.mood_note || 'No note added'}</p>
                <div id="edit-box-${r.record_id}" style="display:none;margin-top:8px">
                    <textarea id="edit-input-${r.record_id}" style="width:100%;padding:6px;border-radius:6px;border:1px solid #e2e8f0;font-size:13px">${r.mood_note || ''}</textarea>
                    <button onclick="saveNote(${r.record_id})" style="margin-top:4px;padding:4px 12px;background:#667eea;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px">Save</button>
                    <button onclick="cancelEdit(${r.record_id})" style="margin-top:4px;margin-left:6px;padding:4px 12px;background:#e2e8f0;color:#333;border:none;border-radius:6px;cursor:pointer;font-size:12px">Cancel</button>
                </div>
            </div>
        </div>
        <div style="text-align:right;display:flex;flex-direction:column;gap:6px;align-items:flex-end">
            <p style="color:#a0aec0;font-size:12px">${new Date(r.recorded_date).toLocaleDateString('en-US', {year:'numeric', month:'short', day:'numeric'})}</p>
            <p style="color:#a0aec0;font-size:12px">${new Date(r.recorded_date + 'T' + r.recorded_time).toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'})}</p>
            <button onclick="editNote(${r.record_id})" style="padding:4px 10px;background:#667eea;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px">✏️ Edit Note</button>
            <button onclick="deleteMood(${r.record_id})" style="padding:4px 10px;background:#fc8181;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px">🗑️ Delete</button>
        </div>
    </div>
`).join('');
    } catch {
        document.getElementById('moodHistory').innerHTML = '<p style="color:red">Error loading history.</p>';
    }
 }   
    function editNote(id) {
    document.getElementById(`edit-box-${id}`).style.display = 'block';
    document.getElementById(`note-text-${id}`).style.display = 'none';
}

function cancelEdit(id) {
    document.getElementById(`edit-box-${id}`).style.display = 'none';
    document.getElementById(`note-text-${id}`).style.display = 'block';
}

async function saveNote(id) {
    const mood_note = document.getElementById(`edit-input-${id}`).value;
    try {
        const res = await fetch(`http://localhost:5000/api/mood/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'authorization': localStorage.getItem('token') },
            body: JSON.stringify({ mood_note })
        });
        const data = await res.json();
        if (res.ok) {
            document.getElementById(`note-text-${id}`).textContent = mood_note || 'No note added';
            cancelEdit(id);
        } else {
            alert(data.message);
        }
    } catch {
        alert('Error updating note.');
    }
}

async function deleteMood(id) {
    if (!confirm('Are you sure you want to delete this mood entry?')) return;
    try {
        const res = await fetch(`http://localhost:5000/api/mood/${id}`, {
            method: 'DELETE',
            headers: { 'authorization': localStorage.getItem('token') }
        });
        const data = await res.json();
        if (res.ok) {
            document.getElementById(`entry-${id}`).remove();
        } else {
            alert(data.message);
        }
    } catch {
        alert('Error deleting mood entry.');
    }
}
