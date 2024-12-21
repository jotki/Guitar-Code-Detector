const startButton = document.getElementById("start-button");
const stopButton = document.getElementById("stop-button");
const detectedNoteDiv = document.getElementById("detected-note");
const soundwaveBar = document.getElementById("soundwave-bar");

let stream;
let audioContext;
let analyser;
let source;
let requestId;
let isDetecting = false; // Flag to track detection status

// Ensure both buttons are always visible
stopButton.style.display = "inline-block"; // Make sure stop button is always visible

startButton.addEventListener("click", async () => {
  if (isDetecting) return; // Prevent starting detection multiple times

  isDetecting = true;

  // Change button colors for animation
  startButton.classList.add("clicked");
  detectedNoteDiv.textContent = "Listening..."; // Update status text

  // Request access to microphone
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);

  // Set up YIN pitch detection
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Float32Array(bufferLength);
  const yinDetector = new YIN(audioContext.sampleRate); // YIN setup

  // Function to update the sound wave visualization
  function updateSoundwave() {
    analyser.getFloatTimeDomainData(dataArray);

    let totalAmplitude = 0;
    for (let i = 0; i < dataArray.length; i++) {
      totalAmplitude += Math.abs(dataArray[i]);
    }

    const waveWidth = Math.min(totalAmplitude * 1000, soundwaveBar.offsetWidth);  // Scale to fit the bar width

    const wave = document.createElement("div");
    wave.style.width = waveWidth + "px";
    wave.className = "wave";

    soundwaveBar.appendChild(wave);
    if (soundwaveBar.children.length > 1) {
      soundwaveBar.removeChild(soundwaveBar.children[0]);
    }
  }

  // Function to detect the note and update the display
  function detectNote() {
    analyser.getFloatTimeDomainData(dataArray);

    const pitch = yinDetector.getPitch(dataArray);

    if (pitch) {
      const note = Tonal.Note.fromFreq(pitch);
      detectedNoteDiv.textContent = `Detected Note: ${note}`;
    } else {
      detectedNoteDiv.textContent = "No note detected...";
    }

    updateSoundwave();
    requestId = requestAnimationFrame(detectNote);
  }

  detectNote();
});

stopButton.addEventListener("click", () => {
  if (!isDetecting) return; // Prevent stopping if detection is not running

  // Change button colors for animation
  stopButton.classList.add("clicked");

  // Stop detection
  cancelAnimationFrame(requestId);
  stream.getTracks().forEach(track => track.stop());
  detectedNoteDiv.textContent = "Stopped Listening...";

  // Reset text after a delay
  setTimeout(() => {
    detectedNoteDiv.textContent = "Play a chord or note..."; // Reset text
  }, 10000); // Wait for 10 seconds

  startButton.classList.remove("clicked");
  isDetecting = false; // Update flag
});
