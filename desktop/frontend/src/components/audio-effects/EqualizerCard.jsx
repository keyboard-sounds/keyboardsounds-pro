import { Box, Typography, Switch, Slider, Select, MenuItem, Button } from '@mui/material';
import { GlassCard } from '../common';
import { greenSwitchStyle, equalizerPresets, selectMenuProps } from '../../constants';

function EqualizerCard({
  enabled,
  setEnabled,
  bands,
  setBands,
}) {
  const applyPreset = (presetName) => {
    const preset = equalizerPresets[presetName];
    if (preset) {
      setBands(preset.map(band => ({ ...band })));
    }
  };

  const resetAll = () => {
    setBands(bands.map(band => ({ ...band, gain: 0 })));
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
          Equalizer
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
        Fine-tune the frequency balance of your key press sounds. Boost bass for deeper tones or enhance treble for crisper clicks.
      </Typography>

      {/* Preset Selector */}
      <Box sx={{ marginBottom: '20px' }}>
        <Typography
          sx={{
            color: 'var(--text-secondary)',
            fontSize: '13px',
            fontWeight: 500,
            marginBottom: '8px',
          }}
        >
          Preset
        </Typography>
        <Select
          defaultValue="flat"
          onChange={(e) => applyPreset(e.target.value)}
          disabled={!enabled}
          sx={{
            width: '100%',
            backgroundColor: 'var(--input-bg)',
            backdropFilter: 'blur(10px) saturate(180%)',
            WebkitBackdropFilter: 'blur(10px) saturate(180%)',
            borderRadius: '10px',
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontWeight: 500,
            border: '1px solid var(--card-border)',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'transparent',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'var(--input-border-hover)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'var(--accent-border)',
            },
            '& .MuiSelect-select': {
              padding: '10px 14px',
            },
            '& .MuiSvgIcon-root': {
              color: 'var(--text-secondary)',
            },
            '&.Mui-disabled': {
              color: 'var(--text-muted)',
              borderColor: 'var(--input-border)',
            },
          }}
          MenuProps={selectMenuProps}
        >
          <MenuItem value="flat">Flat</MenuItem>
          <MenuItem value="bassBoost">Bass Boost</MenuItem>
          <MenuItem value="trebleBoost">Treble Boost</MenuItem>
        </Select>
      </Box>

      {/* Equalizer Bands */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '8px',
          padding: '16px',
          background: 'var(--hover-bg-light)',
          borderRadius: '12px',
          border: '1px solid var(--card-border)',
        }}
      >
        {bands.map((band, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1,
              gap: '8px',
            }}
          >
            <Slider
              orientation="vertical"
              value={band.gain}
              onChange={(e, newValue) => {
                const newBands = [...bands];
                newBands[index].gain = newValue;
                setBands(newBands);
              }}
              min={-12}
              max={12}
              step={0.5}
              disabled={!enabled}
              valueLabelDisplay="on"
              valueLabelFormat={(value) => `${value > 0 ? '+' : ''}${value}dB`}
              sx={{
                height: '200px',
                color: enabled ? 'var(--accent-primary)' : 'var(--input-border)',
                '& .MuiSlider-thumb': {
                  backgroundColor: enabled ? 'var(--accent-primary)' : 'var(--input-border)',
                  border: '2px solid var(--bg-primary)',
                  width: '20px',
                  height: '20px',
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
                  width: '6px',
                },
                '& .MuiSlider-rail': {
                  backgroundColor: 'var(--hover-bg-light)',
                  width: '6px',
                },
                '& .MuiSlider-valueLabel': {
                  backgroundColor: 'var(--dropdown-bg)',
                  backdropFilter: 'blur(10px)',
                  color: 'var(--text-primary)',
                  fontSize: '11px',
                  fontWeight: 500,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid var(--card-border)',
                  whiteSpace: 'nowrap',
                  width: 'auto',
                  minWidth: 'max-content',
                  // Center the value label above the thumb
                  right: 'auto',
                  left: '50% !important',
                  top: '-8px',
                  transform: 'translateX(-50%) translateY(-100%) !important',
                  '& > *': {
                    width: 'auto',
                    minWidth: 'max-content',
                    transform: 'none !important',
                  },
                  '&::before': {
                    display: 'none',
                  },
                },
              }}
            />
            <Typography
              sx={{
                color: 'var(--text-secondary)',
                fontSize: '11px',
                fontWeight: 500,
                textAlign: 'center',
                marginTop: '4px',
              }}
            >
              {band.freq >= 1000 ? `${(band.freq / 1000).toFixed(1)}k` : band.freq}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Reset Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
        <Button
          onClick={resetAll}
          disabled={!enabled}
          sx={{
            color: 'var(--text-secondary)',
            fontSize: '12px',
            textTransform: 'none',
            padding: '6px 12px',
            '&:hover': {
              backgroundColor: 'var(--hover-bg-light)',
              color: 'var(--text-primary)',
            },
            '&.Mui-disabled': {
              color: 'var(--text-muted)',
            },
          }}
        >
          Reset All
        </Button>
      </Box>
    </GlassCard>
  );
}

export default EqualizerCard;

