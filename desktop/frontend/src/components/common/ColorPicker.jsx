import { useState } from 'react';
import { Box, Popover, TextField, Slider, Typography } from '@mui/material';

function ColorPicker({ value, onChange, disabled }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [tempColor, setTempColor] = useState(value);

  const handleClick = (event) => {
    if (!disabled) {
      setTempColor(value);
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleColorChange = (newColor) => {
    setTempColor(newColor);
    onChange(newColor);
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
  };

  const rgbToHex = (r, g, b) => {
    return "#" + [r, g, b].map(x => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join('');
  };

  const rgb = hexToRgb(tempColor);

  const handleRChange = (newR) => {
    handleColorChange(rgbToHex(newR, rgb.g, rgb.b));
  };

  const handleGChange = (newG) => {
    handleColorChange(rgbToHex(rgb.r, newG, rgb.b));
  };

  const handleBChange = (newB) => {
    handleColorChange(rgbToHex(rgb.r, rgb.g, newB));
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Box
        onClick={handleClick}
        sx={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          backgroundColor: value,
          border: '2px solid var(--input-border)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.2s ease',
          boxShadow: !disabled ? `0 4px 12px ${value}40` : 'none',
          '&:hover': !disabled ? {
            transform: 'scale(1.05)',
            boxShadow: `0 6px 16px ${value}60`,
          } : {},
        }}
      />
      
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            backgroundColor: 'var(--card-bg)',
            backdropFilter: 'blur(25px) saturate(180%)',
            WebkitBackdropFilter: 'blur(25px) saturate(180%)',
            border: '1px solid var(--card-border)',
            borderRadius: '16px',
            padding: '20px',
            marginTop: '8px',
            minWidth: '280px',
            boxShadow: 'var(--card-shadow)',
          },
        }}
      >
        {/* Preview */}
        <Box
          sx={{
            width: '100%',
            height: '80px',
            borderRadius: '12px',
            backgroundColor: tempColor,
            marginBottom: '16px',
            border: '2px solid var(--input-border)',
            boxShadow: `inset 0 2px 8px rgba(0,0,0,0.1)`,
          }}
        />

        {/* Hex Input */}
        <TextField
          value={tempColor}
          onChange={(e) => {
            const val = e.target.value;
            if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
              setTempColor(val);
              if (val.length === 7) {
                handleColorChange(val);
              }
            }
          }}
          placeholder="#FFFFFF"
          size="small"
          fullWidth
          sx={{
            marginBottom: '20px',
            '& .MuiInputBase-root': {
              backgroundColor: 'var(--input-bg)',
              borderRadius: '10px',
              border: '1px solid var(--input-border)',
              color: 'var(--text-primary)',
              fontFamily: 'monospace',
              fontSize: '14px',
              fontWeight: 600,
            },
            '& .MuiOutlinedInput-notchedOutline': {
              border: 'none',
            },
          }}
        />

        {/* RGB Sliders */}
        <Box sx={{ marginBottom: '12px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <Typography sx={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>
              Red
            </Typography>
            <Typography sx={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, fontFamily: 'monospace' }}>
              {rgb.r}
            </Typography>
          </Box>
          <Slider
            value={rgb.r}
            onChange={(e, val) => handleRChange(val)}
            min={0}
            max={255}
            sx={{
              color: '#ef4444',
              '& .MuiSlider-thumb': { backgroundColor: '#ef4444' },
              '& .MuiSlider-track': { backgroundColor: '#ef4444' },
              '& .MuiSlider-rail': { backgroundColor: 'var(--input-border)' },
            }}
          />
        </Box>

        <Box sx={{ marginBottom: '12px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <Typography sx={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>
              Green
            </Typography>
            <Typography sx={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, fontFamily: 'monospace' }}>
              {rgb.g}
            </Typography>
          </Box>
          <Slider
            value={rgb.g}
            onChange={(e, val) => handleGChange(val)}
            min={0}
            max={255}
            sx={{
              color: '#22c55e',
              '& .MuiSlider-thumb': { backgroundColor: '#22c55e' },
              '& .MuiSlider-track': { backgroundColor: '#22c55e' },
              '& .MuiSlider-rail': { backgroundColor: 'var(--input-border)' },
            }}
          />
        </Box>

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <Typography sx={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>
              Blue
            </Typography>
            <Typography sx={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, fontFamily: 'monospace' }}>
              {rgb.b}
            </Typography>
          </Box>
          <Slider
            value={rgb.b}
            onChange={(e, val) => handleBChange(val)}
            min={0}
            max={255}
            sx={{
              color: '#3b82f6',
              '& .MuiSlider-thumb': { backgroundColor: '#3b82f6' },
              '& .MuiSlider-track': { backgroundColor: '#3b82f6' },
              '& .MuiSlider-rail': { backgroundColor: 'var(--input-border)' },
            }}
          />
        </Box>
      </Popover>
    </>
  );
}

export default ColorPicker;
