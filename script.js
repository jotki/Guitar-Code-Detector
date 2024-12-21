const startButton = document.getElementById("start-button");
const stopButton = document.getElementById("stop-button");
const detectedNoteDiv = document.getElementById("detected-note");
const soundwaveBar = document.getElementById("soundwave-bar");

let stream;
let audioContext;
let analyser;
let bufferLength;
let dataArray;
let yinDetector;
let isListening = false;

startButton.addEventListener("click", async () => {
  if (isListening) return;

  try {
    // Request access to the microphone
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    bufferLength = analyser.fftSize;
    dataArray = new Float32Array(bufferLength);
    yinDetector = Pitchfinder.YIN();

    isListening = true;

    // Disable start button, enable stop button
    startButton.disabled = true;
    stopButton.disabled = false;
    detectedNoteDiv.textContent = "Listening...";

    detectPitch();
  } catch (error) {
    console.error("Error accessing microphone:", error);
    detectedNoteDiv.textContent = "Error accessing microphone!";
  }
});

stopButton.addEventListener("click", () => {
  if (!isListening) return;

  // Stop listening and clean up
  isListening = false;
  startButton.disabled = false;
  stopButton.disabled = true;
  detectedNoteDiv.textContent = "Stopped Listening";
  soundwaveBar.style.height = "100%"; // Reset soundwave height

  // Stop the audio context and microphone stream
  audioContext.close();
  stream.getTracks().forEach(track => track.stop());

  // Wait for 7 seconds, then reset to initial state
  setTimeout(() => {
    detectedNoteDiv.textContent = "Play a chord or note...";
  }, 7000);
});

function detectPitch() {
  if (!isListening) return;

  analyser.getFloatTimeDomainData(dataArray);

  // Get the pitch from the sound data using the YIN algorithm
  const pitch = yinDetector.getPitch(dataArray);
  if (pitch) {
    // Convert pitch frequency to musical note
    const note = Tonal.Note.fromFreq(pitch);
    detectedNoteDiv.textContent = `Detected Note: ${note}`;
  }

  // Update the soundwave bar with the current data
  updateSoundwave();

  // Keep detecting pitch
  requestAnimationFrame(detectPitch);
}

function updateSoundwave() {
  const maxValue = Math.max(...dataArray); // Get the maximum value from the audio data
  const soundwaveHeight = Math.abs(maxValue) * 100; // Scale the value to adjust the height
  soundwaveBar.style.height = `${soundwaveHeight}%`;
}
