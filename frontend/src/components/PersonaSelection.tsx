import React from 'react';
import {
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Box,
  IconButton,
  Tooltip, // Import IconButton
} from '@mui/material';
import { type SelectChangeEvent } from '@mui/material/Select';
import InfoIcon from '@mui/icons-material/InfoOutlined'; // Import Info Icon

// Generate the dataset names from S2 to S17
const datasetNames: string[] = [];
for (let i = 2; i <= 17; i++) {
  datasetNames.push(`S${i}`);
}

interface PersonaSelectionProps {
  selectedDataset: string;
  onSelectDataset: (datasetId: string) => void;
  // NEW: Prop to open the info modal
  onOpenInfo: () => void;
}

const PersonaSelection: React.FC<PersonaSelectionProps> = ({
  selectedDataset,
  onSelectDataset,
  onOpenInfo, // Use the new prop
}) => {
  const handleChange = (event: SelectChangeEvent) => {
    onSelectDataset(event.target.value as string);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 3 }}>
      <FormControl
        size="small"
        sx={{ minWidth: 200, flexGrow: 0 }}
      >
        <InputLabel id="dataset-selector-label">
          Dataset ID
        </InputLabel>
        <Select
          labelId="dataset-selector-label"
          value={selectedDataset}
          label="Dataset ID"
          onChange={handleChange}
          sx={{
            borderRadius: '8px',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(0, 0, 0, 0.12)', // Subtle border
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: (theme) => theme.palette.primary.main,
            },
            backgroundColor: 'white',
          }}
        >
          {datasetNames.map((name) => (
            <MenuItem key={name} value={name}>
              {name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* NEW: Info Button */}
      <Tooltip title={`View context for ${selectedDataset}`}>
        <IconButton
          onClick={onOpenInfo}
          sx={{
            ml: 1,
            color: (theme) => theme.palette.text.secondary,
            '&:hover': {
              color: (theme) => theme.palette.primary.main,
            },
          }}
        >
          <InfoIcon />
        </IconButton>
      </Tooltip>
      {/* END NEW */}
    </Box>
  );
};

export default PersonaSelection;