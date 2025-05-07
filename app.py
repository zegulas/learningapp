# app.py - Transcription App using OpenAI Whisper (Cloud) and FastWhisper
import os
import tempfile
import base64
import json
import subprocess
import time
import requests
from flask import Flask, request, jsonify, render_template, redirect, url_for
from flask_cors import CORS
from flask_login import LoginManager, UserMixin, login_user, login_required, current_user, logout_user
from authlib.integrations.flask_client import OAuth
from dotenv import load_dotenv
import redis
import openai
from faster_whisper import WhisperModel
import torch

print(f"PID: {os.getpid()}")

# Load environment variables
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
AZURE_KEY = os.getenv("AZURE_SPEECH_KEY")
AZURE_REGION = os.getenv("AZURE_REGION")
SECRET_KEY = os.getenv("SECRET_KEY")

language_mapping = {
    'hi-IN': 'hi',
    'de-DE': 'de',
    'en-US': 'en'
}

# App setup
app = Flask(__name__)
CORS(app, supports_credentials=True)
app.secret_key = SECRET_KEY

# Redis setup
redis_client = redis.Redis(host='redis', port=6379, decode_responses=True)

# OpenAI client
client = openai.OpenAI(api_key=OPENAI_API_KEY)

# Login setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"

# OAuth setup
oauth = OAuth(app)
oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={"scope": "openid email profile"},
)

class User(UserMixin):
    def __init__(self, id_, name, email):
        self.id = id_
        self.name = name
        self.email = email

users = {}

@login_manager.user_loader
def load_user(user_id):
    return users.get(user_id)

# Rate Limiter
def is_rate_limited(user_key, limit, interval):
    now = int(time.time())
    key = f"rate_limit:{user_key}:{now // interval}"
    current = redis_client.incr(key)
    if current == 1:
        redis_client.expire(key, interval)
    return current > limit

# Model setup
device = "cuda" if torch.cuda.is_available() else "cpu"
# device = "cpu"
if device == "cuda":
    print(f"[INFO] CUDA is available. Using device: {torch.cuda.get_device_name(0)}")
else:
    print("[INFO] CUDA is not available. Falling back to CPU.")

fast_whisper_model = WhisperModel("small", device=device, compute_type="int8")

@app.route("/")
def home():
    if not current_user.is_authenticated:
        return redirect(url_for("login"))
    return render_template("index.html", name=current_user.name)

@app.route("/login")
def login():
    redirect_uri = url_for("auth", _external=True)
    return oauth.google.authorize_redirect(redirect_uri)

@app.route("/auth")
def auth():
    token = oauth.google.authorize_access_token()
    user_info = token['userinfo']
    user = User(user_info["sub"], user_info["name"], user_info["email"])
    users[user.id] = user
    login_user(user)
    return redirect("/")

@app.route("/logout")
def logout():
    logout_user()
    return redirect("/")

@app.route("/whisper-transcribe", methods=["POST"])
@login_required
def transcribe_whisper():
    return transcribe_with_model("cloud")

@app.route("/fast-whisper-transcribe", methods=["POST"])
@login_required
def transcribe_fast_whisper():
    return transcribe_with_model("fast")

def transcribe_with_model(model_type):
    print(f"[DEBUG] Model type: {model_type}")
    user_key = current_user.get_id()
    if is_rate_limited(user_key, limit=10, interval=60):
        return jsonify({"error": "Rate limit exceeded. Please wait and try again."}), 429

    if 'audio' not in request.files:
        return jsonify({"error": "No audio file uploaded."}), 400

    raw_language = request.form.get("language", "en")
    language_short = language_mapping.get(raw_language, raw_language.split("-")[0])

    print(f"[DEBUG] Requested language: {raw_language}")
    print(f"[DEBUG] Using language code: {language_short}")

    audio_file = request.files['audio']
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        audio_path = tmp.name
        audio_file.save(audio_path)

    try:
        wav_path = audio_path.replace('.webm', '.wav')
        subprocess.run(["ffmpeg", "-i", audio_path, "-ac", "1", "-ar", "16000", wav_path], check=True, capture_output=True)

        if model_type == "cloud":
            with open(audio_path, "rb") as af:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=af,
                    language=language_short,
                    response_format="verbose_json"
                )
                return jsonify({
                    "transcript": transcript.text,
                    "segments": [s.model_dump() if hasattr(s, 'model_dump') else s for s in getattr(transcript, 'segments', [])]
                })

        elif model_type == "fast":
            segments, _ = fast_whisper_model.transcribe(wav_path, language=language_short)
            transcript = "".join([s.text for s in segments])
            seg_list = [{"start": s.start, "end": s.end, "text": s.text} for s in segments]
            return jsonify({"transcript": transcript.strip(), "segments": seg_list})

        else:
            return jsonify({"error": f"Unknown model type: {model_type}"}), 400

    except Exception as e:
        print("[ERROR]", str(e))
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(audio_path): os.remove(audio_path)
        if os.path.exists(wav_path): os.remove(wav_path)

@app.route("/azure-assess", methods=["POST"])
@login_required
def assess_pronunciation_azure():
    user_key = current_user.get_id()
    if is_rate_limited(user_key, limit=10, interval=60):
        return jsonify({"error": "Rate limit exceeded. Please wait and try again."}), 429

    if 'audio' not in request.files or 'expected_text' not in request.form:
        return jsonify({"error": "Missing audio or expected_text"}), 400

    expected_text = request.form["expected_text"]
    language = request.form.get("language", "hi-IN")
    audio_file = request.files["audio"]

    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        audio_path = tmp.name
        audio_file.save(audio_path)

    try:
        wav_path = audio_path.replace('.webm', '.wav')
        subprocess.run(["ffmpeg", "-i", audio_path, "-ac", "1", "-ar", "16000", wav_path], check=True, capture_output=True)
        azure_audio_path = wav_path
    except Exception:
        azure_audio_path = audio_path

    try:
        assessment_config = {
            "referenceText": expected_text,
            "gradingSystem": "HundredMark",
            "granularity": "Phoneme",
            "dimension": "Comprehensive",
            "enableMiscue": True
        }
        encoded_header = base64.b64encode(json.dumps(assessment_config).encode("utf-8")).decode("ascii")

        with open(azure_audio_path, 'rb') as audio_data:
            headers = {
                "Ocp-Apim-Subscription-Key": AZURE_KEY,
                "Content-Type": "audio/wav" if azure_audio_path.endswith(".wav") else "audio/webm",
                "Pronunciation-Assessment": encoded_header
            }
            params = {
                "language": language,
                "format": "detailed",
                "profanity": "masked"
            }
            endpoint = f"https://{AZURE_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1"
            response = requests.post(endpoint, params=params, headers=headers, data=audio_data)

            if response.status_code == 200:
                return response.json()
            else:
                return jsonify({
                    "error": f"Azure returned {response.status_code}",
                    "details": response.text
                }), 500
    finally:
        if os.path.exists(audio_path):
            os.remove(audio_path)
        if 'wav_path' in locals() and os.path.exists(wav_path):
            os.remove(wav_path)

@app.route("/ping")
def ping():
    return jsonify(message="pong")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True, use_reloader=False)
