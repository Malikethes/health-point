import React from 'react';
import {
  Modal,
  Box,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import AiOverview from './AiOverview';
import type { SensorData } from '../data/sensorData.types'; // Import our new type
import { useTheme } from '@mui/material/styles';

// Modal style remains the same
const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '95%', sm: '80%', md: '60%', lg: '50%' },
  maxWidth: '600px',
  bgcolor: 'background.paper',
  borderRadius: '16px',
  boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
  p: 0,
  overflow: 'hidden',
};

interface SensorModalProps {
  open: boolean;
  onClose: () => void;
  sensor: SensorData | null; // Now expects the full SensorData object
  isLoading: boolean;
  children: React.ReactNode; // The visualization component
}

const SensorModal: React.FC<SensorModalProps> = ({
  open,
  onClose,
  sensor,
  isLoading,
  children, // <-- The new prop
}) => {
  const theme = useTheme();

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        {/* Modal Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            pb: 1,
            borderBottom: '1px solid #eee',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: 'primary.main', // Generic color for now
                mr: 1,
              }}
            />
            <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
              {sensor?.name || 'Loading Data...'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography
              variant="body1"
              sx={{ mr: 1, fontWeight: 500, color: theme.palette.text.secondary }}
            >
              {sensor?.currentValue || ''}
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Modal Content */}
        <Box sx={{ p: 3 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
              <CircularProgress />
            </Box>
          ) : sensor ? (
            <>
              {/* === THIS IS THE BIG CHANGE === */}
              {/* We render the child component passed from App.tsx */}
              {children}
              {/* ============================== */}

              {/* The AI Overview - Styled to match Figma's box */}
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  backgroundColor: theme.palette.primary.light,
                  borderRadius: '12px',
                  border: `1px solid ${theme.palette.primary.main}`,
                  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
                  display: 'flex',
                  alignItems: 'flex-start',
                }}
              >
                <FlashOnIcon
                  sx={{
                    color: theme.palette.primary.main,
                    mr: 1.5,
                    fontSize: '1.5rem',
                  }}
                />
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.primary.main,
                      mb: 0.5,
                    }}
                  >
                    AI-Powered Analysis
                  </Typography>
                  <AiOverview
                    sensorName={sensor.name}
                    payload={sensor.payload}
                  />
                </Box>
              </Box>
            </>
          ) : (
            <Typography variant="h6" color="text.secondary" sx={{ my: 4 }}>
              No data available for this sensor.
            </Typography>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default SensorModal;