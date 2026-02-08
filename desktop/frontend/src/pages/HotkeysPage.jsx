import { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Button,
  Chip,
  FormControl,
  InputLabel,
  OutlinedInput,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import KeyboardIcon from "@mui/icons-material/Keyboard";
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
  { value: "all", label: "All Devices" },
  { value: "keyboard", label: "Keyboard" },
  { value: "mouse", label: "Mouse" },
  { value: "none", label: "None" },
];

const MODIFIER_OPTIONS = [
  'LeftControl', 'RightControl', 'LeftShift', 'RightShift',
  'LeftAlt', 'RightAlt', 'LeftWin', 'RightWin'
];

const KEY_OPTIONS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
  'Up', 'Down', 'Left', 'Right',
  'Space', 'Enter', 'Tab', 'Backspace', 'Escape',
  'Home', 'End', 'PageUp', 'PageDown', 'Insert', 'Delete',
];

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
    } else if (field === "action" || field === "target" || field === "value") {
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

  const formatHotkeyDisplay = (group) => {
    const modifiers = (group.modifiers || []).join(" + ");
    if (modifiers && group.keys && group.keys.length > 0) {
      return `${modifiers} + [${group.keys.length} key${group.keys.length !== 1 ? "s" : ""}]`;
    }
    return "No modifiers or keys";
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
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
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
            <InfoOutlinedIcon sx={{ fontSize: "20px", color: "#60a5fa" }} />
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
              Hotkeys will only function when the application is enabled. Make
              sure the app is running and enabled for your configured hotkeys to
              work.
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
            Create your first hotkey group to configure keyboard shortcuts for
            controlling the application.
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
                  {(group.modifiers || []).length > 0
                    ? (group.modifiers || []).join(" + ")
                    : "No Modifiers"}
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
              <Typography
                sx={{
                  color: "var(--text-primary)",
                  fontSize: "15px",
                  fontWeight: 500,
                  marginBottom: "12px",
                }}
              >
                Modifier Keys
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                {(group.modifiers || []).map((modifier) => (
                  <Chip
                    key={modifier}
                    label={modifier}
                    onDelete={() => removeModifier(groupIndex, modifier)}
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
              </Box>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: "var(--text-secondary)" }}>
                  Add Modifier
                </InputLabel>
                <Select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      addModifier(groupIndex, e.target.value);
                      e.target.value = "";
                    }
                  }}
                  input={<OutlinedInput label="Add Modifier" />}
                  sx={{
                    backgroundColor: "var(--input-bg)",
                    backdropFilter: "blur(10px)",
                    color: "var(--text-primary)",
                    borderRadius: "10px",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "var(--input-border)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "var(--input-border-hover)",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "var(--accent-border)",
                    },
                  }}
                  MenuProps={selectMenuProps}
                >
                  {MODIFIER_OPTIONS.filter(
                    (m) => !(group.modifiers || []).includes(m),
                  ).map((modifier) => (
                    <MenuItem key={modifier} value={modifier}>
                      {modifier}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Hotkeys */}
            <Box>
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
                    fontSize: "15px",
                    fontWeight: 500,
                  }}
                >
                  Hotkeys
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
                      borderColor: "var(--input-border-hover)",
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
                      onClick={() => removeHotkey(groupIndex, keyIndex)}
                      sx={{
                        color: "var(--text-secondary)",
                        width: "32px",
                        height: "32px",
                        "&:hover": {
                          color: "var(--accent-primary)",
                          backgroundColor: "var(--hover-bg)",
                        },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    <FormControl size="small">
                      <InputLabel sx={{ color: "var(--text-secondary)" }}>
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
                        input={<OutlinedInput label="Key" />}
                        sx={{
                          backgroundColor: "var(--input-bg)",
                          backdropFilter: "blur(10px)",
                          color: "var(--text-primary)",
                          borderRadius: "10px",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "var(--input-border)",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "var(--input-border-hover)",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "var(--accent-border)",
                          },
                        }}
                        MenuProps={selectMenuProps}
                      >
                        {KEY_OPTIONS.map((key) => (
                          <MenuItem key={key} value={key}>
                            {key}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl size="small">
                      <InputLabel sx={{ color: "var(--text-secondary)" }}>
                        Action
                      </InputLabel>
                      <Select
                        value={hotkey.action?.action || "mute"}
                        onChange={(e) =>
                          updateHotkey(
                            groupIndex,
                            keyIndex,
                            "action",
                            e.target.value,
                          )
                        }
                        input={<OutlinedInput label="Action" />}
                        sx={{
                          backgroundColor: "var(--input-bg)",
                          backdropFilter: "blur(10px)",
                          color: "var(--text-primary)",
                          borderRadius: "10px",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "var(--input-border)",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "var(--input-border-hover)",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "var(--accent-border)",
                          },
                        }}
                        MenuProps={selectMenuProps}
                      >
                        {ACTION_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                    }}
                  >
                    {/* Hide device selector for toggle-osk-helpers action */}
                    {hotkey.action?.action !== "toggle-osk-helpers" && (
                      <FormControl size="small">
                        <InputLabel sx={{ color: "var(--text-secondary)" }}>
                          Device
                        </InputLabel>
                        <Select
                          value={hotkey.action?.target || "all"}
                          onChange={(e) =>
                            updateHotkey(
                              groupIndex,
                              keyIndex,
                              "target",
                              e.target.value,
                            )
                          }
                          input={<OutlinedInput label="Device" />}
                          sx={{
                            backgroundColor: "var(--input-bg)",
                            backdropFilter: "blur(10px)",
                            color: "var(--text-primary)",
                            borderRadius: "10px",
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "var(--input-border)",
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "var(--input-border-hover)",
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: "var(--accent-border)",
                            },
                          }}
                          MenuProps={selectMenuProps}
                        >
                          {DEVICE_OPTIONS.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}

                    {(hotkey.action?.action === "increase-volume" ||
                      hotkey.action?.action === "decrease-volume") && (
                      <TextField
                        size="small"
                        label="Value"
                        type="number"
                        value={hotkey.action?.value || ""}
                        onChange={(e) =>
                          updateHotkey(
                            groupIndex,
                            keyIndex,
                            "value",
                            e.target.value,
                          )
                        }
                        inputProps={{ step: "0.1", min: "0", max: "1" }}
                        helperText="Volume change amount (0.0 - 1.0)"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            backgroundColor: "var(--input-bg)",
                            backdropFilter: "blur(10px)",
                            color: "var(--text-primary)",
                            borderRadius: "10px",
                            "& fieldset": {
                              borderColor: "var(--input-border)",
                            },
                            "&:hover fieldset": {
                              borderColor: "var(--input-border-hover)",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "var(--accent-border)",
                            },
                          },
                          "& .MuiInputLabel-root": {
                            color: "var(--text-secondary)",
                          },
                          "& .MuiFormHelperText-root": {
                            color: "var(--text-muted)",
                            fontSize: "11px",
                          },
                        }}
                      />
                    )}
                  </Box>
                </Box>
              ))}

              {(!group.keys || group.keys.length === 0) && (
                <Box
                  sx={{
                    textAlign: "center",
                    padding: "32px",
                    backgroundColor: "var(--hover-bg-light)",
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
                        backgroundColor: "var(--accent-bg)",
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
