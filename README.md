# 🎓 StudyAI — Learn Smarter, Not Harder

An AI-powered study assistant that helps students understand concepts, summarize long notes, practice with MCQs, and plan their study time, in **English or Roman Urdu**.

**🔗 Live demo:** _add your Vercel link here_ · **Built with:** React, Vite, Firebase Auth, Gemini / Groq / OpenAI

---

## 🌍 The Problem

Students, especially in regions where most study material is in English but daily conversation is in Urdu, run into the same issues:

- **Long notes and PDFs are hard to revise** before exams.
- **Concepts are hard to grasp** when explained in dense textbook language.
- **Self-testing takes effort**: writing practice questions by hand is slow.
- **Planning is overwhelming**: it's unclear what to study and when.
- **Language barrier**: most AI tools answer only in formal English.

## 💡 The Solution

StudyAI puts everything in one place:

| Feature | What it does |
|---|---|
| 💬 **AI Chat** | Ask any study question and get a short, simple explanation. Switch between **English** and **Roman Urdu**. |
| 📝 **Summarize Notes** | Paste notes or upload a PDF and get a concise summary. |
| ❓ **Generate MCQs** | Turn a topic, notes or a PDF into multiple-choice practice questions. |
| 📅 **Study Planner** | Generate a study schedule from your topics and goals. |
| 🔐 **Authentication** | Secure email/password sign-up and login with Firebase. |

## 🛠️ Real-World Engineering Problems Solved

This project goes beyond calling one AI API. These are practical issues that real apps face:

1. **API limits and downtime → automatic multi-provider fallback.**
   Free AI tiers have rate limits and models get retired. StudyAI tries **Gemini → Groq → OpenAI** in order. If one fails, hits its limit or times out, the next one answers, so the user never sees a broken chat.
2. **Retired or renamed models → self-healing model discovery.**
   If a provider returns "model not found", the server fetches that provider's available models, picks a working one and remembers it.
3. **Slow or hanging requests → per-provider timeouts and cooldowns.**
   Each provider gets 15 seconds. Slow or rate-limited providers are skipped for 60 seconds so the next messages stay fast.
4. **API key security → server-side proxy.**
   Keys are never shipped to the browser. The frontend calls `/api/chat`, and a serverless function holds the keys. This avoids the common mistake of exposing keys in a client-side bundle.
5. **User control → Stop button.**
   Users can cancel an in-progress AI response at any time.

## 🏗️ Architecture

```
Browser (React + Vite)
   │  POST /api/chat  { prompt, language }
   ▼
Serverless function (Vercel)  ──►  server/aiCore.js
                                     ├─ 1. Gemini
                                     ├─ 2. Groq        (fallback)
                                     └─ 3. OpenAI      (fallback)
```

- **Frontend:** React 19, Vite, `pdfjs-dist` for PDF text extraction
- **Auth:** Firebase Authentication
- **Backend:** Vercel serverless function (`api/chat.js`) plus shared logic in `server/aiCore.js`
- **AI providers:** Google Gemini, Groq (Llama), OpenAI

## 🚀 Getting Started

### 1. Clone and install

```bash
git clone https://github.com/alishbakhan1223/studyai_system.git
cd studyai_system
npm install
```

### 2. Add your API keys

Copy `.env.example` to `.env` and fill in the keys. You only need **one** to start, and the free tiers of Gemini and Groq work well.

```env
GEMINI_API_KEY=
GROQ_API_KEY=
OPENAI_API_KEY=
```

- Gemini key: https://aistudio.google.com/apikey
- Groq key: https://console.groq.com/keys

> These variables have **no** `VITE_` prefix on purpose, so they stay on the server and are never sent to the browser.

### 3. Run locally

```bash
npm run dev
```

Open http://localhost:5173. The dev server also serves `/api/chat`, so everything works locally like production.

### 4. Deploy (Vercel)

1. Push the repo to GitHub.
2. Import it on [Vercel](https://vercel.com) (the Vite preset is detected automatically).
3. Add `GEMINI_API_KEY` and `GROQ_API_KEY` under **Environment Variables**.
4. Deploy, then add your Vercel domain under **Firebase → Authentication → Settings → Authorized domains**.

## 📁 Project Structure

```
├── api/chat.js            # Vercel serverless endpoint
├── server/aiCore.js       # Provider fallback, timeouts, model discovery
├── src/
│   ├── App.jsx            # Layout and navigation
│   ├── Auth.jsx           # Login / Sign up
│   ├── firebase.js        # Firebase config
│   ├── gemini.js          # Frontend helper → /api/chat
│   └── components/        # AIChat, SummarizeNotes, GenerateMCQs, StudyPlanner
├── vite.config.js         # Includes the local /api/chat dev middleware
└── .env.example
```

## 🔮 Future Improvements

- Save chat history and generated notes per user
- Quiz scoring and progress tracking
- Streaming AI responses
- More languages
- Rate limiting per user on the backend

## 👩‍💻 Author

**Alishba Khan**, built as a practical full-stack and AI project.

---

⭐ If you found this useful, consider giving the repo a star!