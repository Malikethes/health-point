import React from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { Box } from '@mui/material';

interface BarChartVizProps {
  payload: {
    series: any[];
    xAxis: any[];
    yAxis?: any[];
  };
}

const BarChartViz: React.FC<BarChartVizProps> = ({ payload }) => {
  return (
    <Box sx={{ height: 250, width: '100%', mt: 2 }}>
      <BarChart
        xAxis={payload.xAxis}
        yAxis={payload.yAxis}
        series={payload.series}
        grid={{ vertical: true, horizontal: true }}
        margin={{ top: 20, right: 30, left: 60, bottom: 30 }}
      />
    </Box>
  );
};

export default BarChartViz;