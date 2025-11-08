/**
 * Filters a chart's payload (series and xAxis) based on a start and end time.
 *
 * @param payload The original payload from SensorData
 * @param startTime The start of the time range (e.g., 0)
 * @param endTime The end of the time range (e.g., 3600)
 * @returns A new payload object with filtered data, or the original if not applicable.
 */
export const filterPayloadByTime = (
  payload: any,
  startTime: number,
  endTime: number,
): any => {
  // Check if this payload has a time-based xAxis
  if (
    !payload ||
    !payload.xAxis ||
    !payload.xAxis[0] ||
    !payload.xAxis[0].data ||
    // --- THIS IS THE FIX ---
    // It should check for 'linear' (or whatever scale our time data uses)
    payload.xAxis[0].scaleType !== 'linear'
  ) {
    // If not, it's not a time-series chart (e.g., radial, progress).
    // Return the original payload without filtering.
    return payload;
  }

  try {
    const timestamps = payload.xAxis[0].data as number[];
    let startIndex = -1;
    let endIndex = -1;

    // Find the first data point that is *within* the time range
    for (let i = 0; i < timestamps.length; i++) {
      if (timestamps[i] >= startTime) {
        startIndex = i;
        break;
      }
    }

    // If no data point is after the start time, return an empty payload
    if (startIndex === -1) {
      return {
        ...payload,
        xAxis: [{ ...payload.xAxis[0], data: [] }],
        series: payload.series.map((s: any) => ({ ...s, data: [] })),
      };
    }

    // Find the last data point that is *within* the time range
    for (let i = timestamps.length - 1; i >= startIndex; i--) {
      if (timestamps[i] <= endTime) {
        endIndex = i;
        break;
      }
    }

    // If no data point is before the end time (e.g., range is before all data), return empty
    if (endIndex === -1) {
      return {
        ...payload,
        xAxis: [{ ...payload.xAxis[0], data: [] }],
        series: payload.series.map((s: any) => ({ ...s, data: [] })),
      };
    }

    // Slice all data arrays based on the found indices
    const newXAxisData = payload.xAxis[0].data.slice(startIndex, endIndex + 1);
    const newSeries = payload.series.map((s: any) => ({
      ...s,
      data: s.data.slice(startIndex, endIndex + 1),
    }));

    // Return the new, filtered payload
    return {
      ...payload,
      xAxis: [{ ...payload.xAxis[0], data: newXAxisData }],
      series: newSeries,
    };
  } catch (error) {
    console.error('Error filtering payload:', error, payload);
    // On error, return the original payload to prevent a crash
    return payload;
  }
};