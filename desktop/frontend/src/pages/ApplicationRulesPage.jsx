import { useState, useEffect, useRef, useCallback } from "react";
import {
    Box,
    Typography,
    TextField,
    InputAdornment,
    IconButton,
    Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AppsIcon from "@mui/icons-material/Apps";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import { PageHeader, GlassCard } from "../components/common";
import { RuleCard, DefaultRuleCard } from "../components/rules";
import { glassCardStyle } from "../constants";
import {
    GetInfoBannerDismissed,
    SetInfoBannerDismissed,
    GetApplicationRulesHeroContext,
} from "../../wailsjs/go/app/AppRules";

const profileToDisplayLocal = (profile) => profile ?? "None";

function ApplicationRulesPage({
    rules,
    onAddRule,
    onRemoveRule,
    onRuleProfileChange,
    onRuleToggle,
    unknownApplicationsDefault,
    onUnknownApplicationsDefaultChange,
    searchQuery,
    setSearchQuery,
    keyboardProfiles = [],
    mouseProfiles = [],
    platform = "",
    onHeroUpdateRule,
    onOpenAddRuleWithPrefill,
}) {
    const [showInfoBanner, setShowInfoBanner] = useState(false); // Start hidden until we load the preference
    const [infoBannerLoaded, setInfoBannerLoaded] = useState(false);
    const [newRuleIds, setNewRuleIds] = useState(new Set());
    const [exitingRuleIds, setExitingRuleIds] = useState(new Set());
    const prevRuleIdsRef = useRef(null); // Start as null to detect initial render

    // Load info banner dismissed state from backend
    useEffect(() => {
        const loadInfoBannerState = async () => {
            try {
                const dismissed = await GetInfoBannerDismissed();
                setShowInfoBanner(!dismissed);
            } catch (error) {
                console.error("Failed to load info banner state:", error);
                setShowInfoBanner(true); // Show by default on error
            } finally {
                setInfoBannerLoaded(true);
            }
        };
        loadInfoBannerState();
    }, []);

    // Handle dismissing the info banner
    const handleDismissInfoBanner = async () => {
        setShowInfoBanner(false);
        try {
            await SetInfoBannerDismissed(true);
        } catch (error) {
            console.error("Failed to save info banner state:", error);
        }
    };

    // Track newly added rules
    useEffect(() => {
        const currentIds = new Set(rules.map((r) => r.id));
        const prevIds = prevRuleIdsRef.current;

        // On initial render (prevIds is null), just initialize the ref without animations
        if (prevIds === null) {
            prevRuleIdsRef.current = currentIds;
            return;
        }

        // Find new IDs that weren't in the previous set
        const addedIds = [...currentIds].filter((id) => !prevIds.has(id));

        // Always update the ref to current state
        prevRuleIdsRef.current = currentIds;

        if (addedIds.length > 0) {
            setNewRuleIds((prev) => new Set([...prev, ...addedIds]));

            // Clear the "new" status after animation completes
            const timer = setTimeout(() => {
                setNewRuleIds((prev) => {
                    const updated = new Set(prev);
                    addedIds.forEach((id) => updated.delete(id));
                    return updated;
                });
            }, 800); // Match animation duration

            return () => clearTimeout(timer);
        }
    }, [rules]);

    // Handle animated removal
    const handleRemoveWithAnimation = (ruleId) => {
        setExitingRuleIds((prev) => new Set([...prev, ruleId]));

        // Wait for animation to complete before actually removing
        setTimeout(() => {
            setExitingRuleIds((prev) => {
                const updated = new Set(prev);
                updated.delete(ruleId);
                return updated;
            });
            onRemoveRule(ruleId);
        }, 350); // Match exit animation duration
    };

    const filteredRules = rules.filter((rule) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            rule.executableName.toLowerCase().includes(query) ||
            rule.path.toLowerCase().includes(query)
        );
    });

    return (
        <Box>
            <PageHeader title="Application Rules">
                <Box
                    sx={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                    <TextField
                        placeholder="Search rules..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        size="small"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon
                                        sx={{
                                            color: "var(--text-tertiary)",
                                            fontSize: "18px",
                                        }}
                                    />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            width: "300px",
                            "& .MuiOutlinedInput-root": {
                                backgroundColor: "var(--input-bg)",
                                backdropFilter: "blur(10px)",
                                color: "var(--text-primary)",
                                borderRadius: "10px",
                                fontSize: "14px",
                                "& fieldset": {
                                    borderColor: "var(--input-border)",
                                },
                                "&:hover fieldset": {
                                    borderColor: "var(--input-border-hover)",
                                },
                                "&.Mui-focused fieldset": {
                                    borderColor: "var(--accent-border)",
                                },
                                "& input": {
                                    color: "var(--text-primary)",
                                    "&::placeholder": {
                                        color: "var(--text-muted)",
                                        opacity: 1,
                                    },
                                },
                            },
                        }}
                    />
                    <IconButton
                        onClick={onAddRule}
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
                    >
                        <AddIcon />
                    </IconButton>
                </Box>
            </PageHeader>

            {/* Info Banner */}
            {infoBannerLoaded && showInfoBanner && (
                <GlassCard
                    sx={{
                        marginBottom: "24px",
                        background:
                            "linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, var(--card-bg))",
                        border: "1px solid rgba(59, 130, 246, 0.25)",
                        position: "relative",
                    }}
                >
                    {/* Close Button */}
                    <IconButton
                        onClick={handleDismissInfoBanner}
                        sx={{
                            position: "absolute",
                            top: "12px",
                            right: "12px",
                            width: "28px",
                            height: "28px",
                            color: "var(--text-muted)",
                            "&:hover": {
                                color: "var(--text-secondary)",
                                backgroundColor: "var(--hover-bg-light)",
                            },
                        }}
                    >
                        <CloseIcon sx={{ fontSize: "18px" }} />
                    </IconButton>

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "16px",
                            paddingRight: "32px",
                        }}
                    >
                        <Box
                            sx={{
                                width: "48px",
                                height: "48px",
                                borderRadius: "12px",
                                background:
                                    "linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(59, 130, 246, 0.15) 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}
                        >
                            <InfoOutlinedIcon
                                sx={{ fontSize: "24px", color: "#60a5fa" }}
                            />
                        </Box>
                        <Box>
                            <Typography
                                sx={{
                                    color: "var(--text-primary)",
                                    fontSize: "15px",
                                    fontWeight: 600,
                                    marginBottom: "6px",
                                }}
                            >
                                What are Application Rules?
                            </Typography>
                            <Typography
                                sx={{
                                    color: "var(--text-secondary)",
                                    fontSize: "13px",
                                    lineHeight: 1.6,
                                }}
                            >
                                Application rules let you customize which
                                keyboard and mouse sound profiles are used for
                                specific applications. When an application is in
                                focus, its assigned profiles will automatically
                                be used instead of the global defaults.
                            </Typography>
                        </Box>
                    </Box>
                </GlassCard>
            )}

            {platform !== "linux" &&
                onHeroUpdateRule &&
                onOpenAddRuleWithPrefill && (
                    <ApplicationRulesHero
                        rules={rules}
                        keyboardProfiles={keyboardProfiles}
                        mouseProfiles={mouseProfiles}
                        platform={platform}
                        onHeroUpdateRule={onHeroUpdateRule}
                        onOpenAddRuleWithPrefill={onOpenAddRuleWithPrefill}
                        onRuleToggle={onRuleToggle}
                        onRemoveRuleWithAnimation={handleRemoveWithAnimation}
                    />
                )}

            {/* Application Rules Section */}
            <Box sx={{ marginBottom: "24px" }}>
                <SectionHeader
                    title="Application Rules"
                    subtitle={
                        rules.length > 0
                            ? `${rules.length} rule${rules.length !== 1 ? "s" : ""} configured`
                            : "No rules configured yet"
                    }
                    icon={<AppsIcon />}
                    count={
                        filteredRules.length !== rules.length
                            ? `Showing ${filteredRules.length}`
                            : null
                    }
                />

                <Box sx={{ marginBottom: "20px" }}>
                    <DefaultRuleCard
                        defaultSettings={unknownApplicationsDefault}
                        onProfileChange={onUnknownApplicationsDefaultChange}
                        keyboardProfiles={keyboardProfiles}
                        mouseProfiles={mouseProfiles}
                    />
                </Box>

                {rules.length === 0 ? (
                    <EmptyState onAddRule={onAddRule} />
                ) : filteredRules.length === 0 && searchQuery ? (
                    <Box
                        sx={{
                            ...glassCardStyle,
                            padding: "48px",
                            textAlign: "center",
                        }}
                    >
                        <SearchIcon
                            sx={{
                                fontSize: "48px",
                                color: "var(--text-muted)",
                                marginBottom: "16px",
                            }}
                        />
                        <Typography
                            variant="body1"
                            sx={{
                                color: "var(--text-tertiary)",
                                fontSize: "15px",
                            }}
                        >
                            No rules found matching &quot;{searchQuery}&quot;
                        </Typography>
                    </Box>
                ) : (
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                        }}
                    >
                        {filteredRules.map((rule) => (
                            <RuleCard
                                key={rule.id}
                                rule={rule}
                                platform={platform}
                                onProfileChange={(profileType, value) =>
                                    onRuleProfileChange(
                                        rule.id,
                                        profileType,
                                        value,
                                    )
                                }
                                onRemove={() =>
                                    handleRemoveWithAnimation(rule.id)
                                }
                                onToggle={() => onRuleToggle(rule.id)}
                                isNew={newRuleIds.has(rule.id)}
                                isExiting={exitingRuleIds.has(rule.id)}
                                keyboardProfiles={keyboardProfiles}
                                mouseProfiles={mouseProfiles}
                            />
                        ))}
                    </Box>
                )}
            </Box>

            {/* Tips Section */}
            <TipsCard />
        </Box>
    );
}

function ApplicationRulesHero({
    rules = [],
    keyboardProfiles = [],
    mouseProfiles = [],
    onHeroUpdateRule,
    onOpenAddRuleWithPrefill,
    onRuleToggle,
    onRemoveRuleWithAnimation,
    platform = "",
}) {
    const [hero, setHero] = useState(null);
    const [draftKb, setDraftKb] = useState("None");
    const [draftMouse, setDraftMouse] = useState("None");
    const lastPathRef = useRef("");

    const loadHero = useCallback(async () => {
        try {
            const ctx = await GetApplicationRulesHeroContext();
            setHero(ctx);
        } catch (error) {
            console.error(
                "Failed to load application rules hero context:",
                error,
            );
        }
    }, []);

    useEffect(() => {
        loadHero();
    }, [loadHero]);

    useEffect(() => {
        const id = setInterval(loadHero, 1500);
        return () => clearInterval(id);
    }, [loadHero]);

    useEffect(() => {
        if (!hero?.appPath) {
            lastPathRef.current = "";
            return;
        }
        if (hero.appPath !== lastPathRef.current) {
            lastPathRef.current = hero.appPath;
            setDraftKb(profileToDisplayLocal(hero.keyboardProfile));
            setDraftMouse(profileToDisplayLocal(hero.mouseProfile));
        }
    }, [hero]);

    if (!hero?.supported) {
        return null;
    }

    const hasApp = Boolean(hero.appPath);
    if (!hasApp) {
        return null;
    }
    const matchingRulePath = hero.matchingRulePath ?? null;
    const hasExistingRule = Boolean(matchingRulePath);
    const matchingRule = matchingRulePath
        ? rules.find((r) => r.id === matchingRulePath)
        : null;
    const matchingRuleEnabled = matchingRule
        ? matchingRule.enabled !== false
        : true;

    const handleSaveNew = () => {
        if (!hasApp) return;
        onOpenAddRuleWithPrefill({
            appPath: hero.appPath,
            keyboardProfile: draftKb,
            mouseProfile: draftMouse,
        });
    };

    const heroBadgeChipSx = {
        backgroundColor: "rgba(139, 92, 246, 0.2)",
        color: "#a78bfa",
        fontSize: "10px",
        fontWeight: 600,
        height: "20px",
        border: "1px solid rgba(139, 92, 246, 0.3)",
        "& .MuiChip-label": {
            padding: "0 8px",
        },
    };

    return (
        <Box sx={{ marginBottom: "24px" }}>
            <SectionHeader
                title="Last Active application"
                titleExtras={
                    <>
                        {hasApp ? (
                            <Chip
                                label={
                                    hero.usingDefaults
                                        ? "Using global default"
                                        : "Rule applies"
                                }
                                size="small"
                                sx={heroBadgeChipSx}
                            />
                        ) : null}
                        {hero.focusIsSelf ? (
                            <Chip
                                label="This app is focused"
                                size="small"
                                sx={heroBadgeChipSx}
                            />
                        ) : null}
                    </>
                }
                subtitle="Profiles used for the last focused app."
                icon={<AppsIcon />}
            />

            <RuleCard
                rule={{
                    id: hero.appPath,
                    executableName: hero.executableName,
                    path: hero.appPath,
                    keyboardProfile: draftKb,
                    mouseProfile: draftMouse,
                    enabled: hasExistingRule ? matchingRuleEnabled : true,
                }}
                platform={platform}
                keyboardProfiles={keyboardProfiles}
                mouseProfiles={mouseProfiles}
                mode={hasExistingRule ? "existing" : "create"}
                createButtonLabel="Add rule"
                createButtonVariant="icon"
                onCreate={handleSaveNew}
                onToggle={() => {
                    if (!hasExistingRule || !matchingRulePath) return;
                    onRuleToggle(matchingRulePath);
                }}
                onRemove={() => {
                    if (!hasExistingRule || !matchingRulePath) return;
                    onRemoveRuleWithAnimation(matchingRulePath);
                }}
                onProfileChange={(profileType, value) => {
                    const nextKb =
                        profileType === "keyboardProfile" ? value : draftKb;
                    const nextMouse =
                        profileType === "mouseProfile" ? value : draftMouse;
                    setDraftKb(nextKb);
                    setDraftMouse(nextMouse);
                    if (hasExistingRule && matchingRulePath) {
                        onHeroUpdateRule(matchingRulePath, nextKb, nextMouse);
                    }
                }}
            />
        </Box>
    );
}

// Section Header Component
function SectionHeader({ title, subtitle, icon, count, titleExtras = null }) {
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Box
                    sx={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        background:
                            "linear-gradient(135deg, var(--accent-bg) 0%, var(--accent-bg-hover) 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {icon && (
                        <Box
                            sx={{
                                color: "var(--accent-primary)",
                                fontSize: "18px",
                                display: "flex",
                            }}
                        >
                            {icon}
                        </Box>
                    )}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            flexWrap: "wrap",
                        }}
                    >
                        <Typography
                            component="span"
                            sx={{
                                color: "var(--text-primary)",
                                fontSize: "16px",
                                fontWeight: 600,
                            }}
                        >
                            {title}
                        </Typography>
                        {titleExtras}
                    </Box>
                    {subtitle ? (
                        <Typography
                            sx={{
                                color: "var(--text-muted)",
                                fontSize: "12px",
                                marginTop: "2px",
                            }}
                        >
                            {subtitle}
                        </Typography>
                    ) : null}
                </Box>
            </Box>
            {count && (
                <Chip
                    label={count}
                    size="small"
                    sx={{
                        backgroundColor: "var(--hover-bg-light)",
                        color: "var(--text-secondary)",
                        fontSize: "11px",
                        height: "24px",
                    }}
                />
            )}
        </Box>
    );
}

// Empty State Component
function EmptyState({ onAddRule }) {
    return (
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
                <FolderOpenIcon
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
                No Application Rules Yet
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
                Create your first rule to customize sound profiles for specific
                applications. Rules will automatically apply when the
                application is in focus.
            </Typography>
            <Box
                component="button"
                onClick={onAddRule}
                sx={{
                    background:
                        "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)",
                    color: "white",
                    fontWeight: 600,
                    fontSize: "14px",
                    padding: "12px 24px",
                    borderRadius: "12px",
                    border: "none",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 4px 16px var(--accent-shadow)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                        boxShadow: "0 6px 20px var(--accent-shadow)",
                        transform: "translateY(-2px)",
                    },
                }}
            >
                <AddIcon sx={{ fontSize: "20px" }} />
                Create Your First Rule
            </Box>
        </Box>
    );
}

// Tips Card Component
function TipsCard() {
    const tips = [
        {
            title: "Per-App Profiles",
            description:
                'Set "None" for both keyboard and mouse to silence sounds in specific apps like video editors or games.',
        },
        {
            title: "Glob Patterns",
            description:
                "Rules are matched by executable path, so you can use glob patterns to match multiple applications or applications where a part of the path changes frequently.",
        },
        {
            title: "Priority",
            description:
                "When an application has a rule, it takes priority over the default profile settings.",
        },
    ];

    return (
        <GlassCard
            sx={{
                background:
                    "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, var(--card-bg))",
                border: "1px solid rgba(245, 158, 11, 0.2)",
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "20px",
                }}
            >
                <Box
                    sx={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        background:
                            "linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(245, 158, 11, 0.1) 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <TipsAndUpdatesIcon
                        sx={{ fontSize: "20px", color: "#f59e0b" }}
                    />
                </Box>
                <Typography
                    sx={{
                        color: "var(--text-primary)",
                        fontSize: "16px",
                        fontWeight: 600,
                    }}
                >
                    Tips & Tricks
                </Typography>
            </Box>
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "16px",
                }}
            >
                {tips.map((tip, index) => (
                    <Box
                        key={index}
                        sx={{
                            padding: "14px",
                            borderRadius: "10px",
                            backgroundColor: "var(--hover-bg-light)",
                            border: "1px solid var(--card-border)",
                        }}
                    >
                        <Typography
                            sx={{
                                color: "#fbbf24",
                                fontSize: "13px",
                                fontWeight: 600,
                                marginBottom: "6px",
                            }}
                        >
                            {tip.title}
                        </Typography>
                        <Typography
                            sx={{
                                color: "var(--text-tertiary)",
                                fontSize: "12px",
                                lineHeight: 1.5,
                            }}
                        >
                            {tip.description}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </GlassCard>
    );
}

export default ApplicationRulesPage;
