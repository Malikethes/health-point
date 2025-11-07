import { useState } from 'react';
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
import { getMockDataForSensor } from './data/mockData'; // Import our new mock function
import type { SensorData } from './data/sensorData.types'; // Import our new type

// Import all our new visualization components
import LineAreaViz from './components/visualizations/LineAreaViz';
import BarChartViz from './components/visualizations/BarChartViz';
import RadialChartViz from './components/visualizations/RadialChartViz';
import ProgressViz from './components/visualizations/ProgressViz';

// Theme remains the same
const theme = createTheme({
  palette: {
    primary: { main: '#007AFF', light: '#e0f0ff' },
    secondary: { main: '#8E24AA' },
    success: { main: '#4CAF50' },
    warning: { main: '#FFA726' },
    text: { primary: '#333', secondary: '#666' },
    background: { default: '#f4f7f6' },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    h2: { fontWeight: 600, fontSize: '2.5rem', color: '#333' },
    h4: { fontWeight: 600, fontSize: '1.8rem', color: '#333' },
    h5: { fontWeight: 600, fontSize: '1.2rem', color: '#333' },
    h6: { fontWeight: 500, fontSize: '1.1rem' },
    body1: { fontSize: '0.95rem', lineHeight: 1.6 },
    button: { textTransform: 'none' },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.12)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiButton: { styleOverrides: { root: { borderRadius: '8px' } } },
    MuiModal: { styleOverrides: { root: { backdropFilter: 'blur(3px)' } } },
  },
});

function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState<SensorData | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<string>('General');

  const handleSensorClick = async (sensorId: string) => {
    setIsLoading(true);
    setSelectedSensor(null);
    setModalOpen(true);

    try {
      // Call our mock data function
      const data = await getMockDataForSensor(sensorId, selectedPersona);
      setSelectedSensor(data);
    } catch (error) {
      console.error('Failed to fetch sensor data:', error);
      setSelectedSensor(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedSensor(null);
  };

  // === NEW FUNCTION ===
  // This function decides which visualization component to render
  // based on the data we received.
  const renderVisualization = (sensor: SensorData | null) => {
    if (!sensor) return null;

    switch (sensor.visualizationType) {
      case 'line':
      case 'area':
        return <LineAreaViz payload={sensor.payload} />;
      
      case 'bar':
      case 'stacked-bar':
        return <BarChartViz payload={sensor.payload} />;

      case 'radial':
        return <RadialChartViz payload={sensor.payload} />;

      case 'progress':
        return <ProgressViz payload={sensor.payload} />;
        
      default:
        return (
          <Typography color="error">
            Error: No visualization component found for type "{sensor.visualizationType}"
          </Typography>
        );
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default, py: 4 }}>
        <Container maxWidth="lg">
          <Box sx={{ my: 4 }}>
            <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
              Select Dataset
            </Typography>
            <PersonaSelection
              selectedPersona={selectedPersona}
              onSelectPersona={setSelectedPersona}
            />

            <Box
              sx={{
                mt: 4,
                p: 4,
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
                textAlign: 'center',
              }}
            >
              <Typography variant="h6" component="p" gutterBottom sx={{ mt: 2 }}>
                Interactive Health Monitoring
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Click on any metric point to view detailed analysis
              </Typography>

              {/* HumanVisualization component remains the same */}
              <HumanVisualization onSensorClick={handleSensorClick} />
            </Box>
          </Box>

          {/* The SensorModal is now a "frame".
            We pass the sensor data to it for the header and AI box.
            We pass the *correct visualization component* as its child.
          */}
          <SensorModal
            open={modalOpen}
            onClose={handleCloseModal}
            sensor={selectedSensor}
            isLoading={isLoading}
          >
            {renderVisualization(selectedSensor)}
          </SensorModal>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;