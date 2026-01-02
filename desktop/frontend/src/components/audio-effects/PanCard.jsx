import { Box, Typography, Switch, ToggleButton, ToggleButtonGroup, TextField } from '@mui/material';
import { GlassCard } from '../common';
import { greenSwitchStyle } from '../../constants';

function PanCard({
  enabled,
  setEnabled,
  panMode,
  setPanMode,
  keyPositionKeys,
  setKeyPositionKeys,
  isKeyboard = true,
}) {
  const handleKeyPositionChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1) {
      setKeyPositionKeys(value);
    } else if (e.target.value === '') {
      setKeyPositionKeys(1);
    }
  };

  return (
    <GlassCard sx={{ marginBottom: '24px' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <Typography
          variant="h6"
          sx={{
            color: 'var(--text-primary)',
            fontSize: '18px',
            fontWeight: 600,
          }}
        >
          Pan
        </Typography>
        <Switch
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          sx={greenSwitchStyle}
        />
      </Box>
      
      {/* Description */}
      <Typography
        sx={{
          color: 'var(--text-secondary)',
          fontSize: '13px',
          lineHeight: 1.5,
          marginBottom: '20px',
        }}
      >
        Positions audio in the stereo field, making sounds appear to come from different directions for a more immersive experience.
      </Typography>

      {/* Mode Selection - Only show for keyboard */}
      {isKeyboard && (
        <Box sx={{ marginBottom: '24px' }}>
          <Typography
            sx={{
              color: 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: 500,
              marginBottom: '8px',
            }}
          >
            Mode
          </Typography>
          <ToggleButtonGroup
            value={panMode}
            exclusive
            onChange={(e, newValue) => {
              if (newValue !== null) {
                setPanMode(newValue);
              }
            }}
            disabled={!enabled}
            sx={{
              width: '100%',
              display: 'flex',
              gap: '8px',
              '& .MuiToggleButtonGroup-grouped': {
                flex: 1,
                border: '1px solid var(--input-border)',
                borderRadius: '10px !important',
                padding: '10px 16px',
                textTransform: 'none',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--hover-bg-light)',
                '&:hover': {
                  backgroundColor: 'var(--hover-bg)',
                },
                '&.Mui-selected': {
                  backgroundColor: 'var(--accent-bg)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--accent-border)',
                  '&:hover': {
                    backgroundColor: 'var(--accent-bg-hover)',
                  },
                },
                '&.Mui-disabled': {
                  color: 'var(--text-muted)',
                  borderColor: 'var(--input-border)',
                },
              },
            }}
          >
            <ToggleButton value="keyPosition" aria-label="key-position-mode">
              <Typography sx={{ fontSize: '13px', fontWeight: 500 }}>Key Position</Typography>
            </ToggleButton>
            <ToggleButton value="random" aria-label="random-mode">
              <Typography sx={{ fontSize: '13px', fontWeight: 500 }}>Random</Typography>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      {/* Key Position Mode Settings - Only for keyboard */}
      {isKeyboard && panMode === 'keyPosition' && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <Typography
              sx={{
                color: 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              Longest Row
            </Typography>
          </Box>
          <TextField
            type="number"
            value={keyPositionKeys}
            onChange={handleKeyPositionChange}
            disabled={!enabled}
            inputProps={{ min: 1 }}
            size="small"
            sx={{
              width: '100%',
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'var(--hover-bg-light)',
                borderRadius: '10px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                '& fieldset': {
                  borderColor: 'var(--input-border)',
                },
                '&:hover fieldset': {
                  borderColor: 'var(--input-border-hover)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'var(--accent-border)',
                },
                '&.Mui-disabled': {
                  color: 'var(--text-muted)',
                  '& fieldset': {
                    borderColor: 'var(--input-border)',
                  },
                },
              },
              '& .MuiInputBase-input': {
                color: 'var(--text-primary)',
                '&.Mui-disabled': {
                  color: 'var(--text-muted)',
                  WebkitTextFillColor: 'var(--text-muted)',
                },
              },
            }}
          />
          <Typography
            sx={{
              color: 'var(--text-muted)',
              fontSize: '11px',
              marginTop: '8px',
              fontStyle: 'italic',
            }}
          >
            The number of keys in the longest row of your keyboard. Pan position is calculated based on key position.
          </Typography>
        </Box>
      )}

      {/* Mouse Pan Info */}
      {!isKeyboard && (
        <Typography
          sx={{
            color: 'var(--text-muted)',
            fontSize: '11px',
            fontStyle: 'italic',
          }}
        >
          Mouse clicks will be randomly panned across the stereo field.
        </Typography>
      )}
    </GlassCard>
  );
}

export default PanCard;
