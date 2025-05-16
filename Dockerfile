# Use full Python image for robust OpenSSL & TLS support
FROM python:3.11

# Set working directory
WORKDIR /app

# Copy your backend code into the container
COPY ./backend/ .

# Install dependencies
RUN pip install --upgrade pip && pip install -r requirements.txt

# Run the FastAPI app with Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "10000"]
