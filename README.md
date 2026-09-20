# 🎬 FilmyAI — AI-Powered Film Intelligence & Analysis Platform

> **Don't just rate a film. Understand it.**

FilmyAI is an AI-powered Film Intelligence and Analysis Platform that combines **Machine Learning, Computer Vision, Large Language Models (LLMs), and Retrieval-Augmented Generation (RAG)** to analyze films across creative, technical, emotional, and commercial dimensions.

It transforms a film, its metadata, script, and supporting information into a structured **Film Intelligence Report** and enables users to ask film-specific questions using RAG.

---

## 🚀 What Does FilmyAI Do?

FilmyAI analyzes films across multiple dimensions, including:

- 🎭 **Acting & Cast Performance**
- 📖 **Story & Narrative**
- 📝 **Screenplay & Script**
- 🎥 **Cinematography**
- ✨ **VFX & Visual Analysis**
- 🔊 **Audio & Speech**
- ❤️ **Emotion & Sentiment**
- ⏱️ **Pacing & Rhythm**
- 🔄 **Continuity**
- 📊 **Commercial & Audience Analysis**
- 👥 **Audience Suitability**
- 🎬 **Scene-Level Intelligence**
- 🧠 **AI-Powered Film Q&A**

The system combines these signals into a professional, structured report.

---

# 🎯 Problem We Solve

Film-related decisions often depend on:

- Manual analysis
- Delayed audience feedback
- Traditional ratings
- Subjective reviews
- Separate analysis tools
- Large amounts of unstructured film data

FilmyAI provides a centralized AI-driven analysis layer that can help stakeholders understand a film faster and from multiple perspectives.

### 🎬 Filmmakers & Production Houses

FilmyAI can help filmmakers:

- Understand potential audience segments
- Identify storytelling and screenplay weaknesses
- Analyze cinematography and pacing
- Identify technical and visual issues
- Analyze cast performance
- Evaluate emotional impact
- Improve post-production decisions
- Make data-informed marketing decisions

### 📺 OTT Platforms

Platforms such as **Netflix and Amazon Prime Video** could use film intelligence to:

- Analyze newly acquired content
- Understand content characteristics faster
- Identify potentially relevant audiences
- Improve content discovery
- Generate additional metadata for personalization

### 🎟️ Ticket Booking Platforms

Platforms such as **BookMyShow and District** could use FilmyAI insights to:

- Provide richer film information
- Personalize movie discovery
- Highlight characteristics beyond a single rating
- Help users understand whether a film matches their preferences

---

# 🧠 System Architecture

```text
                    ┌───────────────────────┐
                    │    Next.js Frontend   │
                    │    AWS Amplify        │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   Node.js + Express   │
                    │      Render Backend   │
                    └───────────┬───────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
              MongoDB Atlas             AWS S3
              Metadata & Reports       Film & Media
                    │
                    ▼
              Remote ML Pipeline
                    │
          ┌─────────┴──────────┐
          ▼                    ▼
       ML Module           ML_VIDEO
   Commercial ML        Video Intelligence
          │                    │
          └─────────┬──────────┘
                    ▼
             Evidence Layer
                    │
                    ▼
            LLM_FINAL_REPORT
                    │
                    ▼
                  Groq
                    │
                    ▼
             Final Film Report
                    │
                    ▼
                  RAG
                    │
                    ▼
          Film-Specific Q&A




```
🔬 Core AI Modules
1. ML — Commercial Intelligence

The ML/ module handles structured film and commercial analysis.

Responsibilities
Feature engineering
Commercial classification
Commercial regression
Actor-related signals
Director-related signals
Genre analysis
Budget-related features
Release-related features
Production metadata
Production model inference
Models

The project uses trained production models including:

Logistic Regression classifier
XGBoost regressor

Production artifacts are stored separately from source code.

🎥 2. ML_VIDEO — Video Intelligence

The ML_VIDEO/ module analyzes the actual film video.

Capabilities
Scene detection
Keyframe extraction
Shot analysis
Shot scale classification
Cinematography analysis
Lighting analysis
Composition analysis
Audio/speech activity analysis
VFX-related visual analysis
Actor identification
Cast-specific analysis
Pacing analysis
Visual rhythm analysis
Models

Current trained artifacts include:

best_cinematic_shot_model.pt
candidate_cinematic_shot_model_v2.pt
cinematicshotcnn_best.pt
speech_classifier_best.pt

Model files are intentionally excluded from the Git repository and managed separately.

👥 Cast Performance Intelligence

FilmyAI supports structured cast information.

Users can provide:

Actor Name
Character Name
Actor Reference Image

Reference images can be used by the video analysis pipeline for actor identification and tracking.

The system can generate evidence for:

Acting performance
Emotional expression
Dialogue delivery
Character consistency
Scene impact
Character development
Chemistry where applicable

The system is designed to avoid inventing actor identities, timestamps, or performance evidence when sufficient evidence is unavailable.

📊 Scene Intelligence

FilmyAI goes beyond an overall film score.

The system can analyze film sequences and produce:

Film High Points

Sequences with stronger combined evidence across creative and technical dimensions.

Medium Points

Sequences with moderate performance.

Low Points

Sequences where multiple indicators suggest weaknesses.

The number of highlighted scenes is intended to depend on the actual evidence distribution rather than a fixed number.

⏱️ Pacing & Emotional Journey

FilmyAI can organize the film into:

Scene Performance Timeline

Tracks analytical characteristics across the film.

Character & Emotional Journey

Represents how characters and emotional intensity evolve.

Pacing & Rhythm Map

Shows changes in cinematic rhythm and scene intensity.

🤖 LLM_FINAL_REPORT

The LLM_FINAL_REPORT/ module combines structured ML and video evidence into a professional film intelligence report.

It handles:

Evidence normalization
Script/summary integration
Report generation
Structured report schemas
LLM integration
PDF generation
Report validation
LLM Provider

Groq is used as the LLM provider.

The LLM does not replace the underlying ML/video analysis. It interprets the structured evidence generated by those systems.

🧠 RAG — Film-Specific Question Answering

The RAG/ module converts the final film report into a searchable knowledge base.

Final Report
     ↓
Chunking
     ↓
Embeddings
     ↓
FAISS
     ↓
Film-Specific Retrieval
     ↓
Groq
     ↓
Grounded Answer

Every indexed piece of information is associated with its corresponding film_id.

This allows users to ask questions such as:

What were the strongest cinematography sequences?

How was the pacing throughout the film?

What were the major technical weaknesses?

Which cast members had the strongest scene impact?

The system is designed to keep retrieval scoped to the selected film.

🛠️ Technology Stack
Frontend
Next.js
React
Tailwind CSS
Backend
Node.js
Express.js
REST APIs
Multer
Database
MongoDB
MongoDB Atlas
Machine Learning
Python
Scikit-learn
XGBoost
PyTorch
Computer Vision
OpenCV
Torchvision
TIMM
PyTorch
LLM
Groq
RAG
FAISS
Embeddings
Retrieval pipeline
Cloud & Deployment
AWS Amplify
Amazon S3
AWS SDK for JavaScript v3
AWS IAM
Render
Kaggle GPU runtime
☁️ AWS Integration

AWS is used as an important infrastructure layer in FilmyAI.

AWS Amplify

Hosts the Next.js frontend and provides Git-based deployment.

Amazon S3

Used to store:

Film videos
Banner images
Cast images
Other media assets
Large File Handling

Large videos are handled using S3 upload capabilities, including multipart upload for large objects.

Presigned URLs

Presigned URLs can provide temporary controlled access to private S3 objects without exposing the entire bucket publicly.

AWS IAM

IAM policies are used to restrict backend access to required S3 operations.

🔄 Film Processing Workflow
User Uploads Film
        ↓
Backend receives metadata + media
        ↓
Film stored in S3
        ↓
MongoDB stores film record
        ↓
Analysis Pipeline Triggered
        ↓
ML_VIDEO analyzes video
        ↓
ML performs commercial analysis
        ↓
Evidence is combined
        ↓
LLM_FINAL_REPORT generates report
        ↓
Groq interprets evidence
        ↓
Final report stored in MongoDB
        ↓
Report indexed into RAG
        ↓
User can ask questions
📁 Project Structure
FilmyAI/
│
├── Frontend/
│   └── Next.js application
│
├── Backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   │
│   └── package.json
│
├── ML/
│   ├── data/
│   ├── models/
│   ├── src/
│   ├── reports/
│   └── tests/
│
├── ML_VIDEO/
│   ├── data/
│   ├── models/
│   ├── src/
│   ├── scripts/
│   ├── reports/
│   └── tests/
│
├── LLM_FINAL_REPORT/
│   ├── connectors/
│   ├── core/
│   ├── pdf_generator/
│   ├── schemas/
│   └── runner.py
│
├── RAG/
│   ├── embeddings/
│   ├── retrieval/
│   └── services/
│
├── ApiDesign/
│
└── README.md
🔐 Security

Sensitive credentials should never be committed to GitHub.

Examples:

.env
.env.local
GROQ_API_KEY
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
MONGODB_URI

Model checkpoints and large datasets are also kept outside the Git repository.

⚙️ Local Development
Clone Repository
git clone https://github.com/akashchaudhary5812-oss/FilmyAI.git
cd FilmyAI
Frontend
cd Frontend
npm install
npm run dev
Backend
cd Backend
npm install
npm start

Create the required environment variables before starting the backend.

🔑 Example Environment Variables
Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000
Backend
PORT=3000

MONGO_URI=your_mongodb_connection_string

AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name

ML_VIDEO_API_URL=your_remote_ml_endpoint

GROQ_API_KEY=your_groq_key

Never commit actual secret values.

🚀 Deployment Architecture
Frontend
GitHub
   ↓
AWS Amplify
   ↓
Next.js Application
Backend
GitHub
   ↓
Render
   ↓
Node.js + Express
ML

The current ML execution environment uses a GPU-enabled Kaggle runtime for the remote ML pipeline.

Render Backend
      ↓
Remote ML Endpoint
      ↓
ML + ML_VIDEO
      ↓
LLM_FINAL_REPORT
📈 Future Improvements

Potential future improvements include:

Dedicated GPU inference infrastructure
Automated ML model versioning
More advanced actor recognition
Improved VFX detection
Better scene segmentation
Movie-level benchmark datasets
Real-time analysis progress streaming
Advanced audience recommendation models
Personalized user recommendation profiles
Cloud-native asynchronous ML job queues
Production-scale model serving
🎓 Project Context

FilmyAI was developed as a B.Tech Computer Science Engineering major project with the objective of exploring how modern AI technologies can be combined into an end-to-end intelligent media analysis system.

The project integrates:

Full-stack development
Machine Learning
Computer Vision
Natural Language Processing
LLMs
RAG
Cloud Infrastructure
AI-powered reporting
👨‍💻 Team
Team Leader

Akash Chaudhary

Contributions:

Backend Development
Machine Learning
ML_VIDEO
LLM_FINAL_REPORT
RAG
System Architecture
AI Pipeline Integration
Cloud Integration
Team Member

Frontend Developer

Contribution:

Next.js frontend
UI/UX implementation
Film upload interface
Film listing and details pages
Analysis status interface
Report visualization
Backend API integration
📜 License

This project is developed for academic and research purposes.

Add your preferred license here before distributing the project publicly.

⭐ Vision

FilmyAI aims to build a future where films are not evaluated only through ratings and reviews, but through multi-dimensional AI-powered film intelligence.

From Script to Screen. From Screen to Intelligence.
