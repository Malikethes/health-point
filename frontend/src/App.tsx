import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  CssBaseline,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import HumanVisualization from './components/HumanVisualization';
import SensorModal from './components/SensorModal';
import PersonaSelection from './components/PersonaSelection';
import TimeRangeSlider from './components/TimeRangeSlider';
import StatusPanel from './components/StatusPanel';
import SubjectInfoModal from './components/SubjectInfoModal';
import AIVibesLoading from './components/AIVibesLoading'; // <-- NEW IMPORT
// --- DATA IMPORTS ---
import {
  fetchSensorPointData,
  getOverallStatusAI,
} from './data/dataService';
import { mockSensorPointDatabase } from './data/mockData';
// --- TYPE IMPORTS ---
import type { SummaryData } from './components/StatusPanel';
import type { SensorData, SensorPointData } from './data/sensorData.types';
import { fetchSubjectInfo, type SubjectInfo } from './services/apiService';
import { calculateSummary } from './utils/dataCalculator';

// A simple, reassuring theme
const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#f4f7f6', // Light grey page background
      paper: '#ffffff', // White card background
    },
    primary: {
      main: '#007AFF', // Figma-like blue
    },
    text: {
      primary: '#1A1A1A', // Darker text for contrast
      secondary: '#666666', // Lighter grey text
    },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h2: {
      fontWeight: 600,
      fontSize: '2.5rem',
      color: '#1A1A1A',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.2rem',
      color: '#1A1A1A',
    },
    h6: {
      fontWeight: 600, // Make titles a bit bolder
      fontSize: '1.1rem',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)', // Subtle shadow
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        },
      },
    },
  },
});

// --- TIME CONFIG ---
// We'll use the relative time from our (new) mock data
const MASTER_START_TIME = 0;
const MASTER_END_TIME = 3600; // 1 hour in seconds
// --- END TIME CONFIG ---

function App() {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedSensorPointData, setSensorPointData] =
    useState<SensorPointData | null>(null);

  // State for all data (fetched once at load)
  const [allData, setAllData] = useState<SensorData[]>([]);

  // State for the time slider
  const [timeRange, setTimeRange] = useState<number[]>([
    MASTER_START_TIME,
    MASTER_END_TIME,
  ]);

  // State for the dataset selector
  const [selectedDataset, setSelectedDataset] = useState<string>('S2');

  // State for the left panel summaries
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);

  // State for the emoji status
  const [overallStatus, setOverallStatus] = useState<{
    emoji: string;
    insight: string;
  } | null>(null);

  // --- SUBJECT INFO STATE ---
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [subjectInfo, setSubjectInfo] = useState<SubjectInfo | null>(null);
  const [isSubjectInfoLoading, setIsSubjectInfoLoading] = useState(false);
  // --- END SUBJECT INFO STATE ---

  // --- DATA FETCHING (MAIN EFFECT) ---
  // This effect handles the two-stage loading
  useEffect(() => {
    console.log(`Fetching data for dataset: ${selectedDataset}`);
    setIsSubjectInfoLoading(true); // Stage 1: Load essential info first
    setAllData([]); // Clear previous data
    setSummaryData(null);
    setOverallStatus(null);
    
    // Stage 1: Fetch essential info (must be fetched first for immediate use)
    const infoPromise = fetchSubjectInfo(selectedDataset);

    infoPromise
      .then((info) => {
        setSubjectInfo(info);
        setIsSubjectInfoLoading(false); // Stage 1 complete

        // Stage 2: Load heavy sensor data (starts only after info is ready)
        setIsAppLoading(true);

        const chestPromise = fetchSensorPointData('chest', selectedDataset);
        const handPromise = fetchSensorPointData('hand', selectedDataset);

        return Promise.all([chestPromise, handPromise]);
      })
      .then(([chestData, handData]) => {
        const allParams = [
          ...chestData.parameters,
          ...handData.parameters,
        ];
        setAllData(allParams);
      })
      .catch((err) => {
        console.error('Error fetching data:', err);
        setAllData([]);
        setSubjectInfo(null);
        setIsSubjectInfoLoading(false); // Ensure loader is dismissed
      })
      .finally(() => {
        setIsAppLoading(false); // Stage 2 complete
      });
  }, [selectedDataset]);

  // --- SUMMARY CALCULATION (UNCHANGED LOGIC) ---
  useMemo(() => {
    if (!allData || allData.length === 0) {
      setSummaryData(null);
      return;
    }

    const newSummary: SummaryData = {
      'heart-rate': calculateSummary(
        allData.find((p) => p.id === 'heart-rate')!,
        timeRange,
      ),
      'breathing-rate': calculateSummary(
        allData.find((p) => p.id === 'breathing-rate')!,
        timeRange,
      ),
      'stress': calculateSummary(
        allData.find((p) => p.id === 'stress')!,
        timeRange,
      ),
      'activity': calculateSummary(
        allData.find((p) => p.id === 'activity')!,
        timeRange,
      ),
      'temperature': calculateSummary(
        allData.find((p) => p.id === 'temperature')!,
        timeRange,
      ),
    };
    setSummaryData(newSummary);

    getOverallStatusAI(allData, timeRange).then((status) => {
      setOverallStatus(status);
    });
  }, [allData, timeRange]);

  // --- EVENT HANDLERS (UNCHANGED) ---
  const handleSensorClick = async (sensorPointId: string) => {
    setModalLoading(true);
    setSensorPointData(null);
    setModalOpen(true);

    const pointTemplate = mockSensorPointDatabase[sensorPointId];
    if (!pointTemplate) {
      console.error(`No template found for point: ${sensorPointId}`);
      setModalLoading(false);
      return;
    }

    const pointParams = pointTemplate.parameters.map((p) =>
      allData.find((d) => d.id === p.id),
    );

    const dataForModal: SensorPointData = {
      pointId: sensorPointId,
      pointName: pointTemplate.pointName,
      parameters: pointParams.filter(Boolean) as SensorData[],
    };

    setSensorPointData(dataForModal);
    setModalLoading(false);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSensorPointData(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default,
          py: { xs: 2, md: 4 },
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: '16px',
              boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '80vh',
            }}
          >
            {/* Top Bar: Dataset Selector */}
            <Box
              sx={{
                p: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
                position: 'relative', // Context for loading overlay
                zIndex: 2, // Ensure selector is above loading screen
              }}
            >
              <PersonaSelection
                selectedDataset={selectedDataset}
                onSelectDataset={setSelectedDataset}
                onOpenInfo={() => setIsInfoModalOpen(true)}
              />
            </Box>

            {/* Main Content Area */}
            <Box
              sx={{
                display: 'flex',
                flexGrow: 1,
                flexDirection: { xs: 'column', md: 'row' },
                position: 'relative', // Context for AIVibesLoading
              }}
            >
              {/* --- NEW: AI VIBES LOADING OVERLAY --- */}
              <AIVibesLoading isLoading={isAppLoading} />
              {/* --- END NEW --- */}

              {/* Left Column (Status Panel) */}
              <Box
                sx={{
                  width: { xs: '100%', md: '35%', lg: '30%' },
                  p: 3,
                  borderRight: { xs: 'none', md: `1px solid ${theme.palette.divider}` },
                  borderBottom: { xs: `1px solid ${theme.palette.divider}`, md: 'none' },
                  flexShrink: 0,
                  // Ensure panel is usable when loaded
                  pointerEvents: isAppLoading ? 'none' : 'auto',
                }}
              >
                <StatusPanel summary={summaryData} isLoading={isAppLoading} />
              </Box>

              {/* Right Column (Human + Slider) */}
              <Box
                sx={{
                  flexGrow: 1,
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '400px',
                  // Ensure panel is usable when loaded
                  pointerEvents: isAppLoading ? 'none' : 'auto',
                }}
              >
                <Typography variant="h6" component="h3">
                  Interactive Health Monitoring
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Click a sensor point to explore.
                </Typography>

                <Box
                  sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <HumanVisualization
                    onSensorClick={handleSensorClick}
                    overallStatus={overallStatus}
                  />
                </Box>

                <TimeRangeSlider
                  masterStart={MASTER_START_TIME}
                  masterEnd={MASTER_END_TIME}
                  value={timeRange}
                  onChange={setTimeRange}
                />
              </Box>
            </Box>
          </Box>
        </Container>

        {/* Modal (sits outside the layout) */}
        <SensorModal
          open={modalOpen}
          onClose={handleCloseModal}
          sensorPointData={selectedSensorPointData}
          isLoading={modalLoading}
          timeRange={timeRange}
        />
        
        {/* Subject Info Modal (NEW) */}
        <SubjectInfoModal
          open={isInfoModalOpen}
          onClose={() => setIsInfoModalOpen(false)}
          subjectId={selectedDataset}
          info={subjectInfo}
          isLoading={isSubjectInfoLoading}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;