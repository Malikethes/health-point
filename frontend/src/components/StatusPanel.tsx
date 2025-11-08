import React from 'react';
import { Box, Typography, Divider, Skeleton, useTheme } from '@mui/material';
// No icon imports needed

// This type defines the props our panel expects
export interface SummaryData {
  'heart-rate': string | number | null;
  'breathing-rate': string | number | null;
  'stress': string | number | null;
  'activity': string | number | null;
  'temperature': string | number | null;
}

interface StatusPanelProps {
  summary: SummaryData | null;
  isLoading: boolean;
}

// --- Helper Component for a single status row ---
interface StatusRowProps {
  emoji: string;
  label: string;
  subLabel: string;
  value: string | number | null;
  isLoading: boolean;
}

const StatusRow: React.FC<StatusRowProps> = ({
  emoji,
  label,
  subLabel,
  value,
  isLoading,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 1.5,
      }}
    >
      {/* Left side: Icon and Labels */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {/* Emoji/Icon Container */}
        <Box
          sx={{
            fontSize: '1.5rem',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 2,
          }}
        >
          {emoji}
        </Box>

        {/* Text Labels */}
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {subLabel}
          </Typography>
        </Box>
      </Box>

      {/* Right side: Value */}
      <Box sx={{ minWidth: 60, textAlign: 'right' }}>
        {isLoading ? (
          <Skeleton width={50} height={24} sx={{ ml: 'auto' }} />
        ) : (
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: theme.palette.text.primary }}
          >
            {value === null || value === 'N/A' ? 'N/A' : Number.parseFloat(value as string).toFixed(1)}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

// --- Main Status Panel Component ---
const StatusPanel: React.FC<StatusPanelProps> = ({ summary, isLoading }) => {
  return (
    <Box>
      <Typography variant="h5" component="h3" sx={{ mb: 0.5 }}>
        Live Status
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Average values for the selected time.
      </Typography>

      <Box sx={{ mt: 1 }}>
        <Divider />
        <StatusRow
          emoji="❤️"
          label="Heart Rate"
          subLabel="Avg. (bpm)"
          // FIX: Added null check to prevent TypeError
          value={summary ? summary['heart-rate'] : null}
          isLoading={isLoading}
        />
        <Divider />
        <StatusRow
        emoji="🌬️"
          label="Breathing Rate"
          subLabel="Avg. (br/min)"
          value={summary ? summary['breathing-rate'] : null}
          isLoading={isLoading}
        />
        <Divider />
        <StatusRow
        emoji="🧘"
          label="Stress Level"
          subLabel="Avg. (1-10)"
          value={summary ? summary['stress'] : null}
          isLoading={isLoading}
        />
        <Divider />
        <StatusRow
          emoji="🏃‍♂️"
          label="Activity/Movement"
          subLabel="Avg. G-force (g)" // Updated Label
          value={summary ? summary['activity'] : null}
          isLoading={isLoading}
        />
        <Divider />
        <StatusRow
          emoji="🌡️"
          label="Temperature"
          subLabel="Avg. (°C)"
          value={summary ? summary['temperature'] : null}
          isLoading={isLoading}
        />
        <Divider />
      </Box>
    </Box>
  );
};

export default StatusPanel;