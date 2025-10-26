export interface ProcessedThought {
  title: string;
  snippet: string;
  categories: string[];
  content: string;
}

import { callGemini } from "../_shared/gemini.ts";

export async function callAIForThoughts(content: string, apiKey: string, systemPrompt: string): Promise<ProcessedThought[]> {
  console.log('Sending request to Gemini API...');
  
  const parsedResponse = await callGemini([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: content }
  ], apiKey);

  console.log('Gemini Response received');
  console.log('Parsed Response:', JSON.stringify(parsedResponse, null, 2));

  let thoughts = parsedResponse.thoughts || [];
  console.log(`Gemini returned ${thoughts.length} thought(s)`);

  // Fallback: if AI returns no thoughts, create a basic one
  if (thoughts.length === 0 && content.trim().length > 0) {
    console.warn('AI returned no thoughts, creating fallback thought');
    thoughts = [{
      title: content.trim().split('\n')[0].substring(0, 100) || 'Untitled Thought',
      snippet: content.trim().substring(0, 200),
      categories: ['Note'],
      content: content.trim()
    }];
  }

  return thoughts;
}

export async function saveThoughtToDatabase(
  supabaseClient: any,
  userId: string,
  thought: ProcessedThought
) {
  console.log('Inserting thought into database...');
  const { data: insertedThought, error: thoughtError } = await supabaseClient
    .from('thoughts')
    .insert({
      user_id: userId,
      content: thought.content,
      title: thought.title,
      snippet: thought.snippet,
      status: 'active'
    })
    .select()
    .single();

  if (thoughtError) {
    console.error('Error inserting thought:', thoughtError);
    throw thoughtError;
  }

  console.log('Thought inserted successfully:', insertedThought.id);
  return insertedThought;
}
