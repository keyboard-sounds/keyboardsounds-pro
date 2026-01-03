import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Switch, Chip, IconButton, Tooltip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LaunchIcon from '@mui/icons-material/Launch';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import { GlassCard, PageHeader } from '../components/common';
import { greenSwitchStyle } from '../constants';
import { useTheme } from '../context';
import { GetVersion } from '../../wailsjs/go/main/wailsConfig';
import { IsUpdateAvailable, GetLatestVersion, GetDownloadURL, CheckForUpdate } from '../../wailsjs/go/main/updateDetails';
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime';

function SettingsPage({
  audioDevice,
  setAudioDevice,
  startWithSystem,
  setStartWithSystem,
  startPlayingOnLaunch,
  setStartPlayingOnLaunch,
  startHidden,
  setStartHidden,
  notifyOnMinimize,
  setNotifyOnMinimize,
  notifyOnUpdate,
  setNotifyOnUpdate,
}) {
  const { theme, setTheme } = useTheme();
  const [version, setVersion] = useState('Loading...');
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState('Loading...');
  const [downloadURL, setDownloadURL] = useState('Loading...');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshUpdateInfo = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await CheckForUpdate();
      const [available, latest, url] = await Promise.all([
        IsUpdateAvailable().catch(() => false),
        GetLatestVersion().catch(() => 'Unknown'),
        GetDownloadURL().catch(() => 'Unknown'),
      ]);
      setUpdateAvailable(available);
      setLatestVersion(latest);
      setDownloadURL(url);
    } catch (error) {
      console.error('Failed to check for updates:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    GetVersion().then(setVersion).catch(() => setVersion('Unknown'));
    refreshUpdateInfo();
  }, [refreshUpdateInfo]);

  return (
    <Box>
      <PageHeader title="Settings" />

      {/* Appearance Section */}
      <GlassCard sx={{ marginBottom: '24px' }}>
        <Typography
          variant="h6"
          sx={{
            color: 'var(--text-primary)',
            fontSize: '18px',
            fontWeight: 600,
            marginBottom: '24px',
          }}
        >
          Appearance
        </Typography>

        {/* Theme Selection */}
        <Box sx={{ marginBottom: '20px' }}>
          <Typography
            sx={{
              color: 'var(--text-primary)',
              fontSize: '15px',
              fontWeight: 500,
              marginBottom: '6px',
            }}
          >
            Theme
          </Typography>
          <Typography
            sx={{
              color: 'var(--text-tertiary)',
              fontSize: '13px',
              marginBottom: '12px',
            }}
          >
            Choose the appearance of the application
          </Typography>
          
          {/* Theme Toggle Buttons */}
          <Box sx={{ display: 'flex', gap: '12px' }}>
            <Box
              onClick={() => setTheme('dark')}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '16px',
                borderRadius: '12px',
                cursor: 'pointer',
                backgroundColor: theme === 'dark' ? 'var(--accent-bg)' : 'var(--input-bg)',
                border: theme === 'dark' ? '2px solid var(--accent-primary)' : '2px solid var(--input-border)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: theme === 'dark' ? 'var(--accent-bg-hover)' : 'var(--hover-bg)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <DarkModeIcon 
                sx={{ 
                  fontSize: '28px', 
                  color: theme === 'dark' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                }} 
              />
              <Typography
                sx={{
                  color: theme === 'dark' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontSize: '14px',
                  fontWeight: theme === 'dark' ? 600 : 500,
                }}
              >
                Dark
              </Typography>
            </Box>
            
            <Box
              onClick={() => setTheme('light')}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '16px',
                borderRadius: '12px',
                cursor: 'pointer',
                backgroundColor: theme === 'light' ? 'var(--accent-bg)' : 'var(--input-bg)',
                border: theme === 'light' ? '2px solid var(--accent-primary)' : '2px solid var(--input-border)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: theme === 'light' ? 'var(--accent-bg-hover)' : 'var(--hover-bg)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <LightModeIcon 
                sx={{ 
                  fontSize: '28px', 
                  color: theme === 'light' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                }} 
              />
              <Typography
                sx={{
                  color: theme === 'light' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontSize: '14px',
                  fontWeight: theme === 'light' ? 600 : 500,
                }}
              >
                Light
              </Typography>
            </Box>
          </Box>
        </Box>
      </GlassCard>

      {/* Application Settings Section */}
      <GlassCard sx={{ marginBottom: '24px' }}>
        <Typography
          variant="h6"
          sx={{
            color: 'var(--text-primary)',
            fontSize: '18px',
            fontWeight: 600,
            marginBottom: '24px',
          }}
        >
          Application Settings
        </Typography>

        {/* Start with System */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              sx={{
                color: 'var(--text-primary)',
                fontSize: '15px',
                fontWeight: 500,
                marginBottom: '4px',
              }}
            >
              Auto Launch
            </Typography>
            <Typography
              sx={{
                color: 'var(--text-tertiary)',
                fontSize: '13px',
              }}
            >
              Automatically launch the application when your system starts
            </Typography>
          </Box>
          <Switch
            checked={startWithSystem}
            onChange={(e) => setStartWithSystem(e.target.checked)}
            sx={greenSwitchStyle}
          />
        </Box>

        {/* Start Playing on Launch */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              sx={{
                color: 'var(--text-primary)',
                fontSize: '15px',
                fontWeight: 500,
                marginBottom: '4px',
              }}
            >
              Auto Start
            </Typography>
            <Typography
              sx={{
                color: 'var(--text-tertiary)',
                fontSize: '13px',
              }}
            >
              Begin playing keyboard and mouse sounds immediately when the application starts
            </Typography>
          </Box>
          <Switch
            checked={startPlayingOnLaunch}
            onChange={(e) => setStartPlayingOnLaunch(e.target.checked)}
            sx={greenSwitchStyle}
          />
        </Box>

        {/* Hide On Launch */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              sx={{
                color: 'var(--text-primary)',
                fontSize: '15px',
                fontWeight: 500,
                marginBottom: '4px',
              }}
            >
              Hide Window
            </Typography>
            <Typography
              sx={{
                color: 'var(--text-tertiary)',
                fontSize: '13px',
              }}
            >
              Automatically hide the application window when launched
            </Typography>
          </Box>
          <Switch
            checked={startHidden}
            onChange={(e) => setStartHidden(e.target.checked)}
            sx={greenSwitchStyle}
          />
        </Box>
      </GlassCard>

      {/* Notification Settings Section */}
      <GlassCard sx={{ marginBottom: '24px' }}>
        <Typography
          variant="h6"
          sx={{
            color: 'var(--text-primary)',
            fontSize: '18px',
            fontWeight: 600,
            marginBottom: '24px',
          }}
        >
          Notification Settings
        </Typography>

        {/* Notify on Minimize */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              sx={{
                color: 'var(--text-primary)',
                fontSize: '15px',
                fontWeight: 500,
                marginBottom: '4px',
              }}
            >
              Application Hidden
            </Typography>
            <Typography
              sx={{
                color: 'var(--text-tertiary)',
                fontSize: '13px',
              }}
            >
              Notify me when the application is minimized to the system tray
            </Typography>
          </Box>
          <Switch
            checked={notifyOnMinimize}
            onChange={(e) => setNotifyOnMinimize(e.target.checked)}
            sx={greenSwitchStyle}
          />
        </Box>

        {/* Notify on Update */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              sx={{
                color: 'var(--text-primary)',
                fontSize: '15px',
                fontWeight: 500,
                marginBottom: '4px',
              }}
            >
              Update Available
            </Typography>
            <Typography
              sx={{
                color: 'var(--text-tertiary)',
                fontSize: '13px',
              }}
            >
              Notify me when an update is available
            </Typography>
          </Box>
          <Switch
            checked={notifyOnUpdate}
            onChange={(e) => setNotifyOnUpdate(e.target.checked)}
            sx={greenSwitchStyle}
          />
        </Box>
      </GlassCard>

      {/* Application Details Section */}
      <GlassCard>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Typography
            variant="h6"
            sx={{
              color: 'var(--text-primary)',
              fontSize: '18px',
              fontWeight: 600,
            }}
          >
            Application Details
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {updateAvailable ? (
              <Chip
                icon={<DownloadIcon sx={{ fontSize: '16px !important' }} />}
                label={`Update Available (${latestVersion})`}
                onClick={() => BrowserOpenURL(downloadURL)}
                sx={{
                  backgroundColor: 'var(--accent-bg)',
                  color: 'var(--accent-primary)',
                  border: '1px solid var(--accent-border)',
                  fontSize: '12px',
                  fontWeight: 500,
                  height: '28px',
                  cursor: 'pointer',
                  '& .MuiChip-icon': {
                    color: 'var(--accent-primary)',
                    marginLeft: '8px',
                    marginRight: '-8px'
                  },
                  '&:hover': {
                    backgroundColor: 'var(--accent-bg-hover)',
                    borderColor: 'var(--accent-primary)',
                  },
                }}
              />
            ) : (
              <Chip
                icon={<CheckCircleIcon sx={{ fontSize: '16px !important' }} />}
                label="Up To Date"
                sx={{
                  backgroundColor: 'var(--accent-bg)',
                  color: 'var(--accent-primary)',
                  border: '1px solid var(--accent-border)',
                  fontSize: '12px',
                  fontWeight: 500,
                  height: '28px',
                  '& .MuiChip-icon': {
                    color: 'var(--accent-primary)',
                  },
                }}
              />
            )}
            <Tooltip title="Check for Update">
              <IconButton
                onClick={refreshUpdateInfo}
                disabled={isRefreshing}
                sx={{
                  mr: '-10px',
                  color: 'var(--text-secondary)',
                  '&:hover': {
                    color: 'var(--accent-primary)',
                    backgroundColor: 'var(--hover-bg)',
                  },
                  '&.Mui-disabled': {
                    color: 'var(--text-tertiary)',
                  },
                }}
              >
                <RefreshIcon 
                  sx={{ 
                    fontSize: '20px',
                    animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }} 
                />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Version */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Typography
            sx={{
              color: 'var(--text-secondary)',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Version
          </Typography>
          <Typography
            sx={{
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: 'monospace',
            }}
          >
            {version}
          </Typography>
        </Box>

        {/* Website Link */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Typography
            sx={{
              color: 'var(--text-secondary)',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Website
          </Typography>
          <Box
            onClick={() => BrowserOpenURL('https://keyboardsounds.net')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--accent-primary)',
              fontSize: '14px',
              fontWeight: 500,
              textDecoration: 'none',
              cursor: 'pointer',
              '&:hover': {
                color: 'var(--accent-light)',
                textDecoration: 'underline',
              },
            }}
          >
            keyboardsounds.net
            <LaunchIcon sx={{ fontSize: '14px' }} />
          </Box>
        </Box>

        {/* GitHub Link */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography
            sx={{
              color: 'var(--text-secondary)',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            GitHub
          </Typography>
          <Box
            onClick={() => BrowserOpenURL('https://github.com/keyboard-sounds/keyboardsounds-pro')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--accent-primary)',
              fontSize: '14px',
              fontWeight: 500,
              textDecoration: 'none',
              cursor: 'pointer',
              '&:hover': {
                color: 'var(--accent-light)',
                textDecoration: 'underline',
              },
            }}
          >
            keyboard-sounds/keyboardsounds-pro
            <LaunchIcon sx={{ fontSize: '14px' }} />
          </Box>
        </Box>
      </GlassCard>
    </Box>
  );
}

export default SettingsPage;
