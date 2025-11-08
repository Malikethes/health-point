import type { SensorPointData, SensorData } from './sensorData.types';
import {
  fetchHeartRateData,
  fetchBreathingRateData,
  fetchStressLevelData,
  fetchTemperatureData,
  fetchPulseTransitTimeData,
  fetchMovementData,
  fetchSkinConductanceData, // <-- IMPORT NEW
} from '../services/apiService'; // The REAL fetch
import {
  getMockParameterData,
  getOverallStatusAI,
  mockSensorPointDatabase,
} from './mockData'; // The MOCK fetch

/**
 * Fetches the data for a sensor point, combining REAL and MOCK sources.
 *
 * @param pointId "chest" or "hand"
 * @param subject "S2", "S3", etc.
 */
export const fetchSensorPointData = async (
  pointId: string,
  subject: string,
): Promise<SensorPointData> => {
  // 1. Get the list of parameters we *expect* for this point
  const pointTemplate = mockSensorPointDatabase[pointId];
  if (!pointTemplate) {
    throw new Error(`No sensor point template found for ${pointId}`);
  }

  // 2. Create an array of Promises to fetch all data in parallel
  const dataPromises: Promise<SensorData | undefined>[] =
    pointTemplate.parameters.map((param) => {
      // --- This is our routing logic ---
      // If 'heart-rate', call the real API
      if (param.id === 'heart-rate') {
        return fetchHeartRateData(subject, 'chest', 'ECG');
      }
      // If 'breathing-rate', call the real API
      else if (param.id === 'breathing-rate') {
        return fetchBreathingRateData(subject);
      }
      // If 'stress', call the real API
      else if (param.id === 'stress') {
        return fetchStressLevelData(subject, 'wrist');
      }
      // If 'temperature', call the real API
      else if (param.id === 'temperature') {
        return fetchTemperatureData(subject, 'wrist', 'TEMP');
      }
      // If 'pulse-transit-time', call the real API
      else if (param.id === 'pulse-transit-time') {
        return fetchPulseTransitTimeData(subject);
      }
      // If 'activity', call the real API
      else if (param.id === 'activity') {
        return fetchMovementData(subject, 'wrist', 'ACC');
      }
      // --- FINAL ROUTE (EDA) ---
      else if (param.id === 'eda') {
        return fetchSkinConductanceData(subject, 'wrist', 'EDA');
      }
      // --- END FINAL ROUTE ---
      // Otherwise, get the mock data
      else {
        return Promise.resolve(getMockParameterData(param.id));
      }
    });

  // 3. Wait for all fetches to complete
  const results = await Promise.allSettled(dataPromises);

  // 4. Process results, filtering out any failed/undefined fetches
  const fetchedParameters: SensorData[] = results
    .map((res) => {
      if (res.status === 'fulfilled' && res.value) {
        return res.value;
      }
      if (res.status === 'rejected') {
        console.error('A data fetch failed:', res.reason);
      }
      return null;
    })
    .filter((data): data is SensorData => data !== null);

  // 5. Return the complete SensorPointData object
  return {
    pointId: pointId,
    pointName: pointTemplate.pointName,
    parameters: fetchedParameters,
  };
};

// Re-export the AI function so App.tsx only imports from dataService
export { getOverallStatusAI };