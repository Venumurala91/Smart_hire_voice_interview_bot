# Smart_hire_voice_interview_bot
AI-powered recruitment assistant that shortlists resumes and conducts automated first-round voice interviews, delivering instant insights to recruiters.




Here’s a polished and attractive **`README.md`** version for your AI Voice Interview Bot that will grab attention, be easy to read, and showcase your work professionally.  

---

```markdown
# 🎙️ AI Voice Interview Bot

> **Automated. Intelligent. Hassle-free Candidate Screening.**  
A **full-stack AI-powered voice assistant** that screens job candidates, analyzes resumes, conducts phone interviews, and delivers actionable hiring insights — all without human intervention.

---

## 🚀 Why This Project?

Recruiters spend **hours** screening resumes and scheduling interviews.  
The **AI Voice Interview Bot** cuts this process down to **minutes** by:

- Reading resumes like an **ATS (Applicant Tracking System)**
- Calling candidates for **automated voice interviews**
- Providing **data-backed hiring insights** instantly

---

## ✨ Features

✅ **AI-Powered Resume Screening**  
Upload multiple resumes against a job description to get ATS-style match scores.

✅ **Automated AI Phone Interviews**  
Initiates AI-driven calls with relevant job-specific questions.

✅ **Detailed Interview Analytics**  
Full transcript, overall score, and breakdowns for:
- Communication Skills
- Technical Knowledge
- Role Relevance

✅ **Interactive Recruiter Dashboard**  
Track candidates, see who’s next in the queue, and review recent activity.

✅ **Searchable Talent Pool**  
Maintain a reusable database of all interviewed candidates.

---

## 🛠 Tech Stack

**Backend:** Flask, SQLAlchemy, MySQL  
**Frontend:** HTML, CSS, JavaScript (No frameworks — fully custom UI)  
**AI & Voice:**  
- [VAPI](https://vapi.ai) — AI call orchestration  
- [Google Gemini](https://deepmind.google/technologies/gemini/) — Resume & call analysis  
- [Twilio](https://www.twilio.com/) — Phone number & call infrastructure  

---

## ⚙️ Setup & Installation

### 1️⃣ Clone the Repository
```bash
git clone <your-repository-url>
cd vapi-ai_voice_project
```

### 2️⃣ Set Up Python Environment
```bash
# Create virtual environment
python -m venv env

# Activate (Windows)
.\env\Scripts\activate

# Activate (macOS/Linux)
source env/bin/activate
```

### 3️⃣ Install Dependencies
```bash
pip install -r requirements.txt
```

### 4️⃣ Configure Environment Variables  
Create a `.env` file in the root directory with:
```env
VAPI_API_KEY="<YOUR_VAPI_PRIVATE_KEY>"
VAPI_PHONE_NUMBER_ID="<YOUR_VAPI_PHONE_NUMBER_ID>"
GEMINI_API_KEY="<YOUR_GEMINI_API_KEY>"
DATABASE_URI="mysql+mysqlconnector://root:password@localhost/ai_db"
```

### 5️⃣ Set Up MySQL Database
```bash
# Inside backend/
flask db init
flask db migrate -m "Initial database setup"
flask db upgrade
```

---

## ▶️ Running the App

### Backend (Flask API)
```bash
cd backend
python app.py
```
Backend will be live at: **http://127.0.0.1:5000**

### ngrok (Webhook for VAPI)
```bash
ngrok http 5000
```
Use the generated `https://...ngrok-free.app` URL for VAPI webhook.

**Example:**  
`https://random-string.ngrok-free.app/api/webhook`

---

## 🌐 External Services You’ll Need
- **VAPI:** Core AI voice agent (connects to Twilio & Gemini)  
- **Twilio:** To manage phone numbers & calling  
- **ngrok:** For public webhook access to your local backend  

---

## 📊 How It Works

1. **Upload Resumes** → Bot scores them using Gemini AI  
2. **Call Candidates** → Automated phone interviews via VAPI + Twilio  
3. **Analyze & Report** → Scores, transcripts, and recruiter-friendly insights  
4. **Search & Reuse** → Store all candidates for future openings  

---

## 📸 Screenshots
> *(Add screenshots of dashboard, resume analysis, and interview reports here)*  

---

## 🤝 Contributing
Pull requests are welcome! For major changes, open an issue first to discuss what you'd like to change.

