# ReviewGuard AI — Fake Product Review Detection System

> An end-to-end AI-powered system to detect fake product reviews using NLP, Machine Learning, and a professional full-stack web application.

---

## 🏗️ Architecture Overview

```
┌─────────────────────┐     HTTP      ┌──────────────────────┐     HTTP      ┌─────────────────────┐
│   Angular Frontend  │ ──────────► │  Node.js + Express   │ ──────────► │  Flask ML Service   │
│   (Port 4200)       │ ◄──────────  │  Backend (Port 3000) │ ◄──────────  │  (Port 5001)        │
└─────────────────────┘             └──────────────────────┘             └─────────────────────┘
                                               │                                     │
                                               ▼                                     ▼
                                    ┌─────────────────────┐             ┌─────────────────────┐
                                    │   MongoDB Database   │             │  Naive Bayes Model  │
                                    │   (Port 27017)       │             │  + TF-IDF + NLTK    │
                                    └─────────────────────┘             └─────────────────────┘
```

---

## 📁 Project Structure

```
fake-review-detector/
├── ml-service/                  # Python Flask AI/ML API
│   ├── app.py                   # Flask routes
│   ├── analyzer.py              # NLP + Naive Bayes core
│   ├── train_model.py           # Standalone training script
│   ├── requirements.txt
│   └── Dockerfile
│
├── backend/                     # Node.js + Express API
│   ├── server.js                # Express app entrypoint
│   ├── models/
│   │   └── Review.js            # Mongoose schema
│   ├── routes/
│   │   ├── reviews.js           # Analyze + stats endpoints
│   │   ├── admin.js             # Admin CRUD endpoints
│   │   └── upload.js            # CSV file upload
│   ├── services/
│   │   └── mlService.js         # Flask API client
│   ├── .env.example
│   ├── package.json
│   └── Dockerfile
│
├── frontend/                    # Angular 17 SPA
│   ├── src/
│   │   ├── app/
│   │   │   ├── pages/
│   │   │   │   ├── upload/      # Review input page
│   │   │   │   ├── results/     # Analysis dashboard
│   │   │   │   └── admin/       # Admin panel
│   │   │   ├── components/
│   │   │   │   └── navbar/      # Navigation bar
│   │   │   ├── services/
│   │   │   │   ├── review.service.ts      # API calls
│   │   │   │   └── results-state.service.ts
│   │   │   └── app.module.ts
│   │   ├── styles.scss          # Global design tokens
│   │   └── index.html
│   ├── angular.json
│   ├── nginx.conf               # Production web server config
│   ├── package.json
│   └── Dockerfile
│
├── sample-reviews.csv           # Test CSV (15 mixed reviews)
├── docker-compose.yml           # One-command full stack launch
└── README.md
```

---

## 🧠 How the ML Pipeline Works

```
Raw Review Text
      │
      ▼
┌─────────────────────────────────────┐
│  1. PREPROCESSING (NLTK)            │
│  • Lowercase, remove URLs/punctuation│
│  • Stopword removal                 │
│  • Porter Stemming                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  2. FEATURE EXTRACTION              │
│  • TF-IDF with bigrams (5000 feats) │
│  • Fake pattern hits (regex rules)  │
│  • Genuine pattern hits             │
│  • Caps ratio, exclamation count    │
│  • Word count, vocabulary diversity │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  3. CLASSIFICATION                  │
│  • Multinomial Naive Bayes          │
│  • Heuristic confidence boost       │
│  • Output: FAKE / GENUINE + score   │
└─────────────────────────────────────┘
```

### Why Naive Bayes?
- Excellent for text classification tasks
- Works well with TF-IDF features
- Fast inference — ideal for batch analysis
- Interpretable and explainable results
- Comparable accuracy to more complex models for this domain

---

## 🚀 Setup & Run

### Option 1: Docker (Recommended — One Command)

```bash
# Clone / navigate to project root
docker-compose up --build

# Access:
# Frontend  → http://localhost:4200
# Backend   → http://localhost:3000
# ML API    → http://localhost:5001
```

---

### Option 2: Manual Setup

#### Step 1 — ML Service (Python)
```bash
cd ml-service
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python train_model.py           # Pre-train the model
python app.py                   # Starts on http://localhost:5001
```

#### Step 2 — Backend (Node.js)
```bash
cd backend
cp .env.example .env            # Edit MongoDB URI if needed
npm install
npm run dev                     # Starts on http://localhost:3000
```
Make sure MongoDB is running locally on port 27017.

#### Step 3 — Frontend (Angular)
```bash
cd frontend
npm install
npm start                       # Starts on http://localhost:4200
```

---

## 🔌 API Reference

### ML Service (Flask — Port 5001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |
| POST | `/analyze/single` | Analyze one review |
| POST | `/analyze` | Analyze batch of reviews |

**Single Review Request:**
```json
POST /analyze/single
{ "review": "This is the best product ever!!!" }
```

**Response:**
```json
{
  "classification": "FAKE",
  "confidence": 0.912,
  "fake_probability": 0.912,
  "genuine_probability": 0.088,
  "features": {
    "fake_pattern_hits": 3,
    "genuine_pattern_hits": 0,
    "caps_ratio": 0.0,
    "exclamation_count": 3,
    "avg_word_length": 4.14,
    "review_length": 7,
    "unique_word_ratio": 1.0
  }
}
```

### Backend API (Express — Port 3000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reviews/analyze` | Analyze + save single review |
| POST | `/api/reviews/analyze-batch` | Analyze + save batch |
| GET | `/api/reviews/stats` | Dashboard statistics |
| POST | `/api/upload/csv` | Upload CSV file |
| GET | `/api/admin/reviews` | Get all reviews (paginated) |
| DELETE | `/api/admin/reviews/:id` | Soft delete a review |
| DELETE | `/api/admin/reviews/bulk/fake` | Delete all fake reviews |

---

## 📊 Features at a Glance

| Feature | Details |
|---------|---------|
| **Upload Mode** | Paste text (1–100 reviews) or upload CSV |
| **ML Model** | Naive Bayes + TF-IDF + NLTK preprocessing |
| **Per-review output** | Classification, confidence %, probability bar, 6 feature metrics |
| **Results Dashboard** | Donut chart, stat cards, filter by Fake/Genuine, sort by confidence |
| **Admin Panel** | Paginated table, filter, per-row delete, bulk delete all fake |
| **Persistence** | All results saved to MongoDB with full metadata |
| **CSV Support** | Upload up to 200 reviews; auto-detects `review` or `text` column |

---

## 🎯 How to Test

1. Open **http://localhost:4200**
2. Go to **Upload** page
3. Paste the following sample reviews (one per line):

```
This is the BEST product EVER!!! Amazing quality! Must buy! Incredible value! Five stars!!!
After 3 weeks of use, the battery life is decent but the build feels a bit plastic-y. Good value overall.
WOW WOW WOW! Greatest purchase of my life! Highly recommend to everyone I know! Outstanding!!!
My son uses this for school. Works fine for light tasks. Gets a bit warm with heavy use.
```

4. Click **Analyze Reviews** and view the results dashboard
5. Or upload `sample-reviews.csv` in CSV mode

---

## 🛠️ Tech Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Angular 17 | SPA with routing, reactive forms |
| Styling | SCSS + CSS Variables | Dark theme design system |
| Backend | Node.js + Express | REST API, file handling, DB |
| Database | MongoDB + Mongoose | Review persistence |
| ML API | Python Flask | NLP preprocessing + inference |
| NLP | NLTK | Tokenization, stemming, stopwords |
| ML Model | Scikit-learn (Naive Bayes) | Text classification |
| Features | TF-IDF (bigrams) | Text vectorization |
| DevOps | Docker + Docker Compose | One-command deployment |

---

## 🔮 Possible Enhancements

- Replace Naive Bayes with BERT or DistilBERT for higher accuracy
- Add user authentication (JWT) to admin panel
- Integrate sentiment analysis as an additional feature
- Add review source scraping (Amazon/Flipkart via API)
- Export results as PDF report
- Add email alerts when fake review rate exceeds threshold

---

*Built as a portfolio project demonstrating full-stack development + NLP/ML integration.*
