import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import AiOverview from './AiOverview';
import type { SensorData, SensorPointData } from '../data/sensorData.types';
import { useTheme } from '@mui/material/styles';

// Import all our visualization components
import LineAreaViz from './visualizations/LineAreaViz';
import BarChartViz from './visualizations/BarChartViz';
import RadialChartViz from './visualizations/RadialChartViz';
import ProgressViz from './visualizations/ProgressViz';

// --- IMPORT THE NEW FILTER UTIL ---
import { filterPayloadByTime } from '../utils/timeFilter';

// Modal style
const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '95%', sm: '90%', md: '80%', lg: '70%' }, // Wider
  maxWidth: '1000px', // Max width
  minHeight: '60vh', // Ensure it has some height
  bgcolor: 'background.paper',
  borderRadius: '16px',
  boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
  p: 0,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
};

interface SensorModalProps {
  open: boolean;
  onClose: () => void;
  sensorPointData: SensorPointData | null;
  isLoading: boolean;
  timeRange: number[]; // Receive the timeRange from App.tsx
}

const SensorModal: React.FC<SensorModalProps> = ({
  open,
  onClose,
  sensorPointData,
  isLoading,
  timeRange,
}) => {
  const theme = useTheme();
  const [selectedParam, setSelectedParam] = useState<SensorData | null>(null);

  useEffect(() => {
    if (sensorPointData && sensorPointData.parameters.length > 0) {
      setSelectedParam(sensorPointData.parameters[0]);
    } else {
      setSelectedParam(null);
    }
  }, [sensorPointData]);

  // --- FILTERED DATA ---
  // We use useMemo to recalculate the filtered payload only when
  // the selected parameter or the time range changes.
  const filteredPayload = useMemo(() => {
    if (!selectedParam) return null;
    return filterPayloadByTime(selectedParam.payload, timeRange[0], timeRange[1]);
  }, [selectedParam, timeRange]);
  // ---

  const renderVisualization = (sensor: SensorData | null) => {
    if (!sensor || !filteredPayload) return null; // Use the filtered payload

    switch (sensor.visualizationType) {
      case 'line':
      case 'area':
        return <LineAreaViz payload={filteredPayload} />; // Pass filtered data
      case 'bar':
      case 'stacked-bar':
        return <BarChartViz payload={filteredPayload} />; // Pass filtered data
      case 'radial':
        return <RadialChartViz payload={filteredPayload} />; // (Not time-based)
      case 'progress':
        return <ProgressViz payload={filteredPayload} />; // (Not time-based)
      default:
        return (
          <Typography color="error">
            Error: No visualization component found for type "
            {sensor.visualizationType}"
          </Typography>
        );
    }
  };

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
            borderBottom: '1px solid #eee',
            flexShrink: 0,
          }}
        >
          <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
            {sensorPointData?.pointName || 'Loading...'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Modal Content - 2 Columns (using Flexbox) */}
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' }, // Stack on mobile
            overflow: 'hidden',
          }}
        >
          {isLoading ? (
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                my: 5,
              }}
            >
              <CircularProgress />
            </Box>
          ) : sensorPointData ? (
            <>
              {/* === LEFT COLUMN (NAVIGATION) === */}
              <Box
                sx={{
                  width: { xs: '100%', md: '35%' },
                  flexShrink: 0,
                  borderRight: { xs: 'none', md: '1px solid #eee' },
                  borderBottom: { xs: '1px solid #eee', md: 'none' },
                  overflowY: 'auto',
                  maxHeight: { xs: '200px', md: '70vh' },
                }}
              >
                <Box sx={{ p: 1 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      px: 2,
                      py: 1,
                      color: 'text.secondary',
                      fontWeight: 600,
                    }}
                  >
                    MEASURED PARAMETERS
                  </Typography>
                  <List component="nav">
                    {sensorPointData.parameters.map((param) => (
                      <ListItem key={param.id} disablePadding>
                        <ListItemButton
                          selected={selectedParam?.id === param.id}
                          onClick={() => setSelectedParam(param)}
                        >
                          {/* --- THIS IS THE FIX --- */}
                          {/* We only show the name, not the '...' */}
                          <ListItemText primary={param.name} />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Box>

              {/* === RIGHT COLUMN (CONTENT) === */}
              <Box
                sx={{
                  width: { xs: '100%', md: '65%' },
                  flexGrow: 1,
                  p: 3,
                  overflowY: 'auto',
                  maxHeight: { xs: 'calc(100vh - 300px)', md: '70vh' },
                }}
              >
                {!selectedParam ? (
                  <Typography>Please select a parameter from the list.</Typography>
                ) : (
                  <>
                    {/* 1. The Visualization */}
                    <Box>{renderVisualization(selectedParam)}</Box>

                    {/* 2. The AI Overview */}
                    <Box
                      sx={{
                        mt: 3,
                        p: 2,
                        backgroundColor: theme.palette.primary.light,
                        borderRadius: '12px',
                        border: `1px solid ${theme.palette.primary.main}`,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <FlashOnIcon
                          sx={{
                            mr: 1.5,
                            fontSize: '1.5rem',
                          }}
                        />
                        <Box>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 600,
                              mb: 0.5,
                            }}
                          >
                            AI-Powered Analysis
                          </Typography>
                          <AiOverview
                            sensorName={selectedParam.name}
                            payload={filteredPayload} // Pass filtered data to AI
                          />
                        </Box>
                      </Box>
                    </Box>
                  </>
                )}
              </Box>
            </>
          ) : (
            <Typography sx={{ p: 3 }}>
              No data available for this point.
            </Typography>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default SensorModal;