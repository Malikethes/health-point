import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
} from '@mui/material';
import { useTheme, keyframes } from '@mui/material/styles';
import { getGeneralAiOverview } from '../services/openAiService'; // Import new function
import type { SubjectInfo } from '../services/apiService';
import type { SummaryData } from './StatusPanel';
import FlashOnIcon from '@mui/icons-material/FlashOn';

const pulse = keyframes`
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
`;

interface GeneralAiOverviewProps {
  // This component will receive the *unfiltered*, overall summary
  overallSummary: SummaryData | null;
  subjectInfo: SubjectInfo | null;
  isLoading: boolean; // Is the main app still loading this data?
}

const GeneralAiOverview: React.FC<GeneralAiOverviewProps> = ({
  overallSummary,
  subjectInfo,
  isLoading,
}) => {
  const theme = useTheme();
  const [insight, setInsight] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // This effect fires when the data is ready
  useEffect(() => {
    // Wait until we have both pieces of data and the app isn't loading
    if (overallSummary && subjectInfo && !isLoading) {
      setIsAiLoading(true);
      console.log(
        'Generating general AI overview with:',
        overallSummary,
        subjectInfo,
      );

      getGeneralAiOverview(overallSummary, subjectInfo)
        .then((text) => {
          setInsight(text);
        })
        .catch((err) => {
          console.error(err);
          setInsight(
            'An error occurred while generating the overall analysis.',
          );
        })
        .finally(() => {
          setIsAiLoading(false);
        });
    }
  }, [overallSummary, subjectInfo, isLoading]); // Dependencies

  const renderContent = () => {
    // 1. Show main app loading state
    if (isLoading) {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: 2,
            color: 'text.secondary',
          }}
        >
          <CircularProgress size={20} sx={{ mr: 2 }} />
          Waiting for overall data to be calculated...
        </Box>
      );
    }

    // 2. Show AI loading state
    if (isAiLoading) {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: 2,
            color: 'text.secondary',
          }}
        >
          <CircularProgress size={20} sx={{ mr: 2 }} />
          AI is analyzing the overall session...
        </Box>
      );
    }

    // 3. Show the final insight
    if (insight) {
      return (
        <Typography variant="body1" sx={{ p: 2, lineHeight: 1.7 }}>
          {insight}
        </Typography>
      );
    }

    // 4. Fallback for no data
    return (
      <Typography variant="body1" sx={{ p: 2, color: 'text.secondary' }}>
        No overall data available to analyze.
      </Typography>
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 3, // Margin-top to place it below the main card
        p: 2,
        backgroundColor: theme.palette.background.paper,
        borderRadius: '16px',
        boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.05)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          pb: 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <FlashOnIcon
          sx={{
            color: theme.palette.primary.main,
            mr: 1.5,
            fontSize: '1.5rem',
            animation: isAiLoading ? `${pulse} 1.5s infinite` : 'none',
          }}
        />
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: theme.palette.text.primary,
          }}
        >
          Overall Session Analysis
        </Typography>
      </Box>
      <Box sx={{ minHeight: 80 }}>{renderContent()}</Box>
    </Paper>
  );
};

export default GeneralAiOverview;