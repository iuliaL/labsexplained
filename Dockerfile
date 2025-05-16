# Use a clean, TLS-compatible Python base
FROM python:3.11-slim

# Set working directory inside the container
WORKDIR /app

# Copy contents of backend folder into the container
COPY ./backend/ .

# Install dependencies
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Run the FastAPI app with Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "10000"]
