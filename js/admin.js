async function loadAdmin() {
    try {
        const res = await fetch(`${API}/admin/stats`, {
            headers: { 'authorization': localStorage.getItem('token') }
        });
        const data = await res.json();

        document.getElementById('totalUsers').textContent = data.totalUsers;
        document.getElementById('totalMoods').textContent = data.totalMoods;
        document.getElementById('totalGoals').textContent = data.totalGoals;
        document.getElementById('totalNotes').textContent = data.totalNotes;

        const usersRes = await fetch(`${API}/admin/users`, {
            headers: { 'authorization': localStorage.getItem('token') }
        });
        const users = await usersRes.json();

        document.getElementById('usersTable').innerHTML = users.map(u => `
            <tr>
                <td>${u.user_id}</td>
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td>${u.age || '-'}</td>
                <td>${u.gender || '-'}</td>
                <td>${new Date(u.created_at).toLocaleDateString()}</td>
                <td><span class="badge-user">User</span></td>
                <td><button class="btn-deactivate" onclick="deleteUser(${u.user_id})">🗑️ Delete</button></td>
            </tr>
        `).join('');

        document.getElementById('systemStats').innerHTML = `
            <div style="display:flex;gap:20px;flex-wrap:wrap">
                <div style="padding:15px;background:#f0f4f8;border-radius:10px;flex:1">
                    <h3 style="margin-bottom:8px">📅 Last Updated</h3>
                    <p style="color:#667eea">${new Date().toLocaleString()}</p>
                </div>
                <div style="padding:15px;background:#f0f4f8;border-radius:10px;flex:1">
                    <h3 style="margin-bottom:8px">🗄️ Database</h3>
                    <p style="color:#48bb78">● Connected</p>
                </div>
                <div style="padding:15px;background:#f0f4f8;border-radius:10px;flex:1">
                    <h3 style="margin-bottom:8px">🚀 Server</h3>
                    <p style="color:#48bb78">● Running on port 5000</p>
                </div>
            </div>
        `;
    } catch {
        console.error('Error loading admin data');
    }
}

async function deleteUser(id) {
    if (!confirm('Delete this user and all their data?')) return;
    try {
        await fetch(`${API}/admin/users/${id}`, {
            method: 'DELETE',
            headers: { 'authorization': localStorage.getItem('token') }
        });
        await loadAdmin();
    } catch { console.error('Error deleting user'); }
}