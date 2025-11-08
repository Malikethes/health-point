import React from 'react';
import { Box, Typography } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { formatSeconds } from '../../utils/formatters'; // Import our new helper

interface BarChartVizProps {
  payload: {
    series: { data: number[]; label: string }[];
    xAxis: { data: number[]; scaleType: 'linear' | 'band' }[];
  };
}

const BarChartViz: React.FC<BarChartVizProps> = ({ payload }) => {
  if (!payload || !payload.series || !payload.xAxis) {
    return <Typography>Invalid data for Bar Chart</Typography>;
  }

  return (
    <Box sx={{ height: 300, width: '100%' }}>
      <BarChart
        {...payload} // Spread the original payload
        // Override xAxis to add our value formatter
        xAxis={[
          {
            ...payload.xAxis[0],
            valueFormatter: (seconds: number) => formatSeconds(seconds as number),
          },
        ]}
      />
    </Box>
  );
};

export default BarChartViz;