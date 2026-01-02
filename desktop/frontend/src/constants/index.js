import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import GavelIcon from '@mui/icons-material/Gavel';
import SettingsIcon from '@mui/icons-material/Settings';
import TuneIcon from '@mui/icons-material/Tune';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import ConstructionIcon from '@mui/icons-material/Construction';
import DiscordIcon from '../components/icons/DiscordIcon';
import PeopleIcon from '@mui/icons-material/People';

export const menuItems = [
  { name: 'Application Rules', icon: GavelIcon },
  { name: 'Audio Effects', icon: GraphicEqIcon },
  { name: 'Library', icon: LibraryMusicIcon },
  { name: 'Profile Builder', icon: ConstructionIcon },
  { name: 'Community', icon: PeopleIcon },
  { name: 'Settings', icon: SettingsIcon },
];

// Mock profile list - replace with actual profiles later
export const profiles = ['mx-brown', 'blue-alps', 'cherry-red', 'custom-1', 'custom-2'];

export const defaultEqualizerBands = [
  { freq: 60, gain: 0 },      // Sub-bass
  { freq: 170, gain: 0 },     // Bass
  { freq: 310, gain: 0 },     // Low-mid
  { freq: 600, gain: 0 },     // Mid
  { freq: 1000, gain: 0 },    // Upper-mid
  { freq: 3000, gain: 0 },    // Presence
  { freq: 6000, gain: 0 },    // Brilliance
  { freq: 12000, gain: 0 },   // Air
  { freq: 14000, gain: 0 },   // High
  { freq: 16000, gain: 0 },   // Ultra-high
];

export const equalizerPresets = {
  flat: [
    { freq: 60, gain: 0 },
    { freq: 170, gain: 0 },
    { freq: 310, gain: 0 },
    { freq: 600, gain: 0 },
    { freq: 1000, gain: 0 },
    { freq: 3000, gain: 0 },
    { freq: 6000, gain: 0 },
    { freq: 12000, gain: 0 },
    { freq: 14000, gain: 0 },
    { freq: 16000, gain: 0 },
  ],
  bassBoost: [
    { freq: 60, gain: 6 },
    { freq: 170, gain: 4 },
    { freq: 310, gain: 2 },
    { freq: 600, gain: 0 },
    { freq: 1000, gain: 0 },
    { freq: 3000, gain: 0 },
    { freq: 6000, gain: -1 },
    { freq: 12000, gain: -2 },
    { freq: 14000, gain: -2 },
    { freq: 16000, gain: -2 },
  ],
  trebleBoost: [
    { freq: 60, gain: -2 },
    { freq: 170, gain: -1 },
    { freq: 310, gain: 0 },
    { freq: 600, gain: 0 },
    { freq: 1000, gain: 1 },
    { freq: 3000, gain: 3 },
    { freq: 6000, gain: 5 },
    { freq: 12000, gain: 6 },
    { freq: 14000, gain: 5 },
    { freq: 16000, gain: 4 },
  ],
};

export const defaultRules = [
  { id: 1, executableName: 'chrome.exe', path: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', keyboardProfile: 'mx-brown', mouseProfile: 'mx-brown', enabled: true },
  { id: 2, executableName: 'code.exe', path: 'C:\\Users\\User\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe', keyboardProfile: 'None', mouseProfile: 'None', enabled: true },
];


// Shared style constants - using CSS variables for theme support
export const glassCardStyle = {
  background: 'var(--card-bg)',
  backdropFilter: 'blur(25px) saturate(180%)',
  WebkitBackdropFilter: 'blur(25px) saturate(180%)',
  borderRadius: '20px',
  boxShadow: 'var(--card-shadow), inset 0 1px 0 var(--card-highlight), 0 0 0 1px var(--card-border)',
  border: '1px solid var(--card-border)',
};

export const greenSwitchStyle = {
  '& .MuiSwitch-switchBase.Mui-checked': {
    color: 'var(--accent-primary)',
    '&:hover': {
      backgroundColor: 'var(--accent-bg)',
    },
  },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    backgroundColor: 'var(--accent-primary)',
  },
  '& .MuiSwitch-track': {
    backgroundColor: 'var(--input-border)',
  },
};

export const selectMenuProps = {
  PaperProps: {
    sx: {
      backgroundColor: 'var(--dropdown-bg)',
      backdropFilter: 'blur(10px)',
      border: '1px solid var(--dropdown-border)',
      '& .MuiMenuItem-root': {
        color: 'var(--text-secondary)',
        '&:hover': {
          backgroundColor: 'var(--dropdown-item-hover)',
        },
        '&.Mui-selected': {
          backgroundColor: 'var(--dropdown-item-selected)',
          color: 'var(--text-primary)',
        },
      },
    },
  },
};

