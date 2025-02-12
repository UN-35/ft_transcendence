FROM python:3.12-slim

RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /game
COPY . /game/


RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8000
COPY ./script.sh /game/

RUN chmod 777 /game/script.sh

ENTRYPOINT ["sh", "/game/script.sh"]

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
