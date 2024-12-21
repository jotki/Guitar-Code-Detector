const startButton = document.getElementById("start-button");
const detectedNoteDiv = document.getElementById("detected-note");

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

    requestAnimationFrame(detectNote);
  }

  detectNote();
});
