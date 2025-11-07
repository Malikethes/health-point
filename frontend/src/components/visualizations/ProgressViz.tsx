import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';

interface ProgressVizProps {
  payload: {
    current: number;
    goal: number;
    unit: string;
  };
}

const ProgressViz: React.FC<ProgressVizProps> = ({ payload }) => {
  const normalizedValue = (payload.current / payload.goal) * 100;

  return (
    <Box sx={{ height: 250, width: '100%', mt: 2, p: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Typography variant="h3" component="p" sx={{ fontWeight: 600, textAlign: 'center' }}>
        {payload.current}
        <span style={{ fontSize: '1.5rem', marginLeft: '8px' }}>{payload.unit}</span>
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
        Goal: {payload.goal} {payload.unit}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={normalizedValue}
        sx={{ height: 12, borderRadius: 6 }}
      />
    </Box>
  );
};

export default ProgressViz;