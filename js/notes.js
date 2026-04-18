let selectedColor = 'yellow';

function selectColor(color, el) {
    selectedColor = color;
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
    el.classList.add('selected');
}

async function addNote() {
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;
    const msg = document.getElementById('noteMsg');

    if (!content) {
        msg.className = 'message error';
        msg.textContent = 'Please write something in the note!';
        return;
    }

    try {
        const res = await fetch(`${API}/notes/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'authorization': localStorage.getItem('token') },
            body: JSON.stringify({ title, content, color: selectedColor })
        });
        const data = await res.json();
        msg.className = res.ok ? 'message success' : 'message error';
        msg.textContent = data.message;
        if (res.ok) {
            document.getElementById('noteTitle').value = '';
            document.getElementById('noteContent').value = '';
            await loadNotes();
        }
    } catch {
        msg.className = 'message error';
        msg.textContent = 'Error saving note. Make sure backend is running.';
    }
}

async function loadNotes() {
    try {
        const res = await fetch(`${API}/notes`, {
            headers: { 'authorization': localStorage.getItem('token') }
        });
        const data = await res.json();
        const grid = document.getElementById('notesGrid');

        if (data.length === 0) {
            grid.innerHTML = '<p style="color:#718096">No notes yet. Add your first sticky note!</p>';
            return;
        }

        grid.innerHTML = data.map(n => `
            <div class="sticky-note note-${n.color}">
                <h3>${n.title || 'Note'}</h3>
                <p>${n.content}</p>
                <div class="note-footer">
                    <span class="note-date">${new Date(n.created_at).toLocaleDateString()}</span>
                    <button class="note-delete" onclick="deleteNote(${n.note_id})">🗑️ Delete</button>
                </div>
            </div>
        `).join('');
    } catch {
        document.getElementById('notesGrid').innerHTML = '<p style="color:red">Error loading notes.</p>';
    }
}

async function deleteNote(id) {
    if (!confirm('Delete this note?')) return;
    try {
        await fetch(`${API}/notes/${id}`, {
            method: 'DELETE',
            headers: { 'authorization': localStorage.getItem('token') }
        });
        await loadNotes();
    } catch { console.error('Error deleting note'); }
}