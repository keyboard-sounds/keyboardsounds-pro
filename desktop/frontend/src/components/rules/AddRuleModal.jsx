import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Select,
  MenuItem,
  Button,
  Fade,
  Autocomplete,
  InputAdornment,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MouseIcon from '@mui/icons-material/Mouse';
import AddIcon from '@mui/icons-material/Add';
import TerminalIcon from '@mui/icons-material/Terminal';
import GavelIcon from '@mui/icons-material/Gavel';
import AppsIcon from '@mui/icons-material/Apps';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CodeIcon from '@mui/icons-material/Code';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { selectMenuProps } from '../../constants';
import { GetInstalledApplications, IsValidGlobPattern } from '../../../wailsjs/go/app/AppRules';

function AddRuleModal({
  open,
  onClose,
  onSubmit,
  onBrowse,
  keyboardProfiles,
  mouseProfiles,
}) {
  const [appPath, setAppPath] = useState('');
  const [keyboardProfile, setKeyboardProfile] = useState('None');
  const [mouseProfile, setMouseProfile] = useState('None');
  const [error, setError] = useState('');
  const [installedApps, setInstalledApps] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [inputMode, setInputMode] = useState('installed'); // 'installed', 'browse', 'glob'
  const [globPattern, setGlobPattern] = useState('');
  const [validatingGlob, setValidatingGlob] = useState(false);

  // Reset form when modal opens and fetch installed applications
  useEffect(() => {
    if (open) {
      setAppPath('');
      setKeyboardProfile('None');
      setMouseProfile('None');
      setError('');
      setSelectedApp(null);
      setInputMode('installed');
      setGlobPattern('');
      
      // Fetch installed applications
      const fetchInstalledApps = async () => {
        setLoadingApps(true);
        try {
          const apps = await GetInstalledApplications();
          // Sort apps alphabetically by name
          const sortedApps = (apps || []).sort((a, b) => 
            a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
          );
          setInstalledApps(sortedApps);
        } catch (err) {
          console.error('Failed to fetch installed applications:', err);
          setInstalledApps([]);
        } finally {
          setLoadingApps(false);
        }
      };
      fetchInstalledApps();
    }
  }, [open]);

  // Update appPath when selected app changes
  useEffect(() => {
    if (selectedApp && inputMode === 'installed') {
      setAppPath(selectedApp.executable_path);
      setError('');
    }
  }, [selectedApp, inputMode]);

  // Validate glob pattern when it changes
  useEffect(() => {
    if (inputMode === 'glob' && globPattern.trim()) {
      const validatePattern = async () => {
        setValidatingGlob(true);
        try {
          const isValid = await IsValidGlobPattern(globPattern.trim());
          if (isValid) {
            setAppPath(globPattern.trim());
            setError('');
          } else {
            setAppPath('');
            setError('Invalid glob pattern');
          }
        } catch (err) {
          console.error('Failed to validate glob pattern:', err);
          setAppPath('');
          setError('Failed to validate glob pattern');
        } finally {
          setValidatingGlob(false);
        }
      };

      const timeoutId = setTimeout(validatePattern, 300); // Debounce validation
      return () => clearTimeout(timeoutId);
    } else if (inputMode === 'glob' && !globPattern.trim()) {
      setAppPath('');
      setError('');
    }
  }, [globPattern, inputMode]);

  const handleBrowse = async () => {
    try {
      const path = await onBrowse();
      if (path) {
        setAppPath(path);
        setError('');
        setInputMode('browse');
      }
    } catch (err) {
      console.error('Failed to browse for executable:', err);
    }
  };

  const handleInputModeChange = (mode) => {
    setInputMode(mode);
    setError('');
    if (mode === 'installed') {
      setGlobPattern('');
      if (selectedApp) {
        setAppPath(selectedApp.executable_path);
      } else {
        setAppPath('');
      }
    } else if (mode === 'glob') {
      setSelectedApp(null);
      if (globPattern.trim()) {
        setAppPath(globPattern.trim());
      } else {
        setAppPath('');
      }
    } else if (mode === 'browse') {
      setSelectedApp(null);
      setGlobPattern('');
      // Keep appPath if it was set from browse
    }
  };

  const handleSubmit = async () => {
    if (!appPath.trim()) {
      if (inputMode === 'glob') {
        setError('Please enter a valid glob pattern');
      } else {
        setError('Please select an application');
      }
      return;
    }

    // If glob mode, validate one more time before submitting
    if (inputMode === 'glob') {
      try {
        const isValid = await IsValidGlobPattern(appPath.trim());
        if (!isValid) {
          setError('Invalid glob pattern');
          return;
        }
      } catch (err) {
        console.error('Failed to validate glob pattern:', err);
        setError('Failed to validate glob pattern');
        return;
      }
    }

    onSubmit({
      appPath: appPath.trim(),
      keyboardProfile: keyboardProfile === 'None' ? null : keyboardProfile,
      mouseProfile: mouseProfile === 'None' ? null : mouseProfile,
      enabled: true,
    });

    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getSelectSx = (value) => ({
    backgroundColor: value === 'None' ? 'var(--danger-bg)' : 'var(--accent-bg)',
    backdropFilter: 'blur(10px)',
    color: 'var(--text-primary)',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 500,
    width: '100%',
    height: '48px',
    border: value === 'None' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--accent-border)',
    '& .MuiOutlinedInput-notchedOutline': {
      border: 'none',
    },
    '&:hover': {
      backgroundColor: value === 'None' ? 'rgba(239, 68, 68, 0.2)' : 'var(--accent-bg-hover)',
    },
    '& .MuiSelect-select': {
      padding: '12px 14px',
      color: 'var(--text-primary)',
      fontWeight: 600,
    },
    '& .MuiSvgIcon-root': {
      color: value === 'None' ? 'var(--danger)' : 'var(--accent-primary)',
    },
  });

  if (!open) return null;

  return (
    <Fade in={open} timeout={200}>
      <Box
        onClick={handleBackdropClick}
        sx={{
          position: 'fixed',
          top: '40px', // Start below title bar
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200, // Below title bar (1300)
        }}
      >
        <Box
          sx={{
            width: '480px',
            maxWidth: 'calc(100vw - 48px)',
            background: 'var(--card-bg)',
            backdropFilter: 'blur(25px) saturate(180%)',
            WebkitBackdropFilter: 'blur(25px) saturate(180%)',
            borderRadius: '20px',
            boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--card-border), inset 0 1px 0 var(--card-highlight)',
            border: '1px solid var(--card-border)',
            overflow: 'hidden',
            animation: 'modalSlideIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            '@keyframes modalSlideIn': {
              '0%': {
                opacity: 0,
                transform: 'scale(0.95) translateY(-20px)',
              },
              '100%': {
                opacity: 1,
                transform: 'scale(1) translateY(0)',
              },
            },
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              background: 'var(--card-bg)',
              borderBottom: '1px solid var(--card-border)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <Box
                sx={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, var(--hover-bg) 0%, var(--hover-bg-light) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--card-border)',
                }}
              >
                <GavelIcon sx={{ fontSize: '22px', color: 'var(--text-secondary)' }} />
              </Box>
              <Box>
                <Typography
                  sx={{
                    color: 'var(--text-primary)',
                    fontSize: '17px',
                    fontWeight: 600,
                  }}
                >
                  Add Application Rule
                </Typography>
                <Typography
                  sx={{
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                  }}
                >
                  Configure sound profiles for a specific application
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={onClose}
              sx={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                color: 'var(--text-muted)',
                backgroundColor: 'var(--hover-bg-light)',
                border: '1px solid var(--card-border)',
                '&:hover': {
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--hover-bg)',
                  borderColor: 'var(--input-border-hover)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <CloseIcon sx={{ fontSize: '18px' }} />
            </IconButton>
          </Box>

          {/* Content */}
          <Box sx={{ padding: '24px' }}>
            {/* Application Selection */}
            <Box sx={{ marginBottom: '20px' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '10px',
                }}
              >
                <TerminalIcon sx={{ fontSize: '16px', color: 'var(--text-secondary)' }} />
                <Typography
                  sx={{
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  Application
                </Typography>
              </Box>

              {/* Input Mode Tabs */}
              <Box sx={{ marginBottom: '12px' }}>
                <Tabs
                  value={inputMode}
                  onChange={(e, newValue) => handleInputModeChange(newValue)}
                  variant="fullWidth"
                  sx={{
                    minHeight: '36px',
                    '& .MuiTabs-indicator': {
                      backgroundColor: 'var(--accent-primary)',
                      height: '2px',
                    },
                    '& .MuiTab-root': {
                      minHeight: '36px',
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'none',
                      color: 'var(--text-muted)',
                      '&.Mui-selected': {
                        color: 'var(--accent-primary)',
                      },
                    },
                  }}
                >
                  <Tab 
                    icon={<AppsIcon sx={{ fontSize: '16px' }} />} 
                    iconPosition="start"
                    label="Installed Apps" 
                    value="installed"
                  />
                  <Tab 
                    icon={<FileOpenIcon sx={{ fontSize: '16px' }} />} 
                    iconPosition="start"
                    label="Browse" 
                    value="browse"
                  />
                  <Tab 
                    icon={<CodeIcon sx={{ fontSize: '16px' }} />} 
                    iconPosition="start"
                    label="Glob Pattern" 
                    value="glob"
                  />
                </Tabs>
              </Box>

              {/* Warning about path accuracy - only show for installed apps */}
              {inputMode === 'installed' && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '10px 12px',
                    marginBottom: '12px',
                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                    borderRadius: '10px',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                  }}
                >
                  <WarningAmberIcon 
                    sx={{ 
                      fontSize: '16px', 
                      color: '#f59e0b',
                      marginTop: '1px',
                      flexShrink: 0,
                    }} 
                  />
                  <Typography
                    sx={{
                      color: 'var(--text-secondary)',
                      fontSize: '11px',
                      lineHeight: 1.5,
                    }}
                  >
                    Detected application paths may not be accurate. Please verify the path is correct, or use the Browse tab to manually select the executable.
                  </Typography>
                </Box>
              )}

              {/* Info about glob patterns */}
              {inputMode === 'glob' && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '10px 12px',
                    marginBottom: '12px',
                    backgroundColor: 'rgba(59, 130, 246, 0.12)',
                    borderRadius: '10px',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                  }}
                >
                  <CodeIcon 
                    sx={{ 
                      fontSize: '16px', 
                      color: '#3b82f6',
                      marginTop: '1px',
                      flexShrink: 0,
                    }} 
                  />
                  <Typography
                    sx={{
                      color: 'var(--text-secondary)',
                      fontSize: '11px',
                      lineHeight: '1.5',
                    }}
                  >
                    Enter a glob pattern to match multiple applications or application paths. Example: <code style={{ fontFamily: 'monospace', fontSize: '10px' }}>C:\Program Files\*\*.exe</code>
                  </Typography>
                </Box>
              )}

              {/* Input based on selected mode */}
              {inputMode === 'installed' && (
                <Box sx={{ display: 'flex', gap: '10px' }}>
                  <Autocomplete
                    value={selectedApp}
                    onChange={(event, newValue) => {
                      setSelectedApp(newValue);
                      if (!newValue) {
                        setAppPath('');
                      }
                    }}
                    options={installedApps}
                    loading={loadingApps}
                    getOptionLabel={(option) => option.name || ''}
                    isOptionEqualToValue={(option, value) => option.executable_path === value.executable_path}
                    filterOptions={(options, { inputValue }) => {
                      const filterValue = inputValue.toLowerCase();
                      return options.filter(
                        (option) =>
                          option.name.toLowerCase().includes(filterValue) ||
                          option.executable_path.toLowerCase().includes(filterValue)
                      );
                    }}
                    renderOption={(props, option) => {
                      const { key, ...otherProps } = props;
                      return (
                        <Box
                          key={option.executable_path}
                          component="li"
                          {...otherProps}
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start !important',
                            padding: '10px 14px !important',
                            gap: '2px',
                            '&:hover': {
                              backgroundColor: 'var(--hover-bg) !important',
                            },
                            '&.Mui-focused': {
                              backgroundColor: 'var(--hover-bg) !important',
                            },
                          }}
                        >
                          <Typography
                            sx={{
                              color: 'var(--text-primary)',
                              fontSize: '13px',
                              fontWeight: 600,
                            }}
                          >
                            {option.name}
                          </Typography>
                          <Typography
                            sx={{
                              color: 'var(--text-muted)',
                              fontSize: '11px',
                              fontFamily: 'monospace',
                              wordBreak: 'break-all',
                            }}
                          >
                            {option.executable_path}
                          </Typography>
                        </Box>
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder={loadingApps ? "Loading applications..." : "Search for an application..."}
                        error={!!error}
                        helperText={error}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <AppsIcon sx={{ fontSize: '18px', color: 'var(--text-muted)', marginLeft: '4px' }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <>
                              {loadingApps ? <CircularProgress color="inherit" size={18} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'var(--input-bg)',
                            backdropFilter: 'blur(10px)',
                            color: 'var(--text-primary)',
                            borderRadius: '12px',
                            fontSize: '13px',
                            height: '48px',
                            border: error ? '1px solid var(--danger)' : '1px solid var(--input-border)',
                            transition: 'all 0.2s ease',
                            '& fieldset': {
                              border: 'none',
                            },
                            '&:hover': {
                              borderColor: error ? 'var(--danger)' : 'var(--input-border-hover)',
                              backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            },
                            '&.Mui-focused': {
                              borderColor: error ? 'var(--danger)' : 'var(--accent-primary)',
                              boxShadow: error 
                                ? '0 0 0 3px rgba(239, 68, 68, 0.15)' 
                                : '0 0 0 3px rgba(16, 185, 129, 0.15)',
                            },
                            '& input': {
                              color: 'var(--text-primary)',
                              padding: '0 8px !important',
                              height: '100%',
                              '&::placeholder': {
                                color: 'var(--text-muted)',
                                opacity: 1,
                              },
                            },
                          },
                          '& .MuiFormHelperText-root': {
                            color: 'var(--danger)',
                            marginLeft: '4px',
                            marginTop: '6px',
                            fontSize: '12px',
                          },
                        }}
                      />
                    )}
                    componentsProps={{
                      paper: {
                        sx: {
                          backgroundColor: 'var(--dropdown-bg)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid var(--dropdown-border)',
                          borderRadius: '12px',
                          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
                          marginTop: '4px',
                          maxHeight: '300px',
                          '& .MuiAutocomplete-listbox': {
                            padding: '6px',
                            '& .MuiAutocomplete-option': {
                              borderRadius: '8px',
                              margin: '2px 0',
                            },
                          },
                          '& .MuiAutocomplete-noOptions': {
                            color: 'var(--text-muted)',
                            padding: '14px',
                            fontSize: '13px',
                          },
                          '& .MuiAutocomplete-loading': {
                            color: 'var(--text-muted)',
                            padding: '14px',
                            fontSize: '13px',
                          },
                        },
                      },
                    }}
                    noOptionsText="No applications found"
                    loadingText="Loading applications..."
                    sx={{ width: '100%' }}
                  />
                </Box>
              )}

              {inputMode === 'browse' && (
                <Box sx={{ display: 'flex', gap: '10px' }}>
                  <TextField
                    value={appPath}
                    placeholder="No file selected"
                    error={!!error}
                    helperText={error}
                    InputProps={{
                      readOnly: true,
                      startAdornment: (
                        <InputAdornment position="start">
                          <FileOpenIcon sx={{ fontSize: '18px', color: 'var(--text-muted)', marginLeft: '4px' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      flex: 1,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'var(--input-bg)',
                        backdropFilter: 'blur(10px)',
                        color: 'var(--text-primary)',
                        borderRadius: '12px',
                        fontSize: '13px',
                        height: '48px',
                        border: error ? '1px solid var(--danger)' : '1px solid var(--input-border)',
                        transition: 'all 0.2s ease',
                        '& fieldset': {
                          border: 'none',
                        },
                        '&:hover': {
                          borderColor: error ? 'var(--danger)' : 'var(--input-border-hover)',
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        },
                        '& input': {
                          color: 'var(--text-primary)',
                          padding: '0 8px !important',
                          height: '100%',
                          cursor: 'default',
                          '&::placeholder': {
                            color: 'var(--text-muted)',
                            opacity: 1,
                          },
                        },
                      },
                      '& .MuiFormHelperText-root': {
                        color: 'var(--danger)',
                        marginLeft: '4px',
                        marginTop: '6px',
                        fontSize: '12px',
                      },
                    }}
                  />
                  <Tooltip title="Browse for executable" arrow placement="top">
                    <Button
                      onClick={handleBrowse}
                      sx={{
                        minWidth: '48px',
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        backgroundColor: 'var(--accent-bg)',
                        border: '1px solid var(--accent-border)',
                        color: 'var(--accent-primary)',
                        flexShrink: 0,
                        '&:hover': {
                          backgroundColor: 'var(--accent-bg-hover)',
                          borderColor: 'var(--accent-primary)',
                          transform: 'scale(1.02)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <FileOpenIcon sx={{ fontSize: '20px' }} />
                    </Button>
                  </Tooltip>
                </Box>
              )}

              {inputMode === 'glob' && (
                <TextField
                  fullWidth
                  value={globPattern}
                  onChange={(e) => setGlobPattern(e.target.value)}
                  placeholder="e.g., C:\Users\John\AppData\Local\Discord\*\Discord.exe"
                  error={!!error}
                  helperText={error || (validatingGlob ? 'Validating pattern...' : '')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CodeIcon sx={{ fontSize: '18px', color: 'var(--text-muted)', marginLeft: '4px' }} />
                      </InputAdornment>
                    ),
                    endAdornment: validatingGlob ? (
                      <CircularProgress color="inherit" size={18} />
                    ) : null,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'var(--input-bg)',
                      backdropFilter: 'blur(10px)',
                      color: 'var(--text-primary)',
                      borderRadius: '12px',
                      fontSize: '13px',
                      height: '48px',
                      border: error ? '1px solid var(--danger)' : '1px solid var(--input-border)',
                      transition: 'all 0.2s ease',
                      fontFamily: 'monospace',
                      '& fieldset': {
                        border: 'none',
                      },
                      '&:hover': {
                        borderColor: error ? 'var(--danger)' : 'var(--input-border-hover)',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      },
                      '&.Mui-focused': {
                        borderColor: error ? 'var(--danger)' : 'var(--accent-primary)',
                        boxShadow: error 
                          ? '0 0 0 3px rgba(239, 68, 68, 0.15)' 
                          : '0 0 0 3px rgba(16, 185, 129, 0.15)',
                      },
                      '& input': {
                        color: 'var(--text-primary)',
                        padding: '0 8px !important',
                        height: '100%',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        '&::placeholder': {
                          color: 'var(--text-muted)',
                          opacity: 1,
                          fontFamily: 'inherit',
                        },
                      },
                    },
                    '& .MuiFormHelperText-root': {
                      color: error ? 'var(--danger)' : 'var(--text-muted)',
                      marginLeft: '4px',
                      marginTop: '6px',
                      fontSize: '12px',
                    },
                  }}
                />
              )}
            </Box>

            {/* Profile Selectors */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Keyboard Profile */}
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '10px',
                  }}
                >
                  <KeyboardIcon sx={{ fontSize: '16px', color: 'var(--text-secondary)' }} />
                  <Typography
                    sx={{
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    Keyboard Profile
                  </Typography>
                </Box>
                <Select
                  value={keyboardProfile}
                  onChange={(e) => setKeyboardProfile(e.target.value)}
                  fullWidth
                  sx={getSelectSx(keyboardProfile)}
                  MenuProps={selectMenuProps}
                >
                  <MenuItem value="None">None</MenuItem>
                  {keyboardProfiles.map((profile) => (
                    <MenuItem key={profile} value={profile}>
                      {profile}
                    </MenuItem>
                  ))}
                </Select>
              </Box>

              {/* Mouse Profile */}
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '10px',
                  }}
                >
                  <MouseIcon sx={{ fontSize: '16px', color: 'var(--text-secondary)' }} />
                  <Typography
                    sx={{
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    Mouse Profile
                  </Typography>
                </Box>
                <Select
                  value={mouseProfile}
                  onChange={(e) => setMouseProfile(e.target.value)}
                  fullWidth
                  sx={getSelectSx(mouseProfile)}
                  MenuProps={selectMenuProps}
                >
                  <MenuItem value="None">None</MenuItem>
                  {mouseProfiles.map((profile) => (
                    <MenuItem key={profile} value={profile}>
                      {profile}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            </Box>
          </Box>

          {/* Footer */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              padding: '16px 24px 20px',
              borderTop: '1px solid var(--card-border)',
            }}
          >
            <Button
              onClick={onClose}
              sx={{
                color: 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: 500,
                padding: '10px 20px',
                borderRadius: '10px',
                textTransform: 'none',
                backgroundColor: 'var(--hover-bg-light)',
                border: '1px solid var(--card-border)',
                '&:hover': {
                  backgroundColor: 'var(--hover-bg)',
                  borderColor: 'var(--input-border-hover)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              sx={{
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                padding: '10px 24px',
                borderRadius: '10px',
                textTransform: 'none',
                boxShadow: '0 4px 16px var(--accent-shadow)',
                border: 'none',
                '&:hover': {
                  background: 'linear-gradient(135deg, var(--accent-light) 0%, var(--accent-primary) 100%)',
                  boxShadow: '0 6px 20px var(--accent-shadow)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <AddIcon sx={{ fontSize: '18px', marginRight: '6px' }} />
              Add Rule
            </Button>
          </Box>
        </Box>
      </Box>
    </Fade>
  );
}

export default AddRuleModal;
