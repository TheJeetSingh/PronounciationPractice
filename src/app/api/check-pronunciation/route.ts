import { NextRequest, NextResponse } from 'next/server';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION;

interface PhonemeAssessment {
  Phoneme: string;
  AccuracyScore: number;
  Duration: number;
  Offset: number;
}

interface WordAssessment {
  Word: string;
  AccuracyScore: number;
  ErrorType: string;
  Duration: number;
  Offset: number;
  Phonemes: PhonemeAssessment[];
}

interface DetailResult {
  PronunciationAssessment: {
    AccuracyScore: number;
    CompletenessScore: number;
    FluencyScore: number;
    Words: WordAssessment[];
  };
}

interface SyllableAssessment {
  syllable: string;
  isCorrect: boolean;
  accuracyScore: number;
  tips: string[];
}

function splitIntoSyllables(word: string): string[] {
  // This is a more sophisticated syllable splitter
  // It uses common English syllable patterns
  const vowels = 'aeiouy';
  const word_lower = word.toLowerCase();
  let syllables: string[] = [];
  let current_syllable = '';
  let prev_was_vowel = false;

  for (let i = 0; i < word_lower.length; i++) {
    const char = word_lower[i];
    const is_vowel = vowels.includes(char);
    
    if (is_vowel && prev_was_vowel) {
      // Split between two vowels unless it's a common diphthong
      const diphthongs = ['ai', 'ay', 'ea', 'ee', 'ei', 'ey', 'ie', 'oa', 'oe', 'oi', 'oo', 'ou', 'oy', 'ue', 'ui'];
      const potential_diphthong = word_lower[i - 1] + char;
      if (!diphthongs.includes(potential_diphthong)) {
        syllables.push(current_syllable);
        current_syllable = char;
      } else {
        current_syllable += char;
      }
    } else if (!is_vowel && prev_was_vowel && i < word_lower.length - 1) {
      // Split after a vowel before a consonant, unless it's the last consonant
      if (i < word_lower.length - 2 && !vowels.includes(word_lower[i + 1])) {
        current_syllable += char;
      } else {
        syllables.push(current_syllable);
        current_syllable = char;
      }
    } else {
      current_syllable += char;
    }
    
    prev_was_vowel = is_vowel;
  }
  
  if (current_syllable) {
    syllables.push(current_syllable);
  }

  return syllables;
}

function getPhonemeImprovementTips(phoneme: string): string[] {
  const phonemeTips: { [key: string]: string[] } = {
    'æ': [
      'Open your mouth wider, like saying "cat"',
      'Place your tongue low and flat in your mouth',
      'Keep your lips spread slightly'
    ],
    'ʌ': [
      'Make a short "uh" sound like in "cup"',
      'Keep your mouth relaxed and slightly open',
      'Position your tongue in the middle of your mouth'
    ],
    'ə': [
      'Make a neutral "uh" sound like in "about"',
      'Keep your mouth and tongue relaxed',
      'This is a very short, unstressed sound'
    ],
    'ɪ': [
      'Make a short "i" sound like in "bit"',
      'Keep your tongue high but relaxed',
      'Don\'t stretch your lips too much'
    ],
    'i:': [
      'Make a long "ee" sound like in "see"',
      'Keep your tongue high and tense',
      'Spread your lips slightly'
    ],
    // Add more phoneme-specific tips as needed
  };

  return phonemeTips[phoneme] || [
    `Focus on making the "${phoneme}" sound clearly`,
    'Listen to the reference audio and try to match the sound',
    'Practice the sound in isolation before combining it with others'
  ];
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioBlob = formData.get('audio') as Blob;
    const targetWord = formData.get('word') as string;

    if (!audioBlob || !targetWord) {
      return NextResponse.json(
        { error: 'Missing audio or target word' },
        { status: 400 }
      );
    }

    if (!AZURE_SPEECH_KEY || !AZURE_SPEECH_REGION) {
      return NextResponse.json(
        { error: 'Azure Speech Service credentials not configured' },
        { status: 500 }
      );
    }

    // Convert Blob to ArrayBuffer and then to Buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    const wavBuffer = Buffer.from(arrayBuffer);

    // Create the audio config directly from WAV buffer
    const audioConfig = sdk.AudioConfig.fromWavFileInput(wavBuffer);
    
    // Create the speech config
    const speechConfig = sdk.SpeechConfig.fromSubscription(AZURE_SPEECH_KEY, AZURE_SPEECH_REGION);
    speechConfig.speechRecognitionLanguage = "en-US";

    // Create the pronunciation assessment config with phoneme-level analysis
    const pronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig(
      targetWord,
      sdk.PronunciationAssessmentGradingSystem.HundredMark,
      sdk.PronunciationAssessmentGranularity.Phoneme,
      true
    );

    // Create the recognizer
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    pronunciationAssessmentConfig.applyTo(recognizer);

    return new Promise<NextResponse>((resolve, reject) => {
      recognizer.recognizeOnceAsync(
        async (result) => {
          recognizer.close();

          const pronunciationAssessmentResult = sdk.PronunciationAssessmentResult.fromResult(result);
          const detailResult = (pronunciationAssessmentResult.detailResult as unknown) as DetailResult;
          
          // Get the target syllables
          const targetSyllables = splitIntoSyllables(targetWord);
          
          // Get the recognized syllables
          const recognizedSyllables = result.text ? 
            splitIntoSyllables(result.text) : 
            Array(targetSyllables.length).fill('');

          // Analyze each syllable
          const syllableAssessments: SyllableAssessment[] = targetSyllables.map((syllable, index) => {
            const recognizedSyllable = index < recognizedSyllables.length ? 
              recognizedSyllables[index] : '';
            
            // Calculate syllable accuracy based on phoneme scores
            const syllablePhonemes = detailResult.PronunciationAssessment.Words?.[0]?.Phonemes || [];
            const syllableScore = syllablePhonemes.reduce((acc, p) => acc + p.AccuracyScore, 0) / 
              (syllablePhonemes.length || 1);

            const isCorrect = syllableScore >= 80;

            return {
              syllable,
              isCorrect,
              accuracyScore: syllableScore,
              tips: !isCorrect ? [
                `Focus on the "${syllable}" sound - try breaking it down into individual sounds`,
                `Listen carefully to how the reference audio pronounces "${syllable}"`,
                `Practice saying "${syllable}" slowly, then gradually increase your speed`,
                ...syllablePhonemes.map(p => getPhonemeImprovementTips(p.Phoneme)).flat()
              ] : []
            };
          });

          const response = {
            score: Math.round(pronunciationAssessmentResult.pronunciationScore),
            accuracyScore: Math.round(pronunciationAssessmentResult.accuracyScore),
            completenessScore: Math.round(pronunciationAssessmentResult.completenessScore),
            fluencyScore: Math.round(pronunciationAssessmentResult.fluencyScore),
            recognizedText: result.text,
            syllableBreakdown: {
              target: targetSyllables,
              recognized: recognizedSyllables,
              mispronounced: syllableAssessments
            },
            phonemeScores: detailResult.PronunciationAssessment.Words?.[0]?.Phonemes.map(p => ({
              phoneme: p.Phoneme,
              accuracyScore: p.AccuracyScore
            })) || []
          };

          resolve(NextResponse.json(response));
        },
        (error) => {
          console.error('Recognition error:', error);
          recognizer.close();
          resolve(NextResponse.json(
            { error: 'Failed to assess pronunciation: ' + error },
            { status: 500 }
          ));
        }
      );
    });
  } catch (error) {
    console.error('Error checking pronunciation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check pronunciation' },
      { status: 500 }
    );
  }
} 