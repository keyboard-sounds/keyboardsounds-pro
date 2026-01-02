import { FormControl, Select, MenuItem } from '@mui/material';
import { profiles, selectMenuProps } from '../../constants';

function ProfileSelect({ 
  value, 
  onChange, 
  showNone = false,
  showRemoveRule = false,
  onRemove,
  size = 'small',
  sx = {},
  ...props 
}) {
  const isNone = value === 'None';
  
  const handleChange = (e) => {
    if (e.target.value === 'Remove Rule' && onRemove) {
      onRemove();
      return;
    }
    onChange(e);
  };

  return (
    <FormControl fullWidth size={size}>
      <Select
        value={value}
        onChange={handleChange}
        sx={{
          backgroundColor: isNone 
            ? 'rgba(239, 68, 68, 0.25)' 
            : 'rgba(16, 185, 129, 0.25)',
          backdropFilter: 'blur(10px)',
          color: 'white',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 500,
          minWidth: '120px',
          height: '28px',
          border: isNone
            ? '1px solid rgba(239, 68, 68, 0.4)'
            : '1px solid rgba(16, 185, 129, 0.4)',
          boxShadow: isNone
            ? '0 2px 8px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            : '0 2px 8px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: isNone
              ? 'rgba(239, 68, 68, 0.5)'
              : 'rgba(16, 185, 129, 0.5)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: isNone
              ? 'rgba(239, 68, 68, 0.7)'
              : 'rgba(16, 185, 129, 0.7)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: isNone
              ? 'rgba(239, 68, 68, 0.8)'
              : 'rgba(16, 185, 129, 0.8)',
          },
          '& .MuiSelect-select': {
            padding: '4px 12px',
            color: 'white',
            fontWeight: 600,
          },
          '& .MuiSvgIcon-root': {
            color: isNone
              ? 'rgba(239, 68, 68, 1)'
              : 'rgba(16, 185, 129, 1)',
          },
          ...sx,
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              '& .MuiMenuItem-root': {
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '12px',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: 'white',
                },
              },
            },
          },
        }}
        {...props}
      >
        {showNone && <MenuItem value="None">None</MenuItem>}
        {profiles.map((profile) => (
          <MenuItem key={profile} value={profile}>{profile}</MenuItem>
        ))}
        {showRemoveRule && (
          <MenuItem 
            value="Remove Rule"
            sx={{
              color: 'rgba(239, 68, 68, 0.9) !important',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              marginTop: '4px',
              paddingTop: '8px',
              '&:hover': {
                backgroundColor: 'rgba(239, 68, 68, 0.2) !important',
                color: 'rgba(239, 68, 68, 1) !important',
              },
            }}
          >
            Remove Rule
          </MenuItem>
        )}
      </Select>
    </FormControl>
  );
}

export default ProfileSelect;

