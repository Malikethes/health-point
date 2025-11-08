import React, { useState, useEffect } from 'react';
import { getAiOverview } from '../services/openAiService';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface AiOverviewProps {
  sensorName: string;
  payload: any;
}

const AiOverview: React.FC<AiOverviewProps> = ({ sensorName, payload }) => {
  const [overview, setOverview] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const theme = useTheme();

  useEffect(() => {
    // Only fetch if we have valid data
    if (sensorName && payload) {
      setIsLoading(true);
      setOverview(''); // Clear previous overview
      
      getAiOverview(sensorName, payload)
        .then((text) => {
          setOverview(text);
        })
        .catch((err) => {
          console.error(err);
          setOverview('An error occurred while getting the summary.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [sensorName, payload]); // Re-run when data changes

  return (
    <Box>
      {isLoading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <CircularProgress
            size={16}
            sx={{ mr: 1 }}
          />
          <Typography variant="body2">
            Asking our AI assistant for a simple explanation...
          </Typography>
        </Box>
      ) : (
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.primary }}
        >
          {overview}
        </Typography>
      )}
    </Box>
  );
};

export default AiOverview;