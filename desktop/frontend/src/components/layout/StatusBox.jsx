import { Box, IconButton, Slider, Typography, FormControl, Select, MenuItem, Tooltip, Divider, CircularProgress } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MouseIcon from '@mui/icons-material/Mouse';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { selectMenuProps } from '../../constants';

function StatusBox({
  platform = '',
  isPaused,
  setIsPaused,
  keyboardVolume,
  setKeyboardVolume,
  mouseVolume,
  setMouseVolume,
  keyboardMuted,
  setKeyboardMuted,
  onKeyboardMuteToggle,
  mouseMuted,
  setMouseMuted,
  onMouseMuteToggle,
  volumesLocked,
  setVolumesLocked,
  keyboardProfile,
  setKeyboardProfile,
  mouseProfile,
  setMouseProfile,
  keyboardProfiles = [],
  mouseProfiles = [],
  isLoading = false,
}) {
  const isLinux = platform === 'linux';
  const keyboardLabel = isLinux ? 'Keyboard' : 'Default Keyboard';
  const mouseLabel = isLinux ? 'Mouse' : 'Default Mouse';

  // Build profile options with "None" at the beginning
  const keyboardProfileOptions = ['None', ...keyboardProfiles];
  const mouseProfileOptions = ['None', ...mouseProfiles];
  // Handler for keyboard volume change
  const handleKeyboardVolumeChange = (e, newValue) => {
    setKeyboardVolume(newValue);
    if (newValue > 0 && keyboardMuted) {
      setKeyboardMuted(false);
    }
    if (volumesLocked) {
      setMouseVolume(newValue);
      if (newValue > 0 && mouseMuted) {
        setMouseMuted(false);
      }
    }
  };

  // Handler for mouse volume change
  const handleMouseVolumeChange = (e, newValue) => {
    setMouseVolume(newValue);
    if (newValue > 0 && mouseMuted) {
      setMouseMuted(false);
    }
    if (volumesLocked) {
      setKeyboardVolume(newValue);
      if (newValue > 0 && keyboardMuted) {
        setKeyboardMuted(false);
      }
    }
  };

  // Handler for keyboard mute toggle
  const handleKeyboardMuteToggle = async () => {
    const newMuted = !keyboardMuted;
    await onKeyboardMuteToggle(newMuted);
    // If volumes are locked, also set mouse mute to the same state
    if (volumesLocked) {
      await onMouseMuteToggle(newMuted);
    }
  };

  // Handler for mouse mute toggle
  const handleMouseMuteToggle = async () => {
    const newMuted = !mouseMuted;
    await onMouseMuteToggle(newMuted);
    // If volumes are locked, also set keyboard mute to the same state
    if (volumesLocked) {
      await onKeyboardMuteToggle(newMuted);
    }
  };
  return (
    <Box
      sx={{
        margin: '16px 12px',
        padding: '16px',
        width: 'calc(100% - 24px)',
        maxWidth: 'calc(100% - 24px)',
        boxSizing: 'border-box',
        background: 'var(--status-box-bg)',
        borderRadius: '16px',
        border: '1px solid var(--card-border)',
        boxShadow: 'var(--card-shadow), inset 0 1px 0 var(--card-highlight)',
      }}
    >
      {/* Enable/Disable Toggle Button */}
      <Box
        onClick={() => !isLoading && setIsPaused(!isPaused)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          padding: '14px 20px',
          marginBottom: '14px',
          borderRadius: '14px',
          cursor: isLoading ? 'wait' : 'pointer',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          background: isLoading
            ? 'linear-gradient(135deg, rgba(100, 100, 100, 0.9) 0%, rgba(70, 70, 70, 0.9) 100%)'
            : isPaused 
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)'
              : 'linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(185, 28, 28, 0.9) 100%)',
          border: 'none',
          boxShadow: isLoading
            ? '0 4px 20px rgba(100, 100, 100, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
            : isPaused
              ? '0 4px 20px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
              : '0 4px 20px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          '&:hover': {
            transform: isLoading ? 'none' : 'translateY(-2px) scale(1.02)',
            boxShadow: isLoading
              ? '0 4px 20px rgba(100, 100, 100, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
              : isPaused
                ? '0 8px 30px rgba(16, 185, 129, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                : '0 8px 30px rgba(239, 68, 68, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          },
          '&:active': {
            transform: isLoading ? 'none' : 'translateY(0) scale(0.98)',
            boxShadow: isLoading
              ? '0 4px 20px rgba(100, 100, 100, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
              : isPaused
                ? '0 2px 10px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                : '0 2px 10px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        {isLoading ? (
          <CircularProgress size={22} sx={{ color: 'white' }} />
        ) : isPaused ? (
          <PlayArrowIcon 
            sx={{ 
              fontSize: '22px', 
              color: 'white',
              filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))',
              transition: 'all 0.2s ease',
            }} 
          />
        ) : (
          <PauseIcon 
            sx={{ 
              fontSize: '22px', 
              color: 'white',
              filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))',
              transition: 'all 0.2s ease',
            }} 
          />
        )}
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 700,
            color: 'white',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.2s ease',
          }}
        >
          {isLoading ? 'Loading...' : isPaused ? 'Start Keyboard Sounds' : 'Disable'}
        </Typography>
      </Box>

      {/* Divider */}
      <Divider
        sx={{
          marginBottom: '14px',
          borderColor: 'var(--card-border)',
          opacity: 0.5,
        }}
      />

      {/* Volume Section */}
      <Box sx={{ marginBottom: '12px', opacity: isPaused ? 0.5 : 1, transition: 'opacity 0.2s ease' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <VolumeUpIcon sx={{ fontSize: '16px', color: 'var(--text-secondary)' }} />
          <Typography
            variant="caption"
            sx={{
              color: 'var(--text-tertiary)',
              fontSize: '11px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Volume
          </Typography>
        </Box>
        {/* Volume Controls Container */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 10px',
            background: 'var(--input-bg)',
            borderRadius: '12px',
            border: '1px solid var(--input-border)',
          }}
        >
          {/* Volume Sliders */}
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* Keyboard Volume Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tooltip title="Keyboard Volume" arrow placement="top">
              <KeyboardIcon sx={{ fontSize: '16px', color: 'var(--text-tertiary)', flexShrink: 0 }} />
            </Tooltip>
            <Slider
              value={keyboardMuted ? 0 : keyboardVolume}
              onChange={handleKeyboardVolumeChange}
              disabled={isPaused}
              sx={{
                color: 'var(--accent-primary)',
                height: '4px',
                '& .MuiSlider-thumb': {
                  width: '12px',
                  height: '12px',
                  backgroundColor: 'var(--accent-primary)',
                  border: '2px solid var(--text-primary)',
                  boxShadow: '0 2px 4px var(--accent-shadow)',
                  '&:hover': {
                    boxShadow: '0 2px 8px var(--accent-shadow)',
                  },
                },
                '& .MuiSlider-track': {
                  height: '4px',
                  borderRadius: '2px',
                },
                '& .MuiSlider-rail': {
                  height: '4px',
                  backgroundColor: 'var(--input-border)',
                },
              }}
            />
            <IconButton
              onClick={handleKeyboardMuteToggle}
              disabled={isPaused}
              size="small"
              sx={{
                width: '28px',
                height: '28px',
                color: keyboardMuted ? 'var(--danger)' : 'var(--text-secondary)',
                '&:hover': {
                  backgroundColor: 'var(--hover-bg)',
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {keyboardMuted ? (
                <VolumeOffIcon sx={{ fontSize: '16px' }} />
              ) : (
                <VolumeUpIcon sx={{ fontSize: '16px' }} />
              )}
            </IconButton>
          </Box>

          {/* Mouse Volume Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tooltip title="Mouse Volume" arrow placement="top">
              <MouseIcon sx={{ fontSize: '16px', color: 'var(--text-tertiary)', flexShrink: 0 }} />
            </Tooltip>
            <Slider
              value={mouseMuted ? 0 : mouseVolume}
              onChange={handleMouseVolumeChange}
              disabled={isPaused}
              sx={{
                color: 'var(--accent-primary)',
                height: '4px',
                '& .MuiSlider-thumb': {
                  width: '12px',
                  height: '12px',
                  backgroundColor: 'var(--accent-primary)',
                  border: '2px solid var(--text-primary)',
                  boxShadow: '0 2px 4px var(--accent-shadow)',
                  '&:hover': {
                    boxShadow: '0 2px 8px var(--accent-shadow)',
                  },
                },
                '& .MuiSlider-track': {
                  height: '4px',
                  borderRadius: '2px',
                },
                '& .MuiSlider-rail': {
                  height: '4px',
                  backgroundColor: 'var(--input-border)',
                },
              }}
            />
            <IconButton
              onClick={handleMouseMuteToggle}
              disabled={isPaused}
              size="small"
              sx={{
                width: '28px',
                height: '28px',
                color: mouseMuted ? 'var(--danger)' : 'var(--text-secondary)',
                '&:hover': {
                  backgroundColor: 'var(--hover-bg)',
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {mouseMuted ? (
                <VolumeOffIcon sx={{ fontSize: '16px' }} />
              ) : (
                <VolumeUpIcon sx={{ fontSize: '16px' }} />
              )}
            </IconButton>
          </Box>
          </Box>

          {/* Lock/Unlock Volumes Button */}
          <Tooltip 
            title={volumesLocked ? "Volumes are linked - click to unlink" : "Volumes are independent - click to link"} 
            arrow 
            placement="top"
          >
            <IconButton
              onClick={() => setVolumesLocked(!volumesLocked)}
              disabled={isPaused}
              sx={{
                width: '32px',
                height: '32px',
                color: volumesLocked ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                backgroundColor: volumesLocked ? 'var(--accent-bg)' : 'transparent',
                border: volumesLocked ? '1px solid var(--accent-border)' : '1px solid transparent',
                '&:hover': {
                  backgroundColor: volumesLocked ? 'var(--accent-bg-hover)' : 'var(--hover-bg)',
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {volumesLocked ? (
                <LinkIcon sx={{ fontSize: '16px' }} />
              ) : (
                <LinkOffIcon sx={{ fontSize: '16px' }} />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Divider */}
      <Divider
        sx={{
          marginBottom: '14px',
          borderColor: 'var(--card-border)',
          opacity: 0.5,
        }}
      />

      {/* Keyboard Profile */}
      <Box sx={{ marginBottom: '12px', opacity: isPaused ? 0.5 : 1, transition: 'opacity 0.2s ease' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <KeyboardIcon sx={{ fontSize: '16px', color: 'var(--text-secondary)' }} />
          <Typography
            variant="caption"
            sx={{
              color: 'var(--text-tertiary)',
              fontSize: '11px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {keyboardLabel}
          </Typography>
        </Box>
        <FormControl fullWidth size="small" disabled={isPaused}>
          <Select
            value={keyboardProfile}
            onChange={(e) => setKeyboardProfile(e.target.value)}
            disabled={isPaused}
            sx={{
              backgroundColor: 'var(--input-bg)',
              backdropFilter: 'blur(10px)',
              color: 'var(--text-primary)',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 500,
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1), 0 1px 0 var(--card-highlight)',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--input-border)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--input-border-hover)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--accent-border)',
              },
              '& .MuiSvgIcon-root': {
                color: 'var(--text-secondary)',
              },
            }}
            MenuProps={selectMenuProps}
          >
            {keyboardProfileOptions.map((profile) => (
              <MenuItem key={profile} value={profile}>
                {profile}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Mouse Profile */}
      <Box sx={{ opacity: isPaused ? 0.5 : 1, transition: 'opacity 0.2s ease' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <MouseIcon sx={{ fontSize: '16px', color: 'var(--text-secondary)' }} />
          <Typography
            variant="caption"
            sx={{
              color: 'var(--text-tertiary)',
              fontSize: '11px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {mouseLabel}
          </Typography>
        </Box>
        <FormControl fullWidth size="small" disabled={isPaused}>
          <Select
            value={mouseProfile}
            onChange={(e) => setMouseProfile(e.target.value)}
            disabled={isPaused}
            sx={{
              backgroundColor: 'var(--input-bg)',
              backdropFilter: 'blur(10px)',
              color: 'var(--text-primary)',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 500,
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1), 0 1px 0 var(--card-highlight)',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--input-border)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--input-border-hover)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--accent-border)',
              },
              '& .MuiSvgIcon-root': {
                color: 'var(--text-secondary)',
              },
            }}
            MenuProps={selectMenuProps}
          >
            {mouseProfileOptions.map((profile) => (
              <MenuItem key={profile} value={profile}>
                {profile}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
}

export default StatusBox;
