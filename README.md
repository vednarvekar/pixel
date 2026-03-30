# Pixel AI Detection

Pixel is a full-stack web app that analyzes uploaded images and predicts whether they are AI-generated or real.

It combines:
- a ResNet-18 model score
- metadata analysis (EXIF/XMP/C2PA signals)
- perceptual-hash visual similarity scoring

## Architecture

This project uses **2 deployable services**:

1. Frontend (`web/`)
2. Backend (`app/`)  

The backend automatically starts the Python model API from `resnet18/route/model_route.py` internally, so you do not need to host a third standalone Python server.

## Repository Structure

- `app/` Node.js + Express backend (TypeScript)
- `web/` React + Vite frontend
- `resnet18/` Python model code and weights
- `requirements.txt` Python dependencies required by backend model runtime

## Features

- Auth with Supabase (email/password + Google OAuth)
- Upload and scan image
- File validation:
- `JPG`, `PNG`, `WEBP`
- max upload size: **5 MB**
- Score fusion with robust weighting and disagreement penalty
- Verdict + component score breakdown

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind, React Router
- Backend: Node.js, Express, TypeScript, Multer
- ML Service: FastAPI, PyTorch, torchvision
- Auth/DB: Supabase

## Local Development

## 1. Prerequisites

- Node.js 18+ (recommended 20+)
- Python 3.10+
- pip

## 2. Clone and install

```bash
git clone <your-repo-url>
cd pixel-ai-detection
```

Install backend deps:

```bash
cd app
npm install
cd ..
```

Install frontend deps:

```bash
cd web
npm install
cd ..
```

Install Python deps:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## 3. Configure frontend env

Create `web/.env` (or copy from `web/.env.example`):

```env
VITE_SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="YOUR_SUPABASE_ANON_KEY"
VITE_API_BASE_URL="http://localhost:3000"
```

## 4. Run locally

Start backend:

```bash
cd app
npm run dev
```

Start frontend (new terminal):

```bash
cd web
npm run dev
```

Default local URLs:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

## Backend Runtime Notes

- Backend auto-launches Python model process at startup.
- By default it tries:
- `PYTHON_BIN` (if set)
- local `venv/bin/python` candidates
- fallback `python3`

Useful backend env vars:

- `PORT` (default `3000`)
- `PYTHON_BIN` (example: `/opt/render/project/src/venv/bin/python`)
- `START_EMBEDDED_MODEL` (`true` by default)
- `PYTHON_API_URL` (default `http://127.0.0.1:8000`)

## Deployment

## Frontend on Vercel

Project root: `web/`

Set env vars in Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_API_BASE_URL` = your Render backend URL (for example `https://your-api.onrender.com`)

## Backend on Render

Recommended: Web Service with root directory `app/`.

Build Command:

```bash
npm ci && pip install -r ../requirements.txt
```

Start Command:

```bash
npx tsx src/server.ts
```

Recommended Render env vars:
- `PYTHON_BIN=python3`
- `PORT` (Render usually injects this automatically)

If your Render root is repo root instead of `app/`, use:

Build:

```bash
cd app && npm ci && pip install -r ../requirements.txt
```

Start:

```bash
cd app && npx tsx src/server.ts
```

## API Endpoints

- `GET /api/images/health`  
- `POST /api/images/scan` (multipart form-data, field name: `image`)

Sample success response:

```json
{
  "final_score": 72,
  "verdict": "Likely AI",
  "reasoning": "Model signal: 80%. Metadata signal: 65%. Web signal: 52%. Signals are reasonably consistent.",
  "breakdown": {
    "model": 80,
    "metadata": 65,
    "web": 52
  }
}
```

## Troubleshooting

- `ModuleNotFoundError: No module named 'fastapi'`
- Python deps not installed in the interpreter being used.
- Activate venv and install `requirements.txt`, or set `PYTHON_BIN` explicitly.

- `MulterError: File too large`
- Max upload size is 5 MB.
- UI now shows: `Image must be under 5MB`.

- Auth `Failed to fetch`
- Usually frontend cannot reach Supabase due to network/shields/origin config.
- Verify Supabase URL/key env vars and allowed auth redirect/site URLs.

## License

Add your preferred license here (MIT, Apache-2.0, etc.).