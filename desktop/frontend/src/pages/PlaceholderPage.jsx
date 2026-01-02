import { Box, Typography } from '@mui/material';
import { PageHeader } from '../components/common';
import { glassCardStyle } from '../constants';

function PlaceholderPage({ title }) {
  return (
    <Box>
      <PageHeader title={title} />
      <Box
        sx={{
          ...glassCardStyle,
          padding: '32px',
        }}
      >
        <Typography 
          variant="body1" 
          sx={{ 
            color: 'var(--text-secondary)',
            fontSize: '15px',
            lineHeight: '1.7',
          }}
        >
          This is the <strong style={{ 
            background: 'var(--text-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent',
          }}>{title}</strong> section. Content will be displayed here.
        </Typography>
      </Box>
    </Box>
  );
}

export default PlaceholderPage;
