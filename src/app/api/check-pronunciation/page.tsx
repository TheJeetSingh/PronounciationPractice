'use client';


import { useState, useRef } from 'react';
import { MicrophoneIcon, SpeakerWaveIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import Recorder from 'recorder-js';


// Add mouth animation component
function MouthAnimation({ isPlaying }: { isPlaying: boolean }) {
 return (
   <div className="w-24 h-24 bg-white rounded-xl shadow-lg p-4 relative">
     <svg
       viewBox="0 0 100 100"
       className={`w-full h-full ${isPlaying ? 'animate-mouth' : ''}`}
     >
       <path
         d="M20,50 Q50,${isPlaying ? '70' : '50'} 80,50"
         stroke="#333"
         strokeWidth="3"
         fill="none"
       />
     </svg>
   </div>
 );
}


export default function Home() {
 const [isRecording, setIsRecording] = useState(false);
 const [currentWord, setCurrentWord] = useState('');
 const [score, setScore] = useState<number | null>(null);
 const [isLoading, setIsLoading] = useState(false);
 const [feedback, setFeedback] = useState('');
 const [recognizedText, setRecognizedText] = useState('');
 const [mispronunciations, setMispronunciations] = useState<string[]>([]);
 const [showImprovementTips, setShowImprovementTips] = useState<{[key: string]: boolean}>({});
 const [detailedScores, setDetailedScores] = useState<{
   accuracyScore: number;
   completenessScore: number;
   fluencyScore: number;
 } | null>(null);
 const [isPlaying, setIsPlaying] = useState(false);
 const audioContextRef = useRef<AudioContext | null>(null);
 const recorderRef = useRef<Recorder | null>(null);


 const generateNewWord = async () => {
   setIsLoading(true);
   try {
     const response = await fetch('/api/generate-word', {
       method: 'POST'
     });
     const data = await response.json();
     setCurrentWord(data.word);
     // Generate pronunciation audio using ElevenLabs
     await fetch('/api/generate-audio', {
       method: 'POST',
       body: JSON.stringify({ text: data.word })
     });
   } catch (error) {
     console.error('Error generating word:', error);
   }
   setIsLoading(false);
 };


 const startRecording = async () => {
   try {
     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
     audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
     recorderRef.current = new Recorder(audioContextRef.current, {
       numChannels: 1,
       sampleRate: 16000
     });
     await recorderRef.current.init(stream);
     recorderRef.current.start();
     setIsRecording(true);
   } catch (error) {
     console.error('Error starting recording:', error);
   }
 };


 const stopRecording = async () => {
   try {
     if (!recorderRef.current) return;


     const { blob } = await recorderRef.current.stop();
     setIsRecording(false);


     const formData = new FormData();
     formData.append('audio', blob, 'recording.wav');
     formData.append('word', currentWord);


     const response = await fetch('/api/check-pronunciation', {
       method: 'POST',
       body: formData
     });


     const data = await response.json();
     setScore(data.score);
     setFeedback(data.feedback);
     setRecognizedText(data.recognizedText || '');
     setDetailedScores({
       accuracyScore: data.accuracyScore,
       completenessScore: data.completenessScore,
       fluencyScore: data.fluencyScore
     });
     // Simple comparison to find mispronounced syllables
     const targetSyllables = getSyllables(currentWord);
     const recognizedSyllables = getSyllables(data.recognizedText || '');
     const mismatches = targetSyllables.filter((syllable, index) =>
       !recognizedSyllables[index] || recognizedSyllables[index] !== syllable
     );
     setMispronunciations(mismatches);
     setShowImprovementTips(Object.fromEntries(mismatches.map(s => [s, false])));
   } catch (error) {
     console.error('Error stopping recording or checking pronunciation:', error);
   }
 };


 const playReference = async () => {
   try {
     setIsPlaying(true);
     const audio = new Audio('/api/play-reference');
     await audio.play();
     audio.onended = () => setIsPlaying(false);
   } catch (error) {
     console.error('Error playing reference audio:', error);
     setIsPlaying(false);
   }
 };


 // Function to split word into syllables (simplified version)
 const getSyllables = (word: string) => {
   // This is a simplified syllable split - you might want to use a proper library
   return word.toLowerCase().split(/(?=[aeiou])/gi);
 };


 const getImprovementTips = (syllable: string) => {
   // You could make this more sophisticated with actual phonetic rules
   return [
     `Listen carefully to how the reference audio pronounces "${syllable}"`,
     `Try breaking down the sound into smaller parts`,
     `Practice saying it slowly, then speed up gradually`,
   ];
 };


 return (
   <div className="flex flex-col items-center justify-center min-h-[80vh]">
     <div className="card w-full max-w-2xl">
       <h1 className="text-3xl font-bold text-center mb-8 text-blue-600">
         Pronunciation Practice
       </h1>


       <div className="flex flex-col items-center space-y-8">
         <button
           onClick={generateNewWord}
           className="btn-primary flex items-center space-x-2"
           disabled={isLoading}
         >
           {isLoading ? (
             <ArrowPathIcon className="w-5 h-5 animate-spin" />
           ) : (
             'Generate New Word'
           )}
         </button>


         {currentWord && (
           <div className="text-center space-y-6">
             <div className="flex flex-col items-center space-y-4">
               <h2 className="text-2xl font-semibold">{currentWord}</h2>
              
               <div className="text-xl text-gray-600">
                 Sounds like
               </div>
              
               <div className="flex items-center justify-center space-x-2 text-2xl">
                 {getSyllables(currentWord).map((syllable, index) => (
                   <>
                     <span key={index} className="text-gray-700">{syllable}</span>
                     {index < getSyllables(currentWord).length - 1 && (
                       <span className="text-gray-400">·</span>
                     )}
                   </>
                 ))}
               </div>


               <div className="flex justify-center mt-4">
                 <MouthAnimation isPlaying={isPlaying} />
               </div>


               <div className="flex justify-center space-x-4 mt-4">
                 <button
                   onClick={playReference}
                   className="btn-primary flex items-center space-x-2"
                   disabled={isPlaying}
                 >
                   <SpeakerWaveIcon className="w-5 h-5" />
                   <span>{isPlaying ? 'Playing...' : 'Listen'}</span>
                 </button>


                 <button
                   onClick={isRecording ? stopRecording : startRecording}
                   className={`btn-primary flex items-center space-x-2
                     ${isRecording ? 'bg-red-600 hover:bg-red-700' : ''}`}
                 >
                   <MicrophoneIcon className="w-5 h-5" />
                   <span>{isRecording ? 'Stop' : 'Practice'}</span>
                 </button>
               </div>
             </div>


             {score !== null && (
               <div className="mt-6 space-y-4">
                 <div className="bg-gray-900 text-white p-6 rounded-xl space-y-6">
                   <div className="space-y-4">
                     <div className="text-gray-400 text-sm">
                       Sounds like
                     </div>
                     <div className="flex items-center space-x-2 text-2xl">
                       {getSyllables(currentWord).map((syllable, index) => (
                         <>
                           <span key={`target-${index}`} className="text-white">
                             {syllable}
                           </span>
                           {index < getSyllables(currentWord).length - 1 && (
                             <span className="text-gray-600">·</span>
                           )}
                         </>
                       ))}
                       <button
                         onClick={playReference}
                         className="ml-2 text-gray-400 hover:text-white"
                         disabled={isPlaying}
                       >
                         <SpeakerWaveIcon className="w-5 h-5" />
                       </button>
                     </div>


                     {recognizedText && (
                       <>
                         <div className="text-gray-400 text-sm mt-6">
                           Sounds like you said
                         </div>
                         <div className="flex items-center space-x-2 text-2xl">
                           {getSyllables(recognizedText).map((syllable, index) => (
                             <>
                               <span
                                 key={`said-${index}`}
                                 className={
                                   mispronunciations.includes(getSyllables(currentWord)[index])
                                     ? 'text-red-400'
                                     : 'text-white'
                                 }
                               >
                                 {syllable}
                               </span>
                               {index < getSyllables(recognizedText).length - 1 && (
                                 <span className="text-gray-600">·</span>
                               )}
                             </>
                           ))}
                         </div>
                       </>
                     )}
                   </div>


                   {mispronunciations.map(syllable => (
                     <div
                       key={syllable}
                       className="bg-gray-800 rounded-lg p-4"
                     >
                       <button
                         onClick={() => setShowImprovementTips(prev => ({
                           ...prev,
                           [syllable]: !prev[syllable]
                         }))}
                         className="flex items-center justify-between w-full text-left"
                       >
                         <span>You may have mispronounced "{syllable}"</span>
                         <span className="text-gray-400">
                           {showImprovementTips[syllable] ? '▼' : '▶'}
                         </span>
                       </button>
                      
                       {showImprovementTips[syllable] && (
                         <div className="mt-3 space-y-2 text-gray-400">
                           <div className="font-medium text-white">How to improve:</div>
                           <ul className="list-disc list-inside space-y-1">
                             {getImprovementTips(syllable).map((tip, i) => (
                               <li key={i}>{tip}</li>
                             ))}
                           </ul>
                         </div>
                       )}
                     </div>
                   ))}
                 </div>


                 {detailedScores && (
                   <div className="space-y-2 text-sm mt-6">
                     <div className="grid grid-cols-3 gap-4">
                       <div className="text-center">
                         <div className="font-semibold">Accuracy</div>
                         <div className={`${
                           detailedScores.accuracyScore >= 80
                             ? 'text-green-600'
                             : 'text-red-600'
                         }`}>
                           {Math.round(detailedScores.accuracyScore)}%
                         </div>
                       </div>
                       <div className="text-center">
                         <div className="font-semibold">Completeness</div>
                         <div className={`${
                           detailedScores.completenessScore >= 80
                             ? 'text-green-600'
                             : 'text-red-600'
                         }`}>
                           {Math.round(detailedScores.completenessScore)}%
                         </div>
                       </div>
                       <div className="text-center">
                         <div className="font-semibold">Fluency</div>
                         <div className={`${
                           detailedScores.fluencyScore >= 80
                             ? 'text-green-600'
                             : 'text-red-600'
                         }`}>
                           {Math.round(detailedScores.fluencyScore)}%
                         </div>
                       </div>
                     </div>
                   </div>
                 )}
               </div>
             )}
           </div>
         )}
       </div>
     </div>
   </div>
 );
}
