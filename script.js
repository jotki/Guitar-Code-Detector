// Import Tonal Library from CDN
import * as Tonal from 'https://cdn.jsdelivr.net/npm/tonal@2.0.1/dist/tonal.js';

// Fake YIN pitch detection setup (if you don't have one already)
// This is a basic version of a YIN detector. You can replace it with a more advanced one.
class YIN {
  constructor(sampleRate) {
    this.sampleRate = sampleRate;
  }

  // Basic pitch detection (you may need a more advanced version)
  getPitch(dataArray) {
    // You should replace this with an actual YIN pitch detection algorithm
    // For now, it just returns a random pitch
    return Math.random() * 1000 + 100; // Random pitch between 100 and 1100 Hz
  }
}

const startButton = document.getElementById("start-button");
const stopButton = document.getElementById("stop-button");
const detectedNoteDiv = document.getElementById("detected-note");
const soundwaveElement = document.getElementById("soundwave");

let stream, audioContext, analyser, source, dataArray, yinDetector, requestId;

// Initial text
detectedNoteDiv.textContent = "Play a chord or note...";

// Start detection button
startButton.addEventListener("click", async () => {
  console.log("Start button clicked"); // Debugging log
  
  // Disable start button and show stop button
  startButton.disabled = true;
  stopButton.style.display = "inline-block";

  // Display confirmation for clicking the Start button
  detectedNoteDiv.textContent = "Started Listening...";

  // Request microphone access
  stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    .then(s => {
      console.log("Microphone access granted"); // Debugging log
      return s;
    })
    .catch(error => {
      console.error('Microphone access denied:', error); // Debugging log
      detectedNoteDiv.textContent = "Microphone access denied!";
      return null;
    });

  if (!stream) {
    return; // Stop if we couldn't get the stream
  }

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
  console.log("Stop button clicked"); // Debugging log
  
  // Disable stop button and show start button again
  stopButton.style.display = "none";
  startButton.disabled = false;

  // Display confirmation for clicking the Stop button
  detectedNoteDiv.textContent = "Stopped Listening";

  // Stop the stream and analyzer
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  // Stop detection process
  if (requestId) {
    cancelAnimationFrame(requestId);
  }

  // Show the initial prompt after 7 seconds
  setTimeout(() => {
    detectedNoteDiv.textContent = "Play a chord or note...";
  }, 7000);
});

// Function to detect note and display the soundwave
function detectNote() {
  analyser.getByteFrequencyData(dataArray); // Get frequency data
  console.log("Frequency Data:", dataArray);  // Log frequency data for debugging

  const pitch = yinDetector.getPitch(dataArray); // Get pitch from the frequency data
  console.log("Pitch detected:", pitch);  // Log pitch for debugging

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
  soundwaveElement.style.height = `${soundwaveHeight}%`;  // Dynamically update the height of the soundwave bar
}
