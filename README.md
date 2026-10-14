# ScamShield AI

**Don't Let a Fake Job Steal Your Future.**

AI-powered fake job posting detection for students and job seekers. Paste a job
description or recruiter message and a trained machine-learning model estimates
whether it resembles fraudulent postings.

- **Frontend:** React 18 + Vite + Tailwind (`src/`)
- **Backend:** Flask API (`backend/`) serving a TF-IDF + Logistic Regression model
- **Accounts:** register / sign in; each user's analyses are saved to their own history
- **Deployment:** one Docker service on Render serves both the app and the API — see **[DEPLOY.md](DEPLOY.md)**

> Predictions are **estimates**, not proof. A listing with an estimated fraud
> probability of **55% or more** is shown as **Potentially Fraudulent**;
> anything lower as **Likely Legitimate**.

---

## How it works

```
Browser ──► Flask (backend/app.py)
              ├── /                    built React app (dist/)
              ├── POST /api/predict    TF-IDF vectorizer ─► LogisticRegression.predict_proba
              ├── /api/v1/auth/*       register, login (hashed passwords, signed tokens)
              ├── /api/v1/history      the signed-in user's saved analyses
              └── /api/v1/dashboard    the signed-in user's statistics
                         │
                         ▼
                 SQLite (local) / Postgres (live)
```

The model and vectorizer in `backend/` are only loaded, never re-trained.
Only the job title and description are sent to the model; company name,
recruiter email and source are stored for the history view.

## Run it on your computer

You need **Node.js 18+** and **Python 3.12**.

**One-time setup** (from the project folder):

```powershell
npm install
py -3.12 -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

**Every time — two terminals:**

```powershell
# Terminal 1: backend (API + model) on http://localhost:8000
backend\.venv\Scripts\python.exe backend\app.py

# Terminal 2: frontend with live reload on http://localhost:5173
npm run dev
```

Open **http://localhost:5173**, create an account, and analyze a listing.
Local accounts and history are stored in `backend/scamshield.db` (not committed).

To try the production setup locally (one server for everything):
`npm run build`, then start the backend and open **http://localhost:8000**.

## Configuration

Frontend (`.env`, optional — see `.env.example`):

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Backend URL | dev: `http://localhost:8000`; production build: same origin |
| `VITE_API_TIMEOUT` | Request timeout (ms) | `15000` |

Backend (environment variables): see [backend/README.md](backend/README.md).
In production, `SECRET_KEY` and `DATABASE_URL` **must** be set (Render does this
automatically via `render.yaml`).

## Project structure

```
backend/
├── app.py            App factory, /api/predict, /api/health, serves dist/
├── auth.py           Register / login / me, token checks, login rate limiting
├── records.py        History list/detail/delete, dashboard stats (per user)
├── database.py       User and Analysis tables (SQLAlchemy)
├── *.joblib          Trained model + fitted TF-IDF vectorizer
└── model_metadata.json   Threshold (0.55) and training text columns
src/
├── pages/            Landing, Analyze, Results, Dashboard, History, About, Login, Register
├── components/       Navbar, Sidebar, RiskBadge (prediction chip), StatCard, …
├── services/         api.js (Axios + token + errors), auth, analysis, history, dashboard, session
├── utils/risk.js     The two prediction outcomes and probability formatting
Dockerfile, render.yaml   Production build + Render blueprint
docs/API_CONTRACT.md      Full API reference
```

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| "Unable to connect to the analysis service…" | Start the backend (Terminal 1) and check `http://localhost:8000/api/health` |
| Health says `"ready": false` | Read `errors` in the health response — usually a missing `.joblib` file |
| "Port 8000 is already in use" | Another backend is still running; close it (Ctrl+C in its window) |
| Sent back to the login page | Your session expired (7 days) or the backend `SECRET_KEY` changed — sign in again |
| VS Code says packages are "not installed" | It is looking at your system Python; select `backend\.venv` as the interpreter |

## Limitations

- The model was trained on historical, mostly English full-length job postings.
  It can miss short scam messages (e.g. UPI deposit or registration-fee requests).
- No password reset by email yet.
- Free Render services sleep after inactivity; the first visit afterwards is slow.

## Honesty notes

- No fake predictions, random scores or simulated AI responses exist in this codebase.
- No fabricated testimonials, user counts, accuracy figures or partnerships are shown.
- ScamShield AI is an educational project and is not affiliated with any government,
  police or official organisation, and it does not integrate with government or
  employer verification databases.
- ScamShield AI provides an automated risk assessment, not a definitive determination
  of fraud. Independently verify job offers and recruiters before sharing sensitive
  information or making payments.
