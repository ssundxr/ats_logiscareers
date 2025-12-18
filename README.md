# ATS LogisCareers

Enterprise-grade Applicant Tracking System with AI-powered skill matching.

## Features

- **Job Management**: Upload job descriptions (PDF), auto-extract skills and requirements
- **Candidate Management**: Upload CVs/resumes (PDF), auto-extract skills and experience
- **Smart Matching**: AI-powered skill matching between candidates and jobs
- **CV Score Checker**: Instant CV scoring with visual keyword highlighting
- **Dashboard**: Overview of all jobs, candidates, and match statistics

## Tech Stack

### Backend
- Django 6.0 with Django REST Framework
- PostgreSQL database
- PDF text extraction (pdfminer.six)
- NLP skill extraction (SpaCy)

### Frontend
- React 19 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Axios for API communication

## Quick Start (Development)

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL 14+

### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\Activate

# Install dependencies
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Create .env file
cp ../.env.example .env
# Edit .env with your database credentials

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api

## Docker Deployment

### Using Docker Compose
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The application will be available at:
- Frontend: http://localhost
- Backend API: http://localhost:8000/api

## Google Cloud Deployment

### Prerequisites
- Google Cloud SDK installed
- Google Cloud project with billing enabled
- Cloud SQL, Cloud Run, and Container Registry APIs enabled

### Step 1: Set up Cloud SQL
```bash
# Create PostgreSQL instance
gcloud sql instances create ats-db \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=us-central1

# Create database
gcloud sql databases create ats_logiscareers --instance=ats-db

# Create user
gcloud sql users create ats_user \
    --instance=ats-db \
    --password=YOUR_SECURE_PASSWORD
```

### Step 2: Deploy Backend to Cloud Run
```bash
cd backend

# Build and push Docker image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/ats-backend

# Deploy to Cloud Run
gcloud run deploy ats-backend \
    --image gcr.io/YOUR_PROJECT_ID/ats-backend \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --add-cloudsql-instances YOUR_PROJECT_ID:us-central1:ats-db \
    --set-env-vars "DJANGO_SETTINGS_MODULE=core.settings_production" \
    --set-env-vars "SECRET_KEY=your-secret-key" \
    --set-env-vars "DB_NAME=ats_logiscareers" \
    --set-env-vars "DB_USER=ats_user" \
    --set-env-vars "DB_PASSWORD=YOUR_SECURE_PASSWORD" \
    --set-env-vars "CLOUD_SQL_CONNECTION_NAME=YOUR_PROJECT_ID:us-central1:ats-db"
```

### Step 3: Deploy Frontend to Cloud Run
```bash
cd frontend

# Update API URL in production config
# Edit src/services/api.ts to use your backend URL

# Build and push Docker image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/ats-frontend

# Deploy to Cloud Run
gcloud run deploy ats-frontend \
    --image gcr.io/YOUR_PROJECT_ID/ats-frontend \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated
```

## API Endpoints

### Jobs
- `GET /api/jobs/` - List all jobs
- `POST /api/jobs/` - Create job (with PDF upload)
- `GET /api/jobs/{id}/` - Get job details
- `DELETE /api/jobs/{id}/` - Delete job
- `POST /api/jobs/{id}/match_candidates/` - Match all candidates

### Candidates
- `GET /api/candidates/` - List all candidates
- `POST /api/candidates/` - Create candidate (with CV upload)
- `GET /api/candidates/{id}/` - Get candidate details
- `DELETE /api/candidates/{id}/` - Delete candidate
- `POST /api/candidates/match_all_jobs/` - Match candidate to all jobs

### Matches
- `GET /api/matches/` - List all matches
- `GET /api/matches/top/` - Get top matches
- `POST /api/matches/bulk_create/` - Create all possible matches

### Dashboard
- `GET /api/dashboard/stats/` - Get dashboard statistics

### CV Score Checker
- `POST /api/cv-checker/check_score/` - Check CV score against job requirements

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DEBUG` | Django debug mode | `False` |
| `SECRET_KEY` | Django secret key | Required |
| `DB_NAME` | Database name | `ats_logiscareers` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | Required |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `ALLOWED_HOSTS` | Comma-separated allowed hosts | `*` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated CORS origins | Empty |

## License

MIT License
