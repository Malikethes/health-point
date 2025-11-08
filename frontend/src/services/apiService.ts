import type { SensorData } from '../data/sensorData.types';

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

// --- NEW Subject Info Type ---
export interface SubjectInfo {
  age: number;
  height: number; // in cm
  weight: number; // in kg
  gender: 'male' | 'female' | 'other';
  dominant_hand: 'right' | 'left';
  coffee_today: boolean;
  coffee_last_hour: boolean;
  sports_today: boolean;
  smoker: boolean;
  smoke_last_hour: boolean;
  ill: boolean;
  additional_notes: string;
}
// --- END NEW Type ---

/**
 * Transforms the backend's data format into our app's format.
 * @param id 'heart-rate', 'breathing-rate', 'stress', 'temperature', 'pulse-transit-time', 'activity'
 * @param name 'Heart Rate', 'Breathing Rate', 'Stress Level', 'Body Temperature', 'Pulse Transit Time', 'Movement'
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
  const lastValue = apiData.y_values[apiData.y_values.length - 1];

  // Determine unit
  let unit = '';
  if (id === 'heart-rate') unit = 'bpm';
  else if (id === 'breathing-rate') unit = 'br/min';
  else if (id === 'stress') unit = '(1-10)';
  else if (id === 'temperature') unit = '°C';
  else if (id === 'pulse-transit-time') unit = 'ms';
  else if (id === 'activity') unit = 'g';
  else if (id === 'eda') unit = 'μS'; // <-- NEW

  const currentValue = `${lastValue.toFixed(1)} ${unit}`;

  // Determine color
  let color = '#ef4444'; // default red
  if (id === 'heart-rate') color = '#ef4444';
  else if (id === 'breathing-rate') color = '#10b981';
  else if (id === 'stress') color = '#f59e0b';
  else if (id === 'temperature') color = '#eab308';
  else if (id === 'pulse-transit-time') color = '#6366f1';
  else if (id === 'activity') color = '#8b5cf6';
  else if (id === 'eda') color = '#00bcd4'; // <-- NEW

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

// --- FETCH FUNCTIONS ---

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

export const fetchTemperatureData = async (
  subject: string,
  sensor: string,
  modality: string,
) => {
  const url = `${BASE_URL}/data/temperature?subject=${subject}&sensor=${sensor}&modality=${modality}`;
  console.log(`Fetching REAL data from: ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const apiData: ApiResponse = await response.json();
    return transformApiData('temperature', 'Body Temperature', apiData);
  } catch (error) {
    console.error('Failed to fetch Temperature data:', error);
    throw error;
  }
};

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
    return transformApiData('eda', 'Skin Conductance (EDA)', apiData);
  } catch (error) {
    console.error('Failed to fetch Skin Conductance data:', error);
    throw error;
  }
};

/**
 * NEW: Fetches static subject biographical and contextual information.
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
    const info: SubjectInfo = await response.json();
    return info;
  } catch (error) {
    console.error('Failed to fetch subject info:', error);
    // Throw error so App.tsx can handle loading state
    throw error;
  }
};