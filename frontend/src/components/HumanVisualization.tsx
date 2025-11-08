import React from 'react';
import {
  Box,
  Tooltip,
  Typography,
  CircularProgress,
  IconButton,
} from '@mui/material';

// --- IMAGE PATH LOGIC ---
const getSilhouettePath = (gender: string | undefined | null): string => {
  const safeGender = gender ? gender.toLowerCase() : 'default';

  if (safeGender === 'female') {
    return '/female-silhouette.png';
  }
  return '/male-silhouette.png';
};
// --- END IMAGE PATH LOGIC ---

interface HumanVisualizationProps {
  onSensorClick: (sensorPointId: string) => void;
  overallStatus: { emoji: string; insight: string } | null;
  // --- NEW PROP ---
  subjectGender: string | undefined;
}

const HumanVisualization: React.FC<HumanVisualizationProps> = ({
  onSensorClick,
  overallStatus,
  subjectGender,
}) => {
  // These are now %-based positions.
  // YOU WILL NEED TO ADJUST THESE
  // to match the layout of *your* specific SVG image.
  const chestSensorPosition = { top: '25%', left: '50%' };
  const handSensorPosition = { top: '50%', left: subjectGender === 'female' ? '42%' : '40%' };

  // Calculate the dynamic path
  const silhouettePath = getSilhouettePath(subjectGender);

  return (
    <Box
      sx={{
        width: '100%',
        flexGrow: 1,
        minHeight: 300,
        height: '100%',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        mb: 2,
        mt: { xs: 2, md: 0 },
      }}
    >
      {/* 1. The Human Silhouette Image */}
      <img
        src={silhouettePath} // <-- Dynamic path used here
        alt={`${subjectGender || 'Default'} Human Silhouette`}
        style={{
          width: 'auto',
          height: '100%',
          display: 'block',
          objectFit: 'contain',
          maxHeight: '450px',
          // Set to a dark grey/black for contrast
          filter: 'invert(0.1) brightness(0.9) contrast(1.2)',
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
          width: '100%',
          height: '100%',
          minHeight: 300,
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
          Make sure `{silhouettePath}` is in the `public` folder.
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
            width: 44,
            height: 44,
            borderRadius: '50%',
            '@keyframes pulse': {
              '0%': { boxShadow: '0 0 0 0px rgba(59, 130, 246, 0.4)' },
              '100%': { boxShadow: '0 0 0 10px rgba(59, 130, 246, 0)' },
            },
            animation: 'pulse 2s infinite',
          }}
        >
          <Typography
            sx={{
              fontWeight: 'bold',
              fontSize: '1.2rem',
              color: '#3b82f6',
              lineHeight: 1,
            }}
          >
            C
          </Typography>
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
            width: 44,
            height: 44,
            borderRadius: '50%',
            '@keyframes pulseRed': {
              '0%': { boxShadow: '0 0 0 0px rgba(239, 68, 68, 0.4)' },
              '100%': { boxShadow: '0 0 0 10px rgba(239, 68, 68, 0)' },
            },
            animation: 'pulseRed 2s infinite',
          }}
        >
          <Typography
            sx={{
              fontWeight: 'bold',
              fontSize: '1.2rem',
              color: '#ef4444',
              lineHeight: 1,
            }}
          >
            H
          </Typography>
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