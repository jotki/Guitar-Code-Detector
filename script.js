const startButton = document.getElementById("start-button");
const stopButton = document.getElementById("stop-button");
const detectedNoteDiv = document.getElementById("detected-note");

let stream, audioContext, analyser, source, dataArray, yinDetector, requestId;

// Initial text
detectedNoteDiv.textContent = "Play a chord or note...";

// Start detection button
startButton.addEventListener("click", async () => {
  // Disable start button and show stop button
  startButton.disabled = true;
  stopButton.style.display = "inline-block";

  // Request microphone access
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);

  const bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);

  // Initialize YIN pitch detection
  yinDetector = new YIN(audioContext.sampleRate);

  // Update text
  detectedNoteDiv.textContent = "Listening...";

  // Start detecting
  detectNote();
});

// Stop detection button
stopButton.addEventListener("click", () => {
  // Disable stop button and show start button again
  stopButton.style.display = "none";
  startButton.disabled = false;

  // Stop the stream and analyzer
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  // Stop detection process
  cancelAnimationFrame(requestId);
  
  // Show stopped message
  detectedNoteDiv.textContent = "Stopped Listening";
  
  // Show the initial prompt after 7 seconds
  setTimeout(() => {
    detectedNoteDiv.textContent = "Play a chord or note...";
  }, 7000);
});

// Function to detect note and display the soundwave
function detectNote() {
  analyser.getByteFrequencyData(dataArray); // Use frequency-domain data
  const pitch = yinDetector.getPitch(dataArray); // Get pitch from the frequency data

  if (pitch) {
    // Convert pitch to note
    const note = Tonal.Note.fromFreq(pitch);
    detectedNoteDiv.textContent = `Detected Note: ${note}`;

    // Debugging: Log detected pitch and note
    console.log('Pitch detected:', pitch);
    console.log('Note:', note);
  } else {
    detectedNoteDiv.textContent = "No note detected...";
  }

  updateSoundwave();
  requestId = requestAnimationFrame(detectNote);
}

// Function to update the soundwave visualization
function updateSoundwave() {
  const maxValue = Math.max(...dataArray);  // Get the max frequency value from the array
  const soundwaveHeight = (maxValue / 255) * 100; // Scale the max value to a percentage (0-100)

  // Update soundwave visual (adjusting its height based on max sound level)
  const soundwaveElement = document.getElementById("soundwave");
  soundwaveElement.style.height = `${soundwaveHeight}%`;  // Dynamically update the height of the soundwave bar
}
