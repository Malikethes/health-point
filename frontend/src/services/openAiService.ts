// 1. Get variables from Vite's import.meta.env
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL =
  import.meta.env.VITE_OPENAI_API_URL ||
  'https://api.openai.com/v1/chat/completions';

// Simple check to make sure you've set them
if (!OPENAI_API_KEY) {
  throw new Error(
    'Missing VITE_OPENAI_API_KEY. Please check your .env.local file.',
  );
}

/**
 * Intelligently extracts the key data from a complex payload
 * to send to the AI, saving tokens and improving clarity.
 */
const extractDataForPrompt = (payload: any): string => {
  try {
    if (payload.series && payload.series.length > 0) {
      // For charts: "Series 'Systolic': [120, 118, 122]"
      return payload.series
        .map(
          (s: any) =>
            `Series '${s.label}': [${s.data.slice(0, 5).join(', ')}]`,
        )
        .join('; ');
    }
    if (payload.value) {
      // For radial: "98%"
      return `${payload.value}%`;
    }
    if (payload.current) {
      // For progress: "Current: 72, Goal: 100"
      return `Current: ${payload.current}, Goal: ${payload.goal}`;
    }
    return JSON.stringify(payload).substring(0, 100); // Fallback
  } catch (e) {
    return 'complex data';
  }
};

/**
 * Generates a simple, patient-friendly overview of sensor data.
 * @param sensorName e.g., "Heart Rate"
 * @param payload The raw data payload for the chart
 * @returns A string with the AI-generated summary.
 */
export const getAiOverview = async (
  sensorName: string,
  payload: any,
): Promise<string> => {
  const dataString = extractDataForPrompt(payload);

  const systemPrompt =
    'You are a friendly medical assistant. You explain complex sensor data to a patient in 1-2 simple, reassuring, and non-alarming sentences. Do not use medical jargon. Do not provide a diagnosis. Focus on what the data *means* for their health. Don\'t answer with something like "Sure!", "Of course!" or something like that - just the cold explanation';
  const userPrompt = `My doctor is showing me a chart for "${sensorName}". The data is: ${dataString}. Can you explain what this chart is showing me?`;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // <-- CHANGED from 'gpt-5' to a real, working model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 1, // <-- CHANGED from 0.5 to 1 as per the 400 error
        max_completion_tokens: 70, // <-- THIS WAS THE FIX
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error('OpenAI API error:', errorBody);
      throw new Error(
        `OpenAI API error (${response.status}): ${
          errorBody.error?.message || response.statusText
        }`,
      );
    }

    const json = await response.json();
    const overview = json.choices[0]?.message?.content;

    return (
      overview || 'Could not get an explanation from the AI at this time.'
    );
  } catch (error) {
    console.error('Error fetching AI overview:', error);
    return 'We had trouble getting a simple explanation. We can discuss the chart together instead.';
  }
};