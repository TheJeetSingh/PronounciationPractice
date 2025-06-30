'use client';

import { useState, useRef, useCallback, useMemo, useEffect, createContext, useContext } from 'react';
import { 
  MicrophoneIcon, 
  SpeakerWaveIcon, 
  ArrowPathIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ChartBarIcon,
  AcademicCapIcon,
  SparklesIcon
} from '@heroicons/react/24/solid';
import Recorder from 'recorder-js';

// Create a theme context
const ThemeContext = createContext<{
  isDarkMode: boolean;
  toggleTheme: () => void;
}>({
  isDarkMode: true,
  toggleTheme: () => {},
});

// Custom hooks
const useAudioContext = () => {
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const initializeAudio = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        latencyHint: 'interactive',
        sampleRate: 16000
      });
      setIsAudioInitialized(true);
    }
    return audioContextRef.current;
  }, []);

  return { audioContextRef, isAudioInitialized, initializeAudio };
};

const useAnimatedScore = (initialScore: number | null) => {
  const [displayScore, setDisplayScore] = useState<number | null>(initialScore);
  
  useEffect(() => {
    if (initialScore === null) {
      setDisplayScore(null);
      return;
    }

    let frame = 0;
    const totalFrames = 60;
    const animate = () => {
      frame++;
      const progress = frame / totalFrames;
      setDisplayScore(Math.min(initialScore * progress, initialScore));
      
      if (frame < totalFrames) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [initialScore]);

  return displayScore;
};

// Enhanced utility functions
const calculateScoreColor = (score: number): string => {
  if (score >= 90) return 'text-emerald-400 dark:text-emerald-300';
  if (score >= 80) return 'text-green-400 dark:text-green-300';
  if (score >= 70) return 'text-yellow-400 dark:text-yellow-300';
  return 'text-red-400 dark:text-red-300';
};

const formatScore = (score: number): string => {
  return `${Math.round(score)}%`;
};

const getScoreEmoji = (score: number): string => {
  if (score >= 90) return '🌟';
  if (score >= 80) return '✨';
  if (score >= 70) return '👍';
  return '💪';
};

const getFeedbackMessage = (score: number): string => {
  if (score >= 90) return 'Outstanding pronunciation! Keep up the excellent work!';
  if (score >= 80) return 'Great job! You\'re getting really good at this!';
  if (score >= 70) return 'Good effort! Practice makes perfect!';
  return 'Keep practicing! You\'ll improve with time!';
};

const getProgressLevel = (score: number): string => {
  if (score >= 90) return 'Expert';
  if (score >= 80) return 'Advanced';
  if (score >= 70) return 'Intermediate';
  return 'Beginner';
};

// Enhanced mouth animation component
function MouthAnimation({ isPlaying }: { isPlaying: boolean }) {
  const animationStyles = useMemo(() => ({
    transform: isPlaying ? 'scale(1.05)' : 'scale(1)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  }), [isPlaying]);

  return (
    <div 
      className="w-24 h-24 bg-white rounded-xl shadow-lg p-4 relative hover:shadow-xl transition-all duration-300"
      style={animationStyles}
    >
      <svg
        viewBox="0 0 100 100"
        className={`w-full h-full ${isPlaying ? 'animate-mouth' : ''}`}
      >
        <path
          d={`M20,50 Q50,${isPlaying ? '70' : '50'} 80,50`}
          stroke="#333"
          strokeWidth="3"
          fill="none"
          className="transition-all duration-200"
        />
        <circle cx="35" cy="35" r="5" fill="#333" className="animate-pulse" />
        <circle cx="65" cy="35" r="5" fill="#333" className="animate-pulse" />
      </svg>
    </div>
  );
}

// Score card component with enhanced animations
function ScoreCard({ label, score, icon: Icon }: { label: string; score: number; icon: any }) {
  const scoreColor = calculateScoreColor(score);
  const animatedScore = useAnimatedScore(score);
  
  return (
    <div className="score-card text-center transform hover:scale-105 transition-all duration-200 bg-opacity-10 bg-white backdrop-blur-sm rounded-xl p-4 shadow-lg">
      <div className="text-gray-400 text-sm uppercase tracking-wider font-medium mb-2 flex items-center justify-center space-x-2">
        <Icon className="w-5 h-5" />
        <span>{label}</span>
        <span>{getScoreEmoji(score)}</span>
      </div>
      <div className={`text-2xl font-bold ${scoreColor} flex items-center justify-center space-x-2`}>
        <span className="tabular-nums">{formatScore(animatedScore || 0)}</span>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        {getProgressLevel(score)}
      </div>
    </div>
  );
}

// Progress bar component
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
      <div 
        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// Add stats interface
interface PracticeStats {
  totalAttempts: number;
  successfulAttempts: number;
  currentStreak: number;
  bestStreak: number;
  averageScore: number;
}

// Sidebar stats component
function SidebarStats({ stats }: { stats: PracticeStats }) {
  return (
    <div className="bg-opacity-10 bg-white backdrop-blur-sm rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-semibold text-blue-400 flex items-center space-x-2">
        <ChartBarIcon className="w-5 h-5" />
        <span>Practice Stats</span>
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Total Attempts</span>
          <span className="text-lg font-semibold">{stats.totalAttempts}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Success Rate</span>
          <span className="text-lg font-semibold text-green-400">
            {Math.round((stats.successfulAttempts / stats.totalAttempts) * 100) || 0}%
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Current Streak</span>
          <span className="text-lg font-semibold text-yellow-400">
            {stats.currentStreak} 🔥
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Best Streak</span>
          <span className="text-lg font-semibold text-purple-400">
            {stats.bestStreak} ⭐
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Average Score</span>
          <span className="text-lg font-semibold text-blue-400">
            {Math.round(stats.averageScore)}%
          </span>
        </div>
      </div>
    </div>
  );
}

// Recent words component
function RecentWords({ words }: { words: string[] }) {
  return (
    <div className="bg-opacity-10 bg-white backdrop-blur-sm rounded-xl p-6">
      <h3 className="text-lg font-semibold text-blue-400 flex items-center space-x-2 mb-4">
        <AcademicCapIcon className="w-5 h-5" />
        <span>Recent Words</span>
      </h3>
      <div className="space-y-2">
        {words.map((word, index) => (
          <div 
            key={index}
            className="flex items-center space-x-2 p-2 rounded-lg bg-opacity-5 bg-white hover:bg-opacity-10 transition-all duration-200"
          >
            <span className="text-gray-400">{index + 1}.</span>
            <span>{word}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Tips component
function PracticeTips() {
  const tips = [
    "Listen carefully to the pronunciation before practicing",
    "Try to match the speed and rhythm of the audio",
    "Practice in a quiet environment for better results",
    "Take your time - accuracy is more important than speed",
    "Regular practice leads to better pronunciation"
  ];

  return (
    <div className="bg-opacity-10 bg-white backdrop-blur-sm rounded-xl p-6">
      <h3 className="text-lg font-semibold text-blue-400 flex items-center space-x-2 mb-4">
        <SparklesIcon className="w-5 h-5" />
        <span>Pro Tips</span>
      </h3>
      <ul className="space-y-2">
        {tips.map((tip, index) => (
          <li key={index} className="flex items-start space-x-2">
            <span className="text-blue-400">•</span>
            <span className="text-gray-300 text-sm">{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [currentWord, setCurrentWord] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [recognizedText, setRecognizedText] = useState('');
  const [detailedScores, setDetailedScores] = useState<{
    accuracyScore: number;
    completenessScore: number;
    fluencyScore: number;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessionProgress, setSessionProgress] = useState(0);
  const recorderRef = useRef<Recorder | null>(null);
  const { audioContextRef, initializeAudio } = useAudioContext();

  // Add new state
  const [recentWords, setRecentWords] = useState<string[]>([]);
  const [stats, setStats] = useState<PracticeStats>({
    totalAttempts: 0,
    successfulAttempts: 0,
    currentStreak: 0,
    bestStreak: 0,
    averageScore: 0
  });

  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const themeValue = useMemo(() => ({
    isDarkMode,
    toggleTheme
  }), [isDarkMode, toggleTheme]);

  const generateNewWord = useCallback(async () => {
    // Prevent generating a new word if the user hasn't attempted the current one
    if (currentWord && score === null) {
      alert('Please practice pronouncing the current word before generating a new one.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-word', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setCurrentWord(data.word);
      setRecentWords(prev => [data.word, ...prev].slice(0, 5));
      setScore(null);
      setFeedback('');
      setRecognizedText('');
      setDetailedScores(null);
      setSessionProgress(prev => Math.min(prev + 10, 100));
      
      await fetch('/api/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: data.word })
      });
    } catch (error) {
      console.error('Error generating word:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentWord, score]);

  const startRecording = useCallback(async () => {
    try {
      await initializeAudio();
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true
      });
      
      recorderRef.current = new Recorder(audioContextRef.current!, {
        numChannels: 1,
        sampleRate: 16000
      });
      
      await recorderRef.current.init(stream);
      recorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, [initializeAudio]);

  const stopRecording = useCallback(async () => {
    try {
      if (!recorderRef.current) return;

      const { blob } = await recorderRef.current.stop();
      setIsRecording(false);

      const formData = new FormData();
      formData.append('audio', blob, 'recording.wav');
      formData.append('word', currentWord);
      formData.append('timestamp', Date.now().toString());

      const response = await fetch('/api/check-pronunciation', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      const newScore = data.score;
      setScore(newScore);
      setFeedback(getFeedbackMessage(newScore));
      setRecognizedText(data.recognizedText || '');
      setDetailedScores({
        accuracyScore: data.accuracyScore,
        completenessScore: data.completenessScore,
        fluencyScore: data.fluencyScore
      });

      // Update stats
      setStats(prev => {
        const isSuccessful = newScore >= 80;
        const newStreak = isSuccessful ? prev.currentStreak + 1 : 0;
        return {
          totalAttempts: prev.totalAttempts + 1,
          successfulAttempts: prev.successfulAttempts + (isSuccessful ? 1 : 0),
          currentStreak: newStreak,
          bestStreak: Math.max(prev.bestStreak, newStreak),
          averageScore: (prev.averageScore * prev.totalAttempts + newScore) / (prev.totalAttempts + 1)
        };
      });
    } catch (error) {
      console.error('Error stopping recording or checking pronunciation:', error);
    }
  }, [currentWord]);

  const playReference = useCallback(async () => {
    try {
      setIsPlaying(true);
      const audio = new Audio('/api/play-reference');
      audio.volume = 1.0;
      await audio.play();
      audio.onended = () => setIsPlaying(false);
    } catch (error) {
      console.error('Error playing reference audio:', error);
      setIsPlaying(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (recorderRef.current) {
        recorderRef.current.stop();
      }
    };
  }, []);

  // Add keyboard shortcut handler
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Prevent handling if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case ' ':
          event.preventDefault();
          if (!isLoading && !isRecording && !(currentWord !== '' && score === null)) {
            generateNewWord();
          }
          break;
        case 'l':
          event.preventDefault();
          if (!isPlaying && !isRecording) {
            playReference();
          }
          break;
        case 'r':
          event.preventDefault();
          if (isRecording) {
            stopRecording();
          } else if (!isPlaying) {
            startRecording();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [generateNewWord, playReference, startRecording, stopRecording, isLoading, isPlaying, isRecording, currentWord, score]);

  const buttonBaseClasses = useMemo(() => 
    "btn-primary flex items-center space-x-2 transform hover:scale-105 transition-all duration-200 relative overflow-hidden", 
    []
  );

  return (
    <ThemeContext.Provider value={themeValue}>
      <div className={`min-h-screen w-full fixed inset-0 overflow-auto transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white' 
          : 'bg-gradient-to-br from-blue-50 via-white to-blue-50 text-gray-900'
      }`}>
        {/* Header */}
        <header className="sticky top-0 left-0 right-0 z-50 backdrop-blur-md bg-opacity-50 bg-black border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-blue-400 flex items-center space-x-2">
              <AcademicCapIcon className="w-8 h-8" />
              <span>Pronunciation Practice</span>
            </h1>
            <div className="flex items-center space-x-4">
              <div className="w-48">
                <ProgressBar progress={sessionProgress} />
              </div>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-opacity-10 hover:bg-white transition-all duration-200"
              >
                <SparklesIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 w-full h-[calc(100vh-4rem)] overflow-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto h-full">
            <div className="grid grid-cols-12 gap-6 h-full">
              {/* Left sidebar */}
              <div className="col-span-12 lg:col-span-3 space-y-6">
                <SidebarStats stats={stats} />
                <PracticeTips />
              </div>

              {/* Main practice area */}
              <div className="col-span-12 lg:col-span-6">
                <div className="card glass-effect fade-in backdrop-blur-lg border border-opacity-20 border-white h-full">
                  <div className="flex flex-col items-center space-y-8 p-8">
                    <button
                      onClick={generateNewWord}
                      className={`${buttonBaseClasses} w-full sm:w-auto ${
                        currentWord && score === null ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      disabled={isLoading || (currentWord !== '' && score === null)}
                    >
                      {isLoading ? (
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <span>Generate New Word</span>
                          <ArrowPathIcon className="w-5 h-5 transform group-hover:rotate-180 transition-transform duration-300" />
                        </>
                      )}
                    </button>

                    {currentWord && (
                      <div className="text-center space-y-8 w-full fade-in">
                        <div className="flex flex-col items-center space-y-6">
                          <h2 className="text-5xl font-bold text-gradient animate-pulse">
                            {currentWord}
                          </h2>
                          
                          <div className="flex justify-center mt-4 transform hover:scale-105 transition-all duration-300">
                            <MouthAnimation isPlaying={isPlaying} />
                          </div>

                          <div className="flex justify-center space-x-4 mt-4">
                            <button
                              onClick={playReference}
                              className={`${buttonBaseClasses} group`}
                              disabled={isPlaying}
                            >
                              <SpeakerWaveIcon className="w-5 h-5 group-hover:animate-bounce" />
                              <span>{isPlaying ? 'Playing...' : 'Listen'}</span>
                            </button>

                            <button
                              onClick={isRecording ? stopRecording : startRecording}
                              className={`${buttonBaseClasses} 
                                ${isRecording ? 'bg-red-600 hover:bg-red-700 animate-pulse' : ''}`}
                            >
                              <MicrophoneIcon className="w-5 h-5" />
                              <span>{isRecording ? 'Stop' : 'Practice'}</span>
                            </button>
                          </div>
                        </div>

                        {currentWord && score === null && (
                          <div className="text-amber-400 flex items-center justify-center space-x-2 mt-4 animate-pulse">
                            <XCircleIcon className="w-5 h-5" />
                            <span>Please practice this word before continuing</span>
                          </div>
                        )}

                        {score !== null && (
                          <div className="mt-8 space-y-8 animate-fade-in">
                            <div className="feedback-panel backdrop-blur-sm p-6 rounded-xl border border-opacity-20 border-white">
                              <div className="space-y-4">
                                <div className="text-lg flex items-center justify-center space-x-2">
                                  <span className="font-medium">You said: </span>
                                  <span className={`${
                                    recognizedText.toLowerCase() === currentWord.toLowerCase() 
                                      ? 'text-green-400 flex items-center space-x-1' 
                                      : 'text-red-400 flex items-center space-x-1'
                                  }`}>
                                    <span>{recognizedText || '(no speech detected)'}</span>
                                    {recognizedText.toLowerCase() === currentWord.toLowerCase() ? 
                                      <CheckCircleIcon className="w-5 h-5" /> : 
                                      <XCircleIcon className="w-5 h-5" />
                                    }
                                  </span>
                                </div>
                                
                                <div className="text-xl font-semibold flex items-center justify-center space-x-2">
                                  <span>Overall Score:</span>
                                  <span className={calculateScoreColor(score)}>
                                    {formatScore(score)} {getScoreEmoji(score)}
                                  </span>
                                </div>

                                <p className="text-gray-300 italic text-center">
                                  {feedback}
                                </p>
                              </div>
                            </div>

                            {detailedScores && (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <ScoreCard 
                                  label="Accuracy" 
                                  score={detailedScores.accuracyScore}
                                  icon={ChartBarIcon}
                                />
                                <ScoreCard 
                                  label="Completeness" 
                                  score={detailedScores.completenessScore}
                                  icon={CheckCircleIcon}
                                />
                                <ScoreCard 
                                  label="Fluency" 
                                  score={detailedScores.fluencyScore}
                                  icon={SparklesIcon}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right sidebar */}
              <div className="col-span-12 lg:col-span-3 space-y-6">
                <RecentWords words={recentWords} />
                <div className="bg-opacity-10 bg-white backdrop-blur-sm rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-blue-400 flex items-center space-x-2 mb-4">
                    <SparklesIcon className="w-5 h-5" />
                    <span>Keyboard Shortcuts</span>
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Generate Word</span>
                      <kbd className="px-2 py-1 bg-gray-800 rounded text-sm">Space</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Listen</span>
                      <kbd className="px-2 py-1 bg-gray-800 rounded text-sm">L</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Start/Stop Recording</span>
                      <kbd className="px-2 py-1 bg-gray-800 rounded text-sm">R</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ThemeContext.Provider>
  );
}
