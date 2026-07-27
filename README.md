# 🤖 AI Content Generator

A modern, dynamic multi-tab web application powered by the Google Gemini API. It offers a sleek cyberpunk glassmorphism workspace with single and split-view modes, markdown formatting support, and Enter key submission.

---

## ✨ Features

- **💬 Ask Me Anything**: Get fast, AI-powered answers to any question with rich markdown formatting (headings, code blocks, lists, bold text).
- **📝 Quick Summarizer**: Paste long articles or documents to receive a 3-5 sentence summary instantly.
- **💡 Idea Spark**: Generate 5 creative ideas on any topic with formatted bullet points.
- **⚡ Enter Key Submit**: Press `Enter` to submit questions/topics instantly (`Shift + Enter` for new lines in text areas).
- **🔲 Single & Split Views**: Seamlessly switch between Single Tab View and 3-Column Split View.
- **🎨 Glassmorphism & Cyberpunk UI**: Built with custom HSL color palettes, ambient particle effects, and dynamic neon highlights.
- **🔄 Auto API Model Fallback**: Automatically retries across Gemini models (`gemini-1.5-flash`, `gemini-2.0-flash`, `gemini-1.5-pro`) to ensure high availability.

---

## 📁 Project Structure

```
├── index.html       # Main HTML structure & semantic layout
├── style.css        # Responsive glassmorphism CSS & design system
├── app.js           # Core JavaScript logic & Gemini API handler
├── config.js        # API Key configuration
├── .gitignore       # Git ignore rules for sensitive files
└── README.md        # Documentation
```

---

## 🚀 Getting Started

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/sunilkumar25kush/AI-CONTENT-GENERATOR.git
   cd AI-CONTENT-GENERATOR
   ```

2. **Configure API Key**:
   Open `config.js` and set your Gemini API key:
   ```javascript
   window.API_KEY = "YOUR_GEMINI_API_KEY_HERE";
   ```

3. **Run Locally**:
   Open `index.html` in any modern web browser or run using Live Server.

---

## 🛠️ Built With

- **HTML5** & **Vanilla CSS3** (Custom Properties, Flexbox, Grid, Animations)
- **JavaScript (ES6+)**
- **Google Gemini REST API**
