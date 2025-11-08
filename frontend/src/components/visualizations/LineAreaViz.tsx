import React from 'react';
import { Box, Typography } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
// import { formatSeconds } from '../../utils/formatters'; // <-- REMOVED

interface LineAreaVizProps {
  payload: {
    series: { data: number[]; label: string }[];
    xAxis: { data: number[]; scaleType: 'linear' | 'point' }[];
    yAxis?: { min?: number; max?: number }[];
  };
}

const LineAreaViz: React.FC<LineAreaVizProps> = ({ payload }) => {
  if (!payload || !payload.series || !payload.xAxis) {
    return <Typography>Invalid data for Line Chart</Typography>;
  }

  return (
    <Box sx={{ height: 300, width: '100%' }}>
      <LineChart
        {...payload} // Spread the original payload
        // Override xAxis to add our value formatter
        xAxis={[
          {
            ...payload.xAxis[0],
            // --- THIS IS THE FIX FOR GOAL 2 ---
            valueFormatter: (seconds: any) => `${seconds}s`,
            // --- END OF FIX ---
          },
        ]}
      />
    </Box>
  );
};

export default LineAreaViz;