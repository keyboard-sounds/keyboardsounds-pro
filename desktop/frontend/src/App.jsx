import { useState, useEffect, useRef, useCallback } from 'react';
import { Box } from '@mui/material';
import { TitleBar, Sidebar } from './components/layout';
import { AudioEffectsPage, ApplicationRulesPage, LibraryPage, SettingsPage, PlaceholderPage, CommunityPage, ProfileBuilderPage, HotkeysPage } from './pages';
import { defaultEqualizerBands } from './constants';
import { GetState, Enable, Disable, SetKeyboardVolume, SetMouseVolume, SetDefaultKeyboardProfile, SetDefaultMouseProfile, ClearDefaultKeyboardProfile, ClearDefaultMouseProfile, ToggleMuteKeyboard, ToggleMuteMouse, MuteKeyboard, UnmuteKeyboard, MuteMouse, UnmuteMouse } from '../wailsjs/go/app/StatusPanel';
import { ListRules, UpsertRule, RemoveRule, ToggleRule, UpdateRuleProfiles, BrowseForExecutable, GetNotifyOnMinimize, SetNotifyOnMinimize, GetNotifyOnUpdate, SetNotifyOnUpdate, GetStartPlayingOnLaunch, SetStartPlayingOnLaunch, GetStartHidden, SetStartHidden } from '../wailsjs/go/app/AppRules';
import { GetStartWithSystem, SetStartWithSystem } from '../wailsjs/go/main/App';
import { GetState as GetAudioEffectsState, SetKeyboardPitchShift, SetKeyboardPan, SetKeyboardEqualizer, SetMousePitchShift, SetMousePan, SetMouseEqualizer } from '../wailsjs/go/app/AudioEffects';
import { GetState as GetLibraryState, DeleteProfile, OpenProfileFolder, ImportProfile, ExportProfile } from '../wailsjs/go/app/Library';
import { EventsOn } from '../wailsjs/runtime/runtime';
import { AddRuleModal } from './components/rules';
import { initializeAnalytics } from './utils/analytics';
import './App.css';

// Convert null/undefined to "None" for UI display
const profileToDisplay = (profile) => profile ?? 'None';
// Convert "None" to null for backend
const displayToProfile = (display) => display === 'None' ? null : display;

function App() {
  // Navigation state
  const [selectedTab, setSelectedTab] = useState('Application Rules');
  const mainContentRef = useRef(null);

  // Scroll to top when changing pages
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [selectedTab]);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Playback state (isPaused = !enabled)
  const [isPaused, setIsPaused] = useState(true);
  const [keyboardVolume, setKeyboardVolume] = useState(100);
  const [mouseVolume, setMouseVolume] = useState(100);
  const [keyboardMuted, setKeyboardMuted] = useState(false);
  const [mouseMuted, setMouseMuted] = useState(false);
  const [volumesLocked, setVolumesLocked] = useState(true);
  
  // Profile state
  const [keyboardProfile, setKeyboardProfile] = useState('None');
  const [mouseProfile, setMouseProfile] = useState('None');
  
  // Available profiles from backend
  const [keyboardProfiles, setKeyboardProfiles] = useState([]);
  const [mouseProfiles, setMouseProfiles] = useState([]);

  // Library state (defined early so handlers can use loadLibraryState)
  const [librarySearchQuery, setLibrarySearchQuery] = useState('');
  const [libraryKeyboardProfiles, setLibraryKeyboardProfiles] = useState([]);
  const [libraryMouseProfiles, setLibraryMouseProfiles] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(true);

  // Load library state from backend
  const loadLibraryState = useCallback(async () => {
    try {
      setLibraryLoading(true);
      const state = await GetLibraryState();
      setLibraryKeyboardProfiles(state.keyboardProfiles || []);
      setLibraryMouseProfiles(state.mouseProfiles || []);
    } catch (error) {
      console.error('Failed to load library state:', error);
    } finally {
      setLibraryLoading(false);
    }
  }, []);

  // Load library state on mount
  useEffect(() => {
    loadLibraryState();
  }, [loadLibraryState]);
  
  // Function to load state from backend
  const loadState = useCallback(async () => {
    try {
      const state = await GetState();
      setIsPaused(!state.enabled);
      const kbVol = Math.round(state.keyboardVolume * 100);
      const msVol = Math.round(state.mouseVolume * 100);
      setKeyboardVolume(kbVol);
      setMouseVolume(msVol);
      // Update mute state based on volume (0 = muted)
      setKeyboardMuted(kbVol === 0);
      setMouseMuted(msVol === 0);
      setKeyboardProfile(profileToDisplay(state.keyboardProfile));
      setMouseProfile(profileToDisplay(state.mouseProfile));
      setKeyboardProfiles(state.keyboardProfiles || []);
      setMouseProfiles(state.mouseProfiles || []);
    } catch (error) {
      console.error('Failed to load status panel state:', error);
    }
  }, []);

  // Load initial state from backend
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        await loadState();
        
        // Load notify on minimize preference
        const notifyOnMinimizeValue = await GetNotifyOnMinimize();
        setNotifyOnMinimizeState(notifyOnMinimizeValue);
        
        // Load notify on update preference
        const notifyOnUpdateValue = await GetNotifyOnUpdate();
        setNotifyOnUpdateState(notifyOnUpdateValue);
        
        // Load start playing on launch preference
        const startPlayingOnLaunchValue = await GetStartPlayingOnLaunch();
        setStartPlayingOnLaunch(startPlayingOnLaunchValue);
        
        // Load start hidden preference
        const startHiddenValue = await GetStartHidden();
        setStartHidden(startHiddenValue);
        
        // Load start with system preference
        const startWithSystemValue = await GetStartWithSystem();
        setStartWithSystem(startWithSystemValue);
        
        // Initialize analytics tracking (sends ping if needed and schedules future pings)
        initializeAnalytics();
      } catch (error) {
        console.error('Failed to load initial state:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialState();
  }, [loadState]);

  // Listen for hotkey state changes and refresh UI
  useEffect(() => {
    const unsubscribe = EventsOn('hotkey-state-changed', () => {
      // Refresh state when hotkeys trigger changes
      loadState();
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [loadState]);

  // Load rules from backend
  const loadRules = useCallback(async () => {
    try {
      const rulesList = await ListRules();
      // Transform backend rules to frontend format
      const transformedRules = (rulesList || []).map((rule) => ({
        id: rule.appPath, // Use appPath as unique ID
        appPath: rule.appPath,
        executableName: rule.executableName,
        path: rule.appPath,
        keyboardProfile: profileToDisplay(rule.keyboardProfile),
        mouseProfile: profileToDisplay(rule.mouseProfile),
        enabled: rule.enabled,
      }));
      setRules(transformedRules);
    } catch (error) {
      console.error('Failed to load rules:', error);
    }
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);
  
  // Handle enable/disable toggle
  const handleSetIsPaused = useCallback(async (paused) => {
    try {
      if (paused) {
        await Disable();
      } else {
        await Enable();
      }
      setIsPaused(paused);
    } catch (error) {
      console.error('Failed to toggle enabled state:', error);
    }
  }, []);
  
  // Handle keyboard volume change
  const handleSetKeyboardVolume = useCallback(async (volume) => {
    setKeyboardVolume(volume);
    try {
      await SetKeyboardVolume(volume / 100);
    } catch (error) {
      console.error('Failed to set keyboard volume:', error);
    }
  }, []);
  
  // Handle mouse volume change
  const handleSetMouseVolume = useCallback(async (volume) => {
    setMouseVolume(volume);
    try {
      await SetMouseVolume(volume / 100);
    } catch (error) {
      console.error('Failed to set mouse volume:', error);
    }
  }, []);

  // Handle keyboard mute toggle
  const handleKeyboardMuteToggle = useCallback(async (newMutedState) => {
    try {
      if (newMutedState) {
        await MuteKeyboard();
      } else {
        await UnmuteKeyboard();
      }
      // Refresh state to get updated volume
      await loadState();
    } catch (error) {
      console.error('Failed to toggle keyboard mute:', error);
    }
  }, [loadState]);

  // Handle mouse mute toggle
  const handleMouseMuteToggle = useCallback(async (newMutedState) => {
    try {
      if (newMutedState) {
        await MuteMouse();
      } else {
        await UnmuteMouse();
      }
      // Refresh state to get updated volume
      await loadState();
    } catch (error) {
      console.error('Failed to toggle mouse mute:', error);
    }
  }, [loadState]);
  
  // Handle keyboard profile change
  const handleSetKeyboardProfile = useCallback(async (profile) => {
    setKeyboardProfile(profile);
    try {
      const backendProfile = displayToProfile(profile);
      if (backendProfile !== null) {
        await SetDefaultKeyboardProfile(backendProfile);
      } else {
        await ClearDefaultKeyboardProfile();
      }
      // Refresh library state to update inUse status
      await loadLibraryState();
    } catch (error) {
      console.error('Failed to set keyboard profile:', error);
    }
  }, [loadLibraryState]);
  
  // Handle mouse profile change
  const handleSetMouseProfile = useCallback(async (profile) => {
    setMouseProfile(profile);
    try {
      const backendProfile = displayToProfile(profile);
      if (backendProfile !== null) {
        await SetDefaultMouseProfile(backendProfile);
      } else {
        await ClearDefaultMouseProfile();
      }
      // Refresh library state to update inUse status
      await loadLibraryState();
    } catch (error) {
      console.error('Failed to set mouse profile:', error);
    }
  }, [loadLibraryState]);
  
  // Audio effects state - Keyboard
  const [audioInputMethod, setAudioInputMethod] = useState('keyboard');
  const [pitchShiftEnabled, setPitchShiftEnabledState] = useState(false);
  const [pitchRange, setPitchRangeState] = useState([-3, 3]);
  const [equalizerEnabled, setEqualizerEnabledState] = useState(false);
  const [equalizerBands, setEqualizerBandsState] = useState([...defaultEqualizerBands]);
  const [panEnabled, setPanEnabledState] = useState(false);
  const [panMode, setPanModeState] = useState('keyPosition');
  const [panKeyPositionKeys, setPanKeyPositionKeysState] = useState(14);
  
  // Audio effects state - Mouse
  const [pitchShiftEnabledMouse, setPitchShiftEnabledMouseState] = useState(false);
  const [pitchRangeMouse, setPitchRangeMouseState] = useState([-3, 3]);
  const [equalizerEnabledMouse, setEqualizerEnabledMouseState] = useState(false);
  const [equalizerBandsMouse, setEqualizerBandsMouseState] = useState([...defaultEqualizerBands]);
  const [panEnabledMouse, setPanEnabledMouseState] = useState(false);

  // Helper to convert backend equalizer config to frontend bands format
  const eqConfigToBands = (config) => [
    { freq: 60, gain: config.hz60 || 0 },
    { freq: 170, gain: config.hz170 || 0 },
    { freq: 310, gain: config.hz310 || 0 },
    { freq: 600, gain: config.hz600 || 0 },
    { freq: 1000, gain: config.hz1k || 0 },
    { freq: 3000, gain: config.hz3k || 0 },
    { freq: 6000, gain: config.hz6k || 0 },
    { freq: 12000, gain: config.hz12k || 0 },
    { freq: 14000, gain: config.hz14k || 0 },
    { freq: 16000, gain: config.hz16k || 0 },
  ];

  // Helper to convert frontend bands format to backend equalizer config
  const bandsToEqConfig = (bands) => ({
    hz60: bands[0]?.gain || 0,
    hz170: bands[1]?.gain || 0,
    hz310: bands[2]?.gain || 0,
    hz600: bands[3]?.gain || 0,
    hz1k: bands[4]?.gain || 0,
    hz3k: bands[5]?.gain || 0,
    hz6k: bands[6]?.gain || 0,
    hz12k: bands[7]?.gain || 0,
    hz14k: bands[8]?.gain || 0,
    hz16k: bands[9]?.gain || 0,
  });

  // Load audio effects state from backend
  useEffect(() => {
    const loadAudioEffectsState = async () => {
      try {
        const state = await GetAudioEffectsState();
        
        // Keyboard pitch shift
        setPitchShiftEnabledState(state.keyboardPitchShift.enabled);
        setPitchRangeState([state.keyboardPitchShift.lower || -3, state.keyboardPitchShift.upper || 3]);
        
        // Keyboard pan
        setPanEnabledState(state.keyboardPan.enabled);
        // Convert backend pan type to frontend format
        const panType = state.keyboardPan.panType === 'key-position' ? 'keyPosition' : 'random';
        setPanModeState(panType);
        setPanKeyPositionKeysState(state.keyboardPan.maxX || 14);
        
        // Keyboard equalizer
        setEqualizerEnabledState(state.keyboardEqualizer.enabled);
        if (state.keyboardEqualizer.config) {
          setEqualizerBandsState(eqConfigToBands(state.keyboardEqualizer.config));
        }
        
        // Mouse pitch shift
        setPitchShiftEnabledMouseState(state.mousePitchShift.enabled);
        setPitchRangeMouseState([state.mousePitchShift.lower || -3, state.mousePitchShift.upper || 3]);
        
        // Mouse pan
        setPanEnabledMouseState(state.mousePan.enabled);
        
        // Mouse equalizer
        setEqualizerEnabledMouseState(state.mouseEqualizer.enabled);
        if (state.mouseEqualizer.config) {
          setEqualizerBandsMouseState(eqConfigToBands(state.mouseEqualizer.config));
        }
      } catch (error) {
        console.error('Failed to load audio effects state:', error);
      }
    };
    loadAudioEffectsState();
  }, []);

  // Keyboard pitch shift handlers
  const setPitchShiftEnabled = useCallback(async (enabled) => {
    setPitchShiftEnabledState(enabled);
    try {
      await SetKeyboardPitchShift(enabled, pitchRange[0], pitchRange[1]);
    } catch (error) {
      console.error('Failed to set keyboard pitch shift:', error);
    }
  }, [pitchRange]);

  const setPitchRange = useCallback(async (range) => {
    setPitchRangeState(range);
    try {
      await SetKeyboardPitchShift(pitchShiftEnabled, range[0], range[1]);
    } catch (error) {
      console.error('Failed to set keyboard pitch range:', error);
    }
  }, [pitchShiftEnabled]);

  // Keyboard pan handlers
  const setPanEnabled = useCallback(async (enabled) => {
    setPanEnabledState(enabled);
    try {
      const backendPanType = panMode === 'keyPosition' ? 'key-position' : 'random';
      await SetKeyboardPan(enabled, backendPanType, panKeyPositionKeys);
    } catch (error) {
      console.error('Failed to set keyboard pan:', error);
    }
  }, [panMode, panKeyPositionKeys]);

  const setPanMode = useCallback(async (mode) => {
    setPanModeState(mode);
    try {
      const backendPanType = mode === 'keyPosition' ? 'key-position' : 'random';
      await SetKeyboardPan(panEnabled, backendPanType, panKeyPositionKeys);
    } catch (error) {
      console.error('Failed to set keyboard pan mode:', error);
    }
  }, [panEnabled, panKeyPositionKeys]);

  const setPanKeyPositionKeys = useCallback(async (keys) => {
    setPanKeyPositionKeysState(keys);
    try {
      const backendPanType = panMode === 'keyPosition' ? 'key-position' : 'random';
      await SetKeyboardPan(panEnabled, backendPanType, keys);
    } catch (error) {
      console.error('Failed to set keyboard pan keys:', error);
    }
  }, [panEnabled, panMode]);

  // Keyboard equalizer handlers
  const setEqualizerEnabled = useCallback(async (enabled) => {
    setEqualizerEnabledState(enabled);
    try {
      await SetKeyboardEqualizer(enabled, bandsToEqConfig(equalizerBands));
    } catch (error) {
      console.error('Failed to set keyboard equalizer:', error);
    }
  }, [equalizerBands]);

  const setEqualizerBands = useCallback(async (bands) => {
    setEqualizerBandsState(bands);
    try {
      await SetKeyboardEqualizer(equalizerEnabled, bandsToEqConfig(bands));
    } catch (error) {
      console.error('Failed to set keyboard equalizer bands:', error);
    }
  }, [equalizerEnabled]);

  // Mouse pitch shift handlers
  const setPitchShiftEnabledMouse = useCallback(async (enabled) => {
    setPitchShiftEnabledMouseState(enabled);
    try {
      await SetMousePitchShift(enabled, pitchRangeMouse[0], pitchRangeMouse[1]);
    } catch (error) {
      console.error('Failed to set mouse pitch shift:', error);
    }
  }, [pitchRangeMouse]);

  const setPitchRangeMouse = useCallback(async (range) => {
    setPitchRangeMouseState(range);
    try {
      await SetMousePitchShift(pitchShiftEnabledMouse, range[0], range[1]);
    } catch (error) {
      console.error('Failed to set mouse pitch range:', error);
    }
  }, [pitchShiftEnabledMouse]);

  // Mouse pan handler
  const setPanEnabledMouse = useCallback(async (enabled) => {
    setPanEnabledMouseState(enabled);
    try {
      await SetMousePan(enabled);
    } catch (error) {
      console.error('Failed to set mouse pan:', error);
    }
  }, []);

  // Mouse equalizer handlers
  const setEqualizerEnabledMouse = useCallback(async (enabled) => {
    setEqualizerEnabledMouseState(enabled);
    try {
      await SetMouseEqualizer(enabled, bandsToEqConfig(equalizerBandsMouse));
    } catch (error) {
      console.error('Failed to set mouse equalizer:', error);
    }
  }, [equalizerBandsMouse]);

  const setEqualizerBandsMouse = useCallback(async (bands) => {
    setEqualizerBandsMouseState(bands);
    try {
      await SetMouseEqualizer(equalizerEnabledMouse, bandsToEqConfig(bands));
    } catch (error) {
      console.error('Failed to set mouse equalizer bands:', error);
    }
  }, [equalizerEnabledMouse]);
  
  // Application rules state
  const [rules, setRules] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);
  
  // Settings state
  const [audioDevice, setAudioDevice] = useState('default');
  const [startWithSystem, setStartWithSystem] = useState(false);
  const [startPlayingOnLaunch, setStartPlayingOnLaunch] = useState(false);
  const [startHidden, setStartHidden] = useState(false);
  const [notifyOnMinimize, setNotifyOnMinimizeState] = useState(true);
  const [notifyOnUpdate, setNotifyOnUpdateState] = useState(true);

  // Handlers for rules
  const handleAddRule = () => {
    setIsAddRuleModalOpen(true);
  };

  const handleAddRuleSubmit = useCallback(async (ruleData) => {
    try {
      await UpsertRule(
        ruleData.appPath,
        ruleData.keyboardProfile,
        ruleData.mouseProfile,
        ruleData.enabled
      );
      await loadRules();
      // Refresh library state to update inUse status
      await loadLibraryState();
    } catch (error) {
      console.error('Failed to add rule:', error);
    }
  }, [loadRules, loadLibraryState]);

  const handleRemoveRule = useCallback(async (id) => {
    try {
      await RemoveRule(id); // id is the appPath
      await loadRules();
      // Refresh library state to update inUse status
      await loadLibraryState();
    } catch (error) {
      console.error('Failed to remove rule:', error);
    }
  }, [loadRules, loadLibraryState]);

  const handleRuleProfileChange = useCallback(async (id, profileType, newValue) => {
    // Optimistic update for UI
    setRules(prevRules => prevRules.map(rule => 
      rule.id === id ? { ...rule, [profileType]: newValue } : rule
    ));
    
    // Find the current rule to get both profiles
    const currentRule = rules.find(r => r.id === id);
    if (!currentRule) return;
    
    const keyboardProfile = profileType === 'keyboardProfile' 
      ? displayToProfile(newValue) 
      : displayToProfile(currentRule.keyboardProfile);
    const mouseProfile = profileType === 'mouseProfile' 
      ? displayToProfile(newValue) 
      : displayToProfile(currentRule.mouseProfile);
    
    try {
      await UpdateRuleProfiles(id, keyboardProfile, mouseProfile);
      // Refresh library state to update inUse status
      await loadLibraryState();
    } catch (error) {
      console.error('Failed to update rule profile:', error);
      // Reload rules to revert optimistic update on error
      await loadRules();
    }
  }, [rules, loadRules, loadLibraryState]);

  const handleRuleToggle = useCallback(async (id) => {
    // Optimistic update for UI
    setRules(prevRules => prevRules.map(rule => 
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ));
    
    try {
      await ToggleRule(id);
    } catch (error) {
      console.error('Failed to toggle rule:', error);
      // Reload rules to revert optimistic update on error
      await loadRules();
    }
  }, [loadRules]);

  // Handler for default profile changes (synced with StatusPanel)
  const handleUnknownApplicationsDefaultChange = useCallback(async (profileType, newValue) => {
    try {
      const backendValue = displayToProfile(newValue);
      if (profileType === 'keyboardProfile') {
        if (backendValue !== null) {
          await SetDefaultKeyboardProfile(backendValue);
        } else {
          await ClearDefaultKeyboardProfile();
        }
        setKeyboardProfile(newValue);
      } else if (profileType === 'mouseProfile') {
        if (backendValue !== null) {
          await SetDefaultMouseProfile(backendValue);
        } else {
          await ClearDefaultMouseProfile();
        }
        setMouseProfile(newValue);
      }
      // Refresh library state to update inUse status
      await loadLibraryState();
    } catch (error) {
      console.error('Failed to update default profile:', error);
    }
  }, [loadLibraryState]);

  const handleBrowseForExecutable = useCallback(async () => {
    try {
      return await BrowseForExecutable();
    } catch (error) {
      console.error('Failed to browse for executable:', error);
      return '';
    }
  }, []);

  // Refresh all profile lists (called after creating a new profile or changing defaults)
  const refreshProfiles = useCallback(async () => {
    try {
      // Refresh status panel profiles
      const statusState = await GetState();
      setKeyboardProfiles(statusState.keyboardProfiles || []);
      setMouseProfiles(statusState.mouseProfiles || []);
      
      // Refresh library profiles
      const libraryState = await GetLibraryState();
      setLibraryKeyboardProfiles(libraryState.keyboardProfiles || []);
      setLibraryMouseProfiles(libraryState.mouseProfiles || []);
    } catch (error) {
      console.error('Failed to refresh profiles:', error);
    }
  }, []);

  // Handler for removing library profiles
  const handleImportProfile = useCallback(async () => {
    await ImportProfile();
    // Refresh library state after successful import
    await loadLibraryState();
    // Also refresh the main profile lists
    await refreshProfiles();
  }, [loadLibraryState, refreshProfiles]);

  const handleExportProfile = useCallback(async (profileId) => {
    await ExportProfile(profileId);
    // You might want to show a success message to the user here
  }, []);

  const handleRemoveProfile = useCallback(async (profileName) => {
    try {
      await DeleteProfile(profileName);
      // Remove the profile from local state (no refetch needed)
      setLibraryKeyboardProfiles(prev => prev.filter(p => p.id !== profileName));
      setLibraryMouseProfiles(prev => prev.filter(p => p.id !== profileName));
      // Also update status panel profile lists
      setKeyboardProfiles(prev => prev.filter(p => p !== profileName));
      setMouseProfiles(prev => prev.filter(p => p !== profileName));
    } catch (error) {
      console.error('Failed to remove profile:', error);
      throw error; // Re-throw so the modal can handle it
    }
  }, []);

  // Render the current page based on selected tab
  const renderPage = () => {
    switch (selectedTab) {
      case 'Audio Effects':
        return (
          <AudioEffectsPage
            audioInputMethod={audioInputMethod}
            setAudioInputMethod={setAudioInputMethod}
            pitchShiftEnabled={pitchShiftEnabled}
            setPitchShiftEnabled={setPitchShiftEnabled}
            pitchRange={pitchRange}
            setPitchRange={setPitchRange}
            equalizerEnabled={equalizerEnabled}
            setEqualizerEnabled={setEqualizerEnabled}
            equalizerBands={equalizerBands}
            setEqualizerBands={setEqualizerBands}
            pitchShiftEnabledMouse={pitchShiftEnabledMouse}
            setPitchShiftEnabledMouse={setPitchShiftEnabledMouse}
            pitchRangeMouse={pitchRangeMouse}
            setPitchRangeMouse={setPitchRangeMouse}
            equalizerEnabledMouse={equalizerEnabledMouse}
            setEqualizerEnabledMouse={setEqualizerEnabledMouse}
            equalizerBandsMouse={equalizerBandsMouse}
            setEqualizerBandsMouse={setEqualizerBandsMouse}
            panEnabled={panEnabled}
            setPanEnabled={setPanEnabled}
            panMode={panMode}
            setPanMode={setPanMode}
            panKeyPositionKeys={panKeyPositionKeys}
            setPanKeyPositionKeys={setPanKeyPositionKeys}
            panEnabledMouse={panEnabledMouse}
            setPanEnabledMouse={setPanEnabledMouse}
          />
        );
      case 'Application Rules':
        return (
          <>
            <ApplicationRulesPage
              rules={rules}
              onAddRule={handleAddRule}
              onRemoveRule={handleRemoveRule}
              onRuleProfileChange={handleRuleProfileChange}
              onRuleToggle={handleRuleToggle}
              unknownApplicationsDefault={{
                keyboardProfile: keyboardProfile,
                mouseProfile: mouseProfile,
              }}
              onUnknownApplicationsDefaultChange={handleUnknownApplicationsDefaultChange}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              keyboardProfiles={keyboardProfiles}
              mouseProfiles={mouseProfiles}
            />
            <AddRuleModal
              open={isAddRuleModalOpen}
              onClose={() => setIsAddRuleModalOpen(false)}
              onSubmit={handleAddRuleSubmit}
              onBrowse={handleBrowseForExecutable}
              keyboardProfiles={keyboardProfiles}
              mouseProfiles={mouseProfiles}
            />
          </>
        );
      case 'Library':
        return (
          <LibraryPage
            keyboardProfiles={libraryKeyboardProfiles}
            mouseProfiles={libraryMouseProfiles}
            defaultKeyboardProfile={keyboardProfile === 'None' ? null : keyboardProfile}
            defaultMouseProfile={mouseProfile === 'None' ? null : mouseProfile}
            searchQuery={librarySearchQuery}
            setSearchQuery={setLibrarySearchQuery}
            onRemoveProfile={handleRemoveProfile}
            onOpenProfileFolder={(profileId) => OpenProfileFolder(profileId).catch(err => console.error('Failed to open folder:', err))}
            onImportProfile={handleImportProfile}
            onExportProfile={handleExportProfile}
            isLoading={libraryLoading}
            onNavigateToProfileBuilder={() => setSelectedTab('Profile Builder')}
          />
        );
      case 'Settings':
        return (
          <SettingsPage
            audioDevice={audioDevice}
            setAudioDevice={setAudioDevice}
            startWithSystem={startWithSystem}
            setStartWithSystem={async (value) => {
              setStartWithSystem(value);
              try {
                await SetStartWithSystem(value);
              } catch (error) {
                console.error('Failed to set start with system preference:', error);
              }
            }}
            startPlayingOnLaunch={startPlayingOnLaunch}
            setStartPlayingOnLaunch={async (value) => {
              setStartPlayingOnLaunch(value);
              try {
                await SetStartPlayingOnLaunch(value);
              } catch (error) {
                console.error('Failed to set start playing on launch preference:', error);
              }
            }}
            startHidden={startHidden}
            setStartHidden={async (value) => {
              setStartHidden(value);
              try {
                await SetStartHidden(value);
              } catch (error) {
                console.error('Failed to set start hidden preference:', error);
              }
            }}
            notifyOnMinimize={notifyOnMinimize}
            setNotifyOnMinimize={async (value) => {
              setNotifyOnMinimizeState(value);
              try {
                await SetNotifyOnMinimize(value);
              } catch (error) {
                console.error('Failed to set notify on minimize preference:', error);
              }
            }}
            notifyOnUpdate={notifyOnUpdate}
            setNotifyOnUpdate={async (value) => {
              setNotifyOnUpdateState(value);
              try {
                await SetNotifyOnUpdate(value);
              } catch (error) {
                console.error('Failed to set notify on update preference:', error);
              }
            }}
          />
        );
      case 'Community':
        return <CommunityPage />;
      case 'Hotkeys':
        return <HotkeysPage />;
      case 'Profile Builder':
        return (
          <ProfileBuilderPage
            onProfileCreated={refreshProfiles}
            onNavigateToLibrary={() => setSelectedTab('Library')}
          />
        );
      default:
        return <PlaceholderPage title={selectedTab} />;
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Custom Title Bar */}
      <TitleBar />

      {/* Sidebar */}
      <Sidebar
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
        isPaused={isPaused}
        setIsPaused={handleSetIsPaused}
        keyboardVolume={keyboardVolume}
        setKeyboardVolume={handleSetKeyboardVolume}
        mouseVolume={mouseVolume}
        setMouseVolume={handleSetMouseVolume}
        keyboardMuted={keyboardMuted}
        setKeyboardMuted={setKeyboardMuted}
        onKeyboardMuteToggle={handleKeyboardMuteToggle}
        mouseMuted={mouseMuted}
        setMouseMuted={setMouseMuted}
        onMouseMuteToggle={handleMouseMuteToggle}
        volumesLocked={volumesLocked}
        setVolumesLocked={setVolumesLocked}
        keyboardProfile={keyboardProfile}
        setKeyboardProfile={handleSetKeyboardProfile}
        mouseProfile={mouseProfile}
        setMouseProfile={handleSetMouseProfile}
        keyboardProfiles={keyboardProfiles}
        mouseProfiles={mouseProfiles}
        isLoading={isLoading}
      />

      {/* Main Content Area */}
      <Box
        ref={mainContentRef}
        component="main"
        sx={{
          flexGrow: 1,
          background: 'var(--bg-gradient)',
          marginTop: '40px',
          height: 'calc(100vh - 40px)',
          overflow: 'auto',
          padding: '32px 40px',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '300px',
            background: 'var(--bg-gradient-subtle)',
            pointerEvents: 'none',
          },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {renderPage()}
        </Box>
      </Box>
    </Box>
  );
}

export default App;
