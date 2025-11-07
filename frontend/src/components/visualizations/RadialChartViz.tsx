import React from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { Box, Typography } from '@mui/material';

interface RadialChartVizProps {
  payload: {
    series: any[];
    value: number | string;
  };
}

const RadialChartViz: React.FC<RadialChartVizProps> = ({ payload }) => {
  return (
    <Box
      sx={{
        height: 250,
        width: '100%',
        mt: 2,
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Typography
        variant="h4"
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontWeight: 600,
        }}
      >
        {payload.value}%
      </Typography>
      <PieChart
        series={payload.series}
        width={300} // Fixed size for the pie
        height={300}
      />
    </Box>
  );
};

export default RadialChartViz;