export const speak = (text) => {
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('Speech synthesis failed:', err);
  }
};

export const listen = (onResult, onError) => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    onError(new Error('Speech Recognition not supported'));
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.onresult = (event) => {
    const command = event.results[0][0].transcript.toLowerCase();
    onResult(command);
  };
  recognition.onerror = (err) => {
    onError(err);
  };
  recognition.start();
};