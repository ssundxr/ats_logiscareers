FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && python -m spacy download en_core_web_sm

COPY . .

# IMPORTANT: static config
ENV STATIC_ROOT=/app/staticfiles
RUN python manage.py collectstatic --noinput

EXPOSE 8080

CMD gunicorn core.wsgi:application \
    --bind :$PORT \
    --workers 2 \
    --threads 8
