# Stonks AI | Mutual Fund Assistant Prototype

A professional, full-stack wealth management dashboard featuring real-time mutual fund tracking and an AI-powered investment assistant. This project was developed as a technical prototype for an **AI Product Manager** role, showcasing live data integration, modern UI/UX principles, and interactive AI.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688?logo=fastapi)

## 🚀 Features

- **Live Market Feed:** Real-time simulation of Mutual Fund NAV updates using a FastAPI backend.
- **AI Investment Assistant:** A context-aware chatbot that helps users analyze fund performance and portfolio value.
- **Premium Design System:** A custom-built, glassmorphic UI using Vanilla CSS, optimized for professional aesthetics.
- **Responsive & Dynamic:** Polling architecture ensures the data stays fresh without manual page refreshes.

## 🛠️ Tech Stack

### Frontend

- **Framework:** React 19 (Vite)
- **Styling:** Vanilla CSS (CSS Variables, Glassmorphism)
- **Icons:** Lucide-React + Custom Brand SVGs
- **Deployment:** Optimized for modern browsers

### Backend

- **Framework:** FastAPI (Python)
- **Data:** Simulated real-time financial metrics with random fluctuation algorithms.
- **Server:** Uvicorn

## 📦 Installation & Setup

### Prerequisites

- Node.js (v18+)
- Python (v3.10+)

### 1. Clone the Repository

```bash
git clone https://github.com/suyash-agrawal-mntta/Stonks.git
cd Stonks
```

### 2. Setup Backend

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create a `.env` file in the `backend` folder and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key
   ```
3. Set up a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/scripts/activate  # On Windows: .\venv\Scripts\activate
   pip install -r requirements.txt
   ```
4. Run the backend server:
   ```bash
   python main.py
   ```

### 3. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

## 👨‍💻 Author

**Suyash Agrawal**  
_AI Product Manager & Developer_

- **Portfolio:** [suyash-agrawal-mntta.github.io](https://suyash-agrawal-mntta.github.io/)
- **LinkedIn:** [linkedin.com/in/suyash-agrawal-mntta](https://www.linkedin.com/in/suyash-agrawal-mntta/)
- **Email:** suyash.mntta@gmail.com
