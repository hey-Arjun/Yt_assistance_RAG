# Yt_assistance_RAG

# 🎥 YTAssistant – Intelligent YouTube Video Assistant
YTAssistant is a production-grade YouTube AI Assistant built as a Chrome extension with a FastAPI backend.
It enables users to ask context-aware questions about any YouTube video and receive accurate, structured answers using transcript-based Retrieval-Augmented Generation (RAG), with robust fallbacks when transcripts are unavailable.

✨ Key Features
🔹 Chrome Extension (Frontend)
Floating robot UI injected on YouTube pages
Click-to-open chat panel without affecting page layout
Clean, responsive chat interface
Line-wise rendering for lists, questions, and steps
Graceful error handling and loading states
Secure communication with backend via background service worker

🔹 Backend (FastAPI)
Modular, scalable architecture
Transcript-aware intelligent answering (RAG)
Metadata-based fallback answering
Automatic mode detection (Transcript vs Metadata)
Per-user daily quota enforcement
Vector store caching for performance
Deterministic output formatting for lists and questions

# 🏗 System Architecture
The system is divided into three clean layers:

Chrome Extension
content/ → UI rendering and user interaction
background/ → API communication and client identity handling

Backend (FastAPI)
API layer for request handling
Service layer for transcript, metadata, quota, and context building
RAG pipeline for intelligent retrieval and answering

External Services
YouTube Data API (metadata, comments)
YouTube Transcript API (captions)
LLM for reasoning and summarization
Vector database (FAISS) for retrieval

📌 See full architecture diagram here:
docs/architecture.png

🚀 Setup & Run

cd backend

python -m venv venv

source venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload

# Chrome Extension
Open Chrome → chrome://extensions

Enable Developer mode

Click Load unpacked

Select the extension/ folder


📄 License

This project is for educational and portfolio purposes.

YouTube content access respects platform limitations and availability.

👤 Author

Built by Arjun

Focused on AI systems, RAG architectures, and real-world product engineering.
