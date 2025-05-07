// script.js
const scoreHistory = {};
let chart;

const phrases = [
  { phrase: "How are you feeling?", language: "en-IN" },
  { phrase: "Are you in pain?", language: "en-IN" },
  { phrase: "I'm giving you your medication now.", language: "en-IN" },
  { phrase: "Please breathe in deeply and exhale.", language: "en-IN" },
  { phrase: "I need to measure your blood pressure.", language: "en-IN" },
  { phrase: "Wie fühlen Sie sich?", language: "de-DE" },
  { phrase: "Wo tut es weh?", language: "de-DE" },
  { phrase: "Atmen Sie bitte tief ein und aus.", language: "de-DE" },
  { phrase: "Ich gebe Ihnen jetzt Ihre Medikamente.", language: "de-DE" },
  { phrase: "Ich muss Ihren Blutdruck messen.", language: "de-DE" }
];

// Language filter logic
const phraseSelect = document.getElementById("phraseSelect");
const languageRadios = document.getElementsByName("language");

function getSelectedLanguage() {
  return [...languageRadios].find(r => r.checked)?.value || "de-DE";
}

function updatePhraseOptions() {
  const selectedLang = getSelectedLanguage();
  phraseSelect.innerHTML = "";

  phrases.forEach((p, i) => {
    if (p.language === selectedLang) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = p.phrase;
      phraseSelect.appendChild(option);
    }
  });

  renderPhrase();
}

languageRadios.forEach(radio => {
  radio.addEventListener("change", updatePhraseOptions);
});

phraseSelect.addEventListener("change", renderPhrase);
updatePhraseOptions();

function renderPhrase() {
  const idx = document.getElementById("phraseSelect").value;
  const phraseText = phrases[idx].phrase;
  document.getElementById("englishText").textContent = phraseText;
  // document.getElementById("targetText").textContent = phraseText;
  document.getElementById("feedback").innerHTML = "";

  if (chart) {
    chart.destroy();
    chart = null;
  }

  if (scoreHistory[idx]) {
    renderChart(scoreHistory[idx]);
  }
}

// function playPhrase() {
//   const idx = document.getElementById("phraseSelect").value;
//   const utterance = new SpeechSynthesisUtterance(phrases[idx].phrase);
//   utterance.lang = phrases[idx].language;
//   speechSynthesis.speak(utterance);
// }

function playPhrase() {
  const idx = document.getElementById("phraseSelect").value;
  const playBtn = document.querySelector('button[onclick="playPhrase()"]');
  const utterance = new SpeechSynthesisUtterance(phrases[idx].phrase);
  utterance.lang = phrases[idx].language;

  // Add visual feedback
  playBtn.classList.add('playing-active');

  utterance.onend = () => {
    playBtn.classList.remove('playing-active');
  };

  speechSynthesis.speak(utterance);
}


function recordSpeech() {
  document.querySelector('button[onclick="recordSpeech()"]')?.classList.add('recording-active');
  const mode = document.getElementById("modeToggle").value;
  if (mode === "browser") {
    recordUsingBrowser();
  } else {
    recordUsingBackend(mode);
  }
}

function recordUsingBrowser() {
  const idx = document.getElementById("phraseSelect").value;
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

// async function recordUsingBackend(mode) {
//   const idx = document.getElementById("phraseSelect").value;
//   const expectedText = phrases[idx].phrase;
//   const lang = phrases[idx].language;

//   const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//   const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
//   const chunks = [];
//   const audioContext = new AudioContext();
//   const source = audioContext.createMediaStreamSource(stream);
//   const analyser = audioContext.createAnalyser();
//   source.connect(analyser);
//   const dataArray = new Uint8Array(analyser.fftSize);

//   let silenceStart = null;
//   const silenceThreshold = 0.01;
//   const maxSilenceDuration = 1500;

//   function isSilent() {
//     analyser.getByteTimeDomainData(dataArray);
//     let sum = 0;
//     for (let i = 0; i < dataArray.length; i++) {
//       const val = (dataArray[i] - 128) / 128;
//       sum += val * val;
//     }
//     return Math.sqrt(sum / dataArray.length) < silenceThreshold;
//   }

//   let stopTimeout;

//   function monitorSilence() {
//     if (isSilent()) {
//       if (silenceStart === null) silenceStart = Date.now();
//       else if (Date.now() - silenceStart > maxSilenceDuration) {
//         mediaRecorder.stop();
//         return;
//       }
//     } else {
//       silenceStart = null;
//     }
//     stopTimeout = requestAnimationFrame(monitorSilence);
//   }

//   mediaRecorder.ondataavailable = (e) => {
//     if (e.data.size > 0) chunks.push(e.data);
//   };

//   mediaRecorder.onstop = async () => {
//     cancelAnimationFrame(stopTimeout);
//     stream.getTracks().forEach(t => t.stop());
//     audioContext.close();
//     document.querySelector('button[onclick="recordSpeech()"]')?.classList.remove('recording-active');

//     const blob = new Blob(chunks, { type: 'audio/webm' });
//     const formData = new FormData();
//     formData.append("audio", blob, "speech.webm");
//     formData.append("expected_text", expectedText);
//     formData.append("language", lang);

//     try {
//       let endpoint;
//       switch (mode) {
//         case "whisper": endpoint = "whisper-transcribe"; break;
//         case "local-whisper": endpoint = "local-whisper-transcribe"; break;
//         case "whisperx": endpoint = "whisperx-transcribe"; break;
//         case "fast-whisper": endpoint = "fast-whisper-transcribe"; break;
//         case "azure": endpoint = "azure-assess"; break;
//         default:
//           document.getElementById("feedback").innerHTML = `<p style="color:red;">Invalid transcription mode selected.</p>`;
//           return;
//       }

//       const response = await fetch(`http://localhost:5001/${endpoint}`, {
//         method: "POST",
//         body: formData,
//         credentials: "include"
//       });

//       if (response.redirected && response.url.includes("/login")) {
//         alert("Session expired. Redirecting to login...");
//         window.location.href = response.url;
//         return;
//       }

//       if (response.status === 429) {
//         document.getElementById("feedback").innerHTML = `<p style="color:red;">Too quick, please try again in a minute.</p>`;
//         return;
//       }

//       const data = await response.json();
//       if (["whisper", "local-whisper", "whisperx", "fast-whisper"].includes(mode)) {
//         handleFeedback(data.transcript, data.segments || []);
//       } else if (mode === "azure") {
//         const phrase = data.NBest?.[0]?.Lexical || "";
//         handleFeedback(phrase, [], data);
//       }
//     } catch (err) {
//       document.getElementById("feedback").innerHTML = `<p style="color:red;">Transcription failed.</p>`;
//       console.error("Transcription failed:", err);
//     }
//   };

//   mediaRecorder.start();
//   monitorSilence();
// }

async function recordUsingBackend(mode) {
  const recordBtn = document.querySelector('button[onclick="recordSpeech()"]');
  recordBtn.disabled = true;

  const idx = document.getElementById("phraseSelect").value;
  const expectedText = phrases[idx].phrase;
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
  const silenceThreshold = 0.01;
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
    if (isSilent()) {
      if (silenceStart === null) silenceStart = Date.now();
      else if (Date.now() - silenceStart > maxSilenceDuration) {
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
    recordBtn.classList.remove('recording-active');

    // Show processing...
    document.getElementById("feedback").innerHTML = `<p>Processing...</p>`;

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
          recordBtn.disabled = false;
          return;
      }

      const origin = window.location.origin;
      const response = await fetch(`${origin}/${endpoint}`, {
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
        recordBtn.disabled = false;
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

    recordBtn.disabled = false;
  };

  mediaRecorder.start();
  monitorSilence();
}


function normalizeText(text) {
  return text.toLowerCase().replace(/[.,?؟!।]/g, "").trim();
}

function handleFeedback(transcript, segments = [], azureResult = null) {
  const idx = document.getElementById("phraseSelect").value;
  const targetRaw = phrases[idx].phrase;

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
  const idx = document.getElementById("phraseSelect").value;
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = phrases[idx].language;
  utterance.rate = 0.8;
  speechSynthesis.speak(utterance);
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


function getColorForScore(score) {
  if (score >= 80) return 'rgba(0, 200, 0, 0.2)';
  if (score >= 60) return 'rgba(255, 165, 0, 0.2)';
  return 'rgba(255, 0, 0, 0.2)';
}

function formatDuration(microseconds) {
  return microseconds ? `${(microseconds / 1000000).toFixed(2)}s` : 'N/A';
}

function toggleWordDetails(button) {
  const details = button.parentNode.nextElementSibling;
  const isHidden = details.style.display === 'none';
  details.style.display = isHidden ? 'block' : 'none';
  button.textContent = isHidden ? '-' : '+';
}