# 🚀 PrepPilot — Placement Preparation Platform

PrepPilot is a web-based placement preparation platform designed to help students organize and track their placement preparation in one place.

It provides tools for **DSA practice, resume management, ATS analysis, placement tracking, and AI-based doubt solving**.

## 🌐 Live Demo

👉 **[Open PrepPilot](https://preppilot-placement.onrender.com)**

## 📂 GitHub Repository

👉 **[View Source Code](https://github.com/kushali-kanvitha/PrepPilot)**

---

## ✨ Features

### 🔐 Authentication

* User registration and login
* Firebase Authentication
* Protected application routes
* User-specific data

### 📊 Dashboard

* Centralized placement preparation dashboard
* Quick access to different preparation modules
* Overview of preparation activities

### 💻 DSA Tracker

* Track DSA problems
* Add, edit, and delete problems
* Filter problems by topic
* Filter problems by difficulty
* Store user-specific DSA progress

### 📄 Resume Manager

* Manage resume versions
* Store resume information using Firebase
* Maintain multiple resume versions

### 🤖 ATS Resume Analyzer

* Upload a resume
* Extract text from PDF files
* Compare resume content with a job description
* Identify matched keywords
* Identify missing keywords
* Generate an ATS-style compatibility score

### 🧠 AI Doubt Solver

* Ask placement and technical questions
* Get AI-generated explanations
* Uses Google's Gemini API

### 📈 Company / Placement Tracker

* Track placement-related information
* Organize company preparation activities
* Monitor placement preparation

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Vite
* JavaScript
* HTML
* CSS

### Backend / Cloud Services

* Firebase Authentication
* Firebase Firestore
* Firebase Storage

### AI

* Google Gemini API
* `@google/genai`

### Other Technologies

* PDF.js
* React Router
* Git
* GitHub
* Render

---

## 🏗️ Project Structure

```text
PrepPilot/
│
├── public/
│
├── src/
│   ├── components/
│   │   ├── common/
│   │   └── ...
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── AIDoubtSolver.jsx
│   │   ├── ATSAnalyzer.jsx
│   │   ├── ResumeManager.jsx
│   │   └── ...
│   │
│   ├── firebase/
│   │   └── firebase.js
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

---

## 🔄 Application Flow

```text
                ┌─────────────────┐
                │    PrepPilot    │
                └────────┬────────┘
                         │
             ┌───────────┴───────────┐
             │                       │
       Authentication             Dashboard
             │                       │
             └───────────┬───────────┘
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
       ▼                 ▼                 ▼
  DSA Tracker      Resume Manager     Company Tracker
       │                 │
       │                 ▼
       │           ATS Analyzer
       │                 │
       │                 ▼
       │          PDF + Job Description
       │                 │
       │                 ▼
       │          ATS Score + Keywords
       │
       └─────────────────┐
                         ▼
                  AI Doubt Solver
                         │
                         ▼
                   Gemini API
```

---

## 🔥 Firebase Integration

PrepPilot uses Firebase for application data and authentication.

### Firebase services used

* **Firebase Authentication** — user registration and login
* **Cloud Firestore** — storing application data
* **Firebase Storage** — storing uploaded files

User-specific data is associated with the authenticated user's ID.

---

## 🤖 ATS Analyzer Flow

The ATS Analyzer follows this general process:

```text
Resume PDF
    │
    ▼
PDF.js
    │
    ▼
Extract Resume Text
    │
    ├───────────────┐
    │               │
    ▼               ▼
Resume Text    Job Description
    │               │
    └───────┬───────┘
            ▼
      Keyword Matching
            │
      ┌─────┴─────┐
      ▼           ▼
   Matched      Missing
  Keywords     Keywords
      │           │
      └─────┬─────┘
            ▼
        ATS Score
```

The analyzer currently checks for relevant technical and professional keywords and compares them with the job description.

---

## 🧠 AI Doubt Solver

The AI Doubt Solver uses Google's Gemini API to generate responses to technical and placement-related questions.

```text
User Question
      │
      ▼
AI Doubt Solver
      │
      ▼
Gemini API
      │
      ▼
AI Generated Explanation
      │
      ▼
Display Response
```

---

## 🚀 Running the Project Locally

### 1. Clone the repository

```bash
git clone https://github.com/kushali-kanvitha/PrepPilot.git
```

### 2. Navigate into the project

```bash
cd PrepPilot
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file in the project root:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key
```

Do not commit your `.env` file to GitHub.

### 5. Start the development server

```bash
npm run dev
```

The application will be available at the local Vite development URL shown in the terminal.

---

## 🏗️ Build for Production

```bash
npm run build
```

The production files are generated inside:

```text
dist/
```

---

## ☁️ Deployment

PrepPilot is deployed using **Render**.

Deployment flow:

```text
Local Development
       │
       ▼
     Git
       │
       ▼
    GitHub
       │
       ▼
    Render
       │
       ▼
  Live Application
```

Every time changes are pushed to the configured GitHub branch, Render can build and deploy the updated version.

---

## 🔑 Environment Variables

The application uses environment variables for sensitive configuration.

```env
VITE_GEMINI_API_KEY=your_gemini_api_key
```

The actual API key should **never be committed to the repository**.

---

## 📌 Future Improvements

Possible future improvements include:

* More detailed placement analytics
* Additional DSA tracking features
* Improved ATS keyword matching
* More resume analysis capabilities
* Additional AI-powered placement tools
* Improved mobile responsiveness

---

## 👩‍💻 Author

**Kushali Ganapathi**

B.Tech Computer Science Engineering

---

## ⭐ Project

If you find this project useful, consider giving the repository a ⭐ on GitHub.

**Live Demo:** [PrepPilot](https://preppilot-placement.onrender.com)

**GitHub:** [kushali-kanvitha/PrepPilot](https://github.com/kushali-kanvitha/PrepPilot)
