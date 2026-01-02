import { Box, Typography, Select, MenuItem, IconButton, Tooltip, Switch } from '@mui/material';
import { Card, CardContent } from '@mui/material';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MouseIcon from '@mui/icons-material/Mouse';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import TerminalIcon from '@mui/icons-material/Terminal';
import { glassCardStyle, selectMenuProps, greenSwitchStyle } from '../../constants';

function RuleCard({ rule, onProfileChange, onRemove, onToggle, isNew, isExiting, keyboardProfiles = [], mouseProfiles = [] }) {
  const isEnabled = rule.enabled !== false; // Default to true if undefined
  
  // Determine animation class
  const animationClass = isExiting ? 'rule-card-exit' : isNew ? 'rule-card-enter' : '';
  
  const getSelectSx = (value) => ({
    backgroundColor: value === 'None' 
      ? 'var(--danger-bg)' 
      : 'var(--accent-bg)',
    backdropFilter: 'blur(10px)',
    color: 'var(--text-primary)',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 500,
    width: '130px',
    height: '32px',
    border: value === 'None'
      ? '1px solid rgba(239, 68, 68, 0.4)'
      : '1px solid var(--accent-border)',
    boxShadow: value === 'None'
      ? '0 2px 8px rgba(239, 68, 68, 0.2), inset 0 1px 0 var(--card-highlight)'
      : '0 2px 8px var(--accent-shadow), inset 0 1px 0 var(--card-highlight)',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: value === 'None'
        ? 'rgba(239, 68, 68, 0.5)'
        : 'var(--accent-border)',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: value === 'None'
        ? 'rgba(239, 68, 68, 0.7)'
        : 'var(--accent-primary)',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: value === 'None'
        ? 'rgba(239, 68, 68, 0.8)'
        : 'var(--accent-primary)',
    },
    '& .MuiSelect-select': {
      padding: '6px 12px',
      paddingRight: '32px !important',
      color: 'var(--text-primary)',
      fontWeight: 600,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '& .MuiSvgIcon-root': {
      color: value === 'None'
        ? 'var(--danger)'
        : 'var(--accent-primary)',
    },
  });

  // Check if rule is disabled (using explicit enabled flag)
  const isDisabled = !isEnabled;

  return (
    <Card
      className={animationClass}
      sx={{
        ...glassCardStyle,
        opacity: isDisabled ? 0.6 : 1,
        borderColor: isDisabled ? 'var(--input-border)' : 'var(--card-border)',
        '&:hover': {
          boxShadow: 'var(--card-shadow), inset 0 1px 0 var(--card-highlight), 0 0 0 1px var(--card-border)',
          opacity: 1,
        },
        // Only transition specific properties, not transform/position, to prevent
        // all rules from animating when one is added/removed
        transition: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <CardContent sx={{ padding: '20px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          {/* Left side - App info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '14px', flexGrow: 1, minWidth: 0 }}>
            {/* App Icon Placeholder */}
            <Box
              sx={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: isDisabled 
                  ? 'var(--hover-bg-light)'
                  : 'linear-gradient(135deg, var(--accent-bg) 0%, rgba(6, 182, 212, 0.15) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: isDisabled 
                  ? '1px solid var(--input-border)'
                  : '1px solid var(--accent-border)',
              }}
            >
              <TerminalIcon 
                sx={{ 
                  fontSize: '22px', 
                  color: isDisabled ? 'var(--text-muted)' : 'var(--accent-primary)',
                }} 
              />
            </Box>
            
            {/* App Details */}
            <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
              <Typography
                variant="h6"
                sx={{
                  color: isDisabled ? 'var(--text-tertiary)' : 'var(--text-primary)',
                  fontSize: '15px',
                  fontWeight: 600,
                  marginBottom: '4px',
                }}
              >
                {rule.executableName}
              </Typography>
              <Tooltip title={rule.path} arrow placement="bottom-start">
                <Typography
                  variant="body2"
                  sx={{
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%',
                  }}
                >
                  {rule.path}
                </Typography>
              </Tooltip>
            </Box>
          </Box>
          
          {/* Right side - Controls */}
          <Box sx={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Profile Selectors */}
            <Box sx={{ 
              display: 'flex', 
              gap: '12px', 
              opacity: isDisabled ? 0.5 : 1,
              pointerEvents: isDisabled ? 'none' : 'auto',
              transition: 'opacity 0.2s ease',
            }}>
              <ProfileSelector
                icon={<KeyboardIcon />}
                label="Keyboard"
                value={rule.keyboardProfile}
                onChange={(e) => onProfileChange('keyboardProfile', e.target.value)}
                selectSx={getSelectSx(rule.keyboardProfile)}
                profiles={keyboardProfiles}
              />
              <ProfileSelector
                icon={<MouseIcon />}
                label="Mouse"
                value={rule.mouseProfile}
                onChange={(e) => onProfileChange('mouseProfile', e.target.value)}
                selectSx={getSelectSx(rule.mouseProfile)}
                profiles={mouseProfiles}
              />
            </Box>
            
            {/* Enable/Disable Toggle */}
            <Tooltip title={isEnabled ? "Disable rule" : "Enable rule"} arrow>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                marginLeft: '4px',
              }}>
                <Switch
                  checked={isEnabled}
                  onChange={onToggle}
                  size="small"
                  sx={{
                    ...greenSwitchStyle,
                    '& .MuiSwitch-thumb': {
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    },
                  }}
                />
                <Typography
                  sx={{
                    color: isEnabled ? 'var(--accent-primary)' : 'var(--text-muted)',
                    fontSize: '10px',
                    fontWeight: 500,
                    marginTop: '-2px',
                  }}
                >
                  {isEnabled ? 'On' : 'Off'}
                </Typography>
              </Box>
            </Tooltip>
            
            {/* Delete Button */}
            <Tooltip title="Remove rule" arrow>
              <IconButton
                onClick={onRemove}
                sx={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--danger-bg)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: 'rgba(239, 68, 68, 0.7)',
                  marginLeft: '4px',
                  '&:hover': {
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    borderColor: 'rgba(239, 68, 68, 0.4)',
                    color: '#ef4444',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <DeleteOutlineIcon sx={{ fontSize: '18px' }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// Profile Selector Component
function ProfileSelector({ icon, label, value, onChange, selectSx, profiles = [] }) {
  return (
    <Box>
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '4px', 
          marginBottom: '4px',
        }}
      >
        <Box sx={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
          {icon}
        </Box>
        <Typography
          sx={{
            color: 'var(--text-secondary)',
            fontSize: '11px',
            fontWeight: 500,
          }}
        >
          {label}
        </Typography>
      </Box>
      <Select
        value={value}
        onChange={onChange}
        size="small"
        sx={selectSx}
        MenuProps={selectMenuProps}
      >
        <MenuItem value="None">None</MenuItem>
        {profiles.map((profile) => (
          <MenuItem key={profile} value={profile}>{profile}</MenuItem>
        ))}
      </Select>
    </Box>
  );
}

export default RuleCard;
