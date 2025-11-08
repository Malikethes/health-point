import React from 'react';
import {
  Modal,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {
  AccessibilityNew as BodyIcon,
  WbSunny as LifestyleIcon,
  Description as NotesIcon,
  Check as CheckIcon,
  Close as CloseRedIcon,
} from '@mui/icons-material';
import type { SubjectInfo } from '../services/apiService';

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '95%', sm: '60%', md: '500px' },
  bgcolor: 'background.paper',
  borderRadius: '16px',
  boxShadow: 24,
  p: 4,
  maxHeight: '80vh',
  overflowY: 'auto',
};

interface SubjectInfoModalProps {
  open: boolean;
  onClose: () => void;
  subjectId: string;
  info: SubjectInfo | null;
  isLoading: boolean;
}

const InfoItem: React.FC<{
  label: string;
  value: string | number | boolean;
  unit?: string;
}> = ({ label, value, unit }) => {
  const isBoolean = typeof value === 'boolean';
  return (
    <ListItem disablePadding sx={{ py: 0.5 }}>
      <ListItemText
        primary={label}
        secondary={
          isBoolean
            ? undefined
            : `${value} ${unit || ''}`
        }
      />
      <ListItemIcon sx={{ minWidth: 40, justifyContent: 'flex-end' }}>
        {isBoolean ? (
          value ? (
            <CheckIcon color="success" />
          ) : (
            <CloseRedIcon color="error" />
          )
        ) : (
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {/* The value is already in secondary text, this is just for alignment */}
          </Typography>
        )}
      </ListItemIcon>
    </ListItem>
  );
};

const SubjectInfoModal: React.FC<SubjectInfoModalProps> = ({
  open,
  onClose,
  subjectId,
  info,
  isLoading,
}) => {
  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        {/* Header */}
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}
        >
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
            Subject Context ({subjectId})
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : info ? (
          <>
            {/* 1. Biographical Data */}
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', mb: 1 }}
            >
              <BodyIcon sx={{ mr: 1 }} /> Physical Profile
            </Typography>
            <List dense>
              <InfoItem label="Age" value={info.age} unit="years" />
              <InfoItem label="Gender" value={info.gender} />
              <InfoItem label="Height" value={info.height} unit="cm" />
              <InfoItem label="Weight" value={info.weight} unit="kg" />
              <InfoItem
                label="Dominant Hand"
                value={info.dominant_hand}
              />
            </List>

            <Divider sx={{ my: 2 }} />

            {/* 2. Contextual/Lifestyle Data */}
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', mb: 1 }}
            >
              <LifestyleIcon sx={{ mr: 1 }} /> Current Context
            </Typography>
            <List dense>
              <InfoItem label="Coffee Today" value={info.coffee_today} />
              <InfoItem label="Coffee Last Hour" value={info.coffee_last_hour} />
              <InfoItem label="Sports Today" value={info.sports_today} />
              <InfoItem label="Smoker" value={info.smoker} />
              <InfoItem label="Smoked Last Hour" value={info.smoke_last_hour} />
            </List>

            <Divider sx={{ my: 2 }} />

            {/* 3. Additional Notes */}
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', mb: 1 }}
            >
              <NotesIcon sx={{ mr: 1 }} /> Researcher Notes
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
              {info.additional_notes || 'No additional notes provided.'}
            </Typography>
          </>
        ) : (
          <Typography variant="body1" color="text.secondary">
            Could not load subject information.
          </Typography>
        )}
      </Box>
    </Modal>
  );
};

export default SubjectInfoModal;