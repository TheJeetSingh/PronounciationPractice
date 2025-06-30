import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;

// Declare the global variable with proper typing
declare global {
  var lastGeneratedAudio: ArrayBuffer;
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    const response = await axios.post<ArrayBuffer>(
      'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM',
      {
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVEN_LABS_API_KEY
        },
        responseType: 'arraybuffer'
      }
    );

    // Store the audio buffer in memory (not recommended for production)
    global.lastGeneratedAudio = response.data;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error generating audio:', error);
    return NextResponse.json(
      { error: 'Failed to generate audio' },
      { status: 500 }
    );
  }
} 