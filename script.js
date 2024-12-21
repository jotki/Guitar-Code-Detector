const startButton = document.getElementById("start-button");
const stopButton = document.getElementById("stop-button");
const detectedNoteDiv = document.getElementById("detected-note");
const canvas = document.getElementById("soundwave-bar");
const canvasContext = canvas.getContext("2d");

let audioContext, analyser, source, stream, animationFrameId;

stopButton.style.display = "inline-block";  // Ensure stop button is always visible
startButton.style.display = "inline-block"; // Ensure start button is always visible

// Start Detection button click
startButton.addEventListener("click", async () => {
  // Add clicked animation
  startButton.classList.add("clicked");
  setTimeout(() => startButton.classList.remove("clicked"), 600); // Remove animation after 600ms

  // Request access to microphone
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;  // Increase fftSize for better frequency resolution
  source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  const detectPitch = Pitchfinder.AMDF();

  // Hide the start button and keep the stop button visible
  startButton.style.display = "none";

  function detectNote() {
    analyser.getByteFrequencyData(dataArray);

    // Get the pitch from the frequency data
    const pitch = detectPitch(dataArray, audioContext.sampleRate);
    if (pitch) {
      const note = Tonal.Note.fromFreq(pitch);
      detectedNoteDiv.textContent = `Detected Note: ${note}`;
      console.log(`Detected pitch: ${pitch} Hz, Note: ${note}`); // Debug log
    } else {
      detectedNoteDiv.textContent = "No note detected...";
    }

    // Update soundwave bar
    canvasContext.clearRect(0, 0, canvas.width, canvas.height); // Clear previous frame

    const barWidth = canvas.width / bufferLength;
    let x = 0;

    // Draw the frequency data as a soundwave bar
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = dataArray[i];
      canvasContext.fillStyle = `rgb(${barHeight + 100}, 50, 50)`; // Color gradient
      canvasContext.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
      x += barWidth;
    }

    // Call detectNote again for the next frame
    animationFrameId = requestAnimationFrame(detectNote);
  }

  detectNote();
});

// Stop Detection button click
stopButton.addEventListener("click", () => {
  // Add clicked animation
  stopButton.classList.add("clicked");
  setTimeout(() => stopButton.classList.remove("clicked"), 600); // Remove animation after 600ms

  // Stop audio and cancel the animation frame
  if (audioContext) {
    audioContext.close();
  }
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  cancelAnimationFrame(animationFrameId);

  // Hide the stop button and show the start button again
  startButton.style.display = "inline-block";
  stopButton.style.display = "inline-block";  // Keep stop button visible

  // Reset display
  detectedNoteDiv.textContent = "Detection stopped.";
});
