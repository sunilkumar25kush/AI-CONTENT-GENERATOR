// ============================================
// Exact Linux Terminal AI Engine (Gemini API)
// ============================================

function getActiveApiKey() {
    if (typeof window !== 'undefined' && window.API_KEY) return window.API_KEY;
    return "";
}

function getApiEndpoint() {
    const key = getActiveApiKey();
    return `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
}

const jokeBtn = document.getElementById('jokeBtn');
const clearBtn = document.getElementById('clearBtn');
const jokeDisplay = document.getElementById('jokeDisplay');
const cliForm = document.getElementById('cliForm');
const cliInput = document.getElementById('cliInput');

function appendLog(cmd, htmlContent) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.style.marginTop = '10px';
    entry.innerHTML = `
        <div>
            <span class="prompt-text">yusuf@clr4:~$</span> <span class="cmd-text">${escapeHtml(cmd)}</span>
        </div>
        <div style="margin-top: 4px;">${htmlContent}</div>
    `;
    jokeDisplay.appendChild(entry);
    jokeDisplay.scrollTop = jokeDisplay.scrollHeight;
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const getJokePrompt = () => {
    const randomNum = Math.floor(Math.random() * 10000);
    return `Tell me a short, funny, clean joke. Unique seed: ${randomNum}. Just give me the joke directly without any intro or outro.`;
};

async function fetchAIResponse(promptText, commandName = 'ai') {
    const loadingId = 'loading-' + Date.now();
    appendLog(commandName, `<div id="${loadingId}" class="loading-text">🔄 Fetching response from Gemini 2.5 Flash...</div>`);

    try {
        const response = await fetch(getApiEndpoint(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }]
            })
        });

        const loadingElem = document.getElementById(loadingId);

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const msg = errData.error?.message || response.statusText;
            if (loadingElem) loadingElem.outerHTML = `<div class="error-text">❌ API Error (${response.status}): ${escapeHtml(msg)}</div>`;
            return;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
            if (loadingElem) loadingElem.outerHTML = `<div class="response-text">${escapeHtml(text).replace(/\n/g, '<br>')}</div>`;
        } else {
            if (loadingElem) loadingElem.outerHTML = `<div class="error-text">⚠️ Empty response from API.</div>`;
        }

    } catch (err) {
        const loadingElem = document.getElementById(loadingId);
        if (loadingElem) loadingElem.outerHTML = `<div class="error-text">❌ Fetch Error: ${escapeHtml(err.message)}</div>`;
    }
}

if (jokeBtn) {
    jokeBtn.addEventListener('click', () => {
        fetchAIResponse(getJokePrompt(), 'joke');
    });
}

if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        jokeDisplay.innerHTML = `
            <div class="log-entry">
                <span class="prompt-text">yusuf@clr4:~$</span> <span class="cmd-text">clear</span>
            </div>
        `;
    });
}

if (cliForm) {
    cliForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = cliInput.value.trim();
        if (!val) return;

        cliInput.value = '';

        const lower = val.toLowerCase();
        if (lower === 'joke' || lower === 'tell joke') {
            fetchAIResponse(getJokePrompt(), 'joke');
        } else if (lower === 'clear' || lower === 'cls') {
            clearBtn.click();
        } else if (lower === 'neofetch') {
            appendLog('neofetch', '<div class="response-text">Neofetch details displayed above.</div>');
        } else {
            fetchAIResponse(val, val);
        }
    });
}