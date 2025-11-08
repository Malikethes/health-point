import React from 'react';
import {
  Box,
  Tooltip,
  Typography,
  CircularProgress,
  IconButton,
} from '@mui/material';

// --- IMPORTANT ---
// This is the path to your SVG file.
// For this to work, place your SVG file in the `public` folder
// at the root of your project.
//
// Example: /public/human-silhouette.svg
//
const HUMAN_SILHOUETTE_PATH = '/human-silhouette.svg';

interface HumanVisualizationProps {
  onSensorClick: (sensorPointId: string) => void;
  overallStatus: { emoji: string; insight: string } | null;
}

const HumanVisualization: React.FC<HumanVisualizationProps> = ({
  onSensorClick,
  overallStatus,
}) => {
  // These are now %-based positions.
  // YOU WILL NEED TO ADJUST THESE
  // to match the layout of *your* specific SVG image.
  const chestSensorPosition = { top: '25%', left: '50%' };
  const handSensorPosition = { top: '50%', left: '40%' };

  return (
    <Box
      sx={{
        width: '100%',
        // maxWidth: 250, // <-- REMOVED
        flexGrow: 1, // <-- ADDED: Will take up available vertical space
        minHeight: 300, // <-- ADDED: Ensures a minimum height
        height: '100%', // <-- ADDED
        position: 'relative', // This is the container for absolute positioning
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        mb: 2,
        mt: { xs: 2, md: 0 },
      }}
    >
      {/* 1. The Human Silhouette Image */}
      <img
        src={HUMAN_SILHOUETTE_PATH}
        alt="Human Silhouette"
        style={{
          width: 'auto', // <-- CHANGED
          height: '100%', // <-- CHANGED
          display: 'block',
          objectFit: 'contain', // <-- ADDED
          maxHeight: '450px', // <-- ADDED: Prevents it from getting too huge
          // --- COLOR UPDATE ---
          // This filter combination inverts the black to white,
          // adds a sepia (brown/yellow) tint, then shifts the hue
          // to be more skin-like, and boosts saturation.
          filter:
            'invert(1) sepia(1) saturate(1.8) hue-rotate(15deg) brightness(0.65)',
          // --- END COLOR UPDATE ---
        }}
        // Handle image load error
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
          (e.currentTarget.nextSibling as HTMLElement).style.display = 'block';
        }}
      />
      {/* Fallback box in case image fails to load */}
      <Box
        sx={{
          display: 'none', // Hidden by default
          width: '100%', // <-- CHANGED
          height: '100%', // <-- CHANGED
          minHeight: 300, // <-- ADDED
          border: '2px dashed #ccc',
          borderRadius: '8px',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          p: 2,
          color: 'text.secondary',
        }}
      >
        <Typography variant="body2">
          Image not found.
          <br />
          Make sure `human-silhouette.svg` is in the `public` folder.
        </Typography>
      </Box>

      {/* 2. Sensor Point 1: Chest */}
      <Tooltip title="Chest Sensors" arrow>
        <IconButton
          onClick={() => onSensorClick('chest')}
          sx={{
            position: 'absolute',
            top: chestSensorPosition.top,
            left: chestSensorPosition.left,
            transform: 'translate(-50%, -50%)',
            color: '#3b82f6', // Blue
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
            },
            // --- FIX: MAKE CIRCLE ---
            width: 44, // Set fixed width
            height: 44, // Set fixed height
            borderRadius: '50%', // Make it a circle
            // --- END FIX ---
            // Pulsing animation
            '@keyframes pulse': {
              '0%': { boxShadow: '0 0 0 0px rgba(59, 130, 246, 0.4)' },
              '100%': { boxShadow: '0 0 0 10px rgba(59, 130, 246, 0)' },
            },
            animation: 'pulse 2s infinite',
          }}
        >
          {/* --- FIX: REMOVED NESTED TYPOGRAPHY --- */}
          <Typography
            sx={{
              fontWeight: 'bold',
              fontSize: '1.2rem',
              color: '#3b82f6',
              lineHeight: 1, // Ensure it's centered
            }}
          >
            C
          </Typography>
          {/* --- END FIX --- */}
        </IconButton>
      </Tooltip>

      {/* 3. Sensor Point 2: Hand */}
      <Tooltip title="Hand Sensor" arrow>
        <IconButton
          onClick={() => onSensorClick('hand')}
          sx={{
            position: 'absolute',
            top: handSensorPosition.top,
            left: handSensorPosition.left,
            transform: 'translate(-50%, -50%)',
            color: '#ef4444', // Red
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
            },
            // --- FIX: MAKE CIRCLE ---
            width: 44, // Set fixed width
            height: 44, // Set fixed height
            borderRadius: '50%', // Make it a circle
            // --- END FIX ---
            // Pulsing animation
            '@keyframes pulseRed': {
              '0%': { boxShadow: '0 0 0 0px rgba(239, 68, 68, 0.4)' },
              '100%': { boxShadow: '0 0 0 10px rgba(239, 68, 68, 0)' },
            },
            animation: 'pulseRed 2s infinite',
          }}
        >
          {/* --- FIX: REMOVED NESTED TYPOGRAPHY --- */}
          <Typography
            sx={{
              fontWeight: 'bold',
              fontSize: '1.2rem',
              color: '#ef4444',
              lineHeight: 1, // Ensure it's centered
            }}
          >
            H
          </Typography>
          {/* --- END FIX --- */}
        </IconButton>
      </Tooltip>

      {/* 4. Overall Status Emoji & Tooltip */}
      {overallStatus ? (
        <Tooltip
          title={
            <Typography variant="body2" sx={{ p: 0.5 }}>
              {overallStatus.insight}
            </Typography>
          }
          arrow
          placement="right"
        >
          <Typography
            sx={{
              position: 'absolute',
              top: '10%',
              right: '40%', // Adjust as needed
              fontSize: '2.5rem',
              cursor: 'help',
              transform: 'translate(50%, -50%)',
            }}
          >
            {overallStatus.emoji}
          </Typography>
        </Tooltip>
      ) : (
        <CircularProgress
          size={30}
          sx={{
            position: 'absolute',
            top: '10%',
            right: '0%',
            transform: 'translate(50%, -50%)',
          }}
        />
      )}
    </Box>
  );
};

export default HumanVisualization;