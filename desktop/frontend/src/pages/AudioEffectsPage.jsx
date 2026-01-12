import { Box, FormControl, Select, MenuItem } from '@mui/material';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MouseIcon from '@mui/icons-material/Mouse';
import { PageHeader } from '../components/common';
import { PitchShiftCard, EqualizerCard, PanCard } from '../components/audio-effects';
import { selectMenuProps } from '../constants';

function AudioEffectsPage({
  audioInputMethod,
  setAudioInputMethod,
  // Keyboard settings
  pitchShiftEnabled,
  setPitchShiftEnabled,
  pitchRange,
  setPitchRange,
  equalizerEnabled,
  setEqualizerEnabled,
  equalizerBands,
  setEqualizerBands,
  // Mouse settings
  pitchShiftEnabledMouse,
  setPitchShiftEnabledMouse,
  pitchRangeMouse,
  setPitchRangeMouse,
  equalizerEnabledMouse,
  setEqualizerEnabledMouse,
  equalizerBandsMouse,
  setEqualizerBandsMouse,
  // Pan settings - Keyboard
  panEnabled,
  setPanEnabled,
  panMode,
  setPanMode,
  panKeyPositionKeys,
  setPanKeyPositionKeys,
  // Pan settings - Mouse (mouse only has enabled/disabled, always random mode)
  panEnabledMouse,
  setPanEnabledMouse,
}) {
  const isKeyboard = audioInputMethod === 'keyboard';

  return (
    <Box>
      {/* Header with Input Method Selector */}
      <PageHeader title="Audio Effects">
        <FormControl size="small" sx={{ minWidth: '150px' }}>
          <Select
            value={audioInputMethod}
            onChange={(e) => setAudioInputMethod(e.target.value)}
            sx={{
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
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              },
              '& .MuiSvgIcon-root': {
                color: 'var(--text-secondary)',
              },
            }}
            MenuProps={selectMenuProps}
          >
            <MenuItem value="keyboard">
              <KeyboardIcon sx={{ fontSize: '18px', marginRight: '8px' }} />
              Keyboard
            </MenuItem>
            <MenuItem value="mouse">
              <MouseIcon sx={{ fontSize: '18px', marginRight: '8px' }} />
              Mouse
            </MenuItem>
          </Select>
        </FormControl>
      </PageHeader>

      {/* Pitch Shift Section */}
      <PitchShiftCard
        enabled={isKeyboard ? pitchShiftEnabled : pitchShiftEnabledMouse}
        setEnabled={isKeyboard ? setPitchShiftEnabled : setPitchShiftEnabledMouse}
        pitchRange={isKeyboard ? pitchRange : pitchRangeMouse}
        setPitchRange={isKeyboard ? setPitchRange : setPitchRangeMouse}
      />

      {/* Equalizer Section */}
      <EqualizerCard
        enabled={isKeyboard ? equalizerEnabled : equalizerEnabledMouse}
        setEnabled={isKeyboard ? setEqualizerEnabled : setEqualizerEnabledMouse}
        bands={isKeyboard ? equalizerBands : equalizerBandsMouse}
        setBands={isKeyboard ? setEqualizerBands : setEqualizerBandsMouse}
      />

      {/* Pan Section */}
      <PanCard
        enabled={isKeyboard ? panEnabled : panEnabledMouse}
        setEnabled={isKeyboard ? setPanEnabled : setPanEnabledMouse}
        panMode={panMode}
        setPanMode={setPanMode}
        keyPositionKeys={panKeyPositionKeys}
        setKeyPositionKeys={setPanKeyPositionKeys}
        isKeyboard={isKeyboard}
      />
    </Box>
  );
}

export default AudioEffectsPage;
