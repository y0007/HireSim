# AI-Powered Mock Interview Platform 🎤🤖

An AI-powered mock interview platform that simulates real interview scenarios using resume analysis and job descriptions. The system dynamically generates interview questions, supports voice and text-based answers, and provides a complete interview transcript for review.

Built with **React** on the frontend, **Node.js + Express** on the backend, and powered by the **Groq API** for real-time AI question generation.

---

## 🚀 Features

- 📄 PDF resume upload & parsing
- 🧠 AI-generated interview questions based on resume + job description
- 🔁 Context-aware follow-up questions
- 🎙️ Voice-based interaction (Speech-to-Text & Text-to-Speech)
- 📝 Interview transcript generation
- ⚡ Real-time interview flow
- 🔐 Secure backend with JWT authentication

---

## 🛠 Tech Stack

### Frontend
- React
- Axios
- Web Speech API (for voice interaction)

### Backend
- Node.js
- Express.js
- MongoDB
- Multer (file uploads)
- pdf-parse (resume parsing)
- JWT (authentication)

### AI
- Groq API (LLM-based question generation)

---

## 📂 Project Structure
ai-mock-interview-platform/
│
├── backend/
│ ├── controllers/
│ ├── routes/
│ ├── models/
│ ├── middleware/
│ ├── utils/
│ ├── uploads/
│ ├── server.js
│ └── .env
│
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ ├── pages/
│ │ ├── services/
│ │ └── App.js
│ └── package.json
│
└── README.md
