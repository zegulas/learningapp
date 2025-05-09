# 📚 Learning App

This is a browser-based language learning app that provides pronunciation feedback and supports multiple speech recognition backends.

## 🚀 Getting Started

Follow the steps below to set up and run the app locally.

### 1. Clone the Repository
```bash
git clone https://github.com/zegulas/learningapp.git
cd learningapp
```

### 2. Setup Environment Variables
Make a copy of the example `.env` file and update it with your configuration:
```bash
cp dotenv.example .env
```
Then open `.env` and substitute the correct values for the keys.

### 3. Install Dependencies
Use pip to install the required Python packages:
```bash
pip install -r requirements.txt
```

### 4. Run the Application
Start the Flask app using:
```bash
python3 app.py
```

### 5. Access the App
Once the server is running, open your browser and go to:
```
http://localhost:5001
```

## 📂 Project Structure
```
learningapp/
│
├── app.py                # Main Flask app
├── requirements.txt      # Python dependencies
├── dotenv.example        # Sample environment variables
└── ...
```

## 🧪 Tech Stack
- Python (Flask)
- JavaScript + HTML + CSS (Web frontend)
- Web Speech API / OpenAI Whisper / Azure STT / OpenAI Whisper (local)  (for transcription)

## 🤝 Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License
[MIT](LICENSE)
