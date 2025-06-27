declare module 'recorder-js' {
  interface RecorderOptions {
    sampleRate?: number;
    numChannels?: number;
    mimeType?: string;
    onAnalysed?: (data: any) => void;
  }

  class Recorder {
    constructor(audioContext: AudioContext, options?: RecorderOptions);
    init(stream: MediaStream): Promise<void>;
    start(): void;
    stop(): Promise<{ blob: Blob; buffer: ArrayBuffer }>;
    download(filename?: string): void;
  }

  export default Recorder;
} 