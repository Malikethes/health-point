import React from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { Box } from '@mui/material';

interface LineAreaVizProps {
  payload: {
    series: any[];
    xAxis: any[];
    yAxis?: any[];
  };
}

const LineAreaViz: React.FC<LineAreaVizProps> = ({ payload }) => {
  return (
    <Box sx={{ height: 250, width: '100%', mt: 2 }}>
      <LineChart
        xAxis={payload.xAxis}
        yAxis={payload.yAxis}
        series={payload.series}
        grid={{ vertical: true, horizontal: true }}
        margin={{ top: 20, right: 30, left: 60, bottom: 30 }}
      />
    </Box>
  );
};

export default LineAreaViz;