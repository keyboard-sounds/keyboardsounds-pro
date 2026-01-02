import { Box, Typography, Select, MenuItem, Chip } from '@mui/material';
import { Card, CardContent } from '@mui/material';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MouseIcon from '@mui/icons-material/Mouse';
import PublicIcon from '@mui/icons-material/Public';
import { glassCardStyle, selectMenuProps } from '../../constants';

function DefaultRuleCard({ defaultSettings, onProfileChange, keyboardProfiles = [], mouseProfiles = [] }) {
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

  return (
    <Card
      sx={{
        ...glassCardStyle,
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, var(--card-bg))',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      {/* Decorative corner accent */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '60px',
          height: '60px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, transparent 60%)',
          borderTopLeftRadius: '20px',
          pointerEvents: 'none',
        }}
      />
      
      <CardContent sx={{ padding: '24px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px', flexGrow: 1 }}>
            {/* Icon */}
            <Box
              sx={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(139, 92, 246, 0.15) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)',
                flexShrink: 0,
              }}
            >
              <PublicIcon sx={{ fontSize: '26px', color: '#a78bfa' }} />
            </Box>
            
            {/* Text */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'var(--text-primary)',
                    fontSize: '17px',
                    fontWeight: 600,
                  }}
                >
                  Global Default
                </Typography>
                <Chip
                  label="Fallback"
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    color: '#a78bfa',
                    fontSize: '10px',
                    fontWeight: 600,
                    height: '20px',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    '& .MuiChip-label': {
                      padding: '0 8px',
                    },
                  }}
                />
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color: 'var(--text-tertiary)',
                  fontSize: '13px',
                }}
              >
                These profiles are used when no specific rule matches the active application
              </Typography>
            </Box>
          </Box>
          
          {/* Profile Selectors */}
          <Box sx={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <ProfileSelector
              icon={<KeyboardIcon />}
              label="Keyboard"
              value={defaultSettings.keyboardProfile}
              onChange={(e) => onProfileChange('keyboardProfile', e.target.value)}
              selectSx={getSelectSx(defaultSettings.keyboardProfile)}
              profiles={keyboardProfiles}
            />
            <ProfileSelector
              icon={<MouseIcon />}
              label="Mouse"
              value={defaultSettings.mouseProfile}
              onChange={(e) => onProfileChange('mouseProfile', e.target.value)}
              selectSx={getSelectSx(defaultSettings.mouseProfile)}
              profiles={mouseProfiles}
            />
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
          gap: '6px', 
          marginBottom: '6px',
        }}
      >
        <Box sx={{ fontSize: '15px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
          {icon}
        </Box>
        <Typography
          sx={{
            color: 'var(--text-secondary)',
            fontSize: '12px',
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

export default DefaultRuleCard;
