const API_URL = "http://localhost:5000";

// Register
const registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("registerName").value;
        const email = document.getElementById("registerEmail").value;
        const password = document.getElementById("registerPassword").value;

        const res = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();
        alert(data.message);
    });
}

// Login
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;

        const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (data.token) {
            localStorage.setItem("token", data.token);
            window.location.href = "dashboard.html";
        } else {
            alert(data.message);
        }
    });
}

// Save Mood
const moodForm = document.getElementById("moodForm");
if (moodForm) {
    moodForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const mood = document.getElementById("mood").value;
        const note = document.getElementById("note").value;
        const token = localStorage.getItem("token");

        await fetch(`${API_URL}/mood`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token
            },
            body: JSON.stringify({ mood, note })
        });

        alert("Mood Saved!");
        loadMoodChart();
    });

    loadMoodChart();
}

// Load Mood Chart
async function loadMoodChart() {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/mood`, {
        headers: { "Authorization": token }
    });
    const moods = await res.json();

    const labels = moods.map(m => new Date(m.date).toLocaleDateString());
    const data = moods.map(m => m.mood);

    const moodCount = {};
    data.forEach(m => moodCount[m] = (moodCount[m] || 0) + 1);

    new Chart(document.getElementById("moodChart"), {
        type: 'bar',
        data: {
            labels: Object.keys(moodCount),
            datasets: [{
                label: 'Mood Frequency',
                data: Object.values(moodCount)
            }]
        }
    });
}

// Update Profile
const profileForm = document.getElementById("profileForm");
if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("updateName").value;
        const email = document.getElementById("updateEmail").value;
        const token = localStorage.getItem("token");

        const res = await fetch(`${API_URL}/profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token
            },
            body: JSON.stringify({ name, email })
        });

        const data = await res.json();
        alert(data.message);
    });
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "index.html";
}
