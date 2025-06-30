# Pronunciation Practice App

A modern web application that helps users practice and improve their English pronunciation using AI technologies:
- DeepSeek AI for generating practice words
- ElevenLabs for generating reference pronunciations
- AssemblyAI for grading pronunciation accuracy

## Features

- Generate challenging English words for practice
- Listen to correct pronunciations
- Record your pronunciation
- Get instant feedback and scoring
- Beautiful blue and white theme
- Responsive design

## Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- API keys for:
  - AssemblyAI
  - ElevenLabs
  - DeepSeek

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with your API keys:
   ```
   ASSEMBLYAI_API_KEY=your_assemblyai_api_key
   ELEVEN_LABS_API_KEY=your_elevenlabs_api_key
   DEEPSEEK_API_KEY=your_deepseek_api_key
   ```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Click "Generate New Word" to get a word to practice
2. Click the speaker icon to hear the correct pronunciation
3. Click the microphone icon to record your pronunciation
4. Get instant feedback on your pronunciation accuracy

## Technologies Used

- Next.js 14
- React 18
- Tailwind CSS
- AssemblyAI API
- ElevenLabs API
- DeepSeek API
- TypeScript
- Axios

## License

MIT
