import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Divider,
  Fade,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { TitleBar, Sidebar } from "./components/layout";
import {
  AudioEffectsPage,
  ApplicationRulesPage,
  LibraryPage,
  SettingsPage,
  PlaceholderPage,
  CommunityPage,
  ProfileBuilderPage,
  HotkeysPage,
  OSKHelperPage,
} from "./pages";
import { defaultEqualizerBands } from "./constants";
import {
  GetState,
  Enable,
  Disable,
  SetKeyboardVolume,
  SetMouseVolume,
  SetDefaultKeyboardProfile,
  SetDefaultMouseProfile,
  ClearDefaultKeyboardProfile,
  ClearDefaultMouseProfile,
  ToggleMuteKeyboard,
  ToggleMuteMouse,
  MuteKeyboard,
  UnmuteKeyboard,
  MuteMouse,
  UnmuteMouse,
} from "../wailsjs/go/app/StatusPanel";
import {
  ListRules,
  UpsertRule,
  RemoveRule,
  ToggleRule,
  UpdateRuleProfiles,
  BrowseForExecutable,
  GetNotifyOnMinimize,
  SetNotifyOnMinimize,
  GetNotifyOnUpdate,
  SetNotifyOnUpdate,
  GetStartPlayingOnLaunch,
  SetStartPlayingOnLaunch,
  GetStartHidden,
  SetStartHidden,
  GetSystemTrayEnabled,
  SetSystemTrayEnabled,
  GetCustomTitleBarEnabled,
  SetCustomTitleBarEnabled,
  GetHideStatusBoxDefaultProfile,
  SetHideStatusBoxDefaultProfile,
} from "../wailsjs/go/app/AppRules";
import { IsFedora } from "../wailsjs/go/app/FedoraCheck";
import {
  GetStartWithSystem,
  SetStartWithSystem,
  ShouldShowInputGroupWarning,
  CloseApplication,
} from "../wailsjs/go/main/App";
import {
  GetState as GetAudioEffectsState,
  SetKeyboardPitchShift,
  SetKeyboardPan,
  SetKeyboardEqualizer,
  SetMousePitchShift,
  SetMousePan,
  SetMouseEqualizer,
} from "../wailsjs/go/app/AudioEffects";
import {
  GetState as GetLibraryState,
  DeleteProfile,
  OpenProfileFolder,
  ImportProfile,
  ExportProfile,
} from "../wailsjs/go/app/Library";
import { EventsOn, Environment } from "../wailsjs/runtime/runtime";
import { getMenuItemsForPlatform } from "./constants";
import { AddRuleModal } from "./components/rules";
import { initializeAnalytics } from "./utils/analytics";
import "./App.css";

// Convert null/undefined to "None" for UI display
const profileToDisplay = (profile) => profile ?? "None";
// Convert "None" to null for backend
const displayToProfile = (display) => (display === "None" ? null : display);

function App() {
  // Navigation state
  const [selectedTab, setSelectedTab] = useState("Application Rules");
  const mainContentRef = useRef(null);

  // Platform (e.g. 'linux', 'windows', 'darwin') for conditional UI
  const [platform, setPlatform] = useState("");
  const [isFedora, setIsFedora] = useState(false);
  const menuItemsToShow = getMenuItemsForPlatform(platform);

  // Detect platform on mount
  useEffect(() => {
    Environment().then((env) => setPlatform(env.platform || ""));
    IsFedora().then((v) => setIsFedora(v));
  }, []);

  // On Linux, Application Rules and On-Screen Modifiers are hidden; ensure selected tab is valid
  useEffect(() => {
    if (platform === "linux") {
      const items = getMenuItemsForPlatform("linux");
      if (items.length > 0) {
        const validNames = new Set(items.map((item) => item.name));
        setSelectedTab((prev) => (validNames.has(prev) ? prev : items[0].name));
      }
    }
  }, [platform]);

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
  const [keyboardProfile, setKeyboardProfile] = useState("None");
  const [mouseProfile, setMouseProfile] = useState("None");

  // Available profiles from backend
  const [keyboardProfiles, setKeyboardProfiles] = useState([]);
  const [mouseProfiles, setMouseProfiles] = useState([]);

  // Library state (defined early so handlers can use loadLibraryState)
  const [librarySearchQuery, setLibrarySearchQuery] = useState("");
  const [libraryKeyboardProfiles, setLibraryKeyboardProfiles] = useState([]);
  const [libraryMouseProfiles, setLibraryMouseProfiles] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(true);

  // Load library state from backend
  const loadLibraryState = useCallback(async () => {
    try {
      setLibraryLoading(true);
      const state = await GetLibraryState();
      const kb = state.keyboardProfiles || [];
      const ms = state.mouseProfiles || [];
      setLibraryKeyboardProfiles(kb);
      setLibraryMouseProfiles(ms);
      // Single source of truth for profile picker options (matches Library page). Avoids relying on
      // GetState().keyboardProfiles, which hotkey refresh can overwrite with empty slices.
      setKeyboardProfiles(kb.map((p) => p.name || p.id));
      setMouseProfiles(ms.map((p) => p.name || p.id));
    } catch (error) {
      console.error("Failed to load library state:", error);
    } finally {
      setLibraryLoading(false);
    }
  }, []);

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
    } catch (error) {
      console.error("Failed to load status panel state:", error);
    }
  }, []);

  // Load initial state from backend
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        await loadState();
        await loadLibraryState();

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

        // Load system tray enabled preference
        const systemTrayEnabledValue = await GetSystemTrayEnabled();
        setSystemTrayEnabled(systemTrayEnabledValue);

        // Load start with system preference
        const startWithSystemValue = await GetStartWithSystem();
        setStartWithSystem(startWithSystemValue);

        // Load custom title bar preference (frameless vs system title bar - set at startup, requires restart to change)
        const customTitleBarValue = await GetCustomTitleBarEnabled();
        setCustomTitleBarEnabled(customTitleBarValue);

        // Load hide status box default profile preference
        const hideStatusBoxDefaultProfileValue =
          await GetHideStatusBoxDefaultProfile();
        setHideStatusBoxDefaultProfile(hideStatusBoxDefaultProfileValue);

        // On Linux, check if user is in input group; show modal if not
        const showInputGroupWarning = await ShouldShowInputGroupWarning();
        if (showInputGroupWarning) {
          setInputGroupWarningOpen(true);
        }

        // Initialize analytics tracking (sends ping if needed and schedules future pings)
        initializeAnalytics();
      } catch (error) {
        console.error("Failed to load initial state:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialState();
  }, [loadState, loadLibraryState]);

  // Listen for hotkey state changes and refresh UI
  useEffect(() => {
    const unsubscribe = EventsOn("hotkey-state-changed", () => {
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
      console.error("Failed to load rules:", error);
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
      console.error("Failed to toggle enabled state:", error);
    }
  }, []);

  // Handle keyboard volume change
  const handleSetKeyboardVolume = useCallback(async (volume) => {
    setKeyboardVolume(volume);
    try {
      await SetKeyboardVolume(volume / 100);
    } catch (error) {
      console.error("Failed to set keyboard volume:", error);
    }
  }, []);

  // Handle mouse volume change
  const handleSetMouseVolume = useCallback(async (volume) => {
    setMouseVolume(volume);
    try {
      await SetMouseVolume(volume / 100);
    } catch (error) {
      console.error("Failed to set mouse volume:", error);
    }
  }, []);

  // Handle keyboard mute toggle
  const handleKeyboardMuteToggle = useCallback(
    async (newMutedState) => {
      try {
        if (newMutedState) {
          await MuteKeyboard();
        } else {
          await UnmuteKeyboard();
        }
        // Refresh state to get updated volume
        await loadState();
      } catch (error) {
        console.error("Failed to toggle keyboard mute:", error);
      }
    },
    [loadState],
  );

  // Handle mouse mute toggle
  const handleMouseMuteToggle = useCallback(
    async (newMutedState) => {
      try {
        if (newMutedState) {
          await MuteMouse();
        } else {
          await UnmuteMouse();
        }
        // Refresh state to get updated volume
        await loadState();
      } catch (error) {
        console.error("Failed to toggle mouse mute:", error);
      }
    },
    [loadState],
  );

  // Handle keyboard profile change
  const handleSetKeyboardProfile = useCallback(
    async (profile) => {
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
        console.error("Failed to set keyboard profile:", error);
      }
    },
    [loadLibraryState],
  );

  // Handle mouse profile change
  const handleSetMouseProfile = useCallback(
    async (profile) => {
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
        console.error("Failed to set mouse profile:", error);
      }
    },
    [loadLibraryState],
  );

  // Audio effects state - Keyboard
  const [audioInputMethod, setAudioInputMethod] = useState("keyboard");
  const [pitchShiftEnabled, setPitchShiftEnabledState] = useState(false);
  const [pitchRange, setPitchRangeState] = useState([-3, 3]);
  const [equalizerEnabled, setEqualizerEnabledState] = useState(false);
  const [equalizerBands, setEqualizerBandsState] = useState([
    ...defaultEqualizerBands,
  ]);
  const [panEnabled, setPanEnabledState] = useState(false);
  const [panMode, setPanModeState] = useState("keyPosition");
  const [panKeyPositionKeys, setPanKeyPositionKeysState] = useState(14);

  // Audio effects state - Mouse
  const [pitchShiftEnabledMouse, setPitchShiftEnabledMouseState] =
    useState(false);
  const [pitchRangeMouse, setPitchRangeMouseState] = useState([-3, 3]);
  const [equalizerEnabledMouse, setEqualizerEnabledMouseState] =
    useState(false);
  const [equalizerBandsMouse, setEqualizerBandsMouseState] = useState([
    ...defaultEqualizerBands,
  ]);
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
        setPitchRangeState([
          state.keyboardPitchShift.lower || -3,
          state.keyboardPitchShift.upper || 3,
        ]);

        // Keyboard pan
        setPanEnabledState(state.keyboardPan.enabled);
        // Convert backend pan type to frontend format
        const panType =
          state.keyboardPan.panType === "key-position"
            ? "keyPosition"
            : "random";
        setPanModeState(panType);
        setPanKeyPositionKeysState(state.keyboardPan.maxX || 14);

        // Keyboard equalizer
        setEqualizerEnabledState(state.keyboardEqualizer.enabled);
        if (state.keyboardEqualizer.config) {
          setEqualizerBandsState(
            eqConfigToBands(state.keyboardEqualizer.config),
          );
        }

        // Mouse pitch shift
        setPitchShiftEnabledMouseState(state.mousePitchShift.enabled);
        setPitchRangeMouseState([
          state.mousePitchShift.lower || -3,
          state.mousePitchShift.upper || 3,
        ]);

        // Mouse pan
        setPanEnabledMouseState(state.mousePan.enabled);

        // Mouse equalizer
        setEqualizerEnabledMouseState(state.mouseEqualizer.enabled);
        if (state.mouseEqualizer.config) {
          setEqualizerBandsMouseState(
            eqConfigToBands(state.mouseEqualizer.config),
          );
        }
      } catch (error) {
        console.error("Failed to load audio effects state:", error);
      }
    };
    loadAudioEffectsState();
  }, []);

  // Keyboard pitch shift handlers
  const setPitchShiftEnabled = useCallback(
    async (enabled) => {
      setPitchShiftEnabledState(enabled);
      try {
        await SetKeyboardPitchShift(enabled, pitchRange[0], pitchRange[1]);
      } catch (error) {
        console.error("Failed to set keyboard pitch shift:", error);
      }
    },
    [pitchRange],
  );

  const setPitchRange = useCallback(
    async (range) => {
      setPitchRangeState(range);
      try {
        await SetKeyboardPitchShift(pitchShiftEnabled, range[0], range[1]);
      } catch (error) {
        console.error("Failed to set keyboard pitch range:", error);
      }
    },
    [pitchShiftEnabled],
  );

  // Keyboard pan handlers
  const setPanEnabled = useCallback(
    async (enabled) => {
      setPanEnabledState(enabled);
      try {
        const backendPanType =
          panMode === "keyPosition" ? "key-position" : "random";
        await SetKeyboardPan(enabled, backendPanType, panKeyPositionKeys);
      } catch (error) {
        console.error("Failed to set keyboard pan:", error);
      }
    },
    [panMode, panKeyPositionKeys],
  );

  const setPanMode = useCallback(
    async (mode) => {
      setPanModeState(mode);
      try {
        const backendPanType =
          mode === "keyPosition" ? "key-position" : "random";
        await SetKeyboardPan(panEnabled, backendPanType, panKeyPositionKeys);
      } catch (error) {
        console.error("Failed to set keyboard pan mode:", error);
      }
    },
    [panEnabled, panKeyPositionKeys],
  );

  const setPanKeyPositionKeys = useCallback(
    async (keys) => {
      setPanKeyPositionKeysState(keys);
      try {
        const backendPanType =
          panMode === "keyPosition" ? "key-position" : "random";
        await SetKeyboardPan(panEnabled, backendPanType, keys);
      } catch (error) {
        console.error("Failed to set keyboard pan keys:", error);
      }
    },
    [panEnabled, panMode],
  );

  // Keyboard equalizer handlers
  const setEqualizerEnabled = useCallback(
    async (enabled) => {
      setEqualizerEnabledState(enabled);
      try {
        await SetKeyboardEqualizer(enabled, bandsToEqConfig(equalizerBands));
      } catch (error) {
        console.error("Failed to set keyboard equalizer:", error);
      }
    },
    [equalizerBands],
  );

  const setEqualizerBands = useCallback(
    async (bands) => {
      setEqualizerBandsState(bands);
      try {
        await SetKeyboardEqualizer(equalizerEnabled, bandsToEqConfig(bands));
      } catch (error) {
        console.error("Failed to set keyboard equalizer bands:", error);
      }
    },
    [equalizerEnabled],
  );

  // Mouse pitch shift handlers
  const setPitchShiftEnabledMouse = useCallback(
    async (enabled) => {
      setPitchShiftEnabledMouseState(enabled);
      try {
        await SetMousePitchShift(
          enabled,
          pitchRangeMouse[0],
          pitchRangeMouse[1],
        );
      } catch (error) {
        console.error("Failed to set mouse pitch shift:", error);
      }
    },
    [pitchRangeMouse],
  );

  const setPitchRangeMouse = useCallback(
    async (range) => {
      setPitchRangeMouseState(range);
      try {
        await SetMousePitchShift(pitchShiftEnabledMouse, range[0], range[1]);
      } catch (error) {
        console.error("Failed to set mouse pitch range:", error);
      }
    },
    [pitchShiftEnabledMouse],
  );

  // Mouse pan handler
  const setPanEnabledMouse = useCallback(async (enabled) => {
    setPanEnabledMouseState(enabled);
    try {
      await SetMousePan(enabled);
    } catch (error) {
      console.error("Failed to set mouse pan:", error);
    }
  }, []);

  // Mouse equalizer handlers
  const setEqualizerEnabledMouse = useCallback(
    async (enabled) => {
      setEqualizerEnabledMouseState(enabled);
      try {
        await SetMouseEqualizer(enabled, bandsToEqConfig(equalizerBandsMouse));
      } catch (error) {
        console.error("Failed to set mouse equalizer:", error);
      }
    },
    [equalizerBandsMouse],
  );

  const setEqualizerBandsMouse = useCallback(
    async (bands) => {
      setEqualizerBandsMouseState(bands);
      try {
        await SetMouseEqualizer(equalizerEnabledMouse, bandsToEqConfig(bands));
      } catch (error) {
        console.error("Failed to set mouse equalizer bands:", error);
      }
    },
    [equalizerEnabledMouse],
  );

  // Application rules state
  const [rules, setRules] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);

  // Linux input group warning (shown when user is not in input group)
  const [inputGroupWarningOpen, setInputGroupWarningOpen] = useState(false);
  const [inputGroupCommandCopied, setInputGroupCommandCopied] = useState(false);
  const INPUT_GROUP_COMMAND = "sudo usermod -aG input $USER";
  const handleCopyInputGroupCommand = useCallback(() => {
    navigator.clipboard.writeText(INPUT_GROUP_COMMAND).then(() => {
      setInputGroupCommandCopied(true);
      setTimeout(() => setInputGroupCommandCopied(false), 2000);
    });
  }, []);

  // Settings state
  const [audioDevice, setAudioDevice] = useState("default");
  const [startWithSystem, setStartWithSystem] = useState(false);
  const [startPlayingOnLaunch, setStartPlayingOnLaunch] = useState(false);
  const [startHidden, setStartHidden] = useState(false);
  const [systemTrayEnabled, setSystemTrayEnabled] = useState(true);
  const [notifyOnMinimize, setNotifyOnMinimizeState] = useState(true);
  const [notifyOnUpdate, setNotifyOnUpdateState] = useState(true);
  const [customTitleBarEnabled, setCustomTitleBarEnabled] = useState(true);
  const [hideStatusBoxDefaultProfile, setHideStatusBoxDefaultProfile] =
    useState(false);
  const [restartDialogReason, setRestartDialogReason] = useState(null); // 'customTitleBar' | 'systemTray' when restart needed
  const hasFrontendCustomTitleBar =
    customTitleBarEnabled && platform !== "darwin";
  const hasMacInsetTitleBar = customTitleBarEnabled && platform === "darwin";

  // Handlers for rules
  const handleAddRule = () => {
    setIsAddRuleModalOpen(true);
  };

  const handleAddRuleSubmit = useCallback(
    async (ruleData) => {
      try {
        await UpsertRule(
          ruleData.appPath,
          ruleData.keyboardProfile,
          ruleData.mouseProfile,
          ruleData.enabled,
        );
        await loadRules();
        // Refresh library state to update inUse status
        await loadLibraryState();
      } catch (error) {
        console.error("Failed to add rule:", error);
      }
    },
    [loadRules, loadLibraryState],
  );

  const handleRemoveRule = useCallback(
    async (id) => {
      try {
        await RemoveRule(id); // id is the appPath
        await loadRules();
        // Refresh library state to update inUse status
        await loadLibraryState();
      } catch (error) {
        console.error("Failed to remove rule:", error);
      }
    },
    [loadRules, loadLibraryState],
  );

  const handleRuleProfileChange = useCallback(
    async (id, profileType, newValue) => {
      let snapshot = null;
      setRules((prevRules) => {
        const currentRule = prevRules.find((r) => r.id === id);
        if (!currentRule) {
          return prevRules;
        }
        snapshot = { currentRule, profileType, newValue };
        return prevRules.map((rule) =>
          rule.id === id ? { ...rule, [profileType]: newValue } : rule,
        );
      });

      if (!snapshot) {
        return;
      }

      const { currentRule, profileType: pt, newValue: nv } = snapshot;
      const keyboardProfile =
        pt === "keyboardProfile"
          ? displayToProfile(nv)
          : displayToProfile(currentRule.keyboardProfile);
      const mouseProfile =
        pt === "mouseProfile"
          ? displayToProfile(nv)
          : displayToProfile(currentRule.mouseProfile);

      try {
        await UpdateRuleProfiles(id, keyboardProfile, mouseProfile);
        await loadLibraryState();
      } catch (error) {
        console.error("Failed to update rule profile:", error);
        await loadRules();
      }
    },
    [loadRules, loadLibraryState],
  );

  const handleRuleToggle = useCallback(
    async (id) => {
      // Optimistic update for UI
      setRules((prevRules) =>
        prevRules.map((rule) =>
          rule.id === id ? { ...rule, enabled: !rule.enabled } : rule,
        ),
      );

      try {
        await ToggleRule(id);
      } catch (error) {
        console.error("Failed to toggle rule:", error);
        // Reload rules to revert optimistic update on error
        await loadRules();
      }
    },
    [loadRules],
  );

  // Handler for default profile changes (synced with StatusPanel)
  const handleUnknownApplicationsDefaultChange = useCallback(
    async (profileType, newValue) => {
      try {
        const backendValue = displayToProfile(newValue);
        if (profileType === "keyboardProfile") {
          if (backendValue !== null) {
            await SetDefaultKeyboardProfile(backendValue);
          } else {
            await ClearDefaultKeyboardProfile();
          }
          setKeyboardProfile(newValue);
        } else if (profileType === "mouseProfile") {
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
        console.error("Failed to update default profile:", error);
      }
    },
    [loadLibraryState],
  );

  const handleBrowseForExecutable = useCallback(async () => {
    try {
      return await BrowseForExecutable();
    } catch (error) {
      console.error("Failed to browse for executable:", error);
      return "";
    }
  }, []);

  // Refresh all profile lists (called after creating a new profile or changing defaults)
  const refreshProfiles = useCallback(async () => {
    try {
      await loadLibraryState();
    } catch (error) {
      console.error("Failed to refresh profiles:", error);
    }
  }, [loadLibraryState]);

  // Handler for removing library profiles
  const handleImportProfile = useCallback(async () => {
    await ImportProfile();
    await loadLibraryState();
  }, [loadLibraryState]);

  const handleExportProfile = useCallback(async (profileId) => {
    await ExportProfile(profileId);
    // You might want to show a success message to the user here
  }, []);

  const handleRemoveProfile = useCallback(async (profileName) => {
    try {
      await DeleteProfile(profileName);
      // Remove the profile from local state (no refetch needed)
      setLibraryKeyboardProfiles((prev) =>
        prev.filter((p) => p.id !== profileName),
      );
      setLibraryMouseProfiles((prev) =>
        prev.filter((p) => p.id !== profileName),
      );
      // Also update status panel profile lists
      setKeyboardProfiles((prev) => prev.filter((p) => p !== profileName));
      setMouseProfiles((prev) => prev.filter((p) => p !== profileName));
    } catch (error) {
      console.error("Failed to remove profile:", error);
      throw error; // Re-throw so the modal can handle it
    }
  }, []);

  // Render the current page based on selected tab
  const renderPage = () => {
    switch (selectedTab) {
      case "Audio Effects":
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
      case "Application Rules":
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
              onUnknownApplicationsDefaultChange={
                handleUnknownApplicationsDefaultChange
              }
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
              customTitleBarEnabled={customTitleBarEnabled}
            />
          </>
        );
      case "Library":
        return (
          <LibraryPage
            keyboardProfiles={libraryKeyboardProfiles}
            mouseProfiles={libraryMouseProfiles}
            defaultKeyboardProfile={
              keyboardProfile === "None" ? null : keyboardProfile
            }
            defaultMouseProfile={mouseProfile === "None" ? null : mouseProfile}
            searchQuery={librarySearchQuery}
            setSearchQuery={setLibrarySearchQuery}
            onRemoveProfile={handleRemoveProfile}
            onOpenProfileFolder={(profileId) =>
              OpenProfileFolder(profileId).catch((err) =>
                console.error("Failed to open folder:", err),
              )
            }
            onImportProfile={handleImportProfile}
            onExportProfile={handleExportProfile}
            isLoading={libraryLoading}
            onNavigateToProfileBuilder={() => setSelectedTab("Profile Builder")}
          />
        );
      case "Settings":
        return (
          <SettingsPage
            isLinux={platform === "linux"}
            isMacOS={platform === "darwin"}
            audioDevice={audioDevice}
            isFedora={isFedora}
            setAudioDevice={setAudioDevice}
            startWithSystem={startWithSystem}
            setStartWithSystem={async (value) => {
              setStartWithSystem(value);
              try {
                await SetStartWithSystem(value);
              } catch (error) {
                console.error(
                  "Failed to set start with system preference:",
                  error,
                );
              }
            }}
            startPlayingOnLaunch={startPlayingOnLaunch}
            setStartPlayingOnLaunch={async (value) => {
              setStartPlayingOnLaunch(value);
              try {
                await SetStartPlayingOnLaunch(value);
              } catch (error) {
                console.error(
                  "Failed to set start playing on launch preference:",
                  error,
                );
              }
            }}
            startHidden={startHidden}
            setStartHidden={async (value) => {
              setStartHidden(value);
              try {
                await SetStartHidden(value);
              } catch (error) {
                console.error("Failed to set start hidden preference:", error);
              }
            }}
            systemTrayEnabled={systemTrayEnabled}
            setSystemTrayEnabled={async (value) => {
              setSystemTrayEnabled(value);
              try {
                await SetSystemTrayEnabled(value);
                setRestartDialogReason("systemTray");
              } catch (error) {
                console.error("Failed to set system tray preference:", error);
              }
            }}
            notifyOnMinimize={notifyOnMinimize}
            setNotifyOnMinimize={async (value) => {
              setNotifyOnMinimizeState(value);
              try {
                await SetNotifyOnMinimize(value);
              } catch (error) {
                console.error(
                  "Failed to set notify on minimize preference:",
                  error,
                );
              }
            }}
            notifyOnUpdate={notifyOnUpdate}
            setNotifyOnUpdate={async (value) => {
              setNotifyOnUpdateState(value);
              try {
                await SetNotifyOnUpdate(value);
              } catch (error) {
                console.error(
                  "Failed to set notify on update preference:",
                  error,
                );
              }
            }}
            customTitleBarEnabled={customTitleBarEnabled}
            onCustomTitleBarChange={async (value) => {
              try {
                await SetCustomTitleBarEnabled(value);
                setRestartDialogReason("customTitleBar");
              } catch (error) {
                console.error(
                  "Failed to set custom title bar preference:",
                  error,
                );
              }
            }}
            hideStatusBoxDefaultProfile={hideStatusBoxDefaultProfile}
            onHideStatusBoxDefaultProfileChange={async (value) => {
              setHideStatusBoxDefaultProfile(value);
              try {
                await SetHideStatusBoxDefaultProfile(value);
              } catch (error) {
                console.error(
                  "Failed to set hide status box default profile preference:",
                  error,
                );
              }
            }}
          />
        );
      case "Community":
        return <CommunityPage />;
      case "Hotkeys":
        return <HotkeysPage />;
      case "On-Screen Modifiers":
        return <OSKHelperPage />;
      case "Profile Builder":
        return (
          <ProfileBuilderPage
            onProfileCreated={refreshProfiles}
            onNavigateToLibrary={() => setSelectedTab("Library")}
            customTitleBarEnabled={customTitleBarEnabled}
          />
        );
      default:
        return <PlaceholderPage title={selectedTab} />;
    }
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Linux input group warning modal - custom overlay like AddRuleModal (top: 40px keeps title bar draggable) */}
      {/* Non-dismissable restart dialog - shown when a setting that requires restart is toggled */}
      {restartDialogReason && (
        <Fade in={!!restartDialogReason} timeout={200}>
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1400,
            }}
          >
            <Box
              sx={{
                width: "400px",
                maxWidth: "calc(100vw - 48px)",
                background: "var(--card-bg)",
                backdropFilter: "blur(25px) saturate(180%)",
                WebkitBackdropFilter: "blur(25px) saturate(180%)",
                borderRadius: "20px",
                boxShadow:
                  "0 24px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--card-border), inset 0 1px 0 var(--card-highlight)",
                border: "1px solid var(--card-border)",
                overflow: "hidden",
                padding: "24px",
              }}
            >
              <Typography
                sx={{
                  color: "var(--text-primary)",
                  fontSize: "18px",
                  fontWeight: 600,
                  marginBottom: "12px",
                }}
              >
                Restart Required
              </Typography>
              <Typography
                sx={{
                  color: "var(--text-secondary)",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  marginBottom: "24px",
                }}
              >
                {restartDialogReason === "customTitleBar"
                  ? "The custom title bar setting has been saved. Close the application and start it again manually for the change to take effect."
                  : restartDialogReason === "systemTray"
                    ? "The system tray icon setting has been saved. Close the application and start it again manually for the change to take effect."
                    : "Your settings have been saved. Close the application and start it again manually for the changes to take effect."}
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Box
                  component="button"
                  onClick={() => {
                    CloseApplication();
                  }}
                  sx={{
                    padding: "10px 24px",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "white",
                    background:
                      "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-primary-dark, #0d9488) 100%)",
                    border: "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px var(--accent-shadow)",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, var(--accent-primary-hover) 0%, var(--accent-primary) 100%)",
                      boxShadow: "0 6px 16px var(--accent-shadow)",
                      transform: "translateY(-1px)",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  Close Application
                </Box>
              </Box>
            </Box>
          </Box>
        </Fade>
      )}

      {inputGroupWarningOpen && (
        <Fade in={inputGroupWarningOpen} timeout={200}>
          <Box
            sx={{
              position: "fixed",
              top: hasFrontendCustomTitleBar ? "40px" : 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1200,
            }}
          >
            <Box
              onClick={(e) => e.stopPropagation()}
              sx={{
                width: "500px",
                maxWidth: "calc(100vw - 48px)",
                background: "var(--card-bg)",
                backdropFilter: "blur(25px) saturate(180%)",
                WebkitBackdropFilter: "blur(25px) saturate(180%)",
                borderRadius: "20px",
                boxShadow:
                  "0 24px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--card-border), inset 0 1px 0 var(--card-highlight)",
                border: "1px solid var(--card-border)",
                overflow: "hidden",
                animation:
                  "modalSlideIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                "@keyframes modalSlideIn": {
                  "0%": {
                    opacity: 0,
                    transform: "scale(0.95) translateY(-20px)",
                  },
                  "100%": { opacity: 1, transform: "scale(1) translateY(0)" },
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "24px 24px 16px",
                  borderBottom: "1px solid var(--card-border)",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    backgroundColor: "var(--danger-bg)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                  }}
                >
                  <WarningAmberIcon
                    sx={{ fontSize: "22px", color: "var(--danger)" }}
                  />
                </Box>
                <Typography
                  sx={{
                    color: "var(--text-primary)",
                    fontSize: "18px",
                    fontWeight: 600,
                  }}
                >
                  Input Group Required
                </Typography>
              </Box>
              <Box sx={{ padding: "24px" }}>
                <Typography
                  sx={{
                    color: "var(--text-secondary)",
                    fontSize: "14px",
                    lineHeight: 1.6,
                  }}
                >
                  You must be a member of the &quot;input&quot; user group for
                  Keyboard Sounds Pro to function. The app relies on the Linux
                  input subsystem to capture keyboard and mouse events.
                </Typography>
                <Divider
                  sx={{
                    marginTop: "8px",
                    marginBottom: "8px",
                    background: "var(--card-border)",
                  }}
                />
                <Typography
                  sx={{
                    color: "var(--text-secondary)",
                    fontSize: "14px",
                    lineHeight: 1.6,
                    marginTop: "12px",
                  }}
                >
                  To add yourself to the input group, run this command:
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: "var(--card-border)",
                    padding: "12px 12px 12px 16px",
                    borderRadius: "8px",
                    margin: "12px 0",
                  }}
                >
                  <Box
                    component="code"
                    sx={{
                      flex: 1,
                      fontFamily: "monospace",
                      fontSize: "13px",
                      color: "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {INPUT_GROUP_COMMAND}
                  </Box>
                  <Tooltip
                    title={inputGroupCommandCopied ? "Copied!" : "Copy"}
                    arrow
                    placement="left"
                  >
                    <IconButton
                      size="small"
                      onClick={handleCopyInputGroupCommand}
                      sx={{
                        color: "var(--text-secondary)",
                        "&:hover": {
                          color: "var(--text-primary)",
                          backgroundColor: "var(--card-bg)",
                        },
                      }}
                      aria-label="Copy command"
                    >
                      <ContentCopyIcon sx={{ fontSize: "18px" }} />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography
                  sx={{
                    color: "var(--text-secondary)",
                    fontSize: "14px",
                    lineHeight: 1.6,
                  }}
                >
                  After running the command, you must reboot your system for the
                  change to take effect.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Fade>
      )}

      {/* Custom Title Bar - only shown when enabled (frameless window); when disabled, system title bar is used */}
      {hasFrontendCustomTitleBar && <TitleBar platform={platform} />}
      {hasMacInsetTitleBar && (
        <Box
          className="title-bar-drag"
          sx={{
            position: "fixed",
            top: 0,
            left: "80px",
            right: 0,
            height: "36px",
            zIndex: 1250,
            background: "transparent",
          }}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        customTitleBarEnabled={customTitleBarEnabled}
        menuItems={menuItemsToShow}
        platform={platform}
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
        hideStatusBoxDefaultProfile={hideStatusBoxDefaultProfile}
      />

      {/* Main Content Area */}
      <Box
        ref={mainContentRef}
        component="main"
        sx={{
          flexGrow: 1,
          background: "var(--bg-gradient)",
          marginTop: hasFrontendCustomTitleBar ? "40px" : 0,
          height: hasFrontendCustomTitleBar ? "calc(100vh - 40px)" : "100vh",
          overflow: "auto",
          padding: "32px 40px",
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "300px",
            background: "var(--bg-gradient-subtle)",
            pointerEvents: "none",
          },
        }}
      >
        <Box sx={{ position: "relative", zIndex: 1 }}>{renderPage()}</Box>
      </Box>
    </Box>
  );
}

export default App;
