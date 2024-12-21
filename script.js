const startButton = document.getElementById("start-button");
const stopButton = document.getElementById("stop-button");
const detectedNoteDiv = document.getElementById("detected-note");
const canvas = document.getElementById("soundwave-bar");
const canvasContext = canvas.getContext("2d");

let audioContext, analyser, source, stream, animationFrameId;

startButton.addEventListener("click", async () => {
  // Request access to microphone
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);

  const bufferLength = analyser.fftSize;
  const dataArray = new Float32Array(bufferLength);
  const detectPitch = Pitchfinder.AMDF();

  // Hide the start button and show stop button
  startButton.style.display = "none";
  stopButton.style.display = "inline-block";

  function detectNote() {
    analyser.getFloatTimeDomainData(dataArray);
    const pitch = detectPitch(dataArray, audioContext.sampleRate);

    if (pitch) {
      const note = Tonal.Note.fromFreq(pitch);
      detectedNoteDiv.textContent = `Detected Note: ${note}`;
    } else {
      detectedNoteDiv.textContent = "No note detected...";
    }

    // Update soundwave bar
    analyser.getByteFrequencyData(dataArray);
    canvasContext.clearRect(0, 0, canvas.width, canvas.height); // Clear previous frame

    // Draw new soundwave data
    const barWidth = canvas.width / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = dataArray[i];
      canvasContext.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
      canvasContext.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
      x += barWidth;
    }

    // Call detectNote again for the next frame
    animationFrameId = requestAnimationFrame(detectNote);
  }

  detectNote();
});

// Stop detection
stopButton.addEventListener("click", () => {
  // Stop audio and cancel the animation frame
  if (audioContext) {
    audioContext.close();
  }
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  cancelAnimationFrame(animationFrameId);

  // Hide the stop button and show the start button
  startButton.style.display = "inline-block";
  stopButton.style.display = "none";

  // Reset display
  detectedNoteDiv.textContent = "Detection stopped.";
});
