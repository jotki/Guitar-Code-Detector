const startButton = document.getElementById("start-button");
const stopButton = document.getElementById("stop-button");
const detectedNoteDiv = document.getElementById("detected-note");
const soundwaveBar = document.getElementById("soundwave-bar");

let stream;
let audioContext;
let analyser;
let source;
let requestId;

startButton.addEventListener("click", async () => {
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
    
    // Create a visual representation of the soundwave
    let totalAmplitude = 0;
    for (let i = 0; i < dataArray.length; i++) {
      totalAmplitude += Math.abs(dataArray[i]);
    }
    
    // Map the amplitude to a width for the bar
    const waveWidth = Math.min(totalAmplitude * 1000, soundwaveBar.offsetWidth);  // Scale to fit the bar width

    // Create a new wave bar element
    const wave = document.createElement("div");
    wave.style.width = waveWidth + "px";
    wave.className = "wave";
    
    // Append it to the soundwave bar and remove old waves
    soundwaveBar.appendChild(wave);
    if (soundwaveBar.children.length > 1) {
      soundwaveBar.removeChild(soundwaveBar.children[0]);
    }
  }

  // Function to detect the note and update the display
  function detectNote() {
    analyser.getFloatTimeDomainData(dataArray);

    // Use YIN to detect the pitch from the time-domain data
    const pitch = yinDetector.getPitch(dataArray);

    if (pitch) {
      const note = Tonal.Note.fromFreq(pitch);
      detectedNoteDiv.textContent = `Detected Note: ${note}`;
    } else {
      detectedNoteDiv.textContent = "No note detected...";
    }

    // Update the sound wave display and continue the detection loop
    updateSoundwave();
    requestId = requestAnimationFrame(detectNote);
  }

  detectNote();

  // Show Stop button when detection starts
  stopButton.style.display = "inline-block";
});

stopButton.addEventListener("click", () => {
  // Stop detection
  cancelAnimationFrame(requestId);
  stream.getTracks().forEach(track => track.stop());
  detectedNoteDiv.textContent = "Detection stopped.";
  stopButton.style.display = "none"; // Hide stop button
  soundwaveBar.innerHTML = ""; // Clear the sound wave display
});
