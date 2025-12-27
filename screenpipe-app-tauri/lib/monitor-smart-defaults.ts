/**
 * Smart Monitor Defaults Module
 * 
 * Provides intelligent default monitor selection based on:
 * - Number of monitors
 * - Monitor characteristics (size, resolution, primary status)
 * - User context and typical usage patterns
 * - Performance considerations
 * 
 * Design Philosophy:
 * - Defaults should "just work" for 95% of users
 * - Optimize for the most common use case
 * - Provide clear rationale for each decision
 * - Allow easy override without friction
 */

import type { MonitorDevice } from "@/components/settings/monitor-arrangement";

export interface SmartDefaultResult {
    selectedIds: string[];
    useAll: boolean;
    rationale: string;
    confidence: "high" | "medium" | "low";
    alternativeOptions?: AlternativeOption[];
}

export interface AlternativeOption {
    label: string;
    selectedIds: string[];
    useAll: boolean;
    description: string;
}

/**
 * Calculate smart defaults for monitor selection
 * 
 * Decision Tree:
 * 1. Single monitor → Select it (confidence: high)
 * 2. Dual monitors → Select primary only (confidence: high)
 * 3. Triple+ monitors → Select all (confidence: medium)
 * 4. Mixed resolutions → Select largest (confidence: medium)
 * 5. Laptop + external → Select external (confidence: medium)
 */
export function getSmartMonitorDefaults(
    monitors: MonitorDevice[]
): SmartDefaultResult {
    // Edge case: No monitors
    if (monitors.length === 0) {
        return {
            selectedIds: [],
            useAll: false,
            rationale: "No monitors detected",
            confidence: "low",
        };
    }

    // Case 1: Single monitor - obvious choice
    if (monitors.length === 1) {
        return {
            selectedIds: [monitors[0].id],
            useAll: false,
            rationale: "Only one monitor detected - selected automatically",
            confidence: "high",
        };
    }

    // Case 2: Dual monitors - select primary only
    // Rationale: Most users with dual monitors use one for work, one for reference
    // Recording both doubles storage and processing without much benefit
    if (monitors.length === 2) {
        const primary = monitors.find((m) => m.is_default);
        const primaryId = primary?.id || monitors[0].id;

        return {
            selectedIds: [primaryId],
            useAll: false,
            rationale:
                "Dual monitor setup detected - recording primary display only to optimize performance",
            confidence: "high",
            alternativeOptions: [
                {
                    label: "Record both monitors",
                    selectedIds: monitors.map((m) => m.id),
                    useAll: true,
                    description: "Capture everything across both displays",
                },
                {
                    label: "Record largest monitor",
                    selectedIds: [getLargestMonitor(monitors).id],
                    useAll: false,
                    description: "Record the monitor with the highest resolution",
                },
            ],
        };
    }

    // Case 3: Triple+ monitors - use all
    // Rationale: Users with 3+ monitors are power users who likely want comprehensive recording
    if (monitors.length >= 3) {
        const primary = monitors.find((m) => m.is_default);

        return {
            selectedIds: monitors.map((m) => m.id),
            useAll: true,
            rationale: `${monitors.length} monitors detected - recording all displays for comprehensive coverage`,
            confidence: "medium",
            alternativeOptions: [
                {
                    label: "Record primary only",
                    selectedIds: primary ? [primary.id] : [monitors[0].id],
                    useAll: false,
                    description: "Record just your main working display",
                },
                {
                    label: "Record largest monitor",
                    selectedIds: [getLargestMonitor(monitors).id],
                    useAll: false,
                    description: "Record the monitor with the highest resolution",
                },
            ],
        };
    }

    // Fallback: Select primary
    const primary = monitors.find((m) => m.is_default);
    return {
        selectedIds: primary ? [primary.id] : [monitors[0].id],
        useAll: false,
        rationale: "Selected primary monitor as default",
        confidence: "low",
    };
}

/**
 * Detect if this is a laptop + external monitor setup
 */
export function isLaptopPlusExternal(monitors: MonitorDevice[]): boolean {
    if (monitors.length !== 2) return false;

    // Heuristic: Laptop screens are typically:
    // - Smaller (< 16 inches diagonal)
    // - Higher DPI (scale_factor > 1.5)
    // - Common resolutions: 1920×1080, 2560×1600, 2880×1800

    const laptopResolutions = [
        { w: 1920, h: 1080 },
        { w: 2560, h: 1600 },
        { w: 2880, h: 1800 },
        { w: 3024, h: 1964 }, // MacBook Pro 14"
        { w: 3456, h: 2234 }, // MacBook Pro 16"
    ];

    let laptopCount = 0;
    let externalCount = 0;

    monitors.forEach((monitor) => {
        const isLaptopRes = laptopResolutions.some(
            (res) => res.w === monitor.width && res.h === monitor.height
        );
        const isHighDPI = monitor.scale_factor >= 1.5;

        if (isLaptopRes && isHighDPI) {
            laptopCount++;
        } else {
            externalCount++;
        }
    });

    return laptopCount === 1 && externalCount === 1;
}

/**
 * Get smart defaults for laptop + external setup
 */
export function getLaptopExternalDefaults(
    monitors: MonitorDevice[]
): SmartDefaultResult {
    if (!isLaptopPlusExternal(monitors)) {
        return getSmartMonitorDefaults(monitors);
    }

    // Prefer external monitor for recording
    // Rationale: External is typically larger and used for primary work
    const external = monitors.find((m) => m.scale_factor < 1.5);
    const laptop = monitors.find((m) => m.scale_factor >= 1.5);

    if (external) {
        return {
            selectedIds: [external.id],
            useAll: false,
            rationale:
                "Laptop + external monitor detected - recording external display (typically your primary workspace)",
            confidence: "high",
            alternativeOptions: [
                {
                    label: "Record both displays",
                    selectedIds: monitors.map((m) => m.id),
                    useAll: true,
                    description: "Capture both laptop and external monitor",
                },
                {
                    label: "Record laptop only",
                    selectedIds: laptop ? [laptop.id] : [monitors[0].id],
                    useAll: false,
                    description: "Record just the laptop screen",
                },
            ],
        };
    }

    return getSmartMonitorDefaults(monitors);
}

/**
 * Get the largest monitor by pixel count
 */
export function getLargestMonitor(monitors: MonitorDevice[]): MonitorDevice {
    return monitors.reduce((largest, current) => {
        const largestPixels = largest.width * largest.height;
        const currentPixels = current.width * current.height;
        return currentPixels > largestPixels ? current : largest;
    }, monitors[0]);
}

/**
 * Get the primary monitor (or first if none marked)
 */
export function getPrimaryMonitor(monitors: MonitorDevice[]): MonitorDevice {
    return monitors.find((m) => m.is_default) || monitors[0];
}

/**
 * Calculate total pixel count for a selection
 */
export function calculateTotalPixels(
    monitors: MonitorDevice[],
    selectedIds: string[]
): number {
    return monitors
        .filter((m) => selectedIds.includes(m.id))
        .reduce((total, m) => total + m.width * m.height, 0);
}

/**
 * Estimate storage and performance impact
 */
export interface PerformanceEstimate {
    pixelsPerFrame: number;
    estimatedFPS: number;
    estimatedStoragePerHour: string;
    performanceImpact: "low" | "medium" | "high";
    recommendation: string;
}

export function estimatePerformance(
    monitors: MonitorDevice[],
    selectedIds: string[]
): PerformanceEstimate {
    const totalPixels = calculateTotalPixels(monitors, selectedIds);

    // Rough estimates based on typical encoding
    // 1080p @ 30fps ≈ 2MP/frame ≈ 100-200MB/hour
    // 4K @ 30fps ≈ 8MP/frame ≈ 400-800MB/hour

    const megapixels = totalPixels / 1_000_000;

    let estimatedFPS: number;
    let performanceImpact: "low" | "medium" | "high";
    let recommendation: string;

    if (megapixels < 3) {
        // ~1080p or less
        estimatedFPS = 30;
        performanceImpact = "low";
        recommendation = "Excellent performance expected";
    } else if (megapixels < 10) {
        // ~4K or dual 1080p
        estimatedFPS = 20;
        performanceImpact = "medium";
        recommendation = "Good performance on modern hardware";
    } else {
        // Multiple 4K or very high resolution
        estimatedFPS = 10;
        performanceImpact = "high";
        recommendation =
            "High resource usage - consider reducing monitor count or resolution";
    }

    // Storage estimate: ~50-100KB per megapixel per frame at 30fps
    const bytesPerHour = megapixels * estimatedFPS * 75_000 * 3600;
    const mbPerHour = bytesPerHour / 1_000_000;
    const gbPerHour = mbPerHour / 1000;

    const estimatedStoragePerHour =
        gbPerHour >= 1 ? `${gbPerHour.toFixed(1)} GB` : `${mbPerHour.toFixed(0)} MB`;

    return {
        pixelsPerFrame: totalPixels,
        estimatedFPS,
        estimatedStoragePerHour,
        performanceImpact,
        recommendation,
    };
}

/**
 * Get context-aware defaults based on time of day and usage patterns
 * (Future enhancement - placeholder for now)
 */
export function getContextAwareDefaults(
    monitors: MonitorDevice[],
    context?: {
        timeOfDay?: "morning" | "afternoon" | "evening" | "night";
        dayOfWeek?: "weekday" | "weekend";
        userActivity?: "work" | "gaming" | "browsing";
    }
): SmartDefaultResult {
    // For now, just use standard smart defaults
    // Future: Could adjust based on context
    // e.g., "work" mode → primary only, "gaming" mode → all monitors
    return getSmartMonitorDefaults(monitors);
}

/**
 * Validate that smart defaults are sensible
 */
export function validateSmartDefaults(
    result: SmartDefaultResult,
    monitors: MonitorDevice[]
): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check 1: Selected IDs must exist
    const validIds = new Set(monitors.map((m) => m.id));
    result.selectedIds.forEach((id) => {
        if (!validIds.has(id)) {
            issues.push(`Selected ID "${id}" does not exist`);
        }
    });

    // Check 2: If useAll is true, all monitors should be selected
    if (result.useAll && result.selectedIds.length !== monitors.length) {
        issues.push(
            `useAll is true but only ${result.selectedIds.length}/${monitors.length} monitors selected`
        );
    }

    // Check 3: At least one monitor should be selected
    if (result.selectedIds.length === 0 && !result.useAll) {
        issues.push("No monitors selected");
    }

    // Check 4: Confidence should be valid
    if (!["high", "medium", "low"].includes(result.confidence)) {
        issues.push(`Invalid confidence level: ${result.confidence}`);
    }

    return {
        valid: issues.length === 0,
        issues,
    };
}
