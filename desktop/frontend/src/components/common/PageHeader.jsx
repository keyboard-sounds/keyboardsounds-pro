import { Box, Typography } from '@mui/material';
import { menuItems } from '../../constants';

function PageHeader({ title, children }) {
  // Look up the icon from menuItems based on the title
  const menuItem = menuItems.find(item => item.name === title);
  const Icon = menuItem?.icon;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {Icon && (
          <Icon 
            sx={{ 
              fontSize: '38px',
              color: 'var(--icon-color)',
            }} 
          />
        )}
        <Box>
          <Typography 
            variant="h4" 
            sx={{ 
              marginBottom: '8px',
              fontWeight: 700,
              fontSize: '32px',
              letterSpacing: '-0.5px',
              background: 'var(--text-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {title}
          </Typography>
          <Box
            sx={{
              width: '60px',
              height: '4px',
              background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
              borderRadius: '2px',
              boxShadow: '0 2px 8px var(--accent-shadow)',
            }}
          />
        </Box>
      </Box>
      {children}
    </Box>
  );
}

export default PageHeader;
