import React from 'react';
import { Box, Slider, Typography } from '@mui/material';
// import { formatSeconds } from '../utils/formatters'; // <-- REMOVED

interface TimeRangeSliderProps {
  // The earliest possible time (slider min, e.g., 0)
  masterStart: number;
  // The latest possible time (slider max, e.g., 3600)
  masterEnd: number;
  // The current selected range [start, end]
  value: number[];
  // Callback when the value changes
  onChange: (newValue: number[]) => void;
}

const TimeRangeSlider: React.FC<TimeRangeSliderProps> = ({
  masterStart,
  masterEnd,
  value,
  onChange,
}) => {
  const handleChange = (event: Event, newValue: number | number[]) => {
    onChange(newValue as number[]);
  };

  return (
    <Box sx={{ width: '90%', margin: '2rem auto 0' }}>
      <Typography
        variant="h6"
        sx={{ fontWeight: 600, textAlign: 'center', mb: 1 }}
      >
        Time Range Selector
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ textAlign: 'center', mb: 2 }}
      >
        Drag the sliders to filter all data by time.
      </Typography>

      <Slider
        step={5}
        value={value}
        onChange={handleChange}
        min={masterStart}
        max={masterEnd}
        // --- THIS IS THE FIX FOR GOAL 2 ---
        valueLabelFormat={(v) => `${v}s`} // Show "1500s"
        // --- END OF FIX ---
        valueLabelDisplay="auto"
        disableSwap
        sx={{
          height: 8,
          '& .MuiSlider-thumb': {
            width: 24,
            height: 24,
          },
          '& .MuiSlider-rail': {
            opacity: 0.3,
          },
        }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {/* --- THIS IS THE FIX FOR GOAL 2 --- */}
        <Typography variant="body1" color="text.secondary">
          {value[0]}s
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {value[1]}s
        </Typography>
        {/* --- END OF FIX --- */}
      </Box>
    </Box>
  );
};

export default TimeRangeSlider;