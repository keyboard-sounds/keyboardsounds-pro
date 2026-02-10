import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Switch,
  Chip,
  Tooltip,
  Fade,
} from '@mui/material';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MouseIcon from '@mui/icons-material/Mouse';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BuildIcon from '@mui/icons-material/Build';
import { GlassCard, PageHeader } from '../components/common';
import { selectMenuProps } from '../constants';
import { BrowseForDirectory, RefreshAudioFiles, BuildKeyboardProfile, BuildMouseProfile } from '../../wailsjs/go/app/ProfileBuilder';

const KEY_SIZE = 44;
const KEY_GAP = 4;
const SECTION_GAP = 20;
const KEYBOARD_PADDING = 20;

const KEYBOARD_NATURAL_WIDTH = 716 + 140 + 188 + (2 * SECTION_GAP) + (2 * KEYBOARD_PADDING);
const KEYBOARD_NATURAL_HEIGHT = 6 * KEY_SIZE + 5 * KEY_GAP + (2 * KEYBOARD_PADDING);

// Main keyboard section (left)
const mainKeyboard = [
  [
    { id: 'Escape', label: 'Esc', width: 1 },
    { id: 'F1', label: 'F1', width: 1, gap: 1 },
    { id: 'F2', label: 'F2', width: 1 },
    { id: 'F3', label: 'F3', width: 1 },
    { id: 'F4', label: 'F4', width: 1 },
    { id: 'F5', label: 'F5', width: 1, gap: 0.5 },
    { id: 'F6', label: 'F6', width: 1 },
    { id: 'F7', label: 'F7', width: 1 },
    { id: 'F8', label: 'F8', width: 1 },
    { id: 'F9', label: 'F9', width: 1, gap: 0.5 },
    { id: 'F10', label: 'F10', width: 1 },
    { id: 'F11', label: 'F11', width: 1 },
    { id: 'F12', label: 'F12', width: 1 },
  ],
  [
    { id: '`', label: '`', width: 1 },
    { id: '1', label: '1', width: 1 },
    { id: '2', label: '2', width: 1 },
    { id: '3', label: '3', width: 1 },
    { id: '4', label: '4', width: 1 },
    { id: '5', label: '5', width: 1 },
    { id: '6', label: '6', width: 1 },
    { id: '7', label: '7', width: 1 },
    { id: '8', label: '8', width: 1 },
    { id: '9', label: '9', width: 1 },
    { id: '0', label: '0', width: 1 },
    { id: '-', label: '-', width: 1 },
    { id: '+', label: '+', width: 1 },
    { id: 'Backspace', label: '⌫', width: 2 },
  ],
  [
    { id: 'Tab', label: 'Tab', width: 1.5 },
    { id: 'Q', label: 'Q', width: 1 },
    { id: 'W', label: 'W', width: 1 },
    { id: 'E', label: 'E', width: 1 },
    { id: 'R', label: 'R', width: 1 },
    { id: 'T', label: 'T', width: 1 },
    { id: 'Y', label: 'Y', width: 1 },
    { id: 'U', label: 'U', width: 1 },
    { id: 'I', label: 'I', width: 1 },
    { id: 'O', label: 'O', width: 1 },
    { id: 'P', label: 'P', width: 1 },
    { id: '[', label: '[', width: 1 },
    { id: ']', label: ']', width: 1 },
    { id: '\\', label: '\\', width: 1.5 },
  ],
  [
    { id: 'CapsLock', label: 'Caps', width: 1.75 },
    { id: 'A', label: 'A', width: 1 },
    { id: 'S', label: 'S', width: 1 },
    { id: 'D', label: 'D', width: 1 },
    { id: 'F', label: 'F', width: 1 },
    { id: 'G', label: 'G', width: 1 },
    { id: 'H', label: 'H', width: 1 },
    { id: 'J', label: 'J', width: 1 },
    { id: 'K', label: 'K', width: 1 },
    { id: 'L', label: 'L', width: 1 },
    { id: ';', label: ';', width: 1 },
    { id: '\'', label: "'", width: 1 },
    { id: 'Enter', label: 'Enter', width: 2.25 },
  ],
  [
    { id: 'LeftShift', label: 'Shift', width: 2.25 },
    { id: 'Z', label: 'Z', width: 1 },
    { id: 'X', label: 'X', width: 1 },
    { id: 'C', label: 'C', width: 1 },
    { id: 'V', label: 'V', width: 1 },
    { id: 'B', label: 'B', width: 1 },
    { id: 'N', label: 'N', width: 1 },
    { id: 'M', label: 'M', width: 1 },
    { id: ',', label: ',', width: 1 },
    { id: '.', label: '.', width: 1 },
    { id: '/', label: '/', width: 1 },
    { id: 'RightShift', label: 'Shift', width: 2.75 },
  ],
  [
    { id: 'LeftControl', label: 'Ctrl', width: 1.25 },
    { id: 'LeftWin', label: 'Win', width: 1.25 },
    { id: 'LeftAlt', label: 'Alt', width: 1.25 },
    { id: 'Space', label: '', width: 6.25 },
    { id: 'RightAlt', label: 'Alt', width: 1.25 },
    { id: 'RightWin', label: 'Win', width: 1.25 },
    { id: 'Menu', label: 'Menu', width: 1.25 },
    { id: 'RightControl', label: 'Ctrl', width: 1.25 },
  ],
];

const navCluster = [
  [
    { id: 'PrintScreen', label: 'PrtSc', width: 1 },
    { id: 'ScrollLock', label: 'ScrLk', width: 1 },
    { id: 'Pause', label: 'Pause', width: 1 },
  ],
  [
    { id: 'Insert', label: 'Ins', width: 1 },
    { id: 'Home', label: 'Home', width: 1 },
    { id: 'PageUp', label: 'PgUp', width: 1 },
  ],
  [
    { id: 'Delete', label: 'Del', width: 1 },
    { id: 'End', label: 'End', width: 1 },
    { id: 'PageDown', label: 'PgDn', width: 1 },
  ],
  [],
  [
    { id: 'Up', label: '↑', width: 1, gap: 1 },
  ],
  [
    { id: 'Left', label: '←', width: 1 },
    { id: 'Down', label: '↓', width: 1 },
    { id: 'Right', label: '→', width: 1 },
  ],
];

const numpad = [
  [],
  [
    { id: 'NumLock', label: 'Num', width: 1 },
    { id: 'Num/', label: '/', width: 1 },
    { id: 'Num*', label: '*', width: 1 },
    { id: 'Num-', label: '-', width: 1 },
  ],
  [
    { id: 'Num7', label: '7', width: 1 },
    { id: 'Num8', label: '8', width: 1 },
    { id: 'Num9', label: '9', width: 1 },
    { id: 'Num+', label: '+', width: 1, height: 2 },
  ],
  [
    { id: 'Num4', label: '4', width: 1 },
    { id: 'Num5', label: '5', width: 1 },
    { id: 'Num6', label: '6', width: 1 },
  ],
  [
    { id: 'Num1', label: '1', width: 1 },
    { id: 'Num2', label: '2', width: 1 },
    { id: 'Num3', label: '3', width: 1 },
    { id: 'Enter', label: '↵', width: 1, height: 2 },
  ],
  [
    { id: 'Num0', label: '0', width: 2 },
    { id: 'Num.', label: '.', width: 1 },
  ],
];

// Step 1: Profile Type Selection
function TypeSelectionStep({ onSelect }) {
  return (
    <Box>
      <PageHeader title="Profile Builder" />
      
      <GlassCard>
        <Typography
          variant="h6"
          sx={{
            color: 'var(--text-primary)',
            fontSize: '20px',
            fontWeight: 600,
            marginBottom: '8px',
            textAlign: 'center',
          }}
        >
          What type of profile do you want to build?
        </Typography>
        <Typography
          sx={{
            color: 'var(--text-tertiary)',
            fontSize: '14px',
            marginBottom: '32px',
            textAlign: 'center',
          }}
        >
          Choose whether you want to create a keyboard or mouse sound profile.
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            maxWidth: '600px',
            margin: '0 auto',
          }}
        >
          <Button
            onClick={() => onSelect('keyboard')}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 24px',
              borderRadius: '16px',
              background: 'var(--input-bg)',
              border: '2px solid var(--card-border)',
              color: 'var(--text-primary)',
              textTransform: 'none',
              transition: 'all 0.2s ease',
              '&:hover': {
                background: 'var(--accent-bg)',
                borderColor: 'var(--accent-primary)',
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 30px var(--accent-shadow)',
              },
            }}
          >
            <KeyboardIcon sx={{ fontSize: '64px', marginBottom: '16px', color: 'var(--accent-primary)' }} />
            <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Keyboard Profile</Typography>
            <Typography sx={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
              Create sounds for keyboard keys
            </Typography>
          </Button>

          <Button
            onClick={() => onSelect('mouse')}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 24px',
              borderRadius: '16px',
              background: 'var(--input-bg)',
              border: '2px solid var(--card-border)',
              color: 'var(--text-primary)',
              textTransform: 'none',
              transition: 'all 0.2s ease',
              '&:hover': {
                background: 'var(--accent-bg)',
                borderColor: 'var(--accent-primary)',
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 30px var(--accent-shadow)',
              },
            }}
          >
            <MouseIcon sx={{ fontSize: '64px', marginBottom: '16px', color: 'var(--accent-primary)' }} />
            <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Mouse Profile</Typography>
            <Typography sx={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
              Create sounds for mouse buttons
            </Typography>
          </Button>
        </Box>
      </GlassCard>
    </Box>
  );
}

// Step 2: Directory Selection
function DirectorySelectionStep({ profileType, onBack, onSelect }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBrowse = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await BrowseForDirectory();
      if (result && result.audioFiles.length > 0) {
        onSelect(result.path, result.audioFiles);
      } else if (result && result.audioFiles.length === 0) {
        setError('No audio files found in the selected directory. Please select a folder containing .mp3 or .wav files.');
      }
    } catch (err) {
      console.error('Failed to browse for directory:', err);
      setError('Failed to open directory browser.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader title="Profile Builder" />
      
      <GlassCard>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <IconButton
            onClick={onBack}
            sx={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'var(--hover-bg-light)',
              border: '1px solid var(--card-border)',
              color: 'var(--text-secondary)',
              '&:hover': {
                backgroundColor: 'var(--hover-bg)',
              },
            }}
          >
            <ArrowBackIcon sx={{ fontSize: '20px' }} />
          </IconButton>
          <Box>
            <Typography
              sx={{
                color: 'var(--text-primary)',
                fontSize: '18px',
                fontWeight: 600,
              }}
            >
              Select Audio Files Directory
            </Typography>
            <Typography
              sx={{
                color: 'var(--text-tertiary)',
                fontSize: '13px',
              }}
            >
              {profileType === 'keyboard' ? 'Keyboard' : 'Mouse'} Profile
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 24px',
            borderRadius: '16px',
            border: '2px dashed var(--card-border)',
            backgroundColor: 'var(--hover-bg-light)',
            transition: 'all 0.2s ease',
          }}
        >
          <FolderOpenIcon sx={{ fontSize: '64px', color: 'var(--accent-primary)', marginBottom: '20px' }} />
          <Typography
            sx={{
              color: 'var(--text-primary)',
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: '8px',
            }}
          >
            Choose a folder containing your audio files
          </Typography>
          <Typography
            sx={{
              color: 'var(--text-tertiary)',
              fontSize: '13px',
              marginBottom: '24px',
              textAlign: 'center',
            }}
          >
            Supported formats: MP3, WAV
          </Typography>

          <Button
            onClick={handleBrowse}
            disabled={isLoading}
            sx={{
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              padding: '12px 32px',
              borderRadius: '12px',
              textTransform: 'none',
              boxShadow: '0 4px 16px var(--accent-shadow)',
              '&:hover': {
                background: 'linear-gradient(135deg, var(--accent-light) 0%, var(--accent-primary) 100%)',
                transform: 'translateY(-2px)',
              },
              '&:disabled': {
                opacity: 0.6,
              },
            }}
          >
            <FolderOpenIcon sx={{ fontSize: '20px', marginRight: '8px' }} />
            {isLoading ? 'Opening...' : 'Browse Folder'}
          </Button>

          {error && (
            <Typography
              sx={{
                color: 'var(--danger)',
                fontSize: '13px',
                marginTop: '16px',
                textAlign: 'center',
              }}
            >
              {error}
            </Typography>
          )}
        </Box>
      </GlassCard>
    </Box>
  );
}

// Source Modal Component
function SourceModal({ open, onClose, onSave, source, audioFiles, existingSources }) {
  const [name, setName] = useState('');
  const [pressSound, setPressSound] = useState('');
  const [releaseSound, setReleaseSound] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (source) {
      setName(source.name);
      setPressSound(source.pressSound);
      setReleaseSound(source.releaseSound || '');
      setIsDefault(source.isDefault || false);
    } else {
      setName('');
      setPressSound('');
      setReleaseSound('');
      setIsDefault(false);
    }
    setError('');
  }, [source, open]);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Please enter a source name');
      return;
    }
    if (!pressSound) {
      setError('Please select a press sound');
      return;
    }
    // Check for duplicate names (but allow editing the same source)
    const isDuplicate = existingSources.some(s => 
      s.name.toLowerCase() === name.trim().toLowerCase() && 
      (!source || s.name !== source.name)
    );
    if (isDuplicate) {
      setError('A source with this name already exists');
      return;
    }

    onSave({
      name: name.trim(),
      pressSound,
      releaseSound: releaseSound || null,
      isDefault,
    });
    onClose();
  };

  if (!open) return null;

  return (
    <Fade in={open} timeout={200}>
      <Box
        onClick={(e) => e.target === e.currentTarget && onClose()}
        sx={{
          position: 'fixed',
          top: '40px',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
        }}
      >
        <Box
          sx={{
            width: '440px',
            maxWidth: 'calc(100vw - 48px)',
            background: 'var(--card-bg)',
            backdropFilter: 'blur(25px) saturate(180%)',
            borderRadius: '20px',
            boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--card-border)',
            border: '1px solid var(--card-border)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid var(--card-border)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Box
                sx={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'var(--accent-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--accent-border)',
                }}
              >
                <MusicNoteIcon sx={{ fontSize: '20px', color: 'var(--accent-primary)' }} />
              </Box>
              <Typography sx={{ color: 'var(--text-primary)', fontSize: '17px', fontWeight: 600 }}>
                {source ? 'Edit Source' : 'Add Source'}
              </Typography>
            </Box>
            <IconButton
              onClick={onClose}
              sx={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                color: 'var(--text-muted)',
                backgroundColor: 'var(--hover-bg-light)',
                '&:hover': { backgroundColor: 'var(--hover-bg)' },
              }}
            >
              <CloseIcon sx={{ fontSize: '18px' }} />
            </IconButton>
          </Box>

          {/* Content */}
          <Box sx={{ padding: '24px' }}>
            {/* Name */}
            <Box sx={{ marginBottom: '20px' }}>
              <Typography sx={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                Source Name (ID)
              </Typography>
              <TextField
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., alphanumeric, modifiers, spacebar"
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'var(--input-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--input-border)',
                    '& fieldset': { border: 'none' },
                    '&:hover': { borderColor: 'var(--input-border-hover)' },
                    '&.Mui-focused': { borderColor: 'var(--accent-primary)' },
                    '& input': { color: 'var(--text-primary)', padding: '12px 14px' },
                  },
                }}
              />
            </Box>

            {/* Press Sound */}
            <Box sx={{ marginBottom: '20px' }}>
              <Typography sx={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                Press Sound *
              </Typography>
              <Select
                value={pressSound}
                onChange={(e) => setPressSound(e.target.value)}
                displayEmpty
                fullWidth
                sx={{
                  backgroundColor: 'var(--input-bg)',
                  borderRadius: '12px',
                  border: '1px solid var(--input-border)',
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  '& .MuiSelect-select': { padding: '12px 14px', color: pressSound ? 'var(--text-primary)' : 'var(--text-muted)' },
                  '&:hover': { borderColor: 'var(--input-border-hover)' },
                }}
                MenuProps={selectMenuProps}
              >
                <MenuItem value="" disabled>Select a press sound</MenuItem>
                {audioFiles.map((file) => (
                  <MenuItem key={file.path} value={file.name}>{file.name}</MenuItem>
                ))}
              </Select>
            </Box>

            {/* Release Sound */}
            <Box sx={{ marginBottom: '20px' }}>
              <Typography sx={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                Release Sound (Optional)
              </Typography>
              <Select
                value={releaseSound}
                onChange={(e) => setReleaseSound(e.target.value)}
                displayEmpty
                fullWidth
                sx={{
                  backgroundColor: 'var(--input-bg)',
                  borderRadius: '12px',
                  border: '1px solid var(--input-border)',
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  '& .MuiSelect-select': { padding: '12px 14px', color: releaseSound ? 'var(--text-primary)' : 'var(--text-muted)' },
                  '&:hover': { borderColor: 'var(--input-border-hover)' },
                }}
                MenuProps={selectMenuProps}
              >
                <MenuItem value="">None</MenuItem>
                {audioFiles.map((file) => (
                  <MenuItem key={file.path} value={file.name}>{file.name}</MenuItem>
                ))}
              </Select>
            </Box>

            {/* Is Default */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: 'var(--hover-bg-light)',
                border: '1px solid var(--card-border)',
              }}
            >
              <Box>
                <Typography sx={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500 }}>
                  Add to Default Sources
                </Typography>
                <Typography sx={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                  Keys without assigned sources will use default sources
                </Typography>
              </Box>
              <Switch
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: 'var(--accent-primary)',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: 'var(--accent-primary)',
                  },
                }}
              />
            </Box>

            {error && (
              <Typography sx={{ color: 'var(--danger)', fontSize: '13px', marginTop: '16px' }}>
                {error}
              </Typography>
            )}
          </Box>

          {/* Footer */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              padding: '16px 24px',
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
                '&:hover': { backgroundColor: 'var(--hover-bg)' },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              sx={{
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                padding: '10px 24px',
                borderRadius: '10px',
                textTransform: 'none',
                '&:hover': {
                  background: 'linear-gradient(135deg, var(--accent-light) 0%, var(--accent-primary) 100%)',
                },
              }}
            >
              <SaveIcon sx={{ fontSize: '18px', marginRight: '6px' }} />
              {source ? 'Save Changes' : 'Add Source'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Fade>
  );
}

// Key Assignment Modal
function KeyAssignmentModal({ open, onClose, selectedKeys, sources, keyAssignments, onSave }) {
  const [selectedSources, setSelectedSources] = useState([]);

  useEffect(() => {
    if (open && selectedKeys.size > 0) {
      // Get sources that are assigned to ALL selected keys
      const keysArray = Array.from(selectedKeys);
      const firstKeySources = keyAssignments[keysArray[0]] || [];
      const commonSources = firstKeySources.filter(source =>
        keysArray.every(key => (keyAssignments[key] || []).includes(source))
      );
      setSelectedSources(commonSources);
    }
  }, [open, selectedKeys, keyAssignments]);

  const handleToggleSource = (sourceName) => {
    setSelectedSources(prev =>
      prev.includes(sourceName)
        ? prev.filter(s => s !== sourceName)
        : [...prev, sourceName]
    );
  };

  const handleSave = () => {
    onSave(selectedSources);
    onClose();
  };

  const handleClear = () => {
    setSelectedSources([]);
  };

  if (!open) return null;

  return (
    <Fade in={open} timeout={200}>
      <Box
        onClick={(e) => e.target === e.currentTarget && onClose()}
        sx={{
          position: 'fixed',
          top: '40px',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
        }}
      >
        <Box
          sx={{
            width: '400px',
            maxWidth: 'calc(100vw - 48px)',
            background: 'var(--card-bg)',
            backdropFilter: 'blur(25px) saturate(180%)',
            borderRadius: '20px',
            boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--card-border)',
            border: '1px solid var(--card-border)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid var(--card-border)',
            }}
          >
            <Box>
              <Typography sx={{ color: 'var(--text-primary)', fontSize: '17px', fontWeight: 600 }}>
                Assign Sources
              </Typography>
              <Typography sx={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                {selectedKeys.size} key{selectedKeys.size !== 1 ? 's' : ''} selected
              </Typography>
            </Box>
            <IconButton
              onClick={onClose}
              sx={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                color: 'var(--text-muted)',
                backgroundColor: 'var(--hover-bg-light)',
                '&:hover': { backgroundColor: 'var(--hover-bg)' },
              }}
            >
              <CloseIcon sx={{ fontSize: '18px' }} />
            </IconButton>
          </Box>

          {/* Content */}
          <Box sx={{ padding: '20px 24px', maxHeight: '300px', overflow: 'auto' }}>
            {sources.length === 0 ? (
              <Typography sx={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                No sources created yet. Add sources first.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sources.map((source) => (
                  <Box
                    key={source.name}
                    onClick={() => handleToggleSource(source.name)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      backgroundColor: selectedSources.includes(source.name) 
                        ? 'var(--accent-bg)' 
                        : 'var(--hover-bg-light)',
                      border: selectedSources.includes(source.name)
                        ? '1px solid var(--accent-border)'
                        : '1px solid var(--card-border)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        backgroundColor: selectedSources.includes(source.name)
                          ? 'var(--accent-bg-hover)'
                          : 'var(--hover-bg)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <MusicNoteIcon sx={{ fontSize: '18px', color: 'var(--accent-primary)' }} />
                      <Box>
                        <Typography sx={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500 }}>
                          {source.name}
                        </Typography>
                        <Typography sx={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                          {source.pressSound}{source.releaseSound ? ` + ${source.releaseSound}` : ''}
                        </Typography>
                      </Box>
                    </Box>
                    {selectedSources.includes(source.name) && (
                      <CheckCircleIcon sx={{ fontSize: '20px', color: 'var(--accent-primary)' }} />
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* Footer */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '16px 24px',
              borderTop: '1px solid var(--card-border)',
            }}
          >
            <Button
              onClick={handleClear}
              sx={{
                color: 'var(--danger)',
                fontSize: '14px',
                fontWeight: 500,
                padding: '10px 16px',
                borderRadius: '10px',
                textTransform: 'none',
                '&:hover': { backgroundColor: 'var(--danger-bg)' },
              }}
            >
              Clear All
            </Button>
            <Box sx={{ display: 'flex', gap: '12px' }}>
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
                  '&:hover': { backgroundColor: 'var(--hover-bg)' },
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                sx={{
                  background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  padding: '10px 24px',
                  borderRadius: '10px',
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(135deg, var(--accent-light) 0%, var(--accent-primary) 100%)',
                  },
                }}
              >
                Apply
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Fade>
  );
}

// KeyButton for keyboard layout
function KeyButton({ keyData, isSelected, hasAssignment, onClick }) {
  const width = keyData.width * KEY_SIZE + (keyData.width - 1) * KEY_GAP;
  const height = keyData.height 
    ? keyData.height * KEY_SIZE + (keyData.height - 1) * KEY_GAP 
    : KEY_SIZE;
  const gapBefore = keyData.gap ? keyData.gap * (KEY_SIZE + KEY_GAP) : 0;
  
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        width: `${width}px`,
        height: `${height}px`,
        marginLeft: gapBefore > 0 ? `${gapBefore}px` : 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        background: isSelected 
          ? 'linear-gradient(135deg, var(--accent-bg) 0%, var(--accent-bg-hover) 100%)'
          : hasAssignment
            ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.3) 100%)'
          : 'linear-gradient(135deg, var(--input-bg) 0%, var(--hover-bg-light) 100%)',
        border: isSelected 
          ? '2px solid var(--accent-primary)'
          : hasAssignment
            ? '1px solid rgba(139, 92, 246, 0.5)'
          : '1px solid var(--card-border)',
        borderRadius: '8px',
        color: isSelected ? 'var(--accent-primary)' : hasAssignment ? 'rgba(139, 92, 246, 0.9)' : 'var(--text-secondary)',
        fontSize: keyData.label.length > 3 ? '10px' : '12px',
        fontWeight: 600,
        fontFamily: 'inherit',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: isSelected
          ? '0 0 20px var(--accent-shadow), inset 0 1px 0 var(--card-highlight)'
          : '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 var(--card-highlight)',
        textTransform: 'none',
        padding: 0,
        outline: 'none',
        '&:hover': {
          background: isSelected
            ? 'linear-gradient(135deg, var(--accent-bg-hover) 0%, var(--accent-bg) 100%)'
            : 'linear-gradient(135deg, var(--hover-bg) 0%, var(--input-bg) 100%)',
          borderColor: isSelected ? 'var(--accent-light)' : 'var(--input-border-hover)',
          transform: 'translateY(-1px)',
        },
        '&:active': {
          transform: 'translateY(1px)',
        },
      }}
    >
      {keyData.label}
      {hasAssignment && !isSelected && (
        <Box
          sx={{
            position: 'absolute',
            top: '3px',
            right: '3px',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'rgba(139, 92, 246, 0.9)',
          }}
        />
      )}
    </Box>
  );
}

// Keyboard Section
function KeyboardSection({ layout, selectedKeys, keyAssignments, onKeyClick, sx = {} }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${KEY_GAP}px`, ...sx }}>
      {layout.map((row, rowIndex) => (
        <Box
          key={rowIndex}
          sx={{
            display: 'flex',
            gap: `${KEY_GAP}px`,
            height: `${KEY_SIZE}px`,
            alignItems: 'flex-start',
          }}
        >
          {row.map((keyData) => (
            <KeyButton
              key={keyData.id}
              keyData={keyData}
              isSelected={selectedKeys.has(keyData.id)}
              hasAssignment={(keyAssignments[keyData.id] || []).length > 0}
              onClick={() => onKeyClick(keyData.id)}
            />
          ))}
        </Box>
      ))}
    </Box>
  );
}

// Build Profile Modal
function BuildProfileModal({ open, onClose, onBuild, metadata, setMetadata, profileType, isBuilding, buildError }) {
  const [error, setError] = useState('');

  const handleBuild = () => {
    if (!metadata.name.trim()) {
      setError('Please enter a profile name');
      return;
    }
    setError('');
    onBuild();
  };

  // Show build error from parent if present
  const displayError = buildError || error;

  if (!open) return null;

  return (
    <Fade in={open} timeout={200}>
      <Box
        onClick={(e) => e.target === e.currentTarget && onClose()}
        sx={{
          position: 'fixed',
          top: '40px',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
        }}
      >
        <Box
          sx={{
            width: '480px',
            maxWidth: 'calc(100vw - 48px)',
            background: 'var(--card-bg)',
            backdropFilter: 'blur(25px) saturate(180%)',
            borderRadius: '20px',
            boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--card-border)',
            border: '1px solid var(--card-border)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid var(--card-border)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Box
                sx={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'var(--accent-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--accent-border)',
                }}
              >
                <BuildIcon sx={{ fontSize: '20px', color: 'var(--accent-primary)' }} />
              </Box>
              <Box>
                <Typography sx={{ color: 'var(--text-primary)', fontSize: '17px', fontWeight: 600 }}>
                  Build {profileType === 'keyboard' ? 'Keyboard' : 'Mouse'} Profile
                </Typography>
                <Typography sx={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                  Enter profile details to complete the build
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
                '&:hover': { backgroundColor: 'var(--hover-bg)' },
              }}
            >
              <CloseIcon sx={{ fontSize: '18px' }} />
            </IconButton>
          </Box>

          {/* Content */}
          <Box sx={{ padding: '24px' }}>
            {/* Profile Name */}
            <Box sx={{ marginBottom: '20px' }}>
              <Typography sx={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                Profile Name *
              </Typography>
              <TextField
                value={metadata.name}
                onChange={(e) => setMetadata(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Cherry MX Blue"
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'var(--input-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--input-border)',
                    '& fieldset': { border: 'none' },
                    '&:hover': { borderColor: 'var(--input-border-hover)' },
                    '&.Mui-focused': { borderColor: 'var(--accent-primary)' },
                    '& input': { color: 'var(--text-primary)', padding: '12px 14px' },
                  },
                }}
              />
            </Box>

            {/* Description */}
            <Box sx={{ marginBottom: '20px' }}>
              <Typography sx={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                Description
              </Typography>
              <TextField
                value={metadata.description}
                onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                placeholder="e.g., Clicky tactile switch sounds"
                fullWidth
                multiline
                rows={2}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'var(--input-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--input-border)',
                    padding: '0',
                    '& fieldset': { border: 'none' },
                    '&:hover': { borderColor: 'var(--input-border-hover)' },
                    '&.Mui-focused': { borderColor: 'var(--accent-primary)' },
                    '& textarea': { color: 'var(--text-primary)', padding: '12px 14px' },
                  },
                }}
              />
            </Box>

            {/* Author */}
            <Box>
              <Typography sx={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                Author
              </Typography>
              <TextField
                value={metadata.author}
                onChange={(e) => setMetadata(prev => ({ ...prev, author: e.target.value }))}
                placeholder="Your name"
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'var(--input-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--input-border)',
                    '& fieldset': { border: 'none' },
                    '&:hover': { borderColor: 'var(--input-border-hover)' },
                    '&.Mui-focused': { borderColor: 'var(--accent-primary)' },
                    '& input': { color: 'var(--text-primary)', padding: '12px 14px' },
                  },
                }}
              />
            </Box>

            {displayError && (
              <Typography sx={{ color: 'var(--danger)', fontSize: '13px', marginTop: '16px' }}>
                {displayError}
              </Typography>
            )}
          </Box>

          {/* Footer */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              padding: '16px 24px',
              borderTop: '1px solid var(--card-border)',
            }}
          >
            <Button
              onClick={onClose}
              disabled={isBuilding}
              sx={{
                color: 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: 500,
                padding: '10px 20px',
                borderRadius: '10px',
                textTransform: 'none',
                backgroundColor: 'var(--hover-bg-light)',
                '&:hover': { backgroundColor: 'var(--hover-bg)' },
                '&:disabled': { opacity: 0.5 },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBuild}
              disabled={isBuilding}
              sx={{
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                padding: '10px 24px',
                borderRadius: '10px',
                textTransform: 'none',
                '&:hover': {
                  background: 'linear-gradient(135deg, var(--accent-light) 0%, var(--accent-primary) 100%)',
                },
                '&:disabled': { opacity: 0.7 },
              }}
            >
              <BuildIcon sx={{ fontSize: '18px', marginRight: '6px' }} />
              {isBuilding ? 'Building...' : 'Build Profile'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Fade>
  );
}

// Step 3: Profile Editor
function ProfileEditorStep({ profileType, directory, audioFiles: initialAudioFiles, onBack, onSuccess }) {
  const [audioFiles, setAudioFiles] = useState(initialAudioFiles);
  const [sources, setSources] = useState([]);
  const [metadata, setMetadata] = useState({ name: '', description: '', author: '' });
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [keyAssignments, setKeyAssignments] = useState({});
  const [mouseAssignments, setMouseAssignments] = useState({
    left: '',
    right: '',
    middle: '',
    default: '',
  });
  const [scale, setScale] = useState(1);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState(null);
  const [isKeyAssignmentModalOpen, setIsKeyAssignmentModalOpen] = useState(false);
  const [isBuildModalOpen, setIsBuildModalOpen] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildError, setBuildError] = useState('');
  const containerRef = useRef(null);

  // Check if at least one default source exists
  const hasDefaultSource = sources.some(s => s.isDefault);

  const handleBuildProfile = async () => {
    setIsBuilding(true);
    setBuildError('');

    try {
      // Prepare sources for backend
      const sourcesForBackend = sources.map(src => ({
        name: src.name,
        pressSound: src.pressSound,
        releaseSound: src.releaseSound || null,
        isDefault: src.isDefault,
      }));

      if (profileType === 'keyboard') {
        await BuildKeyboardProfile({
          metadata: metadata,
          sources: sourcesForBackend,
          keyAssignments: keyAssignments,
          directory: directory,
        });
      } else {
        await BuildMouseProfile({
          metadata: metadata,
          sources: sourcesForBackend,
          mouseAssignments: mouseAssignments,
          directory: directory,
        });
      }

      // Success - close modal and notify parent with full profile info
      setIsBuildModalOpen(false);
      if (onSuccess) {
        onSuccess({
          name: metadata.name,
          description: metadata.description,
          author: metadata.author,
          type: profileType,
        });
      }
    } catch (err) {
      console.error('Failed to build profile:', err);
      setBuildError(err.message || 'Failed to build profile. Please try again.');
    } finally {
      setIsBuilding(false);
    }
  };

  // Calculate keyboard scale
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScale = () => {
      const containerWidth = container.clientWidth;
      const newScale = Math.min(1, containerWidth / KEYBOARD_NATURAL_WIDTH);
      setScale(newScale);
    };

    updateScale();
    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const handleKeyClick = (keyId) => {
    setSelectedKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const handleAddSource = () => {
    setEditingSource(null);
    setIsSourceModalOpen(true);
  };

  const handleEditSource = (source) => {
    setEditingSource(source);
    setIsSourceModalOpen(true);
  };

  const handleDeleteSource = (sourceName) => {
    setSources(prev => prev.filter(s => s.name !== sourceName));
    // Also remove from key assignments
    setKeyAssignments(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        updated[key] = updated[key].filter(s => s !== sourceName);
      });
      return updated;
    });
  };

  const handleSaveSource = (sourceData) => {
    if (editingSource) {
      setSources(prev => prev.map(s => 
        s.name === editingSource.name ? sourceData : s
      ));
      // Update key assignments if name changed
      if (editingSource.name !== sourceData.name) {
        setKeyAssignments(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(key => {
            updated[key] = updated[key].map(s => 
              s === editingSource.name ? sourceData.name : s
            );
          });
          return updated;
        });
      }
    } else {
      setSources(prev => [...prev, sourceData]);
    }
  };

  const handleAssignSources = () => {
    if (selectedKeys.size > 0) {
      setIsKeyAssignmentModalOpen(true);
    }
  };

  const handleSaveKeyAssignments = (selectedSources) => {
    setKeyAssignments(prev => {
      const updated = { ...prev };
      selectedKeys.forEach(key => {
        updated[key] = selectedSources;
      });
      return updated;
    });
    setSelectedKeys(new Set());
  };

  const handleRefreshAudioFiles = async () => {
    try {
      const files = await RefreshAudioFiles(directory);
      setAudioFiles(files);
    } catch (err) {
      console.error('Failed to refresh audio files:', err);
    }
  };

  const scaledHeight = KEYBOARD_NATURAL_HEIGHT * scale;

  return (
    <Box>
      <PageHeader title="Profile Builder">
        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button
            onClick={onBack}
            sx={{
              color: 'var(--text-secondary)',
              fontSize: '14px',
              fontWeight: 500,
              padding: '8px 16px',
              borderRadius: '10px',
              textTransform: 'none',
              backgroundColor: 'var(--hover-bg-light)',
              border: '1px solid var(--card-border)',
              '&:hover': { backgroundColor: 'var(--hover-bg)' },
            }}
          >
            <ArrowBackIcon sx={{ fontSize: '18px', marginRight: '6px' }} />
            Start Over
          </Button>
          <Tooltip 
            title={!hasDefaultSource ? "Create at least one default source to build" : ""} 
            arrow
          >
            <span>
              <Button
                onClick={() => setIsBuildModalOpen(true)}
                disabled={!hasDefaultSource}
                sx={{
                  background: hasDefaultSource 
                    ? 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)'
                    : 'var(--hover-bg-light)',
                  color: hasDefaultSource ? 'white' : 'var(--text-muted)',
                  fontSize: '14px',
                  fontWeight: 600,
                  padding: '8px 20px',
                  borderRadius: '10px',
                  textTransform: 'none',
                  boxShadow: hasDefaultSource ? '0 4px 16px var(--accent-shadow)' : 'none',
                  border: hasDefaultSource ? 'none' : '1px solid var(--card-border)',
                  '&:hover': {
                    background: hasDefaultSource 
                      ? 'linear-gradient(135deg, var(--accent-light) 0%, var(--accent-primary) 100%)'
                      : 'var(--hover-bg-light)',
                  },
                  '&:disabled': {
                    color: 'var(--text-muted)',
                  },
                }}
              >
                <BuildIcon sx={{ fontSize: '18px', marginRight: '6px' }} />
                Build Profile
              </Button>
            </span>
          </Tooltip>
        </Box>
      </PageHeader>

      {/* Sources Section */}
      <GlassCard sx={{ marginBottom: '20px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <Box>
            <Typography sx={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 600 }}>
              Sound Sources
            </Typography>
            <Typography sx={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>
              Create sound sources that can be assigned to keys.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: '8px' }}>
            <Tooltip title="Refresh audio files" arrow>
              <IconButton
                onClick={handleRefreshAudioFiles}
                sx={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--hover-bg-light)',
                  border: '1px solid var(--card-border)',
                  color: 'var(--text-secondary)',
                  '&:hover': { backgroundColor: 'var(--hover-bg)' },
                }}
              >
                <RefreshIcon sx={{ fontSize: '18px' }} />
              </IconButton>
            </Tooltip>
            <Button
              onClick={handleAddSource}
              sx={{
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                color: 'white',
            fontSize: '13px',
                fontWeight: 600,
                padding: '8px 16px',
                borderRadius: '10px',
                textTransform: 'none',
                '&:hover': {
                  background: 'linear-gradient(135deg, var(--accent-light) 0%, var(--accent-primary) 100%)',
                },
              }}
            >
              <AddIcon sx={{ fontSize: '18px', marginRight: '4px' }} />
              Add Source
            </Button>
          </Box>
        </Box>

        {sources.length === 0 ? (
          <Box
            sx={{
              padding: '40px',
              textAlign: 'center',
              borderRadius: '12px',
              border: '2px dashed var(--card-border)',
              backgroundColor: 'var(--hover-bg-light)',
            }}
          >
            <MusicNoteIcon sx={{ fontSize: '48px', color: 'var(--text-muted)', marginBottom: '12px' }} />
            <Typography sx={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              No sources created yet
        </Typography>
            <Typography sx={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
              Click "Add Source" to create your first sound source
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {sources.map((source) => (
              <Box
                key={source.name}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--hover-bg-light)',
                  border: '1px solid var(--card-border)',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    borderColor: 'var(--input-border-hover)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: source.isDefault ? 'var(--accent-bg)' : 'var(--input-bg)',
                      border: source.isDefault ? '1px solid var(--accent-border)' : '1px solid var(--card-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <VolumeUpIcon sx={{ fontSize: '18px', color: source.isDefault ? 'var(--accent-primary)' : 'var(--text-secondary)' }} />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Typography sx={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}>
                        {source.name}
                      </Typography>
                      {source.isDefault && (
                        <Chip
                          label="Default"
                          size="small"
                          sx={{
                            height: '20px',
                            fontSize: '10px',
                            backgroundColor: 'var(--accent-bg)',
                            color: 'var(--accent-primary)',
                            border: '1px solid var(--accent-border)',
                          }}
                        />
                      )}
                    </Box>
                    <Typography
                      sx={{
                        color: 'var(--text-muted)',
                        fontSize: '11px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {source.pressSound}{source.releaseSound ? ` → ${source.releaseSound}` : ''}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                  <Tooltip title="Edit source" arrow>
                    <IconButton
                      onClick={() => handleEditSource(source)}
                      sx={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        color: 'var(--text-muted)',
                        '&:hover': { backgroundColor: 'var(--hover-bg)', color: 'var(--text-secondary)' },
                      }}
                    >
                      <EditIcon sx={{ fontSize: '16px' }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete source" arrow>
                    <IconButton
                      onClick={() => handleDeleteSource(source.name)}
                      sx={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        color: 'var(--text-muted)',
                        '&:hover': { backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' },
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: '16px' }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </GlassCard>

      {/* Keyboard Layout (for keyboard profiles) */}
      {profileType === 'keyboard' && (
        <GlassCard>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <Box>
              <Typography sx={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 600 }}>
                Keyboard Layout
              </Typography>
              <Typography sx={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>
                Select keys and assign sound sources to them. Purple keys have sources assigned.
              </Typography>
            </Box>
            {selectedKeys.size > 0 && (
              <Box sx={{ display: 'flex', gap: '8px' }}>
                <Button
                  onClick={() => setSelectedKeys(new Set())}
                  sx={{
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: 500,
                    padding: '8px 16px',
                    borderRadius: '10px',
                    textTransform: 'none',
                    backgroundColor: 'var(--hover-bg-light)',
                    '&:hover': { backgroundColor: 'var(--hover-bg)' },
                  }}
                >
                  Clear Selection
                </Button>
                <Button
                  onClick={handleAssignSources}
                  disabled={sources.length === 0}
                  sx={{
                    background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 600,
                    padding: '8px 16px',
                    borderRadius: '10px',
                    textTransform: 'none',
                    '&:hover': {
                      background: 'linear-gradient(135deg, var(--accent-light) 0%, var(--accent-primary) 100%)',
                    },
                    '&:disabled': {
                      opacity: 0.5,
                      color: 'white',
                    },
                  }}
                >
                  Assign Sources ({selectedKeys.size})
                </Button>
              </Box>
            )}
          </Box>

        <Box
          ref={containerRef}
          sx={{
            width: '100%',
            height: `${scaledHeight}px`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: `${SECTION_GAP}px`,
              padding: `${KEYBOARD_PADDING}px`,
              background: 'var(--hover-bg-light)',
                borderRadius: `${16 / scale}px`,
              border: '1px solid var(--card-border)',
              width: `${KEYBOARD_NATURAL_WIDTH}px`,
              height: `${KEYBOARD_NATURAL_HEIGHT}px`,
              transformOrigin: 'top left',
              transform: `scale(${scale})`,
              boxSizing: 'border-box',
            }}
          >
            <KeyboardSection
              layout={mainKeyboard}
              selectedKeys={selectedKeys}
                keyAssignments={keyAssignments}
              onKeyClick={handleKeyClick}
            />
            <KeyboardSection
              layout={navCluster}
              selectedKeys={selectedKeys}
                keyAssignments={keyAssignments}
              onKeyClick={handleKeyClick}
            />
            <KeyboardSection
              layout={numpad}
              selectedKeys={selectedKeys}
                keyAssignments={keyAssignments}
              onKeyClick={handleKeyClick}
            />
          </Box>
        </Box>
        </GlassCard>
      )}

      {/* Mouse Layout (for mouse profiles) */}
      {profileType === 'mouse' && (
        <GlassCard>
          <Typography sx={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            Mouse Buttons
          </Typography>
          <Typography sx={{ color: 'var(--text-tertiary)', fontSize: '13px', marginBottom: '24px' }}>
            Assign sound sources to each mouse button. The "Default" source is used for any button without a specific assignment.
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {[
              { id: 'left', label: 'Left Button', icon: '🖱️' },
              { id: 'right', label: 'Right Button', icon: '🖱️' },
              { id: 'middle', label: 'Middle Button', icon: '🖱️' },
              { id: 'default', label: 'Default (Fallback)', icon: '⚙️' },
            ].map((button) => (
              <Box
                key={button.id}
            sx={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--hover-bg-light)',
                  border: '1px solid var(--card-border)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <Box
                    sx={{
                      width: '36px',
                      height: '36px',
              borderRadius: '10px',
                      background: mouseAssignments[button.id] ? 'var(--accent-bg)' : 'var(--input-bg)',
                      border: mouseAssignments[button.id] ? '1px solid var(--accent-border)' : '1px solid var(--card-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}
                  >
                    {button.icon}
                  </Box>
                  <Typography sx={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}>
                    {button.label}
            </Typography>
          </Box>
                <Select
                  value={mouseAssignments[button.id]}
                  onChange={(e) => setMouseAssignments(prev => ({ ...prev, [button.id]: e.target.value }))}
                  displayEmpty
                  fullWidth
              sx={{
                    backgroundColor: 'var(--input-bg)',
                    borderRadius: '10px',
                    border: '1px solid var(--input-border)',
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '& .MuiSelect-select': { 
                      padding: '10px 14px', 
                      color: mouseAssignments[button.id] ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '13px',
                    },
                    '&:hover': { borderColor: 'var(--input-border-hover)' },
                  }}
                  MenuProps={selectMenuProps}
                >
                  <MenuItem value="">
                    <em style={{ color: 'var(--text-muted)' }}>None</em>
                  </MenuItem>
                  {sources.map((source) => (
                    <MenuItem key={source.name} value={source.name}>{source.name}</MenuItem>
                  ))}
                </Select>
          </Box>
            ))}
          </Box>
      </GlassCard>
      )}

      {/* Source Modal */}
      <SourceModal
        open={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        onSave={handleSaveSource}
        source={editingSource}
        audioFiles={audioFiles}
        existingSources={sources}
      />

      {/* Key Assignment Modal */}
      <KeyAssignmentModal
        open={isKeyAssignmentModalOpen}
        onClose={() => setIsKeyAssignmentModalOpen(false)}
        selectedKeys={selectedKeys}
        sources={sources}
        keyAssignments={keyAssignments}
        onSave={handleSaveKeyAssignments}
      />

      {/* Build Profile Modal */}
      <BuildProfileModal
        open={isBuildModalOpen}
        onClose={() => {
          setIsBuildModalOpen(false);
          setBuildError('');
        }}
        onBuild={handleBuildProfile}
        metadata={metadata}
        setMetadata={setMetadata}
        profileType={profileType}
        isBuilding={isBuilding}
        buildError={buildError}
      />
    </Box>
  );
}

// Profile Preview Card (similar to LibraryPage ProfileCard)
function ProfilePreviewCard({ profile }) {
  const isKeyboard = profile.type === 'keyboard';
  const TypeIcon = isKeyboard ? KeyboardIcon : MouseIcon;

  return (
    <Box
      sx={{
        background: 'var(--card-bg)',
        backdropFilter: 'blur(25px) saturate(180%)',
        borderRadius: '16px',
        border: '1px solid var(--card-border)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        padding: '20px 24px',
        width: '100%',
        maxWidth: '480px',
        textAlign: 'left', // Override parent's center alignment
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '16px', width: '100%' }}>
        {/* Icon */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            backgroundColor: isKeyboard
              ? 'rgba(99, 102, 241, 0.15)'
              : 'rgba(236, 72, 153, 0.15)',
            border: isKeyboard
              ? '1px solid rgba(99, 102, 241, 0.25)'
              : '1px solid rgba(236, 72, 153, 0.25)',
            flexShrink: 0,
          }}
        >
          <TypeIcon
            sx={{
              fontSize: '26px',
              color: isKeyboard ? '#818cf8' : '#f472b6',
            }}
          />
        </Box>

        {/* Profile info */}
        <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textAlign: 'left' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <Typography
              sx={{
                color: 'var(--text-primary)',
                fontSize: '16px',
                fontWeight: 600,
              }}
            >
              {profile.name}
            </Typography>
            <Chip
              label={isKeyboard ? 'Keyboard' : 'Mouse'}
              size="small"
              sx={{
                backgroundColor: 'var(--hover-bg-light)',
                color: 'var(--text-tertiary)',
                fontSize: '10px',
                height: '20px',
                border: '1px solid var(--card-border)',
              }}
            />
          </Box>
          <Typography
            sx={{
              color: 'var(--text-secondary)',
              fontSize: '13px',
              marginBottom: '8px',
              lineHeight: 1.6,
              wordBreak: 'break-word',
              textAlign: 'left',
            }}
          >
            {profile.description || 'No description'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// Success Message Component
function SuccessMessage({ profile, onDismiss, onGoToLibrary }) {
  return (
    <Box>
      <PageHeader title="Profile Builder" />
      
      <GlassCard>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              boxShadow: '0 8px 30px var(--accent-shadow)',
            }}
          >
            <CheckCircleIcon sx={{ fontSize: '40px', color: 'white' }} />
          </Box>
          <Typography
            sx={{
              color: 'var(--text-primary)',
              fontSize: '22px',
              fontWeight: 600,
              marginBottom: '8px',
            }}
          >
            Profile Created Successfully!
          </Typography>
          <Typography
            sx={{
              color: 'var(--text-tertiary)',
              fontSize: '14px',
              marginBottom: '28px',
              maxWidth: '600px',
            }}
          >
            Your new {profile.type} profile has been added to your library and is ready to use.
          </Typography>

          {/* Profile Preview Card */}
          <Box sx={{ marginBottom: '28px', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <ProfilePreviewCard profile={profile} />
          </Box>

          {/* Info about where to find it */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              borderRadius: '12px',
              backgroundColor: 'var(--hover-bg-light)',
              border: '1px solid var(--card-border)',
              marginBottom: '28px',
            }}
          >
            <FolderOpenIcon sx={{ fontSize: '18px', color: 'var(--accent-primary)' }} />
            <Typography sx={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              You can find and manage this profile in the <strong style={{ color: 'var(--text-primary)' }}>Library</strong> page
            </Typography>
          </Box>

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: '12px' }}>
            <Button
              onClick={onDismiss}
              sx={{
                color: 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: 500,
                padding: '12px 24px',
                borderRadius: '12px',
                textTransform: 'none',
                backgroundColor: 'var(--hover-bg-light)',
                border: '1px solid var(--card-border)',
                '&:hover': {
                  backgroundColor: 'var(--hover-bg)',
                },
              }}
            >
              <AddIcon sx={{ fontSize: '18px', marginRight: '6px' }} />
              Create Another
            </Button>
            <Button
              onClick={onGoToLibrary}
              sx={{
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                padding: '12px 24px',
                borderRadius: '12px',
                textTransform: 'none',
                boxShadow: '0 4px 16px var(--accent-shadow)',
                '&:hover': {
                  background: 'linear-gradient(135deg, var(--accent-light) 0%, var(--accent-primary) 100%)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <FolderOpenIcon sx={{ fontSize: '18px', marginRight: '6px' }} />
              Go to Library
            </Button>
          </Box>
        </Box>
      </GlassCard>
    </Box>
  );
}

// Main Component
function ProfileBuilderPage({ onProfileCreated, onNavigateToLibrary }) {
  const [step, setStep] = useState('type'); // 'type', 'directory', 'editor', 'success'
  const [profileType, setProfileType] = useState(null);
  const [directory, setDirectory] = useState('');
  const [audioFiles, setAudioFiles] = useState([]);
  const [successProfile, setSuccessProfile] = useState(null);

  const handleTypeSelect = (type) => {
    setProfileType(type);
    setStep('directory');
  };

  const handleDirectorySelect = (dir, files) => {
    setDirectory(dir);
    setAudioFiles(files);
    setStep('editor');
  };

  const handleBack = () => {
    if (step === 'directory') {
      setStep('type');
      setProfileType(null);
    } else if (step === 'editor') {
      setStep('type');
      setProfileType(null);
      setDirectory('');
      setAudioFiles([]);
    }
  };

  const handleBuildSuccess = async (profileInfo) => {
    setSuccessProfile(profileInfo);
    setStep('success');
    // Refresh the profile lists in the parent component
    if (onProfileCreated) {
      await onProfileCreated();
    }
  };

  const handleSuccessDismiss = () => {
    // Reset everything
    setStep('type');
    setProfileType(null);
    setDirectory('');
    setAudioFiles([]);
    setSuccessProfile(null);
  };

  const handleGoToLibrary = () => {
    // Reset everything first
    handleSuccessDismiss();
    // Navigate to library
    if (onNavigateToLibrary) {
      onNavigateToLibrary();
    }
  };

  switch (step) {
    case 'type':
      return <TypeSelectionStep onSelect={handleTypeSelect} />;
    case 'directory':
      return (
        <DirectorySelectionStep
          profileType={profileType}
          onBack={handleBack}
          onSelect={handleDirectorySelect}
        />
      );
    case 'editor':
      return (
        <ProfileEditorStep
          profileType={profileType}
          directory={directory}
          audioFiles={audioFiles}
          onBack={handleBack}
          onSuccess={handleBuildSuccess}
        />
      );
    case 'success':
      return (
        <SuccessMessage
          profile={successProfile}
          onDismiss={handleSuccessDismiss}
          onGoToLibrary={handleGoToLibrary}
        />
      );
    default:
      return <TypeSelectionStep onSelect={handleTypeSelect} />;
  }
}

export default ProfileBuilderPage;
