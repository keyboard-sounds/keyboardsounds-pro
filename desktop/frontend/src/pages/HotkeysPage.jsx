import { useState, useEffect, useCallback, useRef } from "react";
import {
    Box,
    Typography,
    TextField,
    Select,
    MenuItem,
    Menu,
    IconButton,
    Button,
    Chip,
    FormControl,
    InputLabel,
    OutlinedInput,
    Tooltip,
    ListItemIcon,
    ListItemText,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import MouseIcon from "@mui/icons-material/Mouse";
import AppsIcon from "@mui/icons-material/Apps";
import BlockIcon from "@mui/icons-material/Block";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { GlassCard, PageHeader } from "../components/common";
import { GetHotKeys, SetHotKeys } from "../../wailsjs/go/app/HotKeys";
import { selectMenuProps, glassCardStyle } from "../constants";

const ACTION_OPTIONS = [
    { value: "mute", label: "Mute" },
    { value: "unmute", label: "Unmute" },
    { value: "toggle-mute", label: "Toggle Mute" },
    { value: "increase-volume", label: "Increase Volume" },
    { value: "decrease-volume", label: "Decrease Volume" },
    { value: "toggle-osk-helpers", label: "Toggle On Screen Modifiers" },
];

const DEVICE_OPTIONS = [
    { value: "all", label: "All devices" },
    { value: "keyboard", label: "Keyboard" },
    { value: "mouse", label: "Mouse" },
    { value: "none", label: "None" },
];

const DEVICE_ICONS = {
    all: AppsIcon,
    keyboard: KeyboardIcon,
    mouse: MouseIcon,
    none: BlockIcon,
};

const MODIFIER_OPTIONS = [
    "LeftControl",
    "RightControl",
    "LeftShift",
    "RightShift",
    "LeftAlt",
    "RightAlt",
    "LeftWin",
    "RightWin",
];

const KEY_OPTIONS = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "F1",
    "F2",
    "F3",
    "F4",
    "F5",
    "F6",
    "F7",
    "F8",
    "F9",
    "F10",
    "F11",
    "F12",
    "Up",
    "Down",
    "Left",
    "Right",
    "Space",
    "Enter",
    "Tab",
    "Backspace",
    "Escape",
    "Home",
    "End",
    "PageUp",
    "PageDown",
    "Insert",
    "Delete",
];

function AddModifierMenuButton({ modifiers, onPick }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const available = MODIFIER_OPTIONS.filter(
        (m) => !(modifiers || []).includes(m),
    );

    return (
        <>
            <Tooltip title="Add modifier" arrow placement="top">
                <span>
                    <IconButton
                        size="small"
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        disabled={available.length === 0}
                        aria-label="Add modifier"
                        sx={{
                            width: "28px",
                            height: "28px",
                            padding: 0,
                            flexShrink: 0,
                            borderRadius: "14px",
                            border: "1px solid var(--accent-border)",
                            backgroundColor: "var(--accent-bg)",
                            color: "var(--accent-primary)",
                            "&:hover": {
                                backgroundColor: "var(--hover-bg)",
                                borderColor: "var(--accent-primary)",
                            },
                            "&.Mui-disabled": {
                                opacity: 0.35,
                            },
                        }}
                    >
                        <AddIcon sx={{ fontSize: "18px" }} />
                    </IconButton>
                </span>
            </Tooltip>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={() => setAnchorEl(null)}
                sx={{ zIndex: 2000 }}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                slotProps={{
                    paper: {
                        sx: {
                            ...(selectMenuProps.PaperProps?.sx || {}),
                            minWidth: "200px",
                        },
                    },
                }}
            >
                {available.map((modifier) => (
                    <MenuItem
                        key={modifier}
                        onClick={() => {
                            onPick(modifier);
                            setAnchorEl(null);
                        }}
                        sx={{ fontSize: "13px" }}
                    >
                        {modifier}
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
}

function sanitizeNumericVolumeInput(raw) {
    let v = String(raw ?? "").replace(/[^\d.]/g, "");
    const dot = v.indexOf(".");
    if (dot !== -1) {
        v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, "");
    }
    return v;
}

/** Single target device per hotkey action (matches backend `target` field). */
function HotkeyDeviceMenu({ value, onChange }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const current =
        DEVICE_OPTIONS.find((o) => o.value === value) || DEVICE_OPTIONS[0];
    const IconComponent = DEVICE_ICONS[current.value] || DEVICE_ICONS.all;

    return (
        <>
            <Tooltip title={`Target: ${current.label}`} arrow placement="left">
                <span>
                    <IconButton
                        size="small"
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        aria-label="Select target device"
                        sx={{
                            width: "40px",
                            height: "40px",
                            flexShrink: 0,
                            borderRadius: "10px",
                            border: "1px solid var(--input-border)",
                            backgroundColor: "var(--input-bg)",
                            backdropFilter: "blur(10px)",
                            color: "var(--accent-primary)",
                            "&:hover": {
                                backgroundColor: "var(--hover-bg)",
                                borderColor: "var(--input-border-hover)",
                            },
                            "&.Mui-disabled": {
                                opacity: 0.4,
                            },
                        }}
                    >
                        <IconComponent sx={{ fontSize: "22px" }} />
                    </IconButton>
                </span>
            </Tooltip>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={() => setAnchorEl(null)}
                sx={{ zIndex: 2000 }}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                slotProps={{
                    paper: {
                        sx: {
                            ...(selectMenuProps.PaperProps?.sx || {}),
                            minWidth: "200px",
                        },
                    },
                }}
            >
                {DEVICE_OPTIONS.map((opt) => {
                    const OptIcon = DEVICE_ICONS[opt.value] || AppsIcon;
                    return (
                        <MenuItem
                            key={opt.value}
                            selected={value === opt.value}
                            onClick={() => {
                                onChange(opt.value);
                                setAnchorEl(null);
                            }}
                            sx={{
                                fontSize: "13px",
                                gap: 1,
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: "36px !important" }}>
                                <OptIcon
                                    sx={{
                                        fontSize: "20px",
                                        color: "var(--accent-primary)",
                                    }}
                                />
                            </ListItemIcon>
                            <ListItemText primary={opt.label} />
                        </MenuItem>
                    );
                })}
            </Menu>
        </>
    );
}

function HotkeysPage() {
    const [hotkeys, setHotkeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const isInitialLoad = useRef(true);
    const saveTimeoutRef = useRef(null);

    const loadHotkeys = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await GetHotKeys();
            setHotkeys(data || []);
            isInitialLoad.current = true;
        } catch (err) {
            console.error("Failed to load hotkeys:", err);
            setError("Failed to load hotkeys");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadHotkeys();
    }, [loadHotkeys]);

    // Auto-save when hotkeys change (debounced)
    useEffect(() => {
        // Don't save on initial load
        if (isInitialLoad.current) {
            isInitialLoad.current = false;
            return;
        }

        // Clear any pending save
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Debounce the save by 500ms
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                setError(null);
                await SetHotKeys(hotkeys);
            } catch (err) {
                console.error("Failed to save hotkeys:", err);
                setError("Failed to save hotkeys");
            }
        }, 500);

        // Cleanup timeout on unmount
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [hotkeys]);

    const addHotkeyGroup = () => {
        setHotkeys([...hotkeys, { modifiers: [], keys: [] }]);
    };

    const removeHotkeyGroup = (groupIndex) => {
        setHotkeys(hotkeys.filter((_, index) => index !== groupIndex));
    };

    const updateHotkeyGroup = (groupIndex, field, value) => {
        const updated = [...hotkeys];
        updated[groupIndex] = { ...updated[groupIndex], [field]: value };
        setHotkeys(updated);
    };

    const addHotkey = (groupIndex) => {
        const updated = [...hotkeys];
        if (!updated[groupIndex].keys) {
            updated[groupIndex].keys = [];
        }
        updated[groupIndex].keys = [
            ...updated[groupIndex].keys,
            { key: "", action: { action: "mute", target: "all", value: "" } },
        ];
        setHotkeys(updated);
    };

    const removeHotkey = (groupIndex, keyIndex) => {
        const updated = [...hotkeys];
        updated[groupIndex].keys = updated[groupIndex].keys.filter(
            (_, index) => index !== keyIndex,
        );
        setHotkeys(updated);
    };

    const updateHotkey = (groupIndex, keyIndex, field, value) => {
        const updated = [...hotkeys];
        if (field === "key") {
            updated[groupIndex].keys[keyIndex].key = value;
        } else if (
            field === "action" ||
            field === "target" ||
            field === "value"
        ) {
            updated[groupIndex].keys[keyIndex].action = {
                ...updated[groupIndex].keys[keyIndex].action,
                [field === "target"
                    ? "target"
                    : field === "action"
                      ? "action"
                      : "value"]: value,
            };
            // Auto-set target to "none" for toggle-osk-helpers action
            if (field === "action" && value === "toggle-osk-helpers") {
                updated[groupIndex].keys[keyIndex].action.target = "none";
            }
        }
        setHotkeys(updated);
    };

    const addModifier = (groupIndex, modifier) => {
        const updated = [...hotkeys];
        const modifiers = updated[groupIndex].modifiers || [];
        if (!modifiers.includes(modifier)) {
            updated[groupIndex].modifiers = [...modifiers, modifier];
            setHotkeys(updated);
        }
    };

    const removeModifier = (groupIndex, modifier) => {
        const updated = [...hotkeys];
        updated[groupIndex].modifiers = (
            updated[groupIndex].modifiers || []
        ).filter((m) => m !== modifier);
        setHotkeys(updated);
    };

    if (loading) {
        return (
            <Box>
                <PageHeader title="Hotkeys" />
                <GlassCard sx={{ padding: "32px", textAlign: "center" }}>
                    <Typography sx={{ color: "var(--text-secondary)" }}>
                        Loading hotkeys...
                    </Typography>
                </GlassCard>
            </Box>
        );
    }

    return (
        <Box>
            <PageHeader title="Hotkeys">
                <Tooltip title="Add Hotkey Group">
                    <IconButton
                        onClick={addHotkeyGroup}
                        sx={{
                            background:
                                "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)",
                            color: "white",
                            width: "40px",
                            height: "40px",
                            borderRadius: "12px",
                            boxShadow: "0 4px 12px var(--accent-shadow)",
                            "&:hover": {
                                background:
                                    "linear-gradient(135deg, var(--accent-secondary) 0%, var(--accent-light) 100%)",
                                boxShadow: "0 6px 16px var(--accent-shadow)",
                                transform: "translateY(-1px)",
                            },
                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                        title="Add Hotkey Group"
                    >
                        <AddIcon />
                    </IconButton>
                </Tooltip>
            </PageHeader>

            {error && (
                <GlassCard
                    sx={{
                        marginBottom: "24px",
                        padding: "16px 20px",
                        background:
                            "linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, var(--card-bg))",
                        border: "1px solid rgba(239, 68, 68, 0.25)",
                    }}
                >
                    <Typography
                        sx={{
                            color: "var(--text-primary)",
                            fontSize: "14px",
                            fontWeight: 500,
                        }}
                    >
                        {error}
                    </Typography>
                </GlassCard>
            )}

            {/* Disclaimer Banner */}
            <GlassCard
                sx={{
                    marginBottom: "24px",
                    background:
                        "linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, var(--card-bg))",
                    border: "1px solid rgba(59, 130, 246, 0.25)",
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "16px",
                    }}
                >
                    <Box
                        sx={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "10px",
                            background:
                                "linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(59, 130, 246, 0.15) 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        <InfoOutlinedIcon
                            sx={{ fontSize: "20px", color: "#60a5fa" }}
                        />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography
                            sx={{
                                color: "var(--text-primary)",
                                fontSize: "14px",
                                fontWeight: 600,
                                marginBottom: "4px",
                            }}
                        >
                            Important Notice
                        </Typography>
                        <Typography
                            sx={{
                                color: "var(--text-secondary)",
                                fontSize: "13px",
                                lineHeight: 1.6,
                            }}
                        >
                            Hotkeys will only function when the application is
                            enabled. Make sure the app is running and enabled
                            for your configured hotkeys to work.
                        </Typography>
                    </Box>
                </Box>
            </GlassCard>

            <Typography
                sx={{
                    color: "var(--text-secondary)",
                    fontSize: "14px",
                    marginBottom: "24px",
                }}
            >
                Configure keyboard shortcuts to control the application
            </Typography>

            {hotkeys.length === 0 ? (
                <Box
                    sx={{
                        ...glassCardStyle,
                        padding: "48px",
                        textAlign: "center",
                    }}
                >
                    <Box
                        sx={{
                            width: "80px",
                            height: "80px",
                            borderRadius: "20px",
                            background:
                                "linear-gradient(135deg, var(--accent-bg) 0%, var(--hover-bg-light) 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 20px auto",
                        }}
                    >
                        <KeyboardIcon
                            sx={{
                                fontSize: "40px",
                                color: "var(--accent-primary)",
                                opacity: 0.6,
                            }}
                        />
                    </Box>
                    <Typography
                        variant="h6"
                        sx={{
                            color: "var(--text-primary)",
                            fontSize: "18px",
                            fontWeight: 600,
                            marginBottom: "8px",
                        }}
                    >
                        No Hotkey Groups Configured
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            color: "var(--text-tertiary)",
                            fontSize: "14px",
                            marginBottom: "24px",
                            maxWidth: "400px",
                            margin: "0 auto 24px auto",
                        }}
                    >
                        Create your first hotkey group to configure keyboard
                        keyboard shortcuts for controlling the application.
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={addHotkeyGroup}
                        sx={{
                            background:
                                "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)",
                            color: "white",
                            fontWeight: 600,
                            fontSize: "14px",
                            padding: "12px 24px",
                            borderRadius: "12px",
                            boxShadow: "0 4px 16px var(--accent-shadow)",
                            "&:hover": {
                                boxShadow: "0 6px 20px var(--accent-shadow)",
                                transform: "translateY(-2px)",
                                background:
                                    "linear-gradient(135deg, var(--accent-secondary) 0%, var(--accent-light) 100%)",
                            },
                            transition: "all 0.2s ease",
                        }}
                    >
                        Create Your First Hotkey Group
                    </Button>
                </Box>
            ) : (
                hotkeys.map((group, groupIndex) => (
                    <GlassCard
                        key={groupIndex}
                        sx={{ marginBottom: "24px", padding: "28px" }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                marginBottom: "24px",
                            }}
                        >
                            <Box sx={{ flex: 1 }}>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: "var(--text-primary)",
                                        fontSize: "18px",
                                        fontWeight: 600,
                                        marginBottom: "4px",
                                    }}
                                >
                                    {`HotKey Group #${groupIndex + 1}`}
                                </Typography>
                                <Typography
                                    sx={{
                                        color: "var(--text-muted)",
                                        fontSize: "13px",
                                    }}
                                >
                                    {group.keys && group.keys.length > 0
                                        ? `${group.keys.length} hotkey${group.keys.length !== 1 ? "s" : ""} configured`
                                        : "No hotkeys configured"}
                                </Typography>
                            </Box>
                            <IconButton
                                onClick={() => removeHotkeyGroup(groupIndex)}
                                sx={{
                                    color: "var(--text-secondary)",
                                    width: "36px",
                                    height: "36px",
                                    "&:hover": {
                                        color: "var(--accent-primary)",
                                        backgroundColor: "var(--hover-bg)",
                                    },
                                }}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Box>

                        {/* Modifiers */}
                        <Box sx={{ marginBottom: "24px" }}>
                            <Box sx={{ marginBottom: "16px" }}>
                                <Typography
                                    sx={{
                                        color: "var(--text-primary)",
                                        fontSize: "15px",
                                        fontWeight: 500,
                                    }}
                                >
                                    Modifiers
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: "var(--text-tertiary)",
                                        fontSize: "12px",
                                        display: "block",
                                        marginTop: "4px",
                                        maxWidth: "520px",
                                        lineHeight: 1.45,
                                    }}
                                >
                                    Modifiers are the keys you must hold down to
                                    activate the HotKey group.
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                    gap: "8px",
                                }}
                            >
                                {(group.modifiers || []).map((modifier) => (
                                    <Chip
                                        key={modifier}
                                        label={modifier}
                                        onDelete={() =>
                                            removeModifier(groupIndex, modifier)
                                        }
                                        sx={{
                                            backgroundColor: "var(--accent-bg)",
                                            color: "var(--accent-primary)",
                                            border: "1px solid var(--accent-border)",
                                            fontSize: "12px",
                                            height: "28px",
                                            "& .MuiChip-deleteIcon": {
                                                color: "var(--accent-primary)",
                                                fontSize: "16px",
                                                "&:hover": {
                                                    color: "var(--accent-secondary)",
                                                },
                                            },
                                        }}
                                    />
                                ))}
                                <AddModifierMenuButton
                                    modifiers={group.modifiers}
                                    onPick={(modifier) =>
                                        addModifier(groupIndex, modifier)
                                    }
                                />
                            </Box>
                        </Box>

                        {/* Hotkeys */}
                        <Box>
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    marginBottom: "16px",
                                }}
                            >
                                <Box>
                                    <Typography
                                        sx={{
                                            color: "var(--text-primary)",
                                            fontSize: "15px",
                                            fontWeight: 500,
                                        }}
                                    >
                                        Hotkeys
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: "var(--text-tertiary)",
                                            fontSize: "12px",
                                            display: "block",
                                            marginTop: "4px",
                                            maxWidth: "520px",
                                            lineHeight: 1.45,
                                            marginRight: "16px",
                                        }}
                                    >
                                        Hotkeys map the action to a specific
                                        key.
                                    </Typography>
                                </Box>
                                <Button
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={() => addHotkey(groupIndex)}
                                    sx={{
                                        color: "var(--accent-primary)",
                                        fontSize: "13px",
                                        fontWeight: 500,
                                        padding: "6px 14px",
                                        borderRadius: "8px",
                                        "&:hover": {
                                            backgroundColor: "var(--accent-bg)",
                                        },
                                    }}
                                >
                                    Add Hotkey
                                </Button>
                            </Box>

                            {(group.keys || []).map((hotkey, keyIndex) => (
                                <Box
                                    key={keyIndex}
                                    sx={{
                                        padding: "20px",
                                        marginBottom: "16px",
                                        backgroundColor: "var(--input-bg)",
                                        backdropFilter: "blur(10px)",
                                        borderRadius: "14px",
                                        border: "1px solid var(--input-border)",
                                        transition: "all 0.2s ease",
                                        "&:hover": {
                                            borderColor:
                                                "var(--input-border-hover)",
                                        },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            marginBottom: "16px",
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                color: "var(--text-primary)",
                                                fontSize: "14px",
                                                fontWeight: 600,
                                            }}
                                        >
                                            Hotkey {keyIndex + 1}
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            onClick={() =>
                                                removeHotkey(
                                                    groupIndex,
                                                    keyIndex,
                                                )
                                            }
                                            sx={{
                                                color: "var(--text-secondary)",
                                                width: "32px",
                                                height: "32px",
                                                "&:hover": {
                                                    color: "var(--accent-primary)",
                                                    backgroundColor:
                                                        "var(--hover-bg)",
                                                },
                                            }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>

                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexDirection: {
                                                xs: "column",
                                                md: "row",
                                            },
                                            alignItems: {
                                                xs: "stretch",
                                                md: "flex-end",
                                            },
                                            gap: "12px",
                                        }}
                                    >
                                        <FormControl
                                            size="small"
                                            sx={{
                                                width: {
                                                    xs: "100%",
                                                    md: "112px",
                                                },
                                                flexShrink: 0,
                                            }}
                                        >
                                            <InputLabel
                                                sx={{
                                                    color: "var(--text-secondary)",
                                                }}
                                            >
                                                Key
                                            </InputLabel>
                                            <Select
                                                value={hotkey.key || ""}
                                                onChange={(e) =>
                                                    updateHotkey(
                                                        groupIndex,
                                                        keyIndex,
                                                        "key",
                                                        e.target.value,
                                                    )
                                                }
                                                input={
                                                    <OutlinedInput label="Key" />
                                                }
                                                sx={{
                                                    backgroundColor:
                                                        "var(--input-bg)",
                                                    backdropFilter:
                                                        "blur(10px)",
                                                    color: "var(--text-primary)",
                                                    borderRadius: "10px",
                                                    "& .MuiOutlinedInput-notchedOutline":
                                                        {
                                                            borderColor:
                                                                "var(--input-border)",
                                                        },
                                                    "&:hover .MuiOutlinedInput-notchedOutline":
                                                        {
                                                            borderColor:
                                                                "var(--input-border-hover)",
                                                        },
                                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                                        {
                                                            borderColor:
                                                                "var(--accent-border)",
                                                        },
                                                }}
                                                MenuProps={selectMenuProps}
                                            >
                                                {KEY_OPTIONS.map((key) => (
                                                    <MenuItem
                                                        key={key}
                                                        value={key}
                                                    >
                                                        {key}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        <FormControl
                                            size="small"
                                            sx={{
                                                flex: 1,
                                                minWidth: 0,
                                                width: {
                                                    xs: "100%",
                                                    md: "auto",
                                                },
                                            }}
                                        >
                                            <InputLabel
                                                sx={{
                                                    color: "var(--text-secondary)",
                                                }}
                                            >
                                                Action
                                            </InputLabel>
                                            <Select
                                                value={
                                                    hotkey.action?.action ||
                                                    "mute"
                                                }
                                                onChange={(e) =>
                                                    updateHotkey(
                                                        groupIndex,
                                                        keyIndex,
                                                        "action",
                                                        e.target.value,
                                                    )
                                                }
                                                input={
                                                    <OutlinedInput label="Action" />
                                                }
                                                sx={{
                                                    backgroundColor:
                                                        "var(--input-bg)",
                                                    backdropFilter:
                                                        "blur(10px)",
                                                    color: "var(--text-primary)",
                                                    borderRadius: "10px",
                                                    "& .MuiOutlinedInput-notchedOutline":
                                                        {
                                                            borderColor:
                                                                "var(--input-border)",
                                                        },
                                                    "&:hover .MuiOutlinedInput-notchedOutline":
                                                        {
                                                            borderColor:
                                                                "var(--input-border-hover)",
                                                        },
                                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                                        {
                                                            borderColor:
                                                                "var(--accent-border)",
                                                        },
                                                }}
                                                MenuProps={selectMenuProps}
                                            >
                                                {ACTION_OPTIONS.map(
                                                    (option) => (
                                                        <MenuItem
                                                            key={option.value}
                                                            value={option.value}
                                                        >
                                                            {option.label}
                                                        </MenuItem>
                                                    ),
                                                )}
                                            </Select>
                                        </FormControl>

                                        {(hotkey.action?.action ===
                                            "increase-volume" ||
                                            hotkey.action?.action ===
                                                "decrease-volume") && (
                                            <Tooltip
                                                title="Volume step (0–1). Decimal values allowed."
                                                arrow
                                                placement="top"
                                            >
                                                <TextField
                                                    size="small"
                                                    label="Step"
                                                    value={
                                                        hotkey.action?.value ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        updateHotkey(
                                                            groupIndex,
                                                            keyIndex,
                                                            "value",
                                                            sanitizeNumericVolumeInput(
                                                                e.target.value,
                                                            ),
                                                        )
                                                    }
                                                    inputProps={{
                                                        inputMode: "decimal",
                                                        "aria-label":
                                                            "Volume step",
                                                        autoComplete: "off",
                                                    }}
                                                    sx={{
                                                        width: {
                                                            xs: "100%",
                                                            md: "88px",
                                                        },
                                                        flexShrink: 0,
                                                        "& .MuiOutlinedInput-root":
                                                            {
                                                                backgroundColor:
                                                                    "var(--input-bg)",
                                                                backdropFilter:
                                                                    "blur(10px)",
                                                                color: "var(--text-primary)",
                                                                borderRadius:
                                                                    "10px",
                                                                "& fieldset": {
                                                                    borderColor:
                                                                        "var(--input-border)",
                                                                },
                                                                "&:hover fieldset":
                                                                    {
                                                                        borderColor:
                                                                            "var(--input-border-hover)",
                                                                    },
                                                                "&.Mui-focused fieldset":
                                                                    {
                                                                        borderColor:
                                                                            "var(--accent-border)",
                                                                    },
                                                            },
                                                        "& .MuiInputLabel-root":
                                                            {
                                                                color: "var(--text-secondary)",
                                                            },
                                                    }}
                                                />
                                            </Tooltip>
                                        )}

                                        {hotkey.action?.action !==
                                            "toggle-osk-helpers" && (
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                    flexShrink: 0,
                                                    alignSelf: {
                                                        xs: "center",
                                                        md: "flex-end",
                                                    },
                                                }}
                                            >
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: "var(--text-secondary)",
                                                        fontSize: "12px",
                                                        fontWeight: 500,
                                                        lineHeight: 1.2,
                                                        alignSelf: {
                                                            xs: "flex-start",
                                                            md: "center",
                                                        },
                                                    }}
                                                >
                                                    Device
                                                </Typography>
                                                <HotkeyDeviceMenu
                                                    value={
                                                        hotkey.action?.target ||
                                                        "all"
                                                    }
                                                    onChange={(v) =>
                                                        updateHotkey(
                                                            groupIndex,
                                                            keyIndex,
                                                            "target",
                                                            v,
                                                        )
                                                    }
                                                />
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            ))}

                            {(!group.keys || group.keys.length === 0) && (
                                <Box
                                    sx={{
                                        textAlign: "center",
                                        padding: "32px",
                                        backgroundColor:
                                            "var(--hover-bg-light)",
                                        borderRadius: "12px",
                                        border: "1px dashed var(--input-border)",
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontSize: "14px",
                                            color: "var(--text-tertiary)",
                                            marginBottom: "12px",
                                        }}
                                    >
                                        No hotkeys configured
                                    </Typography>
                                    <Button
                                        size="small"
                                        startIcon={<AddIcon />}
                                        onClick={() => addHotkey(groupIndex)}
                                        sx={{
                                            color: "var(--accent-primary)",
                                            fontSize: "13px",
                                            fontWeight: 500,
                                            padding: "6px 14px",
                                            borderRadius: "8px",
                                            "&:hover": {
                                                backgroundColor:
                                                    "var(--accent-bg)",
                                            },
                                        }}
                                    >
                                        Add First Hotkey
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    </GlassCard>
                ))
            )}
        </Box>
    );
}

export default HotkeysPage;
