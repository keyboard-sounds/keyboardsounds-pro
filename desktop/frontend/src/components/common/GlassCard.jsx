import { Card, CardContent } from '@mui/material';
import { glassCardStyle } from '../../constants';

function GlassCard({ children, sx = {}, contentSx = {}, ...props }) {
  return (
    <Card
      sx={{
        ...glassCardStyle,
        ...sx,
      }}
      {...props}
    >
      <CardContent sx={{ padding: '24px !important', ...contentSx }}>
        {children}
      </CardContent>
    </Card>
  );
}

export default GlassCard;

