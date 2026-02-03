import { useState, useEffect } from 'react';
import { Box, Typography, Switch, TextField, Slider, Chip, MenuItem, Select, FormControl } from '@mui/material';
import { GlassCard, PageHeader } from '../components/common';
import { greenSwitchStyle, selectMenuProps } from '../constants';
import { GetState, SetEnabled, SetConfig, GetMonitors } from '../../wailsjs/go/app/OSKHelperBinding';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import PaletteIcon from '@mui/icons-material/Palette';
import PositionIcon from '@mui/icons-material/AspectRatio';
import TimerIcon from '@mui/icons-material/Timer';
import PreviewIcon from '@mui/icons-material/Visibility';
import MonitorIcon from '@mui/icons-material/Monitor';

function OSKHelperPage() {
  const [enabled, setEnabled] = useState(false);
  const [fontSize, setFontSize] = useState(72);
  const [fontColor, setFontColor] = useState('#bed1d5');
  const [backgroundColor, setBackgroundColor] = useState('#4e4b4b');
  const [backgroundOpacity, setBackgroundOpacity] = useState(94);
  const [cornerRadius, setCornerRadius] = useState(30);
  const [position, setPosition] = useState('bottom');
  const [offset, setOffset] = useState(100);
  const [dismissAfter, setDismissAfter] = useState(1000);
  const [monitorIndex, setMonitorIndex] = useState(0);
  const [monitors, setMonitors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load state from backend
  useEffect(() => {
    const loadState = async () => {
      try {
        const [state, availableMonitors] = await Promise.all([
          GetState(),
          GetMonitors()
        ]);
        
        setEnabled(state.enabled);
        setFontSize(state.fontSize || 24);
        setFontColor(state.fontColor || '#FFFFFF');
        setBackgroundColor(state.backgroundColor || '#000000');
        setBackgroundOpacity(state.backgroundOpacity || 200);
        setCornerRadius(state.cornerRadius || 12);
        setPosition(state.position || 'bottom');
        setOffset(state.offset || 20);
        setDismissAfter(state.dismissAfter || 1000);
        setMonitorIndex(state.monitorIndex || 0);
        setMonitors(availableMonitors || []);
      } catch (error) {
        console.error('Failed to load OSK Helper state:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadState();
  }, []);

  // Update enabled state
  const handleSetEnabled = async (value) => {
    setEnabled(value);
    try {
      await SetEnabled(value);
    } catch (error) {
      console.error('Failed to set OSK Helper enabled state:', error);
    }
  };

  // Update config
  const updateConfig = async (updates) => {
    const newConfig = {
      fontSize: updates.fontSize !== undefined ? updates.fontSize : fontSize,
      fontColor: updates.fontColor !== undefined ? updates.fontColor : fontColor,
      backgroundColor: updates.backgroundColor !== undefined ? updates.backgroundColor : backgroundColor,
      backgroundOpacity: updates.backgroundOpacity !== undefined ? updates.backgroundOpacity : backgroundOpacity,
      cornerRadius: updates.cornerRadius !== undefined ? updates.cornerRadius : cornerRadius,
      position: updates.position !== undefined ? updates.position : position,
      offset: updates.offset !== undefined ? updates.offset : offset,
      dismissAfter: updates.dismissAfter !== undefined ? updates.dismissAfter : dismissAfter,
      monitorIndex: updates.monitorIndex !== undefined ? updates.monitorIndex : monitorIndex,
    };

    try {
      await SetConfig(
        newConfig.fontSize,
        newConfig.fontColor,
        newConfig.backgroundColor,
        newConfig.backgroundOpacity,
        newConfig.cornerRadius,
        newConfig.position,
        newConfig.offset,
        newConfig.dismissAfter,
        newConfig.monitorIndex
      );
    } catch (error) {
      console.error('Failed to update OSK Helper config:', error);
    }
  };

  const handleFontSizeChange = (value) => {
    setFontSize(value);
    updateConfig({ fontSize: value });
  };

  const handleFontColorChange = (value) => {
    setFontColor(value);
    updateConfig({ fontColor: value });
  };

  const handleBackgroundColorChange = (value) => {
    setBackgroundColor(value);
    updateConfig({ backgroundColor: value });
  };

  const handleBackgroundOpacityChange = (value) => {
    setBackgroundOpacity(value);
    updateConfig({ backgroundOpacity: value });
  };

  const handleCornerRadiusChange = (value) => {
    setCornerRadius(value);
    updateConfig({ cornerRadius: value });
  };

  const handlePositionChange = (value) => {
    setPosition(value);
    updateConfig({ position: value });
  };

  const handleOffsetChange = (value) => {
    setOffset(value);
    updateConfig({ offset: value });
  };

  const handleDismissAfterChange = (value) => {
    setDismissAfter(value);
    updateConfig({ dismissAfter: value });
  };

  const handleMonitorIndexChange = (value) => {
    setMonitorIndex(value);
    updateConfig({ monitorIndex: value });
  };

  const handlePresetChange = (preset) => {
    setFontColor(preset.font);
    setBackgroundColor(preset.bg);
    updateConfig({ fontColor: preset.font, backgroundColor: preset.bg });
  };

  if (isLoading) {
    return (
      <Box>
        <PageHeader title="On-Screen Modifiers" />
        <GlassCard>
          <Typography sx={{ color: 'var(--text-secondary)' }}>Loading...</Typography>
        </GlassCard>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="On-Screen Modifiers" />

      {/* Enable/Disable Section */}
      <GlassCard sx={{ marginBottom: '24px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ flexGrow: 1, maxWidth: '85%' }}>
            <Typography
              sx={{
                color: 'var(--text-primary)',
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: '4px',
              }}
            >
              Enable On-Screen Modifiers
            </Typography>
            <Typography
              sx={{
                color: 'var(--text-tertiary)',
                fontSize: '13px',
                lineHeight: 1.5,
              }}
            >
              Display pressed modifier keys on your screen in real-time. Perfect for tutorials, livestreams, or learning keyboard shortcuts.
            </Typography>
          </Box>
          <Switch
            checked={enabled}
            onChange={(e) => handleSetEnabled(e.target.checked)}
            sx={greenSwitchStyle}
          />
        </Box>
      </GlassCard>

      {/* Position Section */}
      <GlassCard sx={{ marginBottom: '24px', opacity: enabled ? 1 : 0.6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <PositionIcon 
            sx={{ 
              color: enabled ? 'var(--accent-primary)' : 'var(--text-tertiary)', 
              fontSize: '24px' 
            }} 
          />
          <Typography
            variant="h6"
            sx={{
              color: enabled ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontSize: '18px',
              fontWeight: 600,
            }}
          >
            Position
          </Typography>
        </Box>

        {/* Monitor Selection */}
        {monitors && monitors.length > 1 && (
          <Box sx={{ marginBottom: '28px' }}>
            <Typography
              sx={{
                color: enabled ? 'var(--text-primary)' : 'var(--text-tertiary)',
                fontSize: '15px',
                fontWeight: 500,
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              Display Monitor
            </Typography>
            <FormControl fullWidth disabled={!enabled}>
              <Select
                value={monitorIndex}
                onChange={(e) => handleMonitorIndexChange(e.target.value)}
                size="small"
                sx={{
                  backgroundColor: 'var(--input-bg)',
                  borderRadius: '12px',
                  border: '1px solid var(--input-border)',
                  color: enabled ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none',
                  },
                  '&:hover': {
                    borderColor: enabled ? 'var(--accent-primary)' : 'var(--input-border)',
                  },
                  '& .MuiSelect-icon': {
                    color: enabled ? 'var(--text-secondary)' : 'var(--text-disabled)',
                  },
                }}
                MenuProps={selectMenuProps}
              >
                {monitors.map((monitor) => (
                  <MenuItem key={monitor.index} value={monitor.index}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MonitorIcon sx={{ fontSize: '16px', color: 'var(--accent-primary)' }} />
                      <Typography>
                        Monitor {monitor.index + 1}
                        {monitor.isPrimary && ' (Primary)'}
                        {' - '}
                        {monitor.width} × {monitor.height}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Position */}
        <Box sx={{ marginBottom: '28px' }}>
          <Typography
            sx={{
              color: enabled ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontSize: '15px',
              fontWeight: 500,
              marginBottom: '12px',
            }}
          >
            Screen Position
          </Typography>
          <Box sx={{ display: 'flex', gap: '12px' }}>
            {['top', 'bottom'].map((pos) => (
              <Box
                key={pos}
                onClick={() => {
                  if (enabled) {
                    setPosition(pos);
                    handlePositionChange(pos);
                  }
                }}
                sx={{
                  flex: 1,
                  padding: '16px',
                  borderRadius: '12px',
                  border: position === pos 
                    ? '2px solid var(--accent-primary)' 
                    : '2px solid var(--input-border)',
                  backgroundColor: position === pos 
                    ? 'var(--accent-bg)' 
                    : 'var(--input-bg)',
                  cursor: enabled ? 'pointer' : 'not-allowed',
                  opacity: enabled ? 1 : 0.5,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  '&:hover': enabled ? {
                    backgroundColor: position === pos 
                      ? 'var(--accent-bg)' 
                      : 'var(--hover-bg)',
                    transform: 'translateY(-2px)',
                  } : {},
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    height: '40px',
                    borderRadius: '8px',
                    border: '2px dashed var(--input-border)',
                    position: 'relative',
                    display: 'flex',
                    alignItems: pos === 'top' ? 'flex-start' : 'flex-end',
                    justifyContent: 'center',
                    padding: '4px',
                  }}
                >
                  <Box
                    sx={{
                      width: '60%',
                      height: '8px',
                      borderRadius: '4px',
                      backgroundColor: position === pos 
                        ? 'var(--accent-primary)' 
                        : 'var(--text-tertiary)',
                    }}
                  />
                </Box>
                <Typography
                  sx={{
                    color: position === pos 
                      ? 'var(--accent-primary)' 
                      : enabled ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                    fontSize: '14px',
                    fontWeight: position === pos ? 600 : 500,
                    textTransform: 'capitalize',
                  }}
                >
                  {pos}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Offset */}
        <Box>
          <Typography
            sx={{
              color: enabled ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontSize: '15px',
              fontWeight: 500,
              marginBottom: '12px',
            }}
          >
            Offset from Edge: {offset}px
          </Typography>
          <Slider
            value={offset}
            onChange={(e, newValue) => setOffset(newValue)}
            onChangeCommitted={(e, newValue) => handleOffsetChange(newValue)}
            min={0}
            max={500}
            step={5}
            marks={[
              { value: 0, label: '0px' },
              { value: 100, label: '100px' },
              { value: 200, label: '200px' },
              { value: 300, label: '300px' },
              { value: 400, label: '400px' },
              { value: 500, label: '500px' },
            ]}
            disabled={!enabled}
            sx={{
              color: enabled ? 'var(--accent-primary)' : 'var(--input-border)',
              '& .MuiSlider-thumb': {
                backgroundColor: enabled ? 'var(--accent-primary)' : 'var(--input-border)',
              },
              '& .MuiSlider-track': {
                backgroundColor: enabled ? 'var(--accent-primary)' : 'var(--input-border)',
              },
              '& .MuiSlider-rail': {
                backgroundColor: 'var(--input-border)',
              },
              '& .MuiSlider-mark': {
                backgroundColor: 'var(--input-border)',
                height: '8px',
                width: '2px',
              },
              '& .MuiSlider-markLabel': {
                color: enabled ? 'var(--text-tertiary)' : 'var(--text-disabled)',
                fontSize: '11px',
                marginTop: '8px',
              },
            }}
          />
        </Box>
      </GlassCard>

      {/* Appearance Section */}
      <GlassCard sx={{ opacity: enabled ? 1 : 0.6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PaletteIcon 
              sx={{ 
                color: enabled ? 'var(--accent-primary)' : 'var(--text-tertiary)', 
                fontSize: '22px' 
              }} 
            />
          </Box>
          <Typography
            variant="h6"
            sx={{
              color: enabled ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontSize: '18px',
              fontWeight: 600,
            }}
          >
            Appearance
          </Typography>
        </Box>

        {/* Live Preview */}
        <Box sx={{ marginBottom: '18px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Typography
              sx={{
                color: 'var(--text-primary)',
                fontSize: '15px',
                fontWeight: 500,
              }}
            >
              Live Preview
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '120px',
              borderRadius: '12px',
              border: '2px dashed var(--input-border)',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                padding: '12px 24px',
                borderRadius: `${cornerRadius}px`,
                backgroundColor: backgroundColor,
                opacity: backgroundOpacity / 255,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Typography
                sx={{
                  color: fontColor,
                  fontSize: `${fontSize}px`,
                  fontWeight: 600,
                  fontFamily: 'monospace',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                Ctrl + Shift + A
              </Typography>
            </Box>
          </Box>
          <Typography
            sx={{
              color: 'var(--text-tertiary)',
              fontSize: '12px',
              textAlign: 'center',
              marginTop: '12px',
              fontStyle: 'italic',
            }}
          >
            This is how modifier keys will appear on your screen
          </Typography>
        </Box>

        {/* Font Size */}
        <Box sx={{ marginBottom: '8px' }}>
          <Typography
            sx={{
              color: enabled ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontSize: '15px',
              fontWeight: 500,
              marginBottom: '12px',
            }}
          >
            Font Size: {fontSize}px
          </Typography>
          <Slider
            value={fontSize}
            onChange={(e, newValue) => setFontSize(newValue)}
            onChangeCommitted={(e, newValue) => handleFontSizeChange(newValue)}
            min={12}
            max={120}
            step={2}
            disabled={!enabled}
            sx={{
              color: enabled ? 'var(--accent-primary)' : 'var(--input-border)',
              '& .MuiSlider-thumb': {
                backgroundColor: enabled ? 'var(--accent-primary)' : 'var(--input-border)',
              },
              '& .MuiSlider-track': {
                backgroundColor: enabled ? 'var(--accent-primary)' : 'var(--input-border)',
              },
              '& .MuiSlider-rail': {
                backgroundColor: 'var(--input-border)',
              },
            }}
          />
        </Box>

        {/* Font and Background Colors */}
        <Box sx={{ marginBottom: '18px' }}>
          <Box sx={{ display: 'flex', gap: '16px' }}>
            {/* Font Color */}
            <Box sx={{ flex: 1 }}>
              <Typography
                sx={{
                  color: enabled ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  fontSize: '15px',
                  fontWeight: 500,
                  marginBottom: '8px',
                }}
              >
                Font Color
              </Typography>
              <Box sx={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <TextField
                  value={fontColor}
                  onChange={(e) => setFontColor(e.target.value)}
                  onBlur={(e) => handleFontColorChange(e.target.value)}
                  placeholder="#FFFFFF"
                  disabled={!enabled}
                  size="small"
                  sx={{
                    flex: 1,
                    '& .MuiInputBase-root': {
                      backgroundColor: 'var(--input-bg)',
                      borderRadius: '12px',
                      border: '1px solid var(--input-border)',
                      color: enabled ? 'var(--text-primary)' : 'var(--text-tertiary)',
                      fontFamily: 'monospace',
                      fontSize: '14px',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none',
                    },
                    '&:hover .MuiInputBase-root': {
                      borderColor: enabled ? 'var(--accent-primary)' : 'var(--input-border)',
                    },
                  }}
                />
                <Box
                  sx={{
                    position: 'relative',
                    width: '40px',
                    height: '40px',
                  }}
                >
                  <Box
                    sx={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: fontColor,
                      border: '2px solid var(--input-border)',
                      cursor: enabled ? 'pointer' : 'not-allowed',
                      opacity: enabled ? 1 : 0.5,
                      transition: 'all 0.2s ease',
                      boxShadow: enabled ? `0 4px 12px ${fontColor}40` : 'none',
                      '&:hover': enabled ? {
                        transform: 'scale(1.05)',
                        boxShadow: `0 6px 16px ${fontColor}60`,
                      } : {},
                    }}
                    onClick={() => enabled && document.getElementById('font-color-picker').click()}
                  />
                  <input
                    id="font-color-picker"
                    type="color"
                    value={fontColor}
                    onChange={(e) => {
                      setFontColor(e.target.value);
                      handleFontColorChange(e.target.value);
                    }}
                    disabled={!enabled}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '40px',
                      height: '40px',
                      opacity: 0,
                      cursor: enabled ? 'pointer' : 'not-allowed',
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Background Color */}
            <Box sx={{ flex: 1 }}>
              <Typography
                sx={{
                  color: enabled ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  fontSize: '15px',
                  fontWeight: 500,
                  marginBottom: '8px',
                }}
              >
                Background Color
              </Typography>
              <Box sx={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <TextField
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  onBlur={(e) => handleBackgroundColorChange(e.target.value)}
                  placeholder="#000000"
                  disabled={!enabled}
                  size="small"
                  sx={{
                    flex: 1,
                    '& .MuiInputBase-root': {
                      backgroundColor: 'var(--input-bg)',
                      borderRadius: '12px',
                      border: '1px solid var(--input-border)',
                      color: enabled ? 'var(--text-primary)' : 'var(--text-tertiary)',
                      fontFamily: 'monospace',
                      fontSize: '14px',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none',
                    },
                    '&:hover .MuiInputBase-root': {
                      borderColor: enabled ? 'var(--accent-primary)' : 'var(--input-border)',
                    },
                  }}
                />
                <Box
                  sx={{
                    position: 'relative',
                    width: '40px',
                    height: '40px',
                  }}
                >
                  <Box
                    sx={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: backgroundColor,
                      border: '2px solid var(--input-border)',
                      cursor: enabled ? 'pointer' : 'not-allowed',
                      opacity: enabled ? 1 : 0.5,
                      transition: 'all 0.2s ease',
                      boxShadow: enabled ? `0 4px 12px ${backgroundColor}40` : 'none',
                      '&:hover': enabled ? {
                        transform: 'scale(1.05)',
                        boxShadow: `0 6px 16px ${backgroundColor}60`,
                      } : {},
                    }}
                    onClick={() => enabled && document.getElementById('bg-color-picker').click()}
                  />
                  <input
                    id="bg-color-picker"
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => {
                      setBackgroundColor(e.target.value);
                      handleBackgroundColorChange(e.target.value);
                    }}
                    disabled={!enabled}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '40px',
                      height: '40px',
                      opacity: 0,
                      cursor: enabled ? 'pointer' : 'not-allowed',
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Color Presets */}
        <Box sx={{ marginBottom: '20px' }}>
          <Box sx={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { name: 'Classic', font: '#FFFFFF', bg: '#000000' },
              { name: 'Matrix', font: '#00FF00', bg: '#001100' },
              { name: 'Ocean', font: '#00D9FF', bg: '#001F3F' },
              { name: 'Sunset', font: '#FF6B35', bg: '#2D1B00' },
              { name: 'Purple', font: '#E0B0FF', bg: '#1A0033' },
              { name: 'Neon', font: '#FF10F0', bg: '#0A0014' },
            ].map((preset) => (
              <Chip
                key={preset.name}
                label={preset.name}
                disabled={!enabled}
                onClick={() => {
                  if (enabled) {
                    handlePresetChange(preset);
                  }
                }}
                sx={{
                  backgroundColor: enabled ? preset.bg : 'var(--input-bg)',
                  color: enabled ? preset.font : 'var(--text-disabled)',
                  border: '1px solid var(--input-border)',
                  cursor: enabled ? 'pointer' : 'not-allowed',
                  fontWeight: 600,
                  fontSize: '12px',
                  transition: 'all 0.2s ease',
                  '&:hover': enabled ? {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${preset.bg}60`,
                  } : {},
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Background Opacity */}
        <Box sx={{ marginBottom: '8px' }}>
          <Typography
            sx={{
              color: enabled ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontSize: '15px',
              fontWeight: 500,
              marginBottom: '12px',
            }}
          >
            Background Opacity: {Math.round((backgroundOpacity / 255) * 100)}%
          </Typography>
          <Slider
            value={backgroundOpacity}
            onChange={(e, newValue) => setBackgroundOpacity(newValue)}
            onChangeCommitted={(e, newValue) => handleBackgroundOpacityChange(newValue)}
            min={0}
            max={255}
            step={5}
            disabled={!enabled}
            sx={{
              color: enabled ? 'var(--accent-primary)' : 'var(--input-border)',
              '& .MuiSlider-thumb': {
                backgroundColor: enabled ? 'var(--accent-primary)' : 'var(--input-border)',
              },
              '& .MuiSlider-track': {
                backgroundColor: enabled ? 'var(--accent-primary)' : 'var(--input-border)',
              },
              '& .MuiSlider-rail': {
                backgroundColor: 'var(--input-border)',
              },
            }}
          />
        </Box>

        {/* Corner Radius */}
        <Box sx={{  }}>
          <Typography
            sx={{
              color: enabled ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontSize: '15px',
              fontWeight: 500,
              marginBottom: '12px',
            }}
          >
            Corner Radius: {cornerRadius}px
          </Typography>
          <Slider
            value={cornerRadius}
            onChange={(e, newValue) => setCornerRadius(newValue)}
            onChangeCommitted={(e, newValue) => handleCornerRadiusChange(newValue)}
            min={0}
            max={50}
            step={2}
            disabled={!enabled}
            sx={{
              color: enabled ? 'var(--accent-primary)' : 'var(--input-border)',
              '& .MuiSlider-thumb': {
                backgroundColor: enabled ? 'var(--accent-primary)' : 'var(--input-border)',
              },
              '& .MuiSlider-track': {
                backgroundColor: enabled ? 'var(--accent-primary)' : 'var(--input-border)',
              },
              '& .MuiSlider-rail': {
                backgroundColor: 'var(--input-border)',
              },
            }}
          />
        </Box>

        {/* Auto-Dismiss */}
        <Box sx={{ paddingTop: '8px' }}>
          <Typography
            sx={{
              color: enabled ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontSize: '15px',
              fontWeight: 500,
              marginBottom: '12px',
            }}
          >
            Auto-Dismiss After: {dismissAfter < 1000 ? `${dismissAfter}ms` : `${(dismissAfter / 1000).toFixed(1)}s`}
          </Typography>
          <Slider
            value={dismissAfter}
            onChange={(e, newValue) => setDismissAfter(newValue)}
            onChangeCommitted={(e, newValue) => handleDismissAfterChange(newValue)}
            min={0}
            max={5000}
            step={100}
            disabled={!enabled}
            marks={[
              { value: 0, label: '0s' },
              { value: 1000, label: '1s' },
              { value: 2000, label: '2s' },
              { value: 3000, label: '3s' },
              { value: 4000, label: '4s' },
              { value: 5000, label: '5s' },
            ]}
            sx={{
              color: enabled ? 'var(--accent-primary)' : 'var(--input-border)',
              '& .MuiSlider-thumb': {
                backgroundColor: enabled ? 'var(--accent-primary)' : 'var(--input-border)',
              },
              '& .MuiSlider-track': {
                backgroundColor: enabled ? 'var(--accent-primary)' : 'var(--input-border)',
              },
              '& .MuiSlider-rail': {
                backgroundColor: 'var(--input-border)',
              },
              '& .MuiSlider-mark': {
                backgroundColor: 'var(--input-border)',
                height: '8px',
                width: '2px',
              },
              '& .MuiSlider-markLabel': {
                color: enabled ? 'var(--text-tertiary)' : 'var(--text-disabled)',
                fontSize: '11px',
                marginTop: '8px',
              },
            }}
          />
        </Box>
      </GlassCard>
    </Box>
  );
}

export default OSKHelperPage;
