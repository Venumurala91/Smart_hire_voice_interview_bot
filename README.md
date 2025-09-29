# Smart_hire_voice_interview_bot
AI-powered recruitment assistant that shortlists resumes and conducts automated first-round voice interviews, delivering instant insights to recruiters.


Got it ✅
I’ll polish your **README.md** so it’s **clear, beginner-friendly, and professional** — making sure that **any new developer or recruiter** can quickly understand **what this project is, why it’s useful, and how to run it**.

Here’s the cleaned-up version 👇

---

````markdown
# 🎙️ Smart Hire – AI Voice Interview Bot

> **Automated. Intelligent. Hassle-free Candidate Screening.**  
An **AI-powered recruitment assistant** that shortlists resumes, conducts voice interviews, and delivers instant insights to recruiters.

---

## 🚀 Why This Project?

Recruiters spend **hours** filtering resumes and scheduling interviews.  
The **AI Voice Interview Bot** reduces this process to **minutes** by:

- Screening resumes with ATS-style scoring  
- Conducting **automated first-round voice interviews**  
- Delivering **transcripts, analytics, and hiring recommendations** instantly  

This ensures **faster hiring decisions** and saves recruiters valuable time.

---

## ✨ Key Features

- ✅ **Resume Screening with AI** – Upload resumes and match them against job descriptions.  
- ✅ **Automated Voice Interviews** – AI calls candidates with job-specific questions.  
- ✅ **Detailed Analytics** – Get transcripts, skill breakdowns, and overall candidate scores.  
- ✅ **Recruiter Dashboard** – Track candidate progress and review insights.  
- ✅ **Searchable Talent Pool** – Maintain a database of all past candidates.  

---

## 🛠 Tech Stack

- **Backend:** Flask, SQLAlchemy, MySQL  
- **Frontend:** HTML, CSS, JavaScript (custom UI)  
- **AI & Voice Services:**  
  - [VAPI](https://vapi.ai) – AI call orchestration  
  - [Google Gemini](https://deepmind.google/technologies/gemini/) – Resume & call analysis  
  - [Twilio](https://www.twilio.com/) – Phone call infrastructure  
  - [ngrok](https://ngrok.com/) – Expose local server for webhooks  

---

## ⚙️ Setup & Installation

Follow these steps to set up the project locally:

### 1️⃣ Clone the Repository
```bash
git clone <your-repository-url>
cd Smart_hire_voice_interview_bot
````

### 2️⃣ Create Virtual Environment

```bash
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

Create a `.env` file in the root directory with the following:

```env
VAPI_API_KEY="<YOUR_VAPI_PRIVATE_KEY>"
VAPI_PHONE_NUMBER_ID="<YOUR_VAPI_PHONE_NUMBER_ID>"
GEMINI_API_KEY="<YOUR_GEMINI_API_KEY>"
DATABASE_URI="mysql+mysqlconnector://root:password@localhost/ai_db"
```

### 5️⃣ Set Up MySQL Database

```bash
cd backend
flask db init
flask db migrate -m "Initial database setup"
flask db upgrade
```

---

## ▶️ Running the Application

### Start Backend (Flask API)

```bash
cd backend
python app.py
```

Your backend will be live at: **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

### Expose API with ngrok

```bash
ngrok http 5000
```

Use the generated `https://...ngrok-free.app` URL as the webhook for **VAPI**.

Example:
`https://random-string.ngrok-free.app/api/webhook`

---

## 📊 Workflow – How It Works

1. **Upload Resumes** → AI scores them using Gemini.
2. **Voice Interview** → Candidate receives a phone call with job-related questions.
3. **Analysis Report** → Transcript + scores (communication, technical skills, relevance).
4. **Recruiter Dashboard** → Review insights & maintain candidate database.

---

## 📸 Screenshots

*(Add screenshots of the recruiter dashboard, resume analysis, and interview reports here.)*

---

## 🤝 Contributing

Contributions are welcome!

* Fork the repo
* Create a new branch
* Make your changes
* Submit a pull request

---

## 📧 Support

If you face issues while setting up or running the project, feel free to open an **issue** in the repository.

---

```

---

