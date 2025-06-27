import { NextResponse } from 'next/server';

declare global {
  var lastGeneratedAudio: ArrayBuffer;
}

export async function GET() {
  try {
    if (!global.lastGeneratedAudio) {
      return NextResponse.json(
        { error: 'No audio available' },
        { status: 404 }
      );
    }

    return new NextResponse(global.lastGeneratedAudio, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': global.lastGeneratedAudio.byteLength.toString()
      }
    });
  } catch (error) {
    console.error('Error serving audio:', error);
    return NextResponse.json(
      { error: 'Failed to serve audio' },
      { status: 500 }
    );
  }
} 