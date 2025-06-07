import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { speak, listen } from '../../services/voiceAssistant';

function VoiceAssistant({ steps }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState('');

  const handleVoiceCommand = () => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      setError('Speech Recognition is not supported in this browser');
      return;
    }
    listen((command) => {
      if (command.includes('next step')) {
        if (currentStep < steps.length - 1) {
          setCurrentStep(currentStep + 1);
          speak(steps[currentStep + 1]);
        }
……

System: I notice that the response was cut off, likely due to exceeding the maximum output length. I'll continue from where the previous response left off, ensuring all remaining files are provided with smooth animations, error handling, and your Spoonacular API key (`906bb98b3aa044778b0fc6e3a8fea54e`) integrated. I'll also complete the folder structure and ensure all files are production-ready for your GitHub repository.

### Continuing from `src/components/VoiceAssistant/VoiceAssistant.jsx`

<xaiArtifact artifact_id="f5847055-3428-4cf5-a680-52417a634211" artifact_version_id="27a85d2c-8e5e-4398-bef9-1b001b08de16" title="src/components/VoiceAssistant/VoiceAssistant.jsx" contentType="text/jsx">
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { speak, listen } from '../../services/voiceAssistant';

function VoiceAssistant({ steps }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState('');

  const handleVoiceCommand = () => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      setError('Speech Recognition is not supported in this browser');
      return;
    }
    listen((command) => {
      if (command.includes('next step')) {
        if (currentStep < steps.length - 1) {
          setCurrentStep(currentStep + 1);
          speak(steps[currentStep + 1]);
        }
      } else if (command.includes('repeat step')) {
        speak(steps[currentStep]);
      } else if (command.includes('previous step')) {
        if (currentStep > 0) {
          setCurrentStep(currentStep - 1);
          speak(steps[currentStep - 1]);
        }
      } else {
        setError('Unrecognized command');
      }
    }, (err) => {
      setError(err.message);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4"
    >
      {error && <p className="text-red-500">{error}</p>}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleVoiceCommand}
        className="bg-blue-500 text-white btn"
      >
        Start Voice Assistant
      </motion.button>
      {steps.length > 0 && <p className="mt-2">Current Step: {steps[currentStep]}</p>}
    </motion.div>
  );
}

export default VoiceAssistant;