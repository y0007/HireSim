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


---

## ⚙️ Prerequisites

- Node.js **v14+**
- npm or yarn
- Groq API Key
- MongoDB (local or cloud)

---

## 🔧 Installation & Setup

### 1️⃣ Clone the Repository
```bash
git clone <repo-url>
cd ai-mock-interview-platform

2️⃣ Backend Setup
cd backend
npm install


Create a .env file inside the backend folder:

PORT=5000
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=your_groq_model_name
GROQ_API_URL=your_groq_api_url
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret


Start the backend server:
npm start

3️⃣ Frontend Setup
cd ../frontend
npm install
npm start


The app will be available at:
http://localhost:3000

🧪 Usage Flow

Upload your PDF resume
Paste the job description
Start the AI-powered interview
Answer questions using voice or text
Receive follow-up questions
Review the full interview transcript

🔌 API Endpoints
Resume & Interview
Method	Endpoint	Description
POST	/api/upload	Upload resume & job description
POST	/api/interview/start	Start interview session
POST	/api/interview/next	Get next interview question
POST	/api/interview/end	End interview & save transcript

🔐 Authentication

JWT-based authentication
Secure session handling

📌 Future Enhancements

⭐ Interview scoring & feedback
📊 Performance analytics
🧩 Domain-specific interviews
🧑‍💼 Recruiter mode
☁️ Cloud-based voice processing
