// ============================================
// API Configuration
// ============================================

function getActiveApiKey() {
    const localKey = localStorage.getItem("GEMINI_API_KEY");
    if (localKey && localKey.trim() !== "" && !localKey.includes("YOUR_GEMINI_API_KEY")) {
        return localKey.trim();
    }
    if (typeof window !== "undefined" && window.API_KEY && !window.API_KEY.includes("YOUR_GEMINI_API_KEY")) {
        return window.API_KEY.trim();
    }
    if (typeof window !== "undefined" && window.API_KEYS && !window.API_KEYS.includes("YOUR_GEMINI_API_KEY")) {
        return window.API_KEYS.trim();
    }
    return "";
}

// MODEL Fallback List (rate limit / quota protection)
const FALLBACK_MODELS = [
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-pro",
    "gemini-2.5-flash"
];

// ============================================
// API Call Function with Auto Fallback
// ============================================
async function callGeminiAPI(prompt) {
    const currentKey = getActiveApiKey();
    
    if (!currentKey) {
        openApiKeyModal("⚠️ Please enter your Gemini API key below to continue.");
        throw new Error("API Key missing! Please enter your key in the settings window.");
    }

    let lastError = null;

    for (const model of FALLBACK_MODELS) {
        try {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${currentKey}`;
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            const data = await response.json();

            if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
                return data.candidates[0].content.parts[0].text;
            }

            if (data.error) {
                lastError = data.error.message;
                if (response.status === 429 || response.status === 404) {
                    console.warn(`Model ${model} returned ${response.status}. Retrying next model...`);
                    continue;
                } else {
                    throw new Error(data.error.message);
                }
            }
        } catch (err) {
            lastError = err.message;
        }
    }

    throw new Error(lastError || "API quota temporarily full. Please wait 10 seconds and try again.");
}

// ============================================
// MARKDOWN FORMATTER
// ============================================
function formatMarkdown(text) {
    if (!text) return "";
    
    // 1. Code blocks ```code```
    let html = text.replace(/```(\w*)\n?([\s\S]*?)```/g, function(match, lang, code) {
        const cleanCode = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return `<pre><code>${cleanCode.trim()}</code></pre>`;
    });

    // 2. Inline code `code`
    html = html.replace(/`([^`]+)`/g, function(match, code) {
        const cleanCode = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return `<code>${cleanCode}</code>`;
    });

    // 3. Headings (# ## ###)
    html = html.replace(/^### (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2>$1</h2>');

    // 4. Bold (**text** or __text__)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

    // 5. Italic (*text* or _text_)
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // 6. Lists (* or - or 1.)
    html = html.replace(/^\s*[\*\-]\s+(.*$)/gim, '<li class="ul-item">$1</li>');
    html = html.replace(/(<li class="ul-item">[\s\S]*?<\/li>)/g, function(match) {
        return `<ul>${match}</ul>`;
    }).replace(/<\/ul>\s*<ul>/g, '');

    html = html.replace(/^\s*(\d+)\.\s+(.*$)/gim, '<li class="ol-item">$2</li>');
    html = html.replace(/(<li class="ol-item">[\s\S]*?<\/li>)/g, function(match) {
        return `<ol>${match}</ol>`;
    }).replace(/<\/ol>\s*<ol>/g, '');

    // 7. Paragraphs & Line Breaks
    const blocks = html.split(/\n{2,}/);
    html = blocks.map(block => {
        block = block.trim();
        if (!block) return '';
        if (block.startsWith('<h') || block.startsWith('<ul') || block.startsWith('<ol') || block.startsWith('<pre')) {
            return block;
        }
        return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    }).join('');

    return html;
}


// ============================================
// DYNAMIC WORKSPACE TAB & LAYOUT MANAGER
// Auto-adjusts 1, 2, or 3 columns on screen
// ============================================

const mainContainer = document.getElementById("main-container");
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
const btnModeSingle = document.getElementById("btn-mode-single");
const btnModeAll = document.getElementById("btn-mode-all");

// Current View Mode: 'single' or 'multi'
let currentViewMode = 'single';

function updateLayout() {
    const activeSections = document.querySelectorAll(".tab-content.active");
    const activeCount = activeSections.length;

    // Reset container column classes
    mainContainer.classList.remove("layout-1-col", "layout-2-col", "layout-3-col");

    if (activeCount === 0) {
        // Fallback: if user closes everything, re-open 'ask' section
        const askSection = document.getElementById("ask");
        if (askSection) askSection.classList.add("active");
        mainContainer.classList.add("layout-1-col");
    } else if (activeCount === 1) {
        mainContainer.classList.add("layout-1-col");
    } else if (activeCount === 2) {
        mainContainer.classList.add("layout-2-col");
    } else {
        mainContainer.classList.add("layout-3-col");
    }

    // Sync tab buttons active status
    tabButtons.forEach(btn => {
        const targetId = btn.getAttribute("data-tab");
        const targetSec = document.getElementById(targetId);
        if (targetSec && targetSec.classList.contains("active")) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    // Sync View Mode indicator buttons
    if (activeCount >= 3) {
        btnModeAll.classList.add("active");
        btnModeSingle.classList.remove("active");
        currentViewMode = 'multi';
    } else if (activeCount === 1) {
        btnModeSingle.classList.add("active");
        btnModeAll.classList.remove("active");
        currentViewMode = 'single';
    } else {
        btnModeSingle.classList.remove("active");
        btnModeAll.classList.remove("active");
        currentViewMode = 'multi';
    }
}

// ---- Tab Button Click Handlers ----
tabButtons.forEach(btn => {
    btn.addEventListener("click", function() {
        const targetId = this.getAttribute("data-tab");
        const targetSection = document.getElementById(targetId);

        if (currentViewMode === 'single') {
            // In Single mode, hide all other sections and show only clicked section
            tabContents.forEach(sec => sec.classList.remove("active"));
            targetSection.classList.add("active");
        } else {
            // In Multi mode, toggle clicked section on/off
            targetSection.classList.toggle("active");
        }

        updateLayout();
    });
});

// ---- View Mode Buttons ----

// Single View Mode: Shows 1 active tab centered
if (btnModeSingle) {
    btnModeSingle.addEventListener("click", function() {
        currentViewMode = 'single';
        
        // Find current active tab or default to 'ask'
        let currentlyActive = document.querySelector(".tab-content.active");
        let activeId = currentlyActive ? currentlyActive.id : 'ask';

        tabContents.forEach(sec => {
            if (sec.id === activeId) {
                sec.classList.add("active");
            } else {
                sec.classList.remove("active");
            }
        });

        updateLayout();
    });
}

// Split View Mode (All 3 Side-by-Side): Opens all 3 sections
if (btnModeAll) {
    btnModeAll.addEventListener("click", function() {
        currentViewMode = 'multi';

        tabContents.forEach(sec => sec.classList.add("active"));
        updateLayout();
    });
}

// ---- Panel Control Buttons (Focus & Close on each section card) ----
document.querySelectorAll(".panel-btn").forEach(btn => {
    btn.addEventListener("click", function(e) {
        e.stopPropagation();
        const targetId = this.getAttribute("data-target");
        const targetSection = document.getElementById(targetId);

        if (this.classList.contains("close-btn")) {
            // Close panel
            targetSection.classList.remove("active");
            updateLayout();
        } else if (this.classList.contains("focus-btn")) {
            // Focus on single panel
            currentViewMode = 'single';
            tabContents.forEach(sec => {
                if (sec.id === targetId) {
                    sec.classList.add("active");
                } else {
                    sec.classList.remove("active");
                }
            });
            updateLayout();
        }
    });
});

// Initialize layout on page load
updateLayout();


// ============================================
// ASK AI - Action Logic
// ============================================
const askInput = document.getElementById("ask-input");
const askButton = document.getElementById("ask-btn");
const askResultBox = document.getElementById("ask-result");
const askOutputText = document.getElementById("ask-output");

if (askInput && askButton) {
    askInput.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            askButton.click();
        }
    });
}

if (askButton) {
    askButton.addEventListener("click", async function() {
        const userQuestion = askInput.value.trim();
        
        if (!userQuestion) {
            alert("Please enter a question first!");
            return;
        }
        
        askResultBox.classList.remove("hidden");
        askOutputText.innerHTML = '<div class="loading-state">⚡ Thinking...</div>';
        
        askButton.disabled = true;
        askButton.textContent = "Thinking...";
        
        const prompt = "Answer this question clearly with clean markdown formatting:\n\n" + userQuestion;
        
        try {
            const result = await callGeminiAPI(prompt);
            askOutputText.innerHTML = formatMarkdown(result);
        } catch (error) {
            askOutputText.innerHTML = `<div class="error-state">❌ Error: ${error.message}</div>`;
        }
        
        askButton.disabled = false;
        askButton.textContent = "Ask";
    });
}


// ============================================
// SUMMARIZER - Action Logic
// ============================================
const summarizeInput = document.getElementById("summarize-input");
const summarizeButton = document.getElementById("summarize-btn");
const summarizeResultBox = document.getElementById("summarize-result");
const summarizeOutputText = document.getElementById("summarize-output");

if (summarizeInput && summarizeButton) {
    summarizeInput.addEventListener("keydown", function(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            summarizeButton.click();
        }
    });
}

if (summarizeButton) {
    summarizeButton.addEventListener("click", async function() {
        const userText = summarizeInput.value.trim();
        
        if (!userText) {
            alert("Please enter some text first!");
            return;
        }
        
        summarizeResultBox.classList.remove("hidden");
        summarizeOutputText.innerHTML = '<div class="loading-state">⚡ Summarizing...</div>';
        
        summarizeButton.disabled = true;
        summarizeButton.textContent = "Summarizing...";
        
        const prompt = "Summarize in 3-5 concise sentences:\n\n" + userText;
        
        try {
            const result = await callGeminiAPI(prompt);
            summarizeOutputText.innerHTML = formatMarkdown(result);
        } catch (error) {
            summarizeOutputText.innerHTML = `<div class="error-state">❌ Error: ${error.message}</div>`;
        }
        
        summarizeButton.disabled = false;
        summarizeButton.textContent = "Summarize";
    });
}


// ============================================
// IDEA GENERATOR - Action Logic
// ============================================
const ideasInput = document.getElementById("ideas-input");
const ideasButton = document.getElementById("ideas-btn");
const ideasResultBox = document.getElementById("ideas-result");
const ideasOutputText = document.getElementById("ideas-output");

if (ideasInput && ideasButton) {
    ideasInput.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            ideasButton.click();
        }
    });
}

if (ideasButton) {
    ideasButton.addEventListener("click", async function() {
        const userTopic = ideasInput.value.trim();
        
        if (!userTopic) {
            alert("Please enter a topic first!");
            return;
        }
        
        ideasResultBox.classList.remove("hidden");
        ideasOutputText.innerHTML = '<div class="loading-state">⚡ Generating Ideas...</div>';
        
        ideasButton.disabled = true;
        ideasButton.textContent = "Generating...";
        
        const prompt = "Generate 5 creative ideas with clean markdown bullet points about:\n\n" + userTopic;
        
        try {
            const result = await callGeminiAPI(prompt);
            ideasOutputText.innerHTML = formatMarkdown(result);
        } catch (error) {
            ideasOutputText.innerHTML = `<div class="error-state">❌ Error: ${error.message}</div>`;
        }
        
        ideasButton.disabled = false;
        ideasButton.textContent = "Get Ideas";
    });
}


// ============================================
// API KEY SETTINGS MODAL LOGIC
// ============================================
const apiKeyBtn = document.getElementById("api-key-btn");
const apiKeyModal = document.getElementById("api-key-modal");
const closeModalBtn = document.getElementById("close-modal-btn");
const modalApiKeyInput = document.getElementById("modal-api-key-input");
const saveApiKeyBtn = document.getElementById("save-api-key-btn");
const clearApiKeyBtn = document.getElementById("clear-api-key-btn");
const toggleKeyVisibilityBtn = document.getElementById("toggle-key-visibility");
const keyStatusMsg = document.getElementById("key-status-msg");

function openApiKeyModal(msg = "") {
    if (!apiKeyModal) return;
    apiKeyModal.classList.remove("hidden");
    const currentKey = getActiveApiKey();
    if (modalApiKeyInput) {
        modalApiKeyInput.value = currentKey;
    }
    if (keyStatusMsg) {
        keyStatusMsg.textContent = msg || (currentKey ? "✅ API key is currently saved." : "⚠️ No API key set yet.");
        keyStatusMsg.className = "key-status-msg " + (currentKey ? "success" : "warning");
    }
}

function closeApiKeyModal() {
    if (apiKeyModal) {
        apiKeyModal.classList.add("hidden");
    }
}

if (apiKeyBtn) {
    apiKeyBtn.addEventListener("click", () => openApiKeyModal());
}

if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeApiKeyModal);
}

if (apiKeyModal) {
    apiKeyModal.addEventListener("click", (e) => {
        if (e.target === apiKeyModal) closeApiKeyModal();
    });
}

if (toggleKeyVisibilityBtn && modalApiKeyInput) {
    toggleKeyVisibilityBtn.addEventListener("click", () => {
        if (modalApiKeyInput.type === "password") {
            modalApiKeyInput.type = "text";
            toggleKeyVisibilityBtn.textContent = "🙈";
        } else {
            modalApiKeyInput.type = "password";
            toggleKeyVisibilityBtn.textContent = "👁️";
        }
    });
}

if (saveApiKeyBtn && modalApiKeyInput) {
    saveApiKeyBtn.addEventListener("click", () => {
        const val = modalApiKeyInput.value.trim();
        if (!val) {
            if (keyStatusMsg) {
                keyStatusMsg.textContent = "❌ Please enter a valid API key!";
                keyStatusMsg.className = "key-status-msg error";
            }
            return;
        }
        localStorage.setItem("GEMINI_API_KEY", val);
        if (keyStatusMsg) {
            keyStatusMsg.textContent = "✅ API Key saved in browser!";
            keyStatusMsg.className = "key-status-msg success";
        }
        setTimeout(closeApiKeyModal, 1000);
    });
}

if (clearApiKeyBtn && modalApiKeyInput) {
    clearApiKeyBtn.addEventListener("click", () => {
        localStorage.removeItem("GEMINI_API_KEY");
        modalApiKeyInput.value = "";
        if (keyStatusMsg) {
            keyStatusMsg.textContent = "🗑️ API Key cleared from browser.";
            keyStatusMsg.className = "key-status-msg warning";
        }
    });
}