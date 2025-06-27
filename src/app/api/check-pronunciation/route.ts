import { NextRequest, NextResponse } from 'next/server';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION;

interface PronunciationAssessmentResult {
  accuracyScore: number;
  pronunciationScore: number;
  completenessScore: number;
  fluencyScore: number;
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

    // Create the pronunciation assessment config
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
        (result) => {
          recognizer.close();

          console.log('Recognition result:', result.text);

          const pronunciationAssessmentResult = sdk.PronunciationAssessmentResult.fromResult(result);

          const scores: PronunciationAssessmentResult = {
            accuracyScore: pronunciationAssessmentResult.accuracyScore,
            pronunciationScore: pronunciationAssessmentResult.pronunciationScore,
            completenessScore: pronunciationAssessmentResult.completenessScore,
            fluencyScore: pronunciationAssessmentResult.fluencyScore
          };

          const feedback = getPronunciationFeedback(scores.pronunciationScore);

          resolve(NextResponse.json({
            score: Math.round(scores.pronunciationScore),
            accuracyScore: Math.round(scores.accuracyScore),
            completenessScore: Math.round(scores.completenessScore),
            fluencyScore: Math.round(scores.fluencyScore),
            feedback,
            recognizedText: result.text
          }));
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

function getPronunciationFeedback(score: number): string {
  if (score >= 95) {
    return 'Excellent pronunciation! Keep it up!';
  } else if (score >= 85) {
    return 'Very good! Just a bit more precision needed for perfect pronunciation.';
  } else if (score >= 75) {
    return 'Good effort! Try speaking more slowly and emphasize each syllable.';
  } else if (score >= 65) {
    return 'Almost there! Focus on the correct stress and rhythm of the word.';
  } else if (score >= 55) {
    return 'Keep practicing! Try to match the reference audio more closely.';
  } else {
    return 'Listen carefully to the reference audio and try to match its pronunciation exactly.';
  }
} 