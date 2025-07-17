const GOOGLE_API_KEY =
  process.env.GOOGLE_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
  '';

async function fetchGemini(body: unknown, model: string): Promise<any> {
  if (!GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY is not set');
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function generateText(prompt: string, model = 'gemini-pro'): Promise<string> {
  const data = await fetchGemini({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  }, model);
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export async function generateVision(parts: any[], model = 'gemini-pro-vision'): Promise<string> {
  const data = await fetchGemini({
    contents: [{ role: 'user', parts }],
  }, model);
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export async function synthesizeSpeech(text: string): Promise<string> {
  if (!GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY is not set');
  }
  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: 'es-ES', name: 'es-ES-Standard-A' },
      audioConfig: { audioEncoding: 'MP3' },
    }),
  });
  const data = await res.json();
  if (data.audioContent) {
    return `data:audio/mp3;base64,${data.audioContent}`;
  }
  return '';
}
