import { NextResponse } from 'next/server';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// Keep track of recently used words to avoid repetition
let recentWords = new Set<string>();
const MAX_RECENT_WORDS = 10;

export async function POST() {
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are a language learning assistant. Generate a single challenging English word that would be good for pronunciation practice. 
            Requirements:
            - Word should be moderately difficult but commonly used
            - Word should be between 2-4 syllables
            - Word should contain interesting phonetic elements
            - Word should NOT be any of these recently used words: ${Array.from(recentWords).join(', ')}
            - Respond with just the word, nothing else
            Examples of good words: enthusiasm, particular, necessary, comfortable, significant, opportunity, technology, vocabulary, restaurant, interesting`
          }
        ],
        max_tokens: 50,
        temperature: 0.9
      })
    });

    const data = await response.json();
    const word = data.choices[0].message.content.trim();

    // Update recent words
    recentWords.add(word);
    if (recentWords.size > MAX_RECENT_WORDS) {
      const [firstWord] = recentWords;
      recentWords.delete(firstWord);
    }

    return NextResponse.json({ word });
  } catch (error) {
    console.error('Error generating word:', error);
    return NextResponse.json(
      { error: 'Failed to generate word' },
      { status: 500 }
    );
  }
} 