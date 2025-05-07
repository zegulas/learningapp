FROM python:3.10-slim

# Install only necessary system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    build-essential \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Install Gunicorn for production server
RUN pip install gunicorn

# Copy the rest of the app
COPY . .

# Expose Flask/Gunicorn port
EXPOSE 5001

# Use Gunicorn to run the Flask app in production
CMD ["gunicorn", "-w", "1", "-b", "0.0.0.0:5001", "app:app"]
