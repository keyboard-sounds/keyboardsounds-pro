import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { menuItems as defaultMenuItems } from '../../constants';

function SidebarMenu({ menuItems = defaultMenuItems, selectedTab, setSelectedTab }) {
  return (
    <Box
      sx={{
        margin: '0 12px 16px 12px',
        padding: '12px',
        paddingRight: '20px',
        background: 'var(--menu-bg)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderRadius: '16px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15), inset 0 1px 0 var(--card-highlight)',
        border: '1px solid var(--card-border)',
        flex: 1,
        overflowY: 'hidden',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1002,
        position: 'relative',
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingRight: '8px',
          marginRight: '-8px',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'var(--scrollbar-track)',
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'var(--scrollbar-thumb)',
            borderRadius: '10px',
            border: '2px solid transparent',
            backgroundClip: 'content-box',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'var(--scrollbar-thumb-hover)',
          },
        }}
      >
        <List sx={{ paddingTop: '4px', paddingX: '0px', color: 'var(--text-secondary)', width: '100%', maxWidth: '100%', boxSizing: 'border-box', margin: 0 }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedTab === item.name;
            return (
              <ListItem key={item.name} disablePadding sx={{ marginBottom: '6px' }}>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => setSelectedTab(item.name)}
                  sx={{
                    borderRadius: '12px',
                    padding: '10px 14px',
                    minHeight: '44px',
                    color: isSelected ? 'var(--text-primary) !important' : 'var(--text-secondary) !important',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&.Mui-selected': {
                      background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                      color: 'white !important',
                      boxShadow: '0 4px 12px var(--accent-shadow)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, var(--accent-secondary) 0%, var(--accent-light) 100%)',
                        boxShadow: '0 6px 16px var(--accent-shadow)',
                        transform: 'translateY(-1px)',
                      },
                    },
                    '&:hover': {
                      backgroundColor: isSelected ? 'transparent' : 'var(--hover-bg-light)',
                      backdropFilter: isSelected ? 'none' : 'blur(10px)',
                      color: isSelected ? 'white !important' : 'var(--text-primary) !important',
                      transform: isSelected ? 'translateY(-1px)' : 'translateX(4px)',
                      boxShadow: isSelected ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 var(--card-highlight)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: '40px',
                      color: 'inherit !important',
                    }}
                  >
                    <Icon sx={{ fontSize: '22px' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.name}
                    primaryTypographyProps={{
                      fontSize: '14px',
                      fontWeight: isSelected ? 600 : 500,
                      color: 'inherit',
                      letterSpacing: '0.2px',
                    }}
                    sx={{
                      '& .MuiTypography-root': {
                        color: 'inherit !important',
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Box>
  );
}

export default SidebarMenu;
