import { Box, Typography, Switch, Slider } from '@mui/material';
import { GlassCard } from '../common';
import { greenSwitchStyle } from '../../constants';

function PitchShiftCard({
  enabled,
  setEnabled,
  pitchRange,
  setPitchRange,
}) {
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
          Pitch Shift
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
        Adds variance to your key press sounds by randomly shifting the pitch within the specified range, making each keystroke sound slightly different.
      </Typography>

      {/* Pitch Slider */}
      <Box sx={{ marginBottom: '24px', paddingTop: '16px' }}>
        <Slider
          disableSwap
          value={pitchRange}
          onChange={(e, newValue) => setPitchRange(newValue)}
          min={-12}
          max={12}
          size="small"
          step={1}
          disabled={!enabled}
          valueLabelDisplay="on"
          valueLabelFormat={(value) => value > -1 ? `+${value}st` : `${value}st`}
          marks={[
            { value: -10, label: '-10st' },
            { value: -6, label: '-6st' },
            { value: -2, label: '-2st' },
            { value: 0, label: '-' },
            { value: 2, label: '+2st' },
            { value: 6, label: '+6st' },
            { value: 10, label: '+10st' },
          ]}
          sx={{
            color: enabled ? 'var(--accent-primary)' : 'var(--input-border)',
            '& .MuiSlider-thumb': {
              backgroundColor: enabled ? 'var(--accent-primary)' : 'var(--input-border)',
              border: '2px solid var(--bg-primary)',
              width: '16px',
              height: '16px',
              '&:hover': {
                boxShadow: enabled ? '0 0 0 8px var(--accent-bg)' : 'none',
              },
              '&.Mui-active': {
                boxShadow: enabled ? '0 0 0 12px var(--accent-bg)' : 'none',
              },
            },
            '& .MuiSlider-track': {
              backgroundColor: enabled ? 'var(--accent-primary)' : 'var(--input-border)',
              border: 'none',
              height: '4px',
            },
            '& .MuiSlider-rail': {
              backgroundColor: 'var(--hover-bg-light)',
              height: '4px',
            },
            '& .MuiSlider-mark': {
              backgroundColor: 'var(--input-border)',
              width: '2px',
              height: '8px',
            },
            '& .MuiSlider-markLabel': {
              color: 'var(--text-tertiary)',
              fontSize: '11px',
              marginTop: '8px',
            },
            '& .MuiSlider-valueLabel': {
              backgroundColor: 'var(--dropdown-bg)',
              backdropFilter: 'blur(10px)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: 500,
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid var(--card-border)',
              '&::before': {
                display: 'none',
              },
            },
          }}
        />
      </Box>
    </GlassCard>
  );
}

export default PitchShiftCard;
