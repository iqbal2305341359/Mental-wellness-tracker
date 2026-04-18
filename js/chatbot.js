let conversationHistory = [];

async function getGeminiKey() {
    const res = await fetch('http://localhost:5000/api/chatbot/key', {
        headers: { 'authorization': localStorage.getItem('token') }
    });
    const data = await res.json();
    return data.key;
}

function addMessage(content, isUser = false) {
    const container = document.getElementById('chatContainer');
    const div = document.createElement('div');
    div.className = isUser ? 'message-user' : 'message-bot';
    div.innerHTML = isUser
        ? `<div class="user-bubble">${content}</div>`
        : `<div class="bot-avatar">🤖</div><div class="bot-bubble">${content}</div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function showTyping() {
    const container = document.getElementById('chatContainer');
    const div = document.createElement('div');
    div.className = 'message-bot';
    div.id = 'typingIndicator';
    div.innerHTML = `<div class="bot-avatar">🤖</div>
        <div class="typing">
            <span></span><span></span><span></span>
        </div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function removeTyping() {
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
}

async function sendToGemini(message) {
    try {
        const key = await getGeminiKey();

        if (!key) {
            return 'API key not found. Please check your configuration.';
        }

        conversationHistory.push({
            role: 'user',
            parts: [{ text: message }]
        });

        const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=' + key;

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{
                        text: 'You are a compassionate mental wellness assistant. Provide supportive, helpful advice about mental health, mood improvement, stress management, sleep, and general wellness. Keep responses concise and friendly. Always encourage professional help for serious issues.'
                    }]
                },
                contents: conversationHistory
            })
        });

        console.log('Response status:', res.status);
        const data = await res.json();
        console.log('Gemini response:', data);

        if (data.error) {
            console.error('Gemini API error:', data.error);
            return 'API Error: ' + data.error.message;
        }

        const reply = data.candidates[0].content.parts[0].text;
        conversationHistory.push({
            role: 'model',
            parts: [{ text: reply }]
        });
        return reply;

    } catch (err) {
        console.error('Gemini error:', err);
        return 'Sorry, I am having trouble connecting right now. Please try again later.';
    }
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;

    input.value = '';
    addMessage(message, true);
    showTyping();

    const reply = await sendToGemini(message);
    removeTyping();
    addMessage(reply);
}

async function sendQuick(message) {
    addMessage(message, true);
    showTyping();
    const reply = await sendToGemini(message);
    removeTyping();
    addMessage(reply);
}

function initChat() {
    addMessage("Hello! I'm your Wellness Assistant 🌟 I'm here to support your mental health journey. How are you feeling today?");
}