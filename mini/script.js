// ========== API CONFIGURATION ==========
// Gemini API ka URL with API key
const API_KEY = (typeof window !== 'undefined' && window.API_KEY) ? window.API_KEY : 'YOUR_GEMINI_API_KEY_HERE';
const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

// ========== DOM ELEMENTS ==========
// HTML elements ko JavaScript me access karna
const jokeBtn = document.getElementById('jokeBtn');      // Joke button
const jokeDisplay = document.getElementById('jokeDisplay'); // Joke display area

// ========== PROMPT BANAO ==========
// AI ko kya puchna hai wo yahan define hai - random number se har baar alag joke milegi
const getPrompt = () => {
    const randomNum = Math.floor(Math.random() * 10000);
    return `Tell me a short, clean, family-friendly joke. Make it unique and different. Random seed: ${randomNum}. Just give me the joke directly without any introduction.`;
};

// ========== API SE JOKE FETCH KARO ==========
// Async function - API call karne ke liye
const fetchJoke = async () => {
    
    // Loading state dikhao jab tak response nahi aata
    jokeDisplay.innerHTML = '<p class="loading">🔄 Fetching a joke...</p>';
    jokeBtn.disabled = true; // Button disable karo taaki dobara click na ho
    
    try {
        // API ko POST request bhejo
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // Request body me prompt bhejo
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: getPrompt()
                    }]
                }]
            })
        });
        
        // Agar response OK nahi hai toh error throw karo
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        // Response ko JSON me convert karo
        const data = await response.json();
        
        // Joke text nikalo response se
        const joke = data.candidates[0].content.parts[0].text;
        
        // Joke display karo page pe
        jokeDisplay.innerHTML = `<p class="joke-text">${joke}</p>`;
        
    } catch (error) {
        // Agar koi error aaye toh yahan handle karo
        console.error('Error fetching joke:', error);
        jokeDisplay.innerHTML = `<p class="error">😅 Oops! Couldn't fetch a joke. Please try again.</p>`;
    } finally {
        // Finally block - chahe success ho ya error, button enable karo
        jokeBtn.disabled = false;
    }
};

// ========== EVENT LISTENER ==========
// Button pe click hone pe fetchJoke function call karo
jokeBtn.addEventListener('click', () => fetchJoke());