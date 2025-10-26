// Shared Gemini AI helper for Supabase Edge Functions
// Using Google's Gemini API directly instead of Lovable's gateway

export interface GeminiMessage {
  role: string;
  content: string;
}

function parseGeminiResponse(data: any): any {
  const part = data.candidates?.[0]?.content?.parts?.[0];

  if (!part) {
    throw new Error("Empty response from Gemini");
  }

  // When using responseMimeType: "application/json", Gemini returns data in the json field
  if (part.json) {
    return part.json;
  }

  // Fallback to text field and parse manually
  let text = part.text;
  if (!text) {
    console.error('No json or text in Gemini response:', part);
    throw new Error("Empty response from Gemini");
  }

  // Strip code fences if present
  text = text.trim();
  if (text.startsWith('```json')) {
    text = text.substring(7);
  } else if (text.startsWith('```')) {
    text = text.substring(3);
  }
  if (text.endsWith('```')) {
    text = text.substring(0, text.length - 3);
  }
  text = text.trim();

  try {
    return JSON.parse(text);
  } catch (parseError) {
    console.error('Failed to parse Gemini response:', text);
    throw new Error(`Invalid JSON response from Gemini: ${parseError.message}`);
  }
}

export async function callGemini(
  messages: GeminiMessage[],
  apiKey: string
): Promise<any> {
  const systemMessage = messages.find(m => m.role === "system");
  const userMessages = messages.filter(m => m.role === "user");
  
  const userPrompt = userMessages.map(m => m.content).join("\n\n");
  
  const payload: any = {
    contents: [{
      parts: [{ text: userPrompt }]
    }]
  };

  if (systemMessage) {
    payload.systemInstruction = {
      parts: [{ text: systemMessage.content }]
    };
  }

  payload.generationConfig = {
    responseMimeType: "application/json"
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error:", response.status, errorText);
    throw new Error(`Gemini API request failed: ${response.status}`);
  }

  const data = await response.json();
  return parseGeminiResponse(data);
}

export async function callGeminiWithSchema(
  prompt: string,
  apiKey: string,
  responseSchema: any
): Promise<any> {
  const payload = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: responseSchema
    }
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error:", response.status, errorText);
    throw new Error(`Gemini API request failed: ${response.status}`);
  }

  const data = await response.json();
  return parseGeminiResponse(data);
}
