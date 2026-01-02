import { useEffect, useRef } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MinimizeIcon from '@mui/icons-material/Remove';
import CropFreeIcon from '@mui/icons-material/CropFree';
import { WindowMinimise, WindowToggleMaximise, Quit } from '../../../wailsjs/runtime/runtime';
import appIcon from '../../assets/images/app-icon.png';

function TitleBar() {
  const titleBarRef = useRef(null);

  useEffect(() => {
    if (titleBarRef.current) {
      titleBarRef.current.style.setProperty('--wails-draggable', 'drag');
      // Also apply to all children except controls
      const children = titleBarRef.current.querySelectorAll('*:not(.title-bar-controls):not(.title-bar-controls *)');
      children.forEach((child) => {
        child.style.setProperty('--wails-draggable', 'drag');
      });
      // Set controls to no-drag
      const controls = titleBarRef.current.querySelectorAll('.title-bar-controls, .title-bar-controls *');
      controls.forEach((control) => {
        control.style.setProperty('--wails-draggable', 'no-drag');
      });
    }
  }, []);

  const controlButtonStyle = {
    width: '28px',
    height: '28px',
    padding: '4px',
    color: 'var(--control-button-color)',
    borderRadius: '6px',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      backgroundColor: 'var(--hover-bg)',
      backdropFilter: 'blur(10px)',
      color: 'var(--control-button-color-hover)',
      transform: 'scale(1.05)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 var(--card-highlight)',
    },
  };

  return (
    <AppBar 
      ref={titleBarRef}
      position="fixed" 
      className="title-bar-drag"
      sx={{ 
        height: '40px',
        background: 'var(--titlebar-bg)',
        backdropFilter: 'blur(30px) saturate(180%)',
        WebkitBackdropFilter: 'blur(30px) saturate(180%)',
        boxShadow: 'var(--titlebar-shadow), inset 0 1px 0 var(--card-highlight)',
        borderBottom: '1px solid var(--titlebar-border)',
        zIndex: 1300,
      }}
    >
      <Toolbar 
        sx={{ minHeight: '40px !important', padding: '0 16px !important', justifyContent: 'space-between' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img 
            src={appIcon} 
            alt="Keyboard Sounds Pro" 
            style={{ 
              width: '20px', 
              height: '20px',
              objectFit: 'contain',
            }} 
          />
          <Typography 
            variant="caption" 
            sx={{ 
              background: 'var(--text-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.3px',
            }}
          >
            Keyboard Sounds Pro
          </Typography>
        </Box>
        <Box 
          className="title-bar-controls"
          sx={{ 
            display: 'flex', 
            gap: '4px',
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            const element = e.currentTarget;
            element.style.webkitAppRegion = 'no-drag';
            const children = element.querySelectorAll('*');
            children.forEach((child) => {
              child.style.webkitAppRegion = 'no-drag';
            });
          }}
        >
          <IconButton
            className="title-bar-controls"
            size="small"
            sx={controlButtonStyle}
            onClick={WindowMinimise}
          >
            <MinimizeIcon sx={{ fontSize: '14px' }} />
          </IconButton>
          <IconButton
            className="title-bar-controls"
            size="small"
            sx={controlButtonStyle}
            onClick={WindowToggleMaximise}
          >
            <CropFreeIcon sx={{ fontSize: '14px' }} />
          </IconButton>
          <IconButton
            className="title-bar-controls"
            size="small"
            sx={{
              ...controlButtonStyle,
              '&:hover': {
                backgroundColor: 'var(--danger-bg)',
                backdropFilter: 'blur(10px)',
                color: 'var(--danger)',
                transform: 'scale(1.05)',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3), inset 0 1px 0 var(--card-highlight)',
              },
            }}
            onClick={Quit}
          >
            <CloseIcon sx={{ fontSize: '14px' }} />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default TitleBar;
