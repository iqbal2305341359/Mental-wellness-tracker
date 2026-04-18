async function addGoal() {
    const title = document.getElementById('goalTitle').value;
    const description = document.getElementById('goalDesc').value;
    const target_days = document.getElementById('goalTarget').value;
    const category = document.getElementById('goalCategory').value;
    const msg = document.getElementById('goalMsg');

    if (!title || !target_days) {
        msg.className = 'message error';
        msg.textContent = 'Please enter goal title and target days!';
        return;
    }

    try {
        const res = await fetch(`${API}/goals/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'authorization': localStorage.getItem('token') },
            body: JSON.stringify({ title, description, target_days, category })
        });
        const data = await res.json();
        msg.className = res.ok ? 'message success' : 'message error';
        msg.textContent = data.message;
        if (res.ok) {
            document.getElementById('goalTitle').value = '';
            document.getElementById('goalDesc').value = '';
            document.getElementById('goalTarget').value = '';
            await loadGoals();
        }
    } catch {
        msg.className = 'message error';
        msg.textContent = 'Error saving goal. Make sure backend is running.';
    }
}

async function loadGoals() {
    try {
        const res = await fetch(`${API}/goals`, {
            headers: { 'authorization': localStorage.getItem('token') }
        });
        const data = await res.json();
        const container = document.getElementById('goalsList');

        const total = data.length;
        const completed = data.filter(g => g.status === 'completed').length;
        const active = total - completed;

        document.getElementById('totalGoals').textContent = total;
        document.getElementById('activeGoals').textContent = active;
        document.getElementById('completedGoals').textContent = completed;

        if (data.length === 0) {
            container.innerHTML = '<p style="color:#718096">No goals yet. Set your first wellness goal!</p>';
            return;
        }

        container.innerHTML = data.map(g => {
            const progress = Math.min(Math.round((g.current_days / g.target_days) * 100), 100);
            return `
            <div class="goal-card">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <div>
                        <h3 style="margin:0">${g.title}</h3>
                        <p style="color:#718096;font-size:13px;margin:4px 0">${g.description || ''}</p>
                        <span style="font-size:12px;color:#a0aec0">📁 ${g.category}</span>
                    </div>
                    <span class="badge ${g.status === 'completed' ? 'badge-done' : 'badge-active'}">
                        ${g.status === 'completed' ? '✅ Completed' : '🔄 Active'}
                    </span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width:${progress}%"></div>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:13px;color:#718096">
                    <span>Progress: ${g.current_days}/${g.target_days} days</span>
                    <span>${progress}%</span>
                </div>
                <div class="goal-actions">
                    ${g.status !== 'completed' ? `<button class="btn-complete" onclick="updateGoal(${g.goal_id})">+1 Day Progress</button>` : ''}
                    <button class="btn-delete" onclick="deleteGoal(${g.goal_id})">Delete</button>
                </div>
            </div>
        `}).join('');
    } catch {
        document.getElementById('goalsList').innerHTML = '<p style="color:red">Error loading goals.</p>';
    }
}

async function updateGoal(id) {
    try {
        await fetch(`${API}/goals/update/${id}`, {
            method: 'PUT',
            headers: { 'authorization': localStorage.getItem('token') }
        });
        await loadGoals();
    } catch { console.error('Error updating goal'); }
}

async function deleteGoal(id) {
    if (!confirm('Delete this goal?')) return;
    try {
        await fetch(`${API}/goals/${id}`, {
            method: 'DELETE',
            headers: { 'authorization': localStorage.getItem('token') }
        });
        await loadGoals();
    } catch { console.error('Error deleting goal'); }
}