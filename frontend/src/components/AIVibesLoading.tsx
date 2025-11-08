import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useTheme, keyframes } from '@mui/material/styles';

const messages = [
  "Fetching raw sensor data...",
  "Running deep analysis...",
  "Calculating overall status...",
  "Generating patient insights...",
  "Visualizing complex rhythms...",
];

const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
`;

interface AIVibesLoadingProps {
  isLoading: boolean;
}

const AIVibesLoading: React.FC<AIVibesLoadingProps> = ({ isLoading }) => {
  const theme = useTheme();
  const [messageIndex, setMessageIndex] = useState(0);

  // Cycle the loading message every 1.5 seconds
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)', // Semi-transparent white overlay
        zIndex: 10, // Ensure it sits on top of the content
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 'inherit',
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          backgroundColor: theme.palette.primary.light,
          borderRadius: '50%',
          width: 80,
          height: 80,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mb: 3,
          boxShadow: `0 0 15px ${theme.palette.primary.main}40`,
          animation: `${pulse} 2s infinite ease-in-out`,
        }}
      >
        <CircularProgress size={40} thickness={4} color="primary" />
      </Box>
      <Typography variant="h6" color="primary" sx={{ fontWeight: 600, mb: 1 }}>
        AI Analysis in Progress...
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {messages[messageIndex]}
      </Typography>
    </Box>
  );
};

export default AIVibesLoading;