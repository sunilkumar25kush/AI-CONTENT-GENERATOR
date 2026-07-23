// ============================================
// API Configuration
// Yahan hum API ki settings rakhte hain
// ============================================

// MODEL ka naam store kar rahe hain - gemini-2.5-flash
const MODEL = "gemini-2.5-flash";

// Yeh function API ka URL banata hai
// key = API key jo hum pass karte hain
// return = complete API URL with key
function getApiUrl(key) {
    return `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
}


// ============================================
// DOM Elements - Tab Buttons
// Yahan hum HTML ke elements ko JavaScript mein laate hain
// ============================================

// Sabhi tab buttons ko select kar rahe hain (Ask AI, Summarizer, Ideas wale buttons)
// querySelectorAll(".tab-btn") = saare elements jinke class mein "tab-btn" hai
// const = yeh value kabhi change nahi hogi
const allTabButtons = document.querySelectorAll(".tab-btn");

// Sabhi tab contents ko select kar rahe hain (har tab ka content area)
// querySelectorAll(".tab-content") = saare elements jinke class mein "tab-content" hai
// const = yeh value kabhi change nahi hogi
const allTabContents = document.querySelectorAll(".tab-content");


// ============================================
// Tab Switching - Remove active from all
// Yeh function sabhi tabs se "active" class hatata hai
// ============================================
function removeActiveFromAllTabs() {
    
    // forEach loop - sabhi tab buttons par ek-ek karke chalega
    // button = current element jo loop mein hai
    // forEach = array ke har item par function chalata hai
    // allTabButtons.forEach(function(button) {
        
    //     // Har button se "active" class hatao
    //     // classList.remove("active") = "active" class ko hata do
    //     button.classList.remove("active");
    // });
    
    // forEach loop - sabhi tab contents par ek-ek karke chalega
    // content = current element jo loop mein hai
    allTabContents.forEach(function(content) {
        
        // Har content se "active" class hatao
        content.classList.remove("active");
    });
}


// ============================================
// Tab Switching - Add click event to each button
// Har tab button par click event lagao
// ============================================

// forEach loop - sabhi tab buttons par ek-ek karke chalega
// button = current element jo loop mein hai
// forEach = array ke har item par function chalata hai
allTabButtons.forEach(function(button) {
    
    // Har button par "click" event listener lagao
    // addEventListener("click", function) = jab click ho toh function chalao
    button.addEventListener("click", function() {
        
        // Pehle sabhi tabs se active hatao
        // Taaki sirf ek tab active rahe
        removeActiveFromAllTabs();
        
        // Jo button click hua usmein "active" class add karo
        // this = jo button click hua (current button)
        // classList.add("active") = "active" class add karo
        this.classList.add("active");
        
        // Button ke data-tab attribute se tab ka naam lo
        // dataset.tab = HTML mein data-tab="ask" jaisa likha hoga
        // const = yeh value ek baar set hoke change nahi hogi
        const tabName = this.dataset.tab;
        
        // Us naam se content element dhundo
        // getElementById(tabName) = id se element dhundo
        // const = yeh value ek baar set hoke change nahi hogi
        const tabContent = document.getElementById(tabName);
        
        // Us content mein "active" class add karo
        // Isse woh content dikhega
        tabContent.classList.add("active");
    });
});


// ============================================
// API Call Function
// Yeh function Gemini AI ko request bhejta hai
// ============================================

// async function = yeh function wait kar sakta hai API response ke liye
// prompt = jo text hum AI ko bhejte hain
async function callGeminiAPI(prompt) {
    
    // API key fetch karo (window.API_KEY ya config.js se)
    const currentKey = window.API_KEY || window.API_KEYS || (typeof API_KEY !== "undefined" ? API_KEY : "");
    
    if (!currentKey || currentKey === "YOUR_GEMINI_API_KEY_HERE" || currentKey === "your_gemini_api_key_here") {
        throw new Error("API Key missing! Please add your Gemini API Key in .env file (GEMINI_API_KEY=\"your_key\") or config.js");
    }

    // API URL banao
    const apiUrl = getApiUrl(currentKey);
    
    // Request body banao - yeh data API ko jaayega
    // contents = API ko yeh format chahiye
    // parts = text ke parts
    // text: prompt = humara question/text
    // const = yeh object ek baar set hoke change nahi hoga
    const requestBody = {
        contents: [
            {
                parts: [
                    { text: prompt }
                ]
            }
        ]
    };
    
    // Request options banao - request kaise bhejna hai
    // method: "POST" = data bhej rahe hain
    // headers = request ki information
    // Content-Type = hum JSON bhej rahe hain
    // body = actual data (string mein convert kiya)
    // const = yeh object ek baar set hoke change nahi hoga
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
    };
    
    // API ko request bhejo aur response ka wait karo
    // await = jab tak response na aaye tab tak ruko
    // fetch = internet se data lene ka tarika
    // const = response ek baar aake change nahi hoga
    const response = await fetch(apiUrl, requestOptions);
    const data = await response.json();

    // Check karo ki response ok hai ya nahi
    if (!response.ok || data.error) {
        const errorMsg = data.error?.message || `API error: ${response.status}`;
        if (response.status === 404 || response.status === 400 || response.status === 403) {
            throw new Error(`${errorMsg} (Please check your API key in config.js)`);
        }
        throw new Error(errorMsg);
    }
    // Response se text nikalo
    // data.candidates[0].content.parts[0].text = nested object se text nikala
    // ?. = optional chaining (agar koi cheez na ho toh error nahi aayega)
    // const = yeh value ek baar set hoke change nahi hogi
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    // Agar text mila toh return karo
    if (resultText) {
        return resultText;
    } else {
        return "No response";
    }
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