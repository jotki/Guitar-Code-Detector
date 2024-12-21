const startButton = document.getElementById("start-button");
const detectedNoteDiv = document.getElementById("detected-note");
const canvas = document.getElementById("soundwave-bar");
const canvasContext = canvas.getContext("2d");

startButton.addEventListener("click", async () => {
  // Request access to microphone
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = audioContext.createAnalyser();
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);

  const bufferLength = analyser.fftSize;
  const dataArray = new Float32Array(bufferLength);
  const detectPitch = Pitchfinder.AMDF();

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

    requestAnimationFrame(detectNote);
  }

  detectNote();
});
