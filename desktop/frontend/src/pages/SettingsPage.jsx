import { useState, useEffect, useCallback } from "react";
import {
    Box,
    Typography,
    Switch,
    Chip,
    IconButton,
    Tooltip,
    FormControl,
    Select,
    MenuItem,
    TextField,
} from "@mui/material";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import MouseIcon from "@mui/icons-material/Mouse";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LaunchIcon from "@mui/icons-material/Launch";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import ContrastIcon from "@mui/icons-material/Contrast";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import { GlassCard, PageHeader } from "../components/common";
import {
    greenSwitchStyle,
    selectMenuProps,
    enabledSoundOptions,
} from "../constants";
import { useTheme } from "../context";
import { GetVersion } from "../../wailsjs/go/main/wailsConfig";
import {
    IsUpdateAvailable,
    GetLatestVersion,
    GetDownloadURL,
    CheckForUpdate,
} from "../../wailsjs/go/main/UpdateDetails";
import { BrowserOpenURL } from "../../wailsjs/runtime/runtime";
import {
    GetClickOverlayShowsApp,
    SetClickOverlayShowsApp,
} from "../../wailsjs/go/app/OSKHelperBinding";

const THEME_OPTIONS = [
    { id: "dark-modern", label: "Modern Dark", Icon: ContrastIcon },
    { id: "dark", label: "Dark", Icon: DarkModeIcon },
    { id: "light", label: "Light", Icon: LightModeIcon },
];

function inAppProfileSelectSx(hasProfile) {
    return {
        backgroundColor: hasProfile ? "var(--accent-bg)" : "var(--input-bg)",
        backdropFilter: "blur(10px)",
        color: "var(--text-primary)",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 500,
        border: hasProfile
            ? "1px solid var(--accent-border)"
            : "1px solid var(--input-border)",
        "& .MuiOutlinedInput-notchedOutline": {
            borderColor: hasProfile
                ? "var(--accent-border)"
                : "var(--input-border)",
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--accent-primary)",
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--accent-primary)",
        },
        "& .MuiSelect-select": {
            padding: "8px 12px",
            color: "var(--text-primary)",
            fontWeight: 600,
        },
        "& .MuiSvgIcon-root": {
            color: hasProfile
                ? "var(--accent-primary)"
                : "var(--text-secondary)",
        },
    };
}

function SettingsPage({
    audioDevice,
    setAudioDevice,
    isLinux,
    showInAppFocusProfiles,
    keyboardProfiles,
    mouseProfiles,
    inAppKeyboardProfile,
    inAppMouseProfile,
    onInAppKeyboardProfileChange,
    onInAppMouseProfileChange,
    isFedora,
    isMacOS,
    startWithSystem,
    setStartWithSystem,
    startPlayingOnLaunch,
    setStartPlayingOnLaunch,
    enabledSoundOnStart,
    setEnabledSoundOnStart,
    startHidden,
    setStartHidden,
    systemTrayEnabled,
    setSystemTrayEnabled,
    notifyOnMinimize,
    setNotifyOnMinimize,
    notifyOnUpdate,
    setNotifyOnUpdate,
    customTitleBarEnabled,
    onCustomTitleBarChange,
    hideStatusBoxDefaultProfile,
    onHideStatusBoxDefaultProfileChange,
}) {
    const { theme, setTheme } = useTheme();
    const [version, setVersion] = useState("Loading...");
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [latestVersion, setLatestVersion] = useState("Loading...");
    const [downloadURL, setDownloadURL] = useState("Loading...");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [oskClickShowsApp, setOskClickShowsApp] = useState(true);
    const [inAppSoundTestText, setInAppSoundTestText] = useState("");

    const refreshUpdateInfo = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await CheckForUpdate();
            const [available, latest, url] = await Promise.all([
                IsUpdateAvailable().catch(() => false),
                GetLatestVersion().catch(() => "Unknown"),
                GetDownloadURL().catch(() => "Unknown"),
            ]);
            setUpdateAvailable(available);
            setLatestVersion(latest);
            setDownloadURL(url);
        } catch (error) {
            console.error("Failed to check for updates:", error);
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        GetVersion()
            .then(setVersion)
            .catch(() => setVersion("Unknown"));
        refreshUpdateInfo();
    }, [refreshUpdateInfo]);

    useEffect(() => {
        if (!isMacOS) {
            return;
        }
        GetClickOverlayShowsApp()
            .then(setOskClickShowsApp)
            .catch(() => setOskClickShowsApp(true));
    }, [isMacOS]);

    return (
        <Box>
            <PageHeader title="Settings" />

            {/* Appearance Section */}
            <GlassCard sx={{ marginBottom: "24px" }}>
                <Typography
                    variant="h6"
                    sx={{
                        color: "var(--text-primary)",
                        fontSize: "18px",
                        fontWeight: 600,
                        marginBottom: "24px",
                    }}
                >
                    Appearance
                </Typography>

                {/* Theme Selection */}
                <Box sx={{ marginBottom: "28px" }}>
                    <Typography
                        sx={{
                            color: "var(--text-primary)",
                            fontSize: "15px",
                            fontWeight: 500,
                            marginBottom: "6px",
                        }}
                    >
                        Application Theme
                    </Typography>
                    <Typography
                        sx={{
                            color: "var(--text-tertiary)",
                            fontSize: "13px",
                            marginBottom: "12px",
                        }}
                    >
                        Choose the appearance of the application
                    </Typography>

                    {/* Theme selection */}
                    <Box
                        sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "12px",
                        }}
                    >
                        {THEME_OPTIONS.map(({ id, label, Icon }) => {
                            const selected = theme === id;
                            return (
                                <Box
                                    key={id}
                                    onClick={() => setTheme(id)}
                                    sx={{
                                        flex: "1 1 120px",
                                        minWidth: "100px",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: "8px",
                                        padding: "16px",
                                        borderRadius: "12px",
                                        cursor: "pointer",
                                        backgroundColor: selected
                                            ? "var(--accent-bg)"
                                            : "var(--input-bg)",
                                        border: selected
                                            ? "2px solid var(--accent-primary)"
                                            : "2px solid var(--input-border)",
                                        transition: "all 0.2s ease",
                                        "&:hover": {
                                            backgroundColor: selected
                                                ? "var(--accent-bg-hover)"
                                                : "var(--hover-bg)",
                                            transform: "translateY(-2px)",
                                        },
                                    }}
                                >
                                    <Icon
                                        sx={{
                                            fontSize: "28px",
                                            color: selected
                                                ? "var(--accent-primary)"
                                                : "var(--text-secondary)",
                                        }}
                                    />
                                    <Typography
                                        sx={{
                                            color: selected
                                                ? "var(--accent-primary)"
                                                : "var(--text-secondary)",
                                            fontSize: "14px",
                                            fontWeight: selected ? 600 : 500,
                                            textAlign: "center",
                                        }}
                                    >
                                        {label}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>

                {/* Custom Title Bar */}
                {!isMacOS && (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <Box sx={{ flexGrow: 1 }}>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    marginBottom: "4px",
                                }}
                            >
                                <Typography
                                    sx={{
                                        color: "var(--text-primary)",
                                        fontSize: "15px",
                                        fontWeight: 500,
                                    }}
                                >
                                    Use Custom Title Bar
                                </Typography>
                                <Chip
                                    label="Restart required"
                                    size="small"
                                    sx={{
                                        fontSize: "11px",
                                        fontWeight: 500,
                                        height: "20px",
                                        backgroundColor: "var(--input-bg)",
                                        color: "var(--text-secondary)",
                                        border: "1px solid var(--input-border)",
                                        "& .MuiChip-label": {
                                            px: "8px",
                                            marginTop: "2px",
                                        },
                                    }}
                                />
                            </Box>
                            <Typography
                                sx={{
                                    color: "var(--text-tertiary)",
                                    fontSize: "13px",
                                }}
                            >
                                Use the application's custom title bar. When
                                disabled, the system title bar is used.
                            </Typography>
                        </Box>
                        <Switch
                            checked={customTitleBarEnabled}
                            onChange={(e) =>
                                onCustomTitleBarChange(e.target.checked)
                            }
                            sx={greenSwitchStyle}
                        />
                    </Box>
                )}

                {/* Hide Default Profile in Status Box */}
                {!isLinux && (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: "20px",
                        }}
                    >
                        <Box sx={{ flexGrow: 1, marginRight: "8px" }}>
                            <Typography
                                sx={{
                                    color: "var(--text-primary)",
                                    fontSize: "15px",
                                    fontWeight: 500,
                                    marginBottom: "4px",
                                }}
                            >
                                Hide Default Profile in Status Box
                            </Typography>
                            <Typography
                                sx={{
                                    color: "var(--text-tertiary)",
                                    fontSize: "13px",
                                }}
                            >
                                Hide the default keyboard and mouse profile
                                selector in the sidebar. This is useful if you
                                rely entirely on application rules to determine
                                the profile.
                            </Typography>
                        </Box>
                        <Switch
                            checked={hideStatusBoxDefaultProfile}
                            onChange={(e) =>
                                onHideStatusBoxDefaultProfileChange(
                                    e.target.checked,
                                )
                            }
                            sx={greenSwitchStyle}
                        />
                    </Box>
                )}

                {isMacOS && (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: "20px",
                        }}
                    >
                        <Box sx={{ flexGrow: 1, marginRight: "8px" }}>
                            <Typography
                                sx={{
                                    color: "var(--text-primary)",
                                    fontSize: "15px",
                                    fontWeight: 500,
                                    marginBottom: "4px",
                                }}
                            >
                                Click On-Screen Modifiers to Show Window
                            </Typography>
                            <Typography
                                sx={{
                                    color: "var(--text-tertiary)",
                                    fontSize: "13px",
                                }}
                            >
                                When enabled, clicking the on-screen modifiers
                                overlay brings the application window to the
                                front.
                            </Typography>
                        </Box>
                        <Switch
                            checked={oskClickShowsApp}
                            onChange={(e) => {
                                const v = e.target.checked;
                                setOskClickShowsApp(v);
                                SetClickOverlayShowsApp(v).catch((err) => {
                                    console.error(
                                        "Failed to set OSK click-to-show preference:",
                                        err,
                                    );
                                });
                            }}
                            sx={greenSwitchStyle}
                        />
                    </Box>
                )}
            </GlassCard>

            {/* Application Settings Section */}
            <GlassCard sx={{ marginBottom: "24px" }}>
                <Typography
                    variant="h6"
                    sx={{
                        color: "var(--text-primary)",
                        fontSize: "18px",
                        fontWeight: 600,
                        marginBottom: "24px",
                    }}
                >
                    Application Settings
                </Typography>

                {showInAppFocusProfiles && (
                    <Box sx={{ marginBottom: "28px" }}>
                        <Typography
                            sx={{
                                color: "var(--text-tertiary)",
                                fontSize: "13px",
                                marginBottom: "16px",
                                lineHeight: 1.5,
                            }}
                        >
                            When Keyboard Sounds Pro is the focused application,
                            use these profiles instead of the global default
                            fallback (when no application rule matches this
                            app). Choose &quot;Use Default&quot; to follow
                            application rules only.
                        </Typography>
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: { xs: "column", sm: "row" },
                                gap: "20px",
                            }}
                        >
                            <FormControl fullWidth size="small">
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        marginBottom: "8px",
                                    }}
                                >
                                    <KeyboardIcon
                                        sx={{
                                            fontSize: "18px",
                                            color: "var(--text-secondary)",
                                        }}
                                    />
                                    <Typography
                                        sx={{
                                            color: "var(--text-primary)",
                                            fontSize: "14px",
                                            fontWeight: 500,
                                        }}
                                    >
                                        In-App Keyboard Profile
                                    </Typography>
                                </Box>
                                <Select
                                    value={inAppKeyboardProfile ?? ""}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        onInAppKeyboardProfileChange(
                                            v === "" ? null : v,
                                        );
                                    }}
                                    displayEmpty
                                    renderValue={(v) =>
                                        v === "" ? "Use Default" : v
                                    }
                                    sx={inAppProfileSelectSx(
                                        (inAppKeyboardProfile ?? "") !== "",
                                    )}
                                    MenuProps={selectMenuProps}
                                >
                                    <MenuItem value="">
                                        <em>Use Default</em>
                                    </MenuItem>
                                    {(keyboardProfiles || []).map((name) => (
                                        <MenuItem key={name} value={name}>
                                            {name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth size="small">
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        marginBottom: "8px",
                                    }}
                                >
                                    <MouseIcon
                                        sx={{
                                            fontSize: "18px",
                                            color: "var(--text-secondary)",
                                        }}
                                    />
                                    <Typography
                                        sx={{
                                            color: "var(--text-primary)",
                                            fontSize: "14px",
                                            fontWeight: 500,
                                        }}
                                    >
                                        In-App Mouse Profile
                                    </Typography>
                                </Box>
                                <Select
                                    value={inAppMouseProfile ?? ""}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        onInAppMouseProfileChange(
                                            v === "" ? null : v,
                                        );
                                    }}
                                    displayEmpty
                                    renderValue={(v) =>
                                        v === "" ? "Use Default" : v
                                    }
                                    sx={inAppProfileSelectSx(
                                        (inAppMouseProfile ?? "") !== "",
                                    )}
                                    MenuProps={selectMenuProps}
                                >
                                    <MenuItem value="">
                                        <em>Use Default</em>
                                    </MenuItem>
                                    {(mouseProfiles || []).map((name) => (
                                        <MenuItem key={name} value={name}>
                                            {name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        <Typography
                            sx={{
                                color: "var(--text-tertiary)",
                                fontSize: "12px",
                                marginTop: "20px",
                                marginBottom: "10px",
                                lineHeight: 1.5,
                            }}
                        >
                            While sounds are playing, try the field and pad
                            below to preview keyboard and mouse profiles for
                            this app.
                        </Typography>
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: { xs: "column", sm: "row" },
                                gap: "16px",
                                alignItems: "stretch",
                            }}
                        >
                            <Box
                                sx={{
                                    flex: 1,
                                    minWidth: 0,
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                <Typography
                                    sx={{
                                        color: "var(--text-secondary)",
                                        fontSize: "12px",
                                        fontWeight: 500,
                                        marginBottom: "8px",
                                        lineHeight: 1.2,
                                    }}
                                >
                                    Keyboard
                                </Typography>
                                <Box
                                    sx={{
                                        flex: 1,
                                        display: "flex",
                                        minHeight: "96px",
                                    }}
                                >
                                    <TextField
                                        multiline
                                        minRows={3}
                                        maxRows={12}
                                        fullWidth
                                        size="small"
                                        placeholder="Click here and type to test keyboard sounds…"
                                        value={inAppSoundTestText}
                                        onChange={(e) =>
                                            setInAppSoundTestText(
                                                e.target.value,
                                            )
                                        }
                                        spellCheck={false}
                                        inputProps={{
                                            "aria-label": "Keyboard sound test",
                                        }}
                                        sx={{
                                            flex: 1,
                                            width: "100%",
                                            display: "flex",
                                            "& .MuiOutlinedInput-root": {
                                                flex: 1,
                                                height: "100%",
                                                alignItems: "flex-start",
                                                backgroundColor:
                                                    "var(--input-bg)",
                                                borderRadius: "10px",
                                                fontSize: "13px",
                                                color: "var(--text-primary)",
                                                "& fieldset": {
                                                    borderColor:
                                                        "var(--input-border)",
                                                },
                                                "&:hover fieldset": {
                                                    borderColor:
                                                        "var(--accent-primary)",
                                                },
                                                "&.Mui-focused fieldset": {
                                                    borderColor:
                                                        "var(--accent-primary)",
                                                },
                                            },
                                            "& textarea": {
                                                height: "100% !important",
                                                overflow: "auto !important",
                                                boxSizing: "border-box",
                                            },
                                        }}
                                    />
                                </Box>
                            </Box>
                            <Box
                                sx={{
                                    width: { xs: "100%", sm: "132px" },
                                    flexShrink: 0,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignSelf: { sm: "stretch" },
                                }}
                            >
                                <Typography
                                    sx={{
                                        color: "var(--text-secondary)",
                                        fontSize: "12px",
                                        fontWeight: 500,
                                        marginBottom: "8px",
                                        lineHeight: 1.2,
                                    }}
                                >
                                    Mouse
                                </Typography>
                                <Box
                                    role="presentation"
                                    sx={{
                                        flex: 1,
                                        minHeight: "96px",
                                        borderRadius: "12px",
                                        border: "1px dashed var(--input-border)",
                                        backgroundColor: "var(--input-bg)",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        userSelect: "none",
                                        transition:
                                            "background-color 0.15s ease, border-color 0.15s ease",
                                        "&:hover": {
                                            backgroundColor: "var(--hover-bg)",
                                            borderColor: "var(--accent-border)",
                                        },
                                        "&:active": {
                                            backgroundColor: "var(--accent-bg)",
                                        },
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            color: "var(--text-tertiary)",
                                            fontSize: "11px",
                                            fontWeight: 500,
                                            textAlign: "center",
                                            px: 1,
                                        }}
                                    >
                                        Click to test
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                )}

                {/* Start with System */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "20px",
                    }}
                >
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography
                            sx={{
                                color: "var(--text-primary)",
                                fontSize: "15px",
                                fontWeight: 500,
                                marginBottom: "4px",
                            }}
                        >
                            Auto Launch
                        </Typography>
                        <Typography
                            sx={{
                                color: "var(--text-tertiary)",
                                fontSize: "13px",
                            }}
                        >
                            Automatically launch the application when your
                            system starts
                        </Typography>
                    </Box>
                    <Switch
                        checked={startWithSystem}
                        onChange={(e) => setStartWithSystem(e.target.checked)}
                        sx={greenSwitchStyle}
                    />
                </Box>

                {/* Start Playing on Launch */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "20px",
                    }}
                >
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography
                            sx={{
                                color: "var(--text-primary)",
                                fontSize: "15px",
                                fontWeight: 500,
                                marginBottom: "4px",
                            }}
                        >
                            Auto Start
                        </Typography>
                        <Typography
                            sx={{
                                color: "var(--text-tertiary)",
                                fontSize: "13px",
                            }}
                        >
                            Begin playing keyboard and mouse sounds immediately
                            when the application starts
                        </Typography>
                    </Box>
                    <Switch
                        checked={startPlayingOnLaunch}
                        onChange={(e) =>
                            setStartPlayingOnLaunch(e.target.checked)
                        }
                        sx={greenSwitchStyle}
                    />
                </Box>

                {/* Hide On Launch */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "20px",
                    }}
                >
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography
                            sx={{
                                color: "var(--text-primary)",
                                fontSize: "15px",
                                fontWeight: 500,
                                marginBottom: "4px",
                            }}
                        >
                            Hide Window
                        </Typography>
                        <Typography
                            sx={{
                                color: "var(--text-tertiary)",
                                fontSize: "13px",
                            }}
                        >
                            Automatically hide the application window when
                            launched
                        </Typography>
                    </Box>
                    <Switch
                        checked={startHidden}
                        onChange={(e) => setStartHidden(e.target.checked)}
                        sx={greenSwitchStyle}
                    />
                </Box>

                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: !isFedora
                            ? isMacOS
                                ? "0px"
                                : "20px"
                            : "0px",
                    }}
                >
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography
                            sx={{
                                color: "var(--text-primary)",
                                fontSize: "15px",
                                fontWeight: 500,
                                marginBottom: "4px",
                            }}
                        >
                            Start Button Sound
                        </Typography>
                        <Typography
                            sx={{
                                color: "var(--text-tertiary)",
                                fontSize: "13px",
                            }}
                        >
                            Choose which confirmation sound plays when "Start
                            Keyboard Sounds" is pressed
                        </Typography>
                    </Box>
                    <FormControl size="small" sx={{ minWidth: 128 }}>
                        <Select
                            value={enabledSoundOnStart}
                            onChange={(e) =>
                                setEnabledSoundOnStart(e.target.value)
                            }
                            MenuProps={selectMenuProps}
                            sx={{
                                backgroundColor: "var(--input-bg)",
                                backdropFilter: "blur(10px)",
                                color: "var(--text-primary)",
                                borderRadius: "8px",
                                fontSize: "13px",
                                fontWeight: 500,
                                border: "1px solid var(--input-border)",
                                "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "var(--input-border)",
                                },
                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "var(--accent-primary)",
                                },
                                "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                    {
                                        borderColor: "var(--accent-primary)",
                                    },
                                "& .MuiSelect-select": {
                                    padding: "8px 12px",
                                    color: "var(--text-primary)",
                                    fontWeight: 600,
                                },
                                "& .MuiSvgIcon-root": {
                                    color: "var(--text-secondary)",
                                },
                            }}
                        >
                            {enabledSoundOptions.map(({ value, label }) => (
                                <MenuItem key={value} value={value}>
                                    {label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {/* System Tray */}
                {!isFedora && !isMacOS && (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <Box sx={{ flexGrow: 1 }}>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    marginBottom: "4px",
                                }}
                            >
                                <Typography
                                    sx={{
                                        color: "var(--text-primary)",
                                        fontSize: "15px",
                                        fontWeight: 500,
                                    }}
                                >
                                    System Tray Icon
                                </Typography>
                                <Chip
                                    label="Restart required"
                                    size="small"
                                    sx={{
                                        fontSize: "11px",
                                        fontWeight: 500,
                                        height: "20px",
                                        backgroundColor: "var(--input-bg)",
                                        color: "var(--text-secondary)",
                                        border: "1px solid var(--input-border)",
                                        "& .MuiChip-label": {
                                            px: "8px",
                                            marginTop: "2px",
                                        },
                                    }}
                                />
                            </Box>
                            <Typography
                                sx={{
                                    color: "var(--text-tertiary)",
                                    fontSize: "13px",
                                }}
                            >
                                When enabled, closing the window minimizes the
                                application to the system tray.
                            </Typography>
                        </Box>
                        <Switch
                            checked={systemTrayEnabled}
                            onChange={(e) =>
                                setSystemTrayEnabled(e.target.checked)
                            }
                            sx={greenSwitchStyle}
                        />
                    </Box>
                )}
            </GlassCard>

            {/* Notification Settings Section */}
            {!isMacOS && (
                <GlassCard sx={{ marginBottom: "24px" }}>
                    <Typography
                        variant="h6"
                        sx={{
                            color: "var(--text-primary)",
                            fontSize: "18px",
                            fontWeight: 600,
                            marginBottom: "24px",
                        }}
                    >
                        Notification Settings
                    </Typography>

                    {/* Notify on Minimize */}
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "20px",
                        }}
                    >
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography
                                sx={{
                                    color: "var(--text-primary)",
                                    fontSize: "15px",
                                    fontWeight: 500,
                                    marginBottom: "4px",
                                }}
                            >
                                Application Hidden
                            </Typography>
                            <Typography
                                sx={{
                                    color: "var(--text-tertiary)",
                                    fontSize: "13px",
                                }}
                            >
                                Notify me when the application is minimized to
                                the system tray
                            </Typography>
                        </Box>
                        <Switch
                            checked={notifyOnMinimize}
                            onChange={(e) =>
                                setNotifyOnMinimize(e.target.checked)
                            }
                            sx={greenSwitchStyle}
                        />
                    </Box>

                    {/* Notify on Update */}
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography
                                sx={{
                                    color: "var(--text-primary)",
                                    fontSize: "15px",
                                    fontWeight: 500,
                                    marginBottom: "4px",
                                }}
                            >
                                Update Available
                            </Typography>
                            <Typography
                                sx={{
                                    color: "var(--text-tertiary)",
                                    fontSize: "13px",
                                }}
                            >
                                Notify me when an update is available
                            </Typography>
                        </Box>
                        <Switch
                            checked={notifyOnUpdate}
                            onChange={(e) =>
                                setNotifyOnUpdate(e.target.checked)
                            }
                            sx={greenSwitchStyle}
                        />
                    </Box>
                </GlassCard>
            )}

            {/* Application Details Section */}
            <GlassCard>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "24px",
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            color: "var(--text-primary)",
                            fontSize: "18px",
                            fontWeight: 600,
                        }}
                    >
                        Application Details
                    </Typography>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        {updateAvailable ? (
                            <Chip
                                icon={
                                    <DownloadIcon
                                        sx={{ fontSize: "16px !important" }}
                                    />
                                }
                                label={`Update Available (${latestVersion})`}
                                onClick={() => BrowserOpenURL(downloadURL)}
                                sx={{
                                    backgroundColor: "var(--accent-bg)",
                                    color: "var(--accent-primary)",
                                    border: "1px solid var(--accent-border)",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    height: "28px",
                                    cursor: "pointer",
                                    "& .MuiChip-icon": {
                                        color: "var(--accent-primary)",
                                        marginLeft: "8px",
                                        marginRight: "-8px",
                                    },
                                    "&:hover": {
                                        backgroundColor:
                                            "var(--accent-bg-hover)",
                                        borderColor: "var(--accent-primary)",
                                    },
                                }}
                            />
                        ) : (
                            <Chip
                                icon={
                                    <CheckCircleIcon
                                        sx={{ fontSize: "16px !important" }}
                                    />
                                }
                                label="Up To Date"
                                sx={{
                                    backgroundColor: "var(--accent-bg)",
                                    color: "var(--accent-primary)",
                                    border: "1px solid var(--accent-border)",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    height: "28px",
                                    "& .MuiChip-icon": {
                                        color: "var(--accent-primary)",
                                    },
                                }}
                            />
                        )}
                        <Tooltip title="Check for Update">
                            <IconButton
                                onClick={refreshUpdateInfo}
                                disabled={isRefreshing}
                                sx={{
                                    mr: "-10px",
                                    color: "var(--text-secondary)",
                                    "&:hover": {
                                        color: "var(--accent-primary)",
                                        backgroundColor: "var(--hover-bg)",
                                    },
                                    "&.Mui-disabled": {
                                        color: "var(--text-tertiary)",
                                    },
                                }}
                            >
                                <RefreshIcon
                                    sx={{
                                        fontSize: "20px",
                                        animation: isRefreshing
                                            ? "spin 1s linear infinite"
                                            : "none",
                                        "@keyframes spin": {
                                            "0%": {
                                                transform: "rotate(0deg)",
                                            },
                                            "100%": {
                                                transform: "rotate(360deg)",
                                            },
                                        },
                                    }}
                                />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Version */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "20px",
                    }}
                >
                    <Typography
                        sx={{
                            color: "var(--text-secondary)",
                            fontSize: "14px",
                            fontWeight: 500,
                        }}
                    >
                        Version
                    </Typography>
                    <Typography
                        sx={{
                            color: "var(--text-primary)",
                            fontSize: "14px",
                            fontWeight: 600,
                            fontFamily: "monospace",
                        }}
                    >
                        {version}
                    </Typography>
                </Box>

                {/* Website Link */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "20px",
                    }}
                >
                    <Typography
                        sx={{
                            color: "var(--text-secondary)",
                            fontSize: "14px",
                            fontWeight: 500,
                        }}
                    >
                        Website
                    </Typography>
                    <Box
                        onClick={() =>
                            BrowserOpenURL("https://keyboardsounds.pro/")
                        }
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            color: "var(--accent-primary)",
                            fontSize: "14px",
                            fontWeight: 500,
                            textDecoration: "none",
                            cursor: "pointer",
                            "&:hover": {
                                color: "var(--accent-light)",
                                textDecoration: "underline",
                            },
                        }}
                    >
                        keyboardsounds.pro
                        <LaunchIcon sx={{ fontSize: "14px" }} />
                    </Box>
                </Box>

                {/* GitHub Link */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Typography
                        sx={{
                            color: "var(--text-secondary)",
                            fontSize: "14px",
                            fontWeight: 500,
                        }}
                    >
                        GitHub
                    </Typography>
                    <Box
                        onClick={() =>
                            BrowserOpenURL(
                                "https://github.com/keyboard-sounds/keyboardsounds-pro",
                            )
                        }
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            color: "var(--accent-primary)",
                            fontSize: "14px",
                            fontWeight: 500,
                            textDecoration: "none",
                            cursor: "pointer",
                            "&:hover": {
                                color: "var(--accent-light)",
                                textDecoration: "underline",
                            },
                        }}
                    >
                        keyboard-sounds/keyboardsounds-pro
                        <LaunchIcon sx={{ fontSize: "14px" }} />
                    </Box>
                </Box>
            </GlassCard>
        </Box>
    );
}

export default SettingsPage;
