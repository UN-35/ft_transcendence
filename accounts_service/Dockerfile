
FROM python:3.12-slim

RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . /app/

RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn 

EXPOSE 8000

COPY wait-for-it.sh /app/wait-for-it.sh
RUN chmod +x /app/wait-for-it.sh

CMD ["./wait-for-it.sh", "db:5432", "--", "gunicorn", "--bind", "0.0.0.0:8000", "accounts_service.wsgi:application"]