FROM python:3.11-slim

# Install system CA certificates and required build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    gcc \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY ./backend/ .

RUN pip install --upgrade pip
RUN pip install -r requirements.txt

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "10000"]
