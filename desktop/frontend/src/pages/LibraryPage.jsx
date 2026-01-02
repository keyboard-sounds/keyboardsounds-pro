import { useState } from 'react';
import { Box, Typography, TextField, InputAdornment, IconButton, Chip, Tooltip, Button, ToggleButtonGroup, ToggleButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MouseIcon from '@mui/icons-material/Mouse';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import LinkIcon from '@mui/icons-material/Link';
import SortIcon from '@mui/icons-material/Sort';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import IosShareIcon from '@mui/icons-material/IosShare';
import ShopTwoIcon from '@mui/icons-material/ShopTwo';
import AddIcon from '@mui/icons-material/Add';
import { Card, CardContent } from '@mui/material';
import { PageHeader } from '../components/common';
import { glassCardStyle } from '../constants';

function ErrorDialog({ open, onClose, errorMessage }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          backgroundColor: 'var(--card-bg)',
          backdropFilter: 'blur(25px)',
          borderRadius: '16px',
          border: '1px solid var(--card-border)',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
          minWidth: '400px',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '24px 24px 16px',
          color: 'var(--text-primary)',
          fontSize: '18px',
          fontWeight: 600,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <ErrorOutlineIcon sx={{ fontSize: '22px', color: 'var(--danger)' }} />
        </Box>
        Error
      </DialogTitle>
      <DialogContent sx={{ padding: '0 24px 24px' }}>
        <Typography
          sx={{
            color: 'var(--text-secondary)',
            fontSize: '14px',
            lineHeight: 1.6,
          }}
        >
          {errorMessage}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ padding: '0 24px 24px', gap: '12px' }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            backgroundColor: 'var(--accent-primary)',
            color: 'white',
            borderRadius: '10px',
            padding: '8px 20px',
            fontSize: '14px',
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: '0 4px 12px var(--accent-shadow)',
            '&:hover': {
              backgroundColor: 'var(--accent-secondary)',
            },
          }}
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DeleteConfirmModal({ open, onClose, onConfirm, profileName, isDeleting }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          backgroundColor: 'var(--card-bg)',
          backdropFilter: 'blur(25px)',
          borderRadius: '16px',
          border: '1px solid var(--card-border)',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
          minWidth: '400px',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '24px 24px 16px',
          color: 'var(--text-primary)',
          fontSize: '18px',
          fontWeight: 600,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <WarningAmberIcon sx={{ fontSize: '22px', color: 'var(--danger)' }} />
        </Box>
        Delete Profile
      </DialogTitle>
      <DialogContent sx={{ padding: '0 24px 24px' }}>
        <Typography
          sx={{
            color: 'var(--text-secondary)',
            fontSize: '14px',
            lineHeight: 1.6,
          }}
        >
          Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{profileName}</strong>? 
          This will permanently remove the profile and all its sound files from your library.
        </Typography>
        <Box
          sx={{
            marginTop: '16px',
            padding: '12px 16px',
            borderRadius: '10px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <Typography
            sx={{
              color: 'var(--danger)',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            This action cannot be undone.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ padding: '0 24px 24px', gap: '12px' }}>
        <Button
          onClick={onClose}
          disabled={isDeleting}
          sx={{
            color: 'var(--text-secondary)',
            borderRadius: '10px',
            padding: '8px 20px',
            fontSize: '14px',
            fontWeight: 500,
            textTransform: 'none',
            '&:hover': {
              backgroundColor: 'var(--hover-bg-light)',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isDeleting}
          variant="contained"
          sx={{
            backgroundColor: 'var(--danger)',
            color: 'white',
            borderRadius: '10px',
            padding: '8px 20px',
            fontSize: '14px',
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
            '&:hover': {
              backgroundColor: '#dc2626',
            },
            '&.Mui-disabled': {
              backgroundColor: 'var(--danger)',
              opacity: 0.6,
            },
          }}
        >
          {isDeleting ? 'Deleting...' : 'Delete Profile'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ProfileCard({ profile, isDefault, onRemove, onOpenFolder, onExport, isExiting }) {
  const isKeyboard = profile.type === 'keyboard';
  const TypeIcon = isKeyboard ? KeyboardIcon : MouseIcon;
  const canDelete = !profile.inUse;

  return (
    <Card
      sx={{
        ...glassCardStyle,
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: isExiting ? 'none' : 'translateY(-2px)',
          boxShadow: 'var(--card-shadow), inset 0 1px 0 var(--card-highlight), 0 0 0 1px var(--card-border)',
        },
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        ...(isDefault && !isExiting && {
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, var(--card-bg) 50%)',
          boxShadow: '0 8px 32px var(--accent-shadow), inset 0 1px 0 var(--card-highlight), 0 0 0 2px var(--accent-primary)',
        }),
        // Exit animation styles
        ...(isExiting && {
          opacity: 0,
          transform: 'translateX(50px) scale(0.95)',
          maxHeight: '0px',
          marginBottom: '-12px',
          padding: 0,
          border: 'none',
          boxShadow: 'none',
        }),
      }}
    >
      <CardContent sx={{ padding: '24px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
          {/* Left side - Icon */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: '16px',
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
                fontSize: '28px',
                color: isKeyboard ? '#818cf8' : '#f472b6',
              }}
            />
          </Box>

          {/* Middle - Profile info */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            {/* Title row with badges */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <Typography
                variant="h6"
                sx={{
                  color: 'var(--text-primary)',
                  fontSize: '17px',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                }}
              >
                {profile.name}
              </Typography>
              {isDefault && (
                <Chip
                  icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                  label="Default"
                  size="small"
                  sx={{
                    backgroundColor: 'var(--accent-bg)',
                    color: 'var(--accent-primary)',
                    border: '1px solid var(--accent-border)',
                    fontSize: '11px',
                    fontWeight: 600,
                    height: '24px',
                    '& .MuiChip-icon': {
                      color: 'var(--accent-primary)',
                    },
                  }}
                />
              )}
              {profile.inUse && !isDefault && (
                <Chip
                  icon={<LinkIcon sx={{ fontSize: '12px !important' }} />}
                  label="In Use"
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    color: '#818cf8',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    fontSize: '10px',
                    fontWeight: 500,
                    height: '22px',
                    '& .MuiChip-icon': {
                      color: '#818cf8',
                    },
                  }}
                />
              )}
            </Box>

            {/* Description */}
            <Typography
              sx={{
                color: 'var(--text-secondary)',
                fontSize: '13px',
                lineHeight: 1.6,
                marginBottom: '12px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {profile.description || 'No description available'}
            </Typography>

            {/* Meta row */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PersonIcon sx={{ fontSize: '14px', color: 'var(--text-muted)' }} />
                <Typography
                  sx={{
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                  }}
                >
                  {profile.author || 'Unknown'}
                </Typography>
              </Box>
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
          </Box>

          {/* Right side - Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <Tooltip title="Export & Share" arrow placement="top">
              <IconButton
                onClick={() => handleExport(profile.id)}
                sx={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--hover-bg-light)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--text-tertiary)',
                  '&:hover': {
                    backgroundColor: 'var(--accent-bg)',
                    borderColor: 'var(--accent-border)',
                    color: 'var(--accent-primary)',
                  },
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <IosShareIcon sx={{ fontSize: '18px' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Open folder" arrow placement="top">
              <IconButton
                onClick={() => onOpenFolder && onOpenFolder(profile.id)}
                sx={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--hover-bg-light)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--text-tertiary)',
                  '&:hover': {
                    backgroundColor: 'var(--accent-bg)',
                    borderColor: 'var(--accent-border)',
                    color: 'var(--accent-primary)',
                  },
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <FolderOpenIcon sx={{ fontSize: '18px' }} />
              </IconButton>
            </Tooltip>
            <Tooltip
              title={!canDelete ? profile.inUseReason : "Remove profile"}
              arrow
              placement="top"
            >
              <span>
                <IconButton
                  onClick={() => canDelete && onRemove()}
                  disabled={!canDelete}
                  sx={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: !canDelete
                      ? 'var(--hover-bg-light)'
                      : 'var(--danger-bg)',
                    border: !canDelete
                      ? '1px solid var(--input-border)'
                      : '1px solid rgba(239, 68, 68, 0.3)',
                    color: !canDelete
                      ? 'var(--text-muted)'
                      : 'var(--danger)',
                    '&:hover': {
                      backgroundColor: !canDelete
                        ? 'var(--hover-bg-light)'
                        : 'rgba(239, 68, 68, 0.25)',
                      color: !canDelete
                        ? 'var(--text-muted)'
                        : '#ef4444',
                    },
                    '&.Mui-disabled': {
                      color: 'var(--text-muted)',
                    },
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: '18px' }} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function StatCard({ icon: Icon, count, label, color, gradient }) {
  return (
    <Box
      sx={{
        ...glassCardStyle,
        padding: '20px 28px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flex: 1,
        background: gradient,
        position: 'relative',
        overflow: 'hidden',
        '&::after': {
          content: '""',
          position: 'absolute',
          right: '-20px',
          bottom: '-20px',
          width: '100px',
          height: '100px',
          background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
          pointerEvents: 'none',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          backgroundColor: `${color}20`,
          border: `1px solid ${color}30`,
        }}
      >
        <Icon sx={{ fontSize: '26px', color }} />
      </Box>
      <Box>
        <Typography sx={{ color: 'var(--text-primary)', fontSize: '28px', fontWeight: 700, lineHeight: 1 }}>
          {count}
        </Typography>
        <Typography sx={{ color: 'var(--text-tertiary)', fontSize: '13px', marginTop: '4px' }}>
          {label}
        </Typography>
      </Box>
    </Box>
  );
}

function LibraryPage({
  keyboardProfiles,
  mouseProfiles,
  defaultKeyboardProfile,
  defaultMouseProfile,
  searchQuery,
  setSearchQuery,
  onRemoveProfile,
  onOpenProfileFolder,
  onImportProfile,
  onExportProfile,
  isLoading,
  onNavigateToProfileBuilder,
}) {
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exitingProfileId, setExitingProfileId] = useState(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle delete request - show confirmation modal
  const handleDeleteRequest = (profile) => {
    setProfileToDelete(profile);
    setDeleteModalOpen(true);
  };

  // Handle confirmed delete
  const handleConfirmDelete = async () => {
    if (!profileToDelete) return;
    
    setIsDeleting(true);
    
    // Close modal and start exit animation
    setDeleteModalOpen(false);
    setExitingProfileId(profileToDelete.id);
    
    // Wait for animation to complete, then delete
    setTimeout(async () => {
      try {
        await onRemoveProfile(profileToDelete.id);
      } catch (error) {
        console.error('Failed to delete profile:', error);
        // If delete fails, stop the exit animation
        setExitingProfileId(null);
      } finally {
        setIsDeleting(false);
        setProfileToDelete(null);
        setExitingProfileId(null);
      }
    }, 350); // Match the CSS transition duration
  };

  // Handle cancel delete
  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setProfileToDelete(null);
  };

  // Handle import with error dialog
  const handleImport = async () => {
    try {
      await onImportProfile();
    } catch (error) {
      console.error('Failed to import profile:', error);
      const message = error?.message || error?.toString() || 'Failed to import profile. Please try again.';
      setErrorMessage(message);
      setErrorDialogOpen(true);
    }
  };

  // Handle export with error dialog
  const handleExport = async (profileId) => {
    try {
      await onExportProfile(profileId);
    } catch (error) {
      console.error('Failed to export profile:', error);
      const message = error?.message || error?.toString() || 'Failed to export profile. Please try again.';
      setErrorMessage(message);
      setErrorDialogOpen(true);
    }
  };

  // Handle close error dialog
  const handleCloseErrorDialog = () => {
    setErrorDialogOpen(false);
    setErrorMessage('');
  };

  // Combine and filter profiles
  const allProfiles = [
    ...keyboardProfiles.map(p => ({ ...p, type: 'keyboard' })),
    ...mouseProfiles.map(p => ({ ...p, type: 'mouse' })),
  ];

  // Apply type filter
  let filteredProfiles = typeFilter === 'all' 
    ? allProfiles 
    : allProfiles.filter(p => p.type === typeFilter);

  // Apply search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredProfiles = filteredProfiles.filter((profile) =>
      profile.name.toLowerCase().includes(query) ||
      (profile.description && profile.description.toLowerCase().includes(query)) ||
      (profile.author && profile.author.toLowerCase().includes(query))
    );
  }

  // Apply sort
  filteredProfiles = [...filteredProfiles].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'author':
        return (a.author || '').localeCompare(b.author || '');
      case 'type':
        return a.type.localeCompare(b.type);
      default:
        return 0;
    }
  });

  const isDefaultProfile = (profile) => {
    if (profile.type === 'keyboard') {
      return profile.name === defaultKeyboardProfile;
    }
    return profile.name === defaultMouseProfile;
  };

  // Get counts for badges
  const keyboardCount = keyboardProfiles.length;
  const mouseCount = mouseProfiles.length;
  const totalCount = keyboardCount + mouseCount;

  if (isLoading) {
    return (
      <Box>
        <PageHeader title="Library" />
        <Box
          sx={{
            ...glassCardStyle,
            padding: '80px 48px',
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: '48px',
              height: '48px',
              margin: '0 auto 16px',
              borderRadius: '50%',
              border: '3px solid var(--accent-primary)',
              borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          />
          <Typography
            sx={{
              color: 'var(--text-tertiary)',
              fontSize: '15px',
            }}
          >
            Loading your profiles...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="Library">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <TextField
            placeholder="Search profiles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'var(--text-tertiary)', fontSize: '18px' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: '280px',
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'var(--input-bg)',
                backdropFilter: 'blur(10px)',
                color: 'var(--text-primary)',
                borderRadius: '10px',
                fontSize: '14px',
                '& fieldset': {
                  borderColor: 'var(--input-border)',
                },
                '&:hover fieldset': {
                  borderColor: 'var(--input-border-hover)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'var(--accent-border)',
                },
                '& input': {
                  color: 'var(--text-primary)',
                  '&::placeholder': {
                    color: 'var(--text-muted)',
                    opacity: 1,
                  },
                },
              },
            }}
          />
          <Tooltip title="Create Profile" arrow placement="top">
            <IconButton
              onClick={() => onNavigateToProfileBuilder && onNavigateToProfileBuilder()}
              sx={{
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                color: 'white',
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px var(--accent-shadow)',
                '&:hover': {
                  background: 'linear-gradient(135deg, var(--accent-secondary) 0%, var(--accent-light) 100%)',
                  boxShadow: '0 6px 16px var(--accent-shadow)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Import Profile" arrow placement="top">
            <IconButton
              onClick={handleImport}
              sx={{
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                color: 'white',
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px var(--accent-shadow)',
                '&:hover': {
                  background: 'linear-gradient(135deg, var(--accent-secondary) 0%, var(--accent-light) 100%)',
                  boxShadow: '0 6px 16px var(--accent-shadow)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <FileOpenIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </PageHeader>

      {/* Stats Summary */}
      <Box
        sx={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <StatCard
          icon={KeyboardIcon}
          count={keyboardCount}
          label="Keyboard Profiles"
          color="#818cf8"
          gradient="linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, var(--card-bg) 100%)"
        />
        <StatCard
          icon={MouseIcon}
          count={mouseCount}
          label="Mouse Profiles"
          color="#f472b6"
          gradient="linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, var(--card-bg) 100%)"
        />
      </Box>

      {/* Empty State - No profiles at all */}
      {totalCount === 0 ? (
        <Box
          sx={{
            ...glassCardStyle,
            padding: '60px 48px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, var(--card-bg) 50%, rgba(99, 102, 241, 0.05) 100%)',
          }}
        >
          <Box
            sx={{
              width: '80px',
              height: '80px',
              margin: '0 auto 24px',
              borderRadius: '20px',
              backgroundColor: 'var(--accent-bg)',
              border: '1px solid var(--accent-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShopTwoIcon sx={{ fontSize: '40px', color: 'var(--accent-primary)' }} />
          </Box>
          <Typography
            sx={{
              color: 'var(--text-primary)',
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: '8px',
            }}
          >
            Your library is empty
          </Typography>
          <Typography
            sx={{
              color: 'var(--text-secondary)',
              fontSize: '14px',
              marginBottom: '24px',
              maxWidth: '400px',
              margin: '0 auto 24px',
            }}
          >
            Get started by creating your own sound profiles using the Profile Builder.
          </Typography>
        </Box>
      ) : (
        <>
          {/* Filters and Sort Bar */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            {/* Type filter */}
            <ToggleButtonGroup
              value={typeFilter}
              exclusive
              onChange={(e, value) => value && setTypeFilter(value)}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  color: 'var(--text-tertiary)',
                  borderColor: 'var(--input-border)',
                  fontSize: '13px',
                  padding: '6px 16px',
                  textTransform: 'none',
                  '&.Mui-selected': {
                    backgroundColor: 'var(--accent-bg)',
                    color: 'var(--accent-primary)',
                    borderColor: 'var(--accent-border)',
                    '&:hover': {
                      backgroundColor: 'var(--accent-bg-hover)',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'var(--hover-bg-light)',
                  },
                },
              }}
            >
              <ToggleButton value="all">
                All ({totalCount})
              </ToggleButton>
              <ToggleButton value="keyboard">
                <KeyboardIcon sx={{ fontSize: '16px', marginRight: '6px' }} />
                Keyboard ({keyboardCount})
              </ToggleButton>
              <ToggleButton value="mouse">
                <MouseIcon sx={{ fontSize: '16px', marginRight: '6px' }} />
                Mouse ({mouseCount})
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Sort dropdown */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SortIcon sx={{ fontSize: '18px', color: 'var(--text-muted)' }} />
              <Typography sx={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                Sort:
              </Typography>
              <ToggleButtonGroup
                value={sortBy}
                exclusive
                onChange={(e, value) => value && setSortBy(value)}
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    color: 'var(--text-tertiary)',
                    borderColor: 'var(--input-border)',
                    fontSize: '12px',
                    padding: '4px 12px',
                    textTransform: 'none',
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(99, 102, 241, 0.2)',
                      color: '#818cf8',
                      borderColor: 'rgba(99, 102, 241, 0.4)',
                      '&:hover': {
                        backgroundColor: 'rgba(99, 102, 241, 0.3)',
                      },
                    },
                    '&:hover': {
                      backgroundColor: 'var(--hover-bg-light)',
                    },
                  },
                }}
              >
                <ToggleButton value="name">Name</ToggleButton>
                <ToggleButton value="author">Author</ToggleButton>
                <ToggleButton value="type">Type</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>

          {/* Profile List */}
          {filteredProfiles.length === 0 ? (
            <Box
              sx={{
                ...glassCardStyle,
                padding: '48px',
                textAlign: 'center',
              }}
            >
              <SearchIcon sx={{ fontSize: '48px', color: 'var(--text-muted)', marginBottom: '16px' }} />
              <Typography
                sx={{
                  color: 'var(--text-tertiary)',
                  fontSize: '15px',
                }}
              >
                No profiles found matching "{searchQuery}"
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredProfiles.map((profile) => (
                <ProfileCard
                  key={`${profile.type}-${profile.id}`}
                  profile={profile}
                  isDefault={isDefaultProfile(profile)}
                  onRemove={() => handleDeleteRequest(profile)}
                  onOpenFolder={onOpenProfileFolder}
                  onExport={onExportProfile}
                  isExiting={exitingProfileId === profile.id}
                />
              ))}
            </Box>
          )}

        </>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={deleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        profileName={profileToDelete?.name || ''}
        isDeleting={isDeleting}
      />

      {/* Error Dialog */}
      <ErrorDialog
        open={errorDialogOpen}
        onClose={handleCloseErrorDialog}
        errorMessage={errorMessage}
      />
    </Box>
  );
}

export default LibraryPage;
