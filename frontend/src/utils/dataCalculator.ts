import type { SensorData } from '../data/sensorData.types';

/**
 * Finds the start and end indices for a given time range
 * in a time-series data array.
 */
const getIndicesForTimeRange = (
  xAxisData: number[],
  startTime: number,
  endTime: number,
): [number, number] => {
  let startIndex = -1;
  let endIndex = -1;

  for (let i = 0; i < xAxisData.length; i++) {
    if (xAxisData[i] >= startTime) {
      startIndex = i;
      break;
    }
  }
  if (startIndex === -1) return [-1, -1];

  for (let i = xAxisData.length - 1; i >= startIndex; i--) {
    if (xAxisData[i] <= endTime) {
      endIndex = i;
      break;
    }
  }
  return [startIndex, endIndex];
};

/**
 * Calculates the average of a numeric array.
 */
const calculateAverage = (data: number[]): number | null => {
  if (!data || data.length === 0) return null;
  const sum = data.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / data.length) * 10) / 10;
};

/**
 * The main exported function.
 * Calculates a single summary value for a given parameter and time range.
 */
export const calculateSummary = (
  param: SensorData,
  timeRange: number[],
): string | number | null => {
  const [startTime, endTime] = timeRange;
  const payload = param.payload;

  if (
    !payload ||
    !payload.xAxis ||
    !payload.xAxis[0] ||
    !payload.xAxis[0].data
  ) {
    return 'N/A';
  }

  const [startIndex, endIndex] = getIndicesForTimeRange(
    payload.xAxis[0].data,
    startTime,
    endTime,
  );

  if (startIndex === -1 || endIndex === -1) {
    return '...'; // No data in range
  }

  // Get the correct data series
  const dataSeries = payload.series[0].data;
  if (!dataSeries) return 'N/A';

  // Get the slice of data for our time range
  const dataSlice = dataSeries.slice(startIndex, endIndex + 1);

  // Calculate based on parameter type
  switch (param.id) {
    case 'heart-rate':
    case 'breathing-rate':
    case 'temperature':
    case 'activity':
    case 'eda':
    case 'stress': // <-- STRESS IS NOW AVERAGED
      return calculateAverage(dataSlice as number[]);
    default:
      return '...';
  }
};