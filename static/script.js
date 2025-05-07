const scoreHistory = {};
let chart;

const nativeLangNames = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi"
};

// const phrases = [
//   {
//     target: "Wie fühlen Sie sich?",
//     language: "de-DE",
//     native: {
//       en: "How are you feeling?",
//       hi: "आप कैसे महसूस कर रहे हैं?",
//       mr: "तुम्हाला कसं वाटतंय?"
//     },
//     phoneticTarget: {
//       en: "vee fyoolen zee zish?",
//       hi: "वी फ्यूलन ज़ी ज़िश?",
//       mr: "व्ही फ्यूलन झी झीश?"
//     }
//   },
//   {
//     target: "Wo tut es weh?",
//     language: "de-DE",
//     native: {
//       en: "Where does it hurt?",
//       hi: "कहाँ दर्द हो रहा है?",
//       mr: "कुठं दुखतंय?"
//     },
//     phoneticTarget: {
//       en: "vo toot es veh?",
//       hi: "वो टुट एस वेह?",
//       mr: "वो तुट एस वेह?"
//     }
//   }
// ];
const phrases = [
  {
    target: "Wie fühlen Sie sich?",
    language: "de-DE",
    native: {
      en: "How are you feeling?",
      hi: "आप कैसे महसूस कर रहे हैं?",
      mr: "तुम्हाला कसं वाटतंय?"
    },
    phoneticTarget: {
      en: "vee fyoolen zee zish?",
      hi: "वी फ्यूलन ज़ी ज़िश?",
      mr: "व्ही फ्यूलन झी झीश?"
    }
  },
  {
    target: "Wo tut es weh?",
    language: "de-DE",
    native: {
      en: "Where does it hurt?",
      hi: "कहाँ दर्द हो रहा है?",
      mr: "कुठं दुखतंय?"
    },
    phoneticTarget: {
      en: "vo toot es veh?",
      hi: "वो टुट एस वेह?",
      mr: "वो तुट एस वेह?"
    }
  },
  {
    target: "Atmen Sie bitte tief ein und aus.",
    language: "de-DE",
    native: {
      en: "Please breathe in deeply and exhale.",
      hi: "कृपया गहराई से सांस लें और छोड़ें।",
      mr: "कृपया खोलून श्वास घ्या आणि सोडा."
    },
    phoneticTarget: {
      en: "aht-men zee bit-te teef ayn oont ous.",
      hi: "आट्मेन ज़ी बिट्टे टीफ आइन उंट आउस।",
      mr: "आट्मेन झी बिट्टे तीफ आइन उंट आउस."
    }
  },
  {
    target: "Ich gebe Ihnen jetzt Ihre Medikamente.",
    language: "de-DE",
    native: {
      en: "I'm giving you your medication now.",
      hi: "मैं आपको अभी आपकी दवा दे रहा हूँ।",
      mr: "मी तुम्हाला आत्ताच तुमची औषधं देतो आहे."
    },
    phoneticTarget: {
      en: "ikh geh-buh eenen yetst eer-uh medikah-men-teh.",
      hi: "इख गे-बु ईनेन येत्स्ट ईर-ए मेडिका-में-टे।",
      mr: "इख गे-बु ईनेन येत्स्ट ईर-ए मेडिका-में-टे."
    }
  },
  {
    target: "Ich muss Ihren Blutdruck messen.",
    language: "de-DE",
    native: {
      en: "I need to measure your blood pressure.",
      hi: "मुझे आपका रक्तचाप मापना है।",
      mr: "माझं तुमचं रक्तदाब मोजायला हवा आहे."
    },
    phoneticTarget: {
      en: "ikh moos eer-en bloot-drook messen.",
      hi: "इख मुस ईरन ब्लूटड्रुक मेसन।",
      mr: "इख मुस ईरन ब्लूटड्रुक मेसन."
    }
  },
  {
    target: "Guten Morgen.",
    language: "de-DE",
    native: {
      en: "Good morning.",
      hi: "सुप्रभात।",
      mr: "शुभ प्रभात."
    },
    phoneticTarget: {
      en: "goo-ten mor-gen",
      hi: "गू-टेन मोर-गेन",
      mr: "गूटन मॉर्गन"
    }
  }
];

const phraseSelect = document.getElementById("phraseSelect");
const nativeLangSelect = document.getElementById("nativeLangSelect");

function updatePhraseOptions() {
  phraseSelect.innerHTML = "";
  const nativeLang = nativeLangSelect?.value || "en";

  phrases.forEach((p, i) => {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = p.native[nativeLang] || p.native["en"];
    phraseSelect.appendChild(option);
  });

  renderPhrase();
}

if (nativeLangSelect) {
  nativeLangSelect.addEventListener("change", updatePhraseOptions);
}

phraseSelect.addEventListener("change", renderPhrase);
updatePhraseOptions();

function renderPhrase() {
  const idx = parseInt(phraseSelect.value, 10);
  const nativeLang = nativeLangSelect?.value || "en";
  const phrase = phrases[idx];

  document.getElementById("nativeLangLabel").textContent = nativeLangNames[nativeLang] || "Your Language";
  document.getElementById("englishText").textContent = phrase.native[nativeLang] || phrase.native["en"];
  document.getElementById("targetText").textContent = phrase.target;
  document.getElementById("feedback").innerHTML = "";
  document.getElementById("phoneticTargetText").textContent = phrase.phoneticTarget[nativeLang] || "";


  if (chart) {
    chart.destroy();
    chart = null;
  }

  if (scoreHistory[idx]) {
    renderChart(scoreHistory[idx]);
  }
}

function playPhrase() {
  const idx = parseInt(phraseSelect.value, 10);
  const playBtn = document.querySelector('button[onclick="playPhrase()"]');
  const { target, language } = phrases[idx];
  const utterance = new SpeechSynthesisUtterance(target);
  utterance.lang = language;

  playBtn.classList.add('playing-active');
  utterance.onend = () => playBtn.classList.remove('playing-active');
  speechSynthesis.speak(utterance);
}

async function recordUsingBackend(mode) {
  console.log('mode: ')
  console.log(mode)
  const idx = document.getElementById("phraseSelect").value;
  const expectedText = phrases[idx].target;
  const lang = phrases[idx].language;

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
  const chunks = [];
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  source.connect(analyser);
  const dataArray = new Uint8Array(analyser.fftSize);

  let silenceStart = null;
  const silenceThreshold = 0.05;
  const maxSilenceDuration = 1500;

  function isSilent() {
    analyser.getByteTimeDomainData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const val = (dataArray[i] - 128) / 128;
      sum += val * val;
    }
    return Math.sqrt(sum / dataArray.length) < silenceThreshold;
  }

  let stopTimeout;

  function monitorSilence() {
    console.log('monitoring for silence')
    if (isSilent()) {
      if (silenceStart === null) silenceStart = Date.now();
      else if (Date.now() - silenceStart > maxSilenceDuration) {
        console.log('recording stopped')
        mediaRecorder.stop();
        return;
      }
    } else {
      silenceStart = null;
    }
    stopTimeout = requestAnimationFrame(monitorSilence);
  }

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  mediaRecorder.onstop = async () => {
    cancelAnimationFrame(stopTimeout);
    stream.getTracks().forEach(t => t.stop());
    audioContext.close();

    document.querySelector('button[onclick="recordSpeech()"]')?.classList.remove('recording-active');

    const blob = new Blob(chunks, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append("audio", blob, "speech.webm");
    formData.append("expected_text", expectedText);
    formData.append("language", lang);

    try {
      let endpoint;
      switch (mode) {
        case "whisper": endpoint = "whisper-transcribe"; break;
        case "local-whisper": endpoint = "local-whisper-transcribe"; break;
        case "whisperx": endpoint = "whisperx-transcribe"; break;
        case "fast-whisper": endpoint = "fast-whisper-transcribe"; break;
        case "azure": endpoint = "azure-assess"; break;
        default:
          document.getElementById("feedback").innerHTML = `<p style="color:red;">Invalid transcription mode selected.</p>`;
          return;
      }

      const response = await fetch(`${window.location.origin}/${endpoint}`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      if (response.redirected && response.url.includes("/login")) {
        alert("Session expired. Redirecting to login...");
        window.location.href = response.url;
        return;
      }

      if (response.status === 429) {
        document.getElementById("feedback").innerHTML = `<p style="color:red;">Too quick, please try again in a minute.</p>`;
        return;
      }

      const data = await response.json();
      if (["whisper", "local-whisper", "whisperx", "fast-whisper"].includes(mode)) {
        handleFeedback(data.transcript, data.segments || []);
      } else if (mode === "azure") {
        const phrase = data.NBest?.[0]?.Lexical || "";
        handleFeedback(phrase, [], data);
      }
    } catch (err) {
      document.getElementById("feedback").innerHTML = `<p style="color:red;">Transcription failed.</p>`;
      console.error("Transcription failed:", err);
    }
  };

  mediaRecorder.start();
  monitorSilence();
}


function recordSpeech() {
  console.log('called recordSpeech function')
  document.querySelector('button[onclick="recordSpeech()"]')?.classList.add('recording-active');
  const mode = document.getElementById("modeToggle").value;
  if (mode === "browser") {
    recordUsingBrowser();
  } else {
    recordUsingBackend(mode);
  }
}

function recordUsingBrowser() {
  const idx = parseInt(phraseSelect.value, 10);
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = phrases[idx].language;
  recognition.start();

  const stopRecognition = () => {
    recognition.stop();
    document.querySelector('button[onclick="recordSpeech()"]')?.classList.remove('recording-active');
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    stopRecognition();
    handleFeedback(transcript);
  };

  recognition.onerror = stopRecognition;
  recognition.onend = stopRecognition;

  setTimeout(stopRecognition, 5000);
}

function handleFeedback(transcript, segments = [], azureResult = null) {
  const idx = parseInt(phraseSelect.value, 10);
  const targetRaw = phrases[idx].target;

  const target = normalizeText(targetRaw);
  const cleanTranscript = normalizeText(transcript);

  const score = similarityScore(cleanTranscript, target);
  const targetWords = target.split(/\s+/);
  const transcriptWords = cleanTranscript.split(/\s+/);
  let wordFeedback = '';

  if (!azureResult?.NBest?.[0]?.Words) {
    for (let i = 0; i < Math.min(targetWords.length, transcriptWords.length); i++) {
      const targetWord = targetWords[i];
      const spokenWord = transcriptWords[i] || '';
      const wordScore = similarityScore(spokenWord, targetWord);
      if (wordScore < 80) {
        wordFeedback += `<div class="word-feedback">
          <span class="mispronounced">${targetWord}</span>
          <span class="arrow">→</span>
          <span class="spoken">${spokenWord}</span>
          <span class="score">(${wordScore}%)</span>
          <button onclick="playWord('${targetWord}')" class="play-word">🔊</button>
        </div>`;
      }
    }
  }

  if (!scoreHistory[idx]) scoreHistory[idx] = [];
  scoreHistory[idx].push(score);
  if (scoreHistory[idx].length > 25) scoreHistory[idx].shift();

  renderChart(scoreHistory[idx]);

  document.getElementById("feedback").innerHTML = `
    <p><strong>You said:</strong> ${transcript}</p>
    <p><strong>Similarity:</strong> ${score}%</p>
    <p><span style="color:${score > 80 ? 'green' : 'orange'}">${score > 80 ? 'Great job!' : 'Keep practicing!'}</span></p>
    ${wordFeedback}
  `;
}

function playWord(word) {
  const idx = parseInt(phraseSelect.value, 10);
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = phrases[idx].language;
  utterance.rate = 0.8;
  speechSynthesis.speak(utterance);
}

function normalizeText(text) {
  return text.toLowerCase().replace(/[.,?؟!।]/g, "").trim();
}

function similarityScore(a, b) {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  const longerLength = longer.length;
  if (longerLength === 0) return 100;
  const editDistance = levenshteinDistance(longer, shorter);
  return Math.round((1 - editDistance / longerLength) * 100);
}

function levenshteinDistance(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

function renderChart(data) {
  const ctx = document.getElementById("scoreChart").getContext("2d");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map((_, i) => `Attempt ${i + 1}`),
      datasets: [{
        label: "Similarity Score (%)",
        data: data,
        backgroundColor: data.map(score =>
          score >= 80 ? 'rgba(46, 204, 113, 0.6)' :
          score >= 60 ? 'rgba(241, 196, 15, 0.6)' :
                        'rgba(231, 76, 60, 0.6)'
        ),
        borderColor: 'rgba(0,0,0,0.2)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { stepSize: 20 }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}
