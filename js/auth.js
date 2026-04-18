const API = 'http://localhost:5000/api';

async function register() {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const age = document.getElementById('regAge').value;
    const gender = document.getElementById('regGender').value;
    const msg = document.getElementById('registerMsg');

    if (!name || !email || !password) {
        msg.className = 'message error';
        msg.textContent = 'Please fill in all required fields!';
        return;
    }

    try {
        const res = await fetch(`${API}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, age, gender })
        });
        const data = await res.json();
        msg.className = res.ok ? 'message success' : 'message error';
        msg.textContent = data.message;
        if (res.ok) setTimeout(() => switchTab('login', document.querySelectorAll('.tab')[0]), 1500);
    } catch {
        msg.className = 'message error';
        msg.textContent = 'Server error. Make sure backend is running.';
    }
}

async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const msg = document.getElementById('loginMsg');

    if (!email || !password) {
        msg.className = 'message error';
        msg.textContent = 'Please enter email and password!';
        return;
    }

    try {
        const res = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
           localStorage.setItem('token', data.token);
localStorage.setItem('user_id', data.user_id);
localStorage.setItem('name', data.name);
localStorage.setItem('is_admin', data.is_admin);
            window.location.href = 'dashboard.html';
        } else {
            msg.className = 'message error';
            msg.textContent = data.message;
        }
    } catch {
        msg.className = 'message error';
        msg.textContent = 'Server error. Make sure backend is running.';
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

function checkAuth() {
    if (!localStorage.getItem('token')) {
        window.location.href = 'index.html';
    }
    const name = localStorage.getItem('name');
    const el = document.getElementById('userName');
    if (el && name) el.textContent = `Hi, ${name}!`;

    const isAdmin = localStorage.getItem('is_admin');
    const adminLink = document.getElementById('adminLink');
    if (adminLink) {
        if (isAdmin == 1) {
            adminLink.style.display = 'inline-block';
        } else {
            adminLink.style.display = 'none';
        }
    }
}