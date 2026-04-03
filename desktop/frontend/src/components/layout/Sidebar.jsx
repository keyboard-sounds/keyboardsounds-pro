import { useState, useEffect, useRef } from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import StatusBox from "./StatusBox";
import SidebarMenu from "./SidebarMenu";
import { menuItems as defaultMenuItems } from "../../constants";
import DiscordIcon from "../icons/DiscordIcon";
import GitHubIcon from "@mui/icons-material/GitHub";
import { BrowserOpenURL } from "../../../wailsjs/runtime/runtime";

function Sidebar({
    customTitleBarEnabled = true,
    menuItems = defaultMenuItems,
    platform = "",
    selectedTab,
    setSelectedTab,
    isPaused,
    setIsPaused,
    keyboardVolume,
    setKeyboardVolume,
    mouseVolume,
    setMouseVolume,
    keyboardMuted,
    setKeyboardMuted,
    onKeyboardMuteToggle,
    mouseMuted,
    setMouseMuted,
    onMouseMuteToggle,
    volumesLocked,
    setVolumesLocked,
    keyboardProfile,
    setKeyboardProfile,
    mouseProfile,
    setMouseProfile,
    keyboardProfiles,
    mouseProfiles,
    isLoading,
    isStarting = false,
    hideStatusBoxDefaultProfile = false,
    lastFocusedApp = null,
    onAddRuleForLastFocusedApp,
    onDismissLastFocusedApp,
}) {
    const [sidebarWidth, setSidebarWidth] = useState(350);
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef(null);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing) return;

            const newWidth = e.clientX;
            const minWidth = 300;
            const maxWidth = 400;

            if (newWidth >= minWidth && newWidth <= maxWidth) {
                setSidebarWidth(newWidth);
            } else if (newWidth < minWidth) {
                setSidebarWidth(minWidth);
            } else if (newWidth > maxWidth) {
                setSidebarWidth(maxWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
        }

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };
    }, [isResizing]);

    return (
        <Box
            ref={sidebarRef}
            sx={{
                width: `${sidebarWidth}px`,
                flexShrink: 0,
                position: "relative",
                marginTop: customTitleBarEnabled ? "40px" : 0,
                height:
                    platform === "darwin"
                        ? "100vh"
                        : customTitleBarEnabled
                          ? "calc(100vh - 40px)"
                          : "100vh",
                top: platform === "darwin" ? "-40px" : "0px",
                overflow: "visible",
                zIndex: customTitleBarEnabled ? 1400 : 1000,
            }}
        >
            <Box
                sx={{
                    width: sidebarWidth,
                    height: "100%",
                    background: "var(--sidebar-bg)",
                    backdropFilter: "blur(30px) saturate(180%)",
                    WebkitBackdropFilter: "blur(30px) saturate(180%)",
                    position: "absolute",
                    left: 0,
                    top: 0,
                    zIndex: 1000,
                    boxShadow:
                        "var(--sidebar-shadow), inset -1px 0 0 var(--card-highlight)",
                    overflowX: "hidden",
                    overflowY: "hidden",
                    borderRight: "1px solid var(--sidebar-border)",
                    display: "flex",
                    flexDirection: "column",
                    paddingTop: 0,
                }}
            >
                {platform === "darwin" && (
                    <Box
                        className="title-bar-drag"
                        sx={{
                            height: "38px",
                            marginTop: "8px",
                            display: "flex",
                            alignItems: "center",
                            padding: "16px",
                            justifyContent: "right",
                            gap: "10px",
                            color: "var(--text-secondary)",
                            fontSize: "14px",
                            fontWeight: 600,
                            letterSpacing: "0.3px",
                            flexShrink: 0,
                            position: "relative",
                            zIndex: 1401,
                            pointerEvents: "auto",
                            "--wails-draggable": "drag",
                        }}
                    >
                        <Tooltip title="Open GitHub repository" arrow>
                            <IconButton
                                size="small"
                                onClick={() =>
                                    BrowserOpenURL(
                                        "https://github.com/keyboard-sounds/keyboardsounds-pro",
                                    )
                                }
                                aria-label="Open GitHub repository"
                                sx={{
                                    width: "30px",
                                    height: "30px",
                                    color: "var(--text-secondary)",
                                    "--wails-draggable": "no-drag",
                                    "&:hover": {
                                        backgroundColor: "var(--hover-bg)",
                                        color: "var(--text-primary)",
                                    },
                                }}
                            >
                                <GitHubIcon
                                    sx={{ width: "20px", height: "20px" }}
                                />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Join Discord community" arrow>
                            <IconButton
                                size="small"
                                onClick={() =>
                                    BrowserOpenURL(
                                        "https://discord.gg/5jM9ER8fJ7",
                                    )
                                }
                                aria-label="Join Discord community"
                                sx={{
                                    width: "30px",
                                    height: "30px",
                                    color: "var(--text-secondary)",
                                    "--wails-draggable": "no-drag",
                                    "&:hover": {
                                        backgroundColor: "var(--hover-bg)",
                                        color: "var(--text-primary)",
                                    },
                                }}
                            >
                                <DiscordIcon
                                    sx={{
                                        width: "20px",
                                        height: "20px",
                                        objectFit: "contain",
                                    }}
                                />
                            </IconButton>
                        </Tooltip>
                    </Box>
                )}
                <StatusBox
                    platform={platform}
                    isPaused={isPaused}
                    setIsPaused={setIsPaused}
                    keyboardVolume={keyboardVolume}
                    setKeyboardVolume={setKeyboardVolume}
                    mouseVolume={mouseVolume}
                    setMouseVolume={setMouseVolume}
                    keyboardMuted={keyboardMuted}
                    setKeyboardMuted={setKeyboardMuted}
                    onKeyboardMuteToggle={onKeyboardMuteToggle}
                    mouseMuted={mouseMuted}
                    setMouseMuted={setMouseMuted}
                    onMouseMuteToggle={onMouseMuteToggle}
                    volumesLocked={volumesLocked}
                    setVolumesLocked={setVolumesLocked}
                    keyboardProfile={keyboardProfile}
                    setKeyboardProfile={setKeyboardProfile}
                    mouseProfile={mouseProfile}
                    setMouseProfile={setMouseProfile}
                    keyboardProfiles={keyboardProfiles}
                    mouseProfiles={mouseProfiles}
                    isLoading={isLoading}
                    isStarting={isStarting}
                    hideDefaultProfileSection={hideStatusBoxDefaultProfile}
                    lastFocusedApp={lastFocusedApp}
                    onAddRuleForLastFocusedApp={onAddRuleForLastFocusedApp}
                    onDismissLastFocusedApp={onDismissLastFocusedApp}
                />
                <SidebarMenu
                    menuItems={menuItems}
                    selectedTab={selectedTab}
                    setSelectedTab={setSelectedTab}
                />
            </Box>

            {/* Resize Handle */}
            <Box
                className="sidebar-resize-handle"
                onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsResizing(true);
                }}
                sx={{
                    position: "absolute",
                    right: "-6px",
                    top: 0,
                    width: "12px",
                    height: "100%",
                    cursor: "col-resize",
                    backgroundColor: "transparent",
                    zIndex: 1001,
                    pointerEvents: "auto",
                    transition: "background-color 0.2s",
                    "--wails-draggable": "no-drag",
                    "&:hover": {
                        backgroundColor: "var(--accent-bg)",
                    },
                    "&::before": {
                        content: '""',
                        position: "absolute",
                        left: "6px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "2px",
                        height: "60px",
                        backgroundColor: "var(--resize-handle)",
                        borderRadius: "1px",
                        transition: "all 0.2s",
                    },
                    "&:hover::before": {
                        backgroundColor: "var(--accent-primary)",
                        height: "80px",
                        width: "3px",
                        boxShadow: "0 0 8px var(--accent-shadow)",
                    },
                }}
            />
        </Box>
    );
}

export default Sidebar;
