import type { SensorData } from '../data/sensorData.types';
import type { SummaryData } from '../components/StatusPanel'; // Import SummaryData

// Get the base URL from the environment variable
const BASE_URL = import.meta.env.VITE_PYTHON_BACKEND_URL;

if (!BASE_URL) {
  throw new Error(
    'VITE_PYTHON_BACKEND_URL is not defined. Please check your .env.local file.',
  );
}

// --- API Response Type (from backend) ---
interface ApiResponse {
  x_label: string;
  x_values: number[];
  y_label: string;
  y_values: number[];
}

// --- Subject Info Type ---
export interface SubjectInfo {
  age: number;
  height: number;
  weight: number;
  gender: string;
  dominant_hand: string;
  coffee_today: boolean;
  coffee_last_hour: boolean;
  sports_today: boolean;
  smoker: boolean;
  smoke_last_hour: boolean;
  ill: boolean;
  additional_notes: string;
}

/**
 * Transforms the backend's data format into our app's format.
 * @param id 'heart-rate', 'breathing-rate', 'stress', 'temperature', 'pulse-transit-time', 'activity', 'eda'
 * @param name 'Heart Rate', 'Breathing Rate', 'Stress Level', 'Body Temperature', 'Pulse Transit Time', 'Movement', 'Skin Conductance'
 * @param apiData The raw JSON response from the backend
 */
const transformApiData = (
  id: string,
  name: string,
  apiData: ApiResponse,
): SensorData => {
  // Determine visualization type
  const visualizationType = 'line'; // All are time-series

  // Calculate current value (use the last value from the series)
  const lastValue =
    apiData.y_values.length > 0
      ? apiData.y_values[apiData.y_values.length - 1]
      : 0;

  // Determine unit
  let unit = '';
  if (id === 'heart-rate') unit = 'bpm';
  else if (id === 'breathing-rate') unit = 'br/min';
  else if (id === 'stress') unit = '(1-10)';
  else if (id === 'temperature') unit = '°C';
  else if (id === 'pulse-transit-time') unit = 'ms';
  else if (id === 'activity') unit = 'g';
  else if (id === 'eda') unit = 'μS';

  const currentValue = `${lastValue.toFixed(1)} ${unit}`;

  // Determine color
  let color = '#ef4444'; // default red
  if (id === 'heart-rate') color = '#ef4444';
  else if (id === 'breathing-rate') color = '#10b981';
  else if (id === 'stress') color = '#f59e0b';
  else if (id === 'temperature') color = '#eab308';
  else if (id === 'pulse-transit-time') color = '#6366f1';
  else if (id === 'activity') color = '#8b5cf6';
  else if (id === 'eda') color = '#06b6d4';

  // --- Dynamic Y-axis Calculation ---
  const dataMin = Math.min(...apiData.y_values);
  const dataMax = Math.max(...apiData.y_values);
  let padding = (dataMax - dataMin) * 0.1; // 10% padding

  if (padding === 0) {
    padding = dataMax * 0.1;
  }
  if (padding === 0) {
    padding = 5;
  }

  const finalMin = Math.max(0, dataMin - padding); // Don't go below 0
  const finalMax = dataMax + padding;
  // --- End Dynamic Y-axis ---

  return {
    id: id,
    name: name,
    currentValue: currentValue,
    visualizationType: visualizationType,
    payload: {
      series: [
        {
          data: apiData.y_values,
          label: apiData.y_label,
          showMark: false,
          area: true,
          color: color,
        },
      ],
      xAxis: [
        {
          data: apiData.x_values,
          scaleType: 'linear', // It's a time-based linear scale
        },
      ],
      // Apply our dynamic Y-axis
      yAxis: [{ min: finalMin, max: finalMax }],
    },
  };
};

// --- Standard Data Fetchers ---

/**
 * Fetches and transforms Heart Rate data.
 */
export const fetchHeartRateData = async (
  subject: string,
  sensor: string,
  modality: string,
): Promise<SensorData> => {
  const url = `${BASE_URL}/data/heart_rate?subject=${subject}&sensor=${sensor}&modality=${modality}`;
  console.log(`Fetching REAL data from: ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const apiData: ApiResponse = await response.json();
    return transformApiData('heart-rate', 'Heart Rate', apiData);
  } catch (error) {
    console.error('Failed to fetch Heart Rate data:', error);
    throw error;
  }
};

/**
 * Fetches and transforms Breathing Rate data.
 */
export const fetchBreathingRateData = async (
  subject: string,
): Promise<SensorData> => {
  const url = `${BASE_URL}/data/breathing_rate?subject=${subject}`;
  console.log(`Fetching REAL data from: ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const apiData: ApiResponse = await response.json();
    return transformApiData('breathing-rate', 'Breathing Rate', apiData);
  } catch (error) {
    console.error('Failed to fetch Breathing Rate data:', error);
    throw error;
  }
};

/**
 * Fetches and transforms Stress Level data.
 */
export const fetchStressLevelData = async (
  subject: string,
  sensor: string,
): Promise<SensorData> => {
  const url = `${BASE_URL}/data/stress_level?subject=${subject}&sensor=${sensor}`;
  console.log(`Fetching REAL data from: ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const apiData: ApiResponse = await response.json();
    return transformApiData('stress', 'Stress Level', apiData);
  } catch (error) {
    console.error('Failed to fetch Stress Level data:', error);
    throw error;
  }
};

/**
 * Fetches and transforms Temperature data.
 */
export const fetchTemperatureData = async (
  subject: string,
  sensor: string,
  modality: string,
): Promise<SensorData> => {
  const url = `${BASE_URL}/data/temperature?subject=${subject}&sensor=${sensor}&modality=${modality}`;
  console.log(`Fetching REAL data from: ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const apiData: ApiResponse = await response.json();
    // Remove the hardcoded Y-axis from here
    return transformApiData('temperature', 'Body Temperature', apiData);
  } catch (error) {
    console.error('Failed to fetch Temperature data:', error);
    throw error;
  }
};

/**
 * Fetches and transforms Pulse Transit Time data.
 */
export const fetchPulseTransitTimeData = async (
  subject: string,
): Promise<SensorData> => {
  const url = `${BASE_URL}/data/pulse_transit_time?subject=${subject}`;
  console.log(`Fetching REAL data from: ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const apiData: ApiResponse = await response.json();
    return transformApiData(
      'pulse-transit-time',
      'Pulse Transit Time',
      apiData,
    );
  } catch (error) {
    console.error('Failed to fetch Pulse Transit Time data:', error);
    throw error;
  }
};

/**
 * Fetches and transforms Movement (Activity) data.
 */
export const fetchMovementData = async (
  subject: string,
  sensor: string,
  modality: string,
): Promise<SensorData> => {
  const url = `${BASE_URL}/data/movement?subject=${subject}&sensor=${sensor}&modality=${modality}`;
  console.log(`Fetching REAL data from: ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const apiData: ApiResponse = await response.json();
    return transformApiData('activity', 'Movement', apiData);
  } catch (error) {
    console.error('Failed to fetch Movement data:', error);
    throw error;
  }
};

/**
 * Fetches and transforms Skin Conductance (EDA) data.
 */
export const fetchSkinConductanceData = async (
  subject: string,
  sensor: string,
  modality: string,
): Promise<SensorData> => {
  const url = `${BASE_URL}/data/skin_conductance?subject=${subject}&sensor=${sensor}&modality=${modality}`;
  console.log(`Fetching REAL data from: ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const apiData: ApiResponse = await response.json();
    return transformApiData('eda', 'Skin Conductance', apiData);
  } catch (error) {
    console.error('Failed to fetch Skin Conductance data:', error);
    throw error;
  }
};

// --- Subject Info Fetcher ---

/**
 * Fetches the static subject info.
 * @param subject e.g., "S2"
 */
export const fetchSubjectInfo = async (
  subject: string,
): Promise<SubjectInfo> => {
  const url = `${BASE_URL}/data/subject_info?subject=${subject}`;
  console.log(`Fetching Subject Info from: ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Subject Info:', error);
    throw error;
  }
};

// --- OpenAI Service ---

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL =
  import.meta.env.VITE_OPENAI_API_URL ||
  'https://api.openai.com/v1/chat/completions';

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
 * Generates a simple, patient-friendly overview for a *single chart*.
 */
export const getAiOverview = async (
  sensorName: string,
  payload: any,
): Promise<string> => {
  const dataString = extractDataForPrompt(payload);

  const systemPrompt =
    'You are a friendly medical assistant. You explain complex sensor data to a patient in 1-2 simple, reassuring, and non-alarming sentences. Do not use medical jargon. Do not provide a diagnosis. Focus on what the data *measures*, not what it *means* for their health.';
  const userPrompt = `My doctor is showing me a chart for "${sensorName}". The data is: ${dataString}. Can you explain what this chart is showing me?`;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Use a reliable, fast model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 1, // Use default
        max_tokens: 70, // Keep it short
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

/**
 * --- NEW: Generates the GENERAL AI overview ---
 * This function takes the overall averages and subject info for a holistic summary.
 */
export const getGeneralAiOverview = async (
  summary: SummaryData,
  info: SubjectInfo,
): Promise<string> => {
  // --- THIS IS THE FIX ---
  // Helper to safely format numbers for the prompt
  const safeToFixed = (val: string | number | null): string => {
    if (typeof val === 'number') {
      return val.toFixed(1);
    }
    if (typeof val === 'string') {
      return val;
    }
    return 'N/A';
  };
  // --- END FIX ---

  // 1. Format the summary data for the prompt
  const summaryString = `
    - Average Heart Rate: ${safeToFixed(summary['heart-rate'])} bpm
    - Average Breathing Rate: ${safeToFixed(summary['breathing-rate'])} br/min
    - Average Stress Level: ${safeToFixed(summary['stress'])} (1-10)
    - Average Movement: ${safeToFixed(summary['activity'])} g
    - Average Temperature: ${safeToFixed(summary['temperature'])} °C
  `;

  // 2. Format the subject info for the prompt
  const infoString = `
    - Age: ${info.age}
    - Gender: ${info.gender}
    - Smoker: ${info.smoker ? 'Yes' : 'No'}
    - Sports Today: ${info.sports_today ? 'Yes' : 'No'}
    - Coffee Today: ${info.coffee_today ? 'Yes' : 'No'}
    - Currently Ill: ${info.ill ? 'Yes' : 'No'}
    - Researcher Notes: ${info.additional_notes || 'None'}
  `;

  // 3. Create the System and User Prompts
  const systemPrompt =
    'You are an expert medical analyst. A patient is looking at their overall session data. Your task is to provide a brief, 3-4 sentence summary of their general condition based on their biometrics AND their personal context. Be reassuring, educational, and professional. Do not diagnose, but *do* correlate the data (e.g., "A higher heart rate is understandable given you had coffee").';

  const userPrompt = `
    Here is my overall session data:
    ${summaryString}

    Here is my personal context for the session:
    ${infoString}

    Based *only* on this information, what is a simple summary of my general condition during this recording?
  `;

  console.log('Sending to OpenAI:', userPrompt);

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 1,
        max_tokens: 150, // Allow for a longer, more detailed response
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
      overview ||
      'Could not get an explanation from the AI at this time.'
    );
  } catch (error) {
    console.error('Error fetching general AI overview:', error);
    return 'We had trouble generating a holistic summary. Please try again later.';
  }
};