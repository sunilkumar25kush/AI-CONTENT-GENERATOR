// ============================================
// API Configuration
// Yahan hum API ki settings rakhte hain
// ============================================

// API Key retrieval function
function getActiveApiKey() {
    if (typeof window !== "undefined" && window.API_KEY) return window.API_KEY;
    if (typeof window !== "undefined" && window.API_KEYS) return window.API_KEYS;
    if (typeof API_KEY !== "undefined") return API_KEY;
    return "";
}

// MODEL Fallback List (rate limit / quota protection)
const FALLBACK_MODELS = [
    "gemini-3.5-flash",
    "gemini-3.6-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash"
];

function getApiUrl(key) {
    return `https://generativelanguage.googleapis.com/v1beta/models/${FALLBACK_MODELS[0]}:generateContent?key=${key}`;
}

// ============================================
// API Call Function with Auto Fallback
// ============================================
async function callGeminiAPI(prompt) {
    const currentKey = getActiveApiKey();
    
    if (!currentKey || currentKey === "YOUR_GEMINI_API_KEY_HERE" || currentKey.includes("your_key")) {
        throw new Error("API Key missing! Please check config.js or refresh your browser (Ctrl + F5).");
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
                // If 429 rate limit or 404 model unavailable, try next fallback model!
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
// Raw Markdown ko clean HTML formatted output mein badalta hai
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
// ASK AI - DOM Elements
// Ask AI feature ke HTML elements
// ============================================

const askInput = document.getElementById("ask-input");
const askButton = document.getElementById("ask-btn");
const askResultBox = document.getElementById("ask-result");
const askOutputText = document.getElementById("ask-output");


// ============================================
// ASK AI - Click Handler
// Jab user "Ask" button click kare toh kya ho
// ============================================

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
    
    const prompt = "Answer this question clearly with clean formatting:\n\n" + userQuestion;
    
    try {
        const result = await callGeminiAPI(prompt);
        // Formatted Markdown render karo
        askOutputText.innerHTML = formatMarkdown(result);
        
    } catch (error) {
        askOutputText.innerHTML = `<div class="error-state">❌ Error: ${error.message}</div>`;
    }
    
    askButton.disabled = false;
    askButton.textContent = "Ask";
});


// ============================================
// SUMMARIZER - DOM Elements
// Summarizer feature ke HTML elements
// ============================================

// Input field jahan user text likhta hai summarize karne ke liye
// const = DOM element reference kabhi change nahi hoga
const summarizeInput = document.getElementById("summarize-input");

// "Summarize" button
// const = DOM element reference kabhi change nahi hoga
const summarizeButton = document.getElementById("summarize-btn");

// Result box jahan summary aayegi
// const = DOM element reference kabhi change nahi hoga
const summarizeResultBox = document.getElementById("summarize-result");

// Summary text element
// const = DOM element reference kabhi change nahi hoga
const summarizeOutputText = document.getElementById("summarize-output");


// ============================================
// SUMMARIZER - Click Handler
// Jab user "Summarize" button click kare toh kya ho
// ============================================

// Summarize button par click event lagao
summarizeButton.addEventListener("click", async function() {
    
    // User ka text lo aur extra spaces hatao
    // const = yeh value ek baar set hoke change nahi hogi
    const userText = summarizeInput.value.trim();
    
    // Check karo ki user ne kuch likha hai ya nahi
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


// ============================================
// IDEA GENERATOR - DOM Elements
// ============================================

const ideasInput = document.getElementById("ideas-input");
const ideasButton = document.getElementById("ideas-btn");
const ideasResultBox = document.getElementById("ideas-result");
const ideasOutputText = document.getElementById("ideas-output");


// ============================================
// IDEA GENERATOR - Click Handler
// ============================================

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