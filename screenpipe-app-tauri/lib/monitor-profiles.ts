/**
 * Monitor Profiles Module
 * 
 * Provides preset configurations for common multi-monitor setups.
 * Profiles are:
 * - Named and descriptive
 * - Quick to switch between
 * - Non-destructive (can always revert)
 * - Shareable (can export/import)
 * 
 * Audit Trail:
 * - Every profile application is logged
 * - Previous state is preserved
 * - Changes are reversible
 */

import type { MonitorDevice } from "@/components/settings/monitor-arrangement";

export interface MonitorProfile {
    id: string;
    name: string;
    description: string;
    icon: string;
    rule: ProfileRule;
    createdAt?: string;
    lastUsed?: string;
    useCount?: number;
}

export type ProfileRule =
    | { type: "all" }
    | { type: "primary" }
    | { type: "largest" }
    | { type: "specific"; monitorIds: string[] }
    | { type: "external-only" }
    | { type: "laptop-only" }
    | { type: "by-resolution"; minWidth: number; minHeight: number };

export interface ProfileApplication {
    profileId: string;
    appliedAt: string;
    previousState: {
        selectedIds: string[];
        useAll: boolean;
    };
    newState: {
        selectedIds: string[];
        useAll: boolean;
    };
    monitors: MonitorDevice[];
}

/**
 * Built-in profiles that cover common use cases
 */
export const BUILTIN_PROFILES: MonitorProfile[] = [
    {
        id: "all-monitors",
        name: "All Monitors",
        description: "Record from all connected displays",
        icon: "🖥️",
        rule: { type: "all" },
    },
    {
        id: "primary-only",
        name: "Primary Display",
        description: "Record only your main working display",
        icon: "⭐",
        rule: { type: "primary" },
    },
    {
        id: "largest-monitor",
        name: "Largest Monitor",
        description: "Record the monitor with the highest resolution",
        icon: "📺",
        rule: { type: "largest" },
    },
    {
        id: "external-only",
        name: "External Display",
        description: "Record external monitor only (laptop + external setups)",
        icon: "🖥️",
        rule: { type: "external-only" },
    },
    {
        id: "laptop-only",
        name: "Laptop Screen",
        description: "Record built-in laptop display only",
        icon: "💻",
        rule: { type: "laptop-only" },
    },
    {
        id: "high-res-only",
        name: "High Resolution",
        description: "Record only monitors with 1920×1080 or higher",
        icon: "🎯",
        rule: { type: "by-resolution", minWidth: 1920, minHeight: 1080 },
    },
];

/**
 * Apply a profile to get monitor selection
 */
export function applyProfile(
    profile: MonitorProfile,
    monitors: MonitorDevice[]
): {
    selectedIds: string[];
    useAll: boolean;
    rationale: string;
} {
    const rule = profile.rule;

    switch (rule.type) {
        case "all":
            return {
                selectedIds: monitors.map((m) => m.id),
                useAll: true,
                rationale: `Applied "${profile.name}" profile - recording all ${monitors.length} monitors`,
            };

        case "primary": {
            const primary = monitors.find((m) => m.is_default);
            if (!primary) {
                return {
                    selectedIds: monitors.length > 0 ? [monitors[0].id] : [],
                    useAll: false,
                    rationale: `Applied "${profile.name}" profile - no primary monitor found, using first monitor`,
                };
            }
            return {
                selectedIds: [primary.id],
                useAll: false,
                rationale: `Applied "${profile.name}" profile - recording ${primary.name}`,
            };
        }

        case "largest": {
            if (monitors.length === 0) {
                return {
                    selectedIds: [],
                    useAll: false,
                    rationale: `Applied "${profile.name}" profile - no monitors found`,
                };
            }
            const largest = monitors.reduce((prev, curr) => {
                const prevPixels = prev.width * prev.height;
                const currPixels = curr.width * curr.height;
                return currPixels > prevPixels ? curr : prev;
            });
            return {
                selectedIds: [largest.id],
                useAll: false,
                rationale: `Applied "${profile.name}" profile - recording ${largest.name} (${largest.width}×${largest.height})`,
            };
        }

        case "specific":
            return {
                selectedIds: rule.monitorIds.filter((id) =>
                    monitors.some((m) => m.id === id)
                ),
                useAll: false,
                rationale: `Applied "${profile.name}" profile - recording ${rule.monitorIds.length} specific monitors`,
            };

        case "external-only": {
            // Heuristic: External monitors typically have scale_factor = 1.0
            const external = monitors.filter((m) => m.scale_factor <= 1.25);
            if (external.length === 0) {
                return {
                    selectedIds: monitors.map((m) => m.id),
                    useAll: false,
                    rationale: `Applied "${profile.name}" profile - no external monitors detected, using all`,
                };
            }
            return {
                selectedIds: external.map((m) => m.id),
                useAll: external.length === monitors.length,
                rationale: `Applied "${profile.name}" profile - recording ${external.length} external monitor(s)`,
            };
        }

        case "laptop-only": {
            // Heuristic: Laptop screens typically have scale_factor > 1.5
            const laptop = monitors.filter((m) => m.scale_factor > 1.5);
            if (laptop.length === 0) {
                const primary = monitors.find((m) => m.is_default);
                return {
                    selectedIds: primary ? [primary.id] : [],
                    useAll: false,
                    rationale: `Applied "${profile.name}" profile - no laptop screen detected, using primary`,
                };
            }
            return {
                selectedIds: laptop.map((m) => m.id),
                useAll: false,
                rationale: `Applied "${profile.name}" profile - recording ${laptop.length} laptop screen(s)`,
            };
        }

        case "by-resolution": {
            const matching = monitors.filter(
                (m) => m.width >= rule.minWidth && m.height >= rule.minHeight
            );
            if (matching.length === 0) {
                return {
                    selectedIds: [],
                    useAll: false,
                    rationale: `Applied "${profile.name}" profile - no monitors meet resolution requirements (${rule.minWidth}×${rule.minHeight})`,
                };
            }
            return {
                selectedIds: matching.map((m) => m.id),
                useAll: matching.length === monitors.length,
                rationale: `Applied "${profile.name}" profile - recording ${matching.length} monitor(s) with ${rule.minWidth}×${rule.minHeight}+`,
            };
        }

        default:
            return {
                selectedIds: [],
                useAll: false,
                rationale: `Unknown profile rule type`,
            };
    }
}

/**
 * Create a custom profile from current selection
 */
export function createCustomProfile(
    name: string,
    description: string,
    selectedIds: string[],
    monitors: MonitorDevice[]
): MonitorProfile {
    return {
        id: `custom-${Date.now()}`,
        name,
        description,
        icon: "⚙️",
        rule: {
            type: "specific",
            monitorIds: selectedIds,
        },
        createdAt: new Date().toISOString(),
        useCount: 0,
    };
}

/**
 * Get recommended profiles based on current monitor setup
 */
export function getRecommendedProfiles(
    monitors: MonitorDevice[]
): MonitorProfile[] {
    const recommended: MonitorProfile[] = [];

    // Always recommend "All Monitors"
    recommended.push(BUILTIN_PROFILES[0]);

    // Always recommend "Primary Display"
    recommended.push(BUILTIN_PROFILES[1]);

    // If 2+ monitors, recommend "Largest Monitor"
    if (monitors.length >= 2) {
        recommended.push(BUILTIN_PROFILES[2]);
    }

    // If laptop + external detected, recommend both options
    const hasHighDPI = monitors.some((m) => m.scale_factor > 1.5);
    const hasLowDPI = monitors.some((m) => m.scale_factor <= 1.25);

    if (hasHighDPI && hasLowDPI && monitors.length === 2) {
        recommended.push(BUILTIN_PROFILES[3]); // External only
        recommended.push(BUILTIN_PROFILES[4]); // Laptop only
    }

    // If any monitor is high-res, recommend high-res filter
    const hasHighRes = monitors.some((m) => m.width >= 1920 && m.height >= 1080);
    if (hasHighRes && monitors.length > 1) {
        recommended.push(BUILTIN_PROFILES[5]);
    }

    return recommended;
}

/**
 * Profile storage management
 */
export interface ProfileStore {
    builtIn: MonitorProfile[];
    custom: MonitorProfile[];
    history: ProfileApplication[];
}

/**
 * Save profile application to history
 */
export function recordProfileApplication(
    profile: MonitorProfile,
    previousState: { selectedIds: string[]; useAll: boolean },
    newState: { selectedIds: string[]; useAll: boolean },
    monitors: MonitorDevice[]
): ProfileApplication {
    return {
        profileId: profile.id,
        appliedAt: new Date().toISOString(),
        previousState,
        newState,
        monitors: monitors.map((m) => ({ ...m })), // Deep copy
    };
}

/**
 * Get profile usage statistics
 */
export function getProfileStats(
    history: ProfileApplication[]
): Map<string, { count: number; lastUsed: string }> {
    const stats = new Map<string, { count: number; lastUsed: string }>();

    history.forEach((app) => {
        const existing = stats.get(app.profileId);
        if (existing) {
            stats.set(app.profileId, {
                count: existing.count + 1,
                lastUsed: app.appliedAt,
            });
        } else {
            stats.set(app.profileId, {
                count: 1,
                lastUsed: app.appliedAt,
            });
        }
    });

    return stats;
}

/**
 * Export profiles for sharing
 */
export function exportProfiles(profiles: MonitorProfile[]): string {
    return JSON.stringify(
        {
            version: "1.0",
            exportedAt: new Date().toISOString(),
            profiles: profiles.map((p) => ({
                ...p,
                // Remove usage stats for privacy
                useCount: undefined,
                lastUsed: undefined,
            })),
        },
        null,
        2
    );
}

/**
 * Import profiles from JSON
 */
export function importProfiles(json: string): {
    success: boolean;
    profiles?: MonitorProfile[];
    error?: string;
} {
    try {
        const data = JSON.parse(json);

        if (!data.version || !data.profiles) {
            return {
                success: false,
                error: "Invalid profile format",
            };
        }

        // Validate each profile
        const profiles: MonitorProfile[] = data.profiles.map((p: any) => ({
            id: p.id || `imported-${Date.now()}`,
            name: p.name || "Unnamed Profile",
            description: p.description || "",
            icon: p.icon || "⚙️",
            rule: p.rule,
            createdAt: new Date().toISOString(),
            useCount: 0,
        }));

        return {
            success: true,
            profiles,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Validate profile compatibility with current monitors
 */
export function validateProfileCompatibility(
    profile: MonitorProfile,
    monitors: MonitorDevice[]
): {
    compatible: boolean;
    warnings: string[];
} {
    const warnings: string[] = [];

    if (profile.rule.type === "specific") {
        const availableIds = new Set(monitors.map((m) => m.id));
        const missingIds = profile.rule.monitorIds.filter(
            (id) => !availableIds.has(id)
        );

        if (missingIds.length > 0) {
            warnings.push(
                `${missingIds.length} monitor(s) from this profile are not currently connected`
            );
        }

        if (missingIds.length === profile.rule.monitorIds.length) {
            return {
                compatible: false,
                warnings: [
                    "None of the monitors from this profile are currently connected",
                ],
            };
        }
    }

    if (profile.rule.type === "external-only") {
        const hasExternal = monitors.some((m) => m.scale_factor <= 1.25);
        if (!hasExternal) {
            warnings.push("No external monitors detected");
        }
    }

    if (profile.rule.type === "laptop-only") {
        const hasLaptop = monitors.some((m) => m.scale_factor > 1.5);
        if (!hasLaptop) {
            warnings.push("No laptop screen detected");
        }
    }

    return {
        compatible: true,
        warnings,
    };
}
