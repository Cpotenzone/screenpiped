/**
 * Monitor Configuration Validation Module
 * 
 * Provides comprehensive validation for monitor configurations to ensure:
 * - No invalid geometries
 * - Proper error handling
 * - Clear error messages
 * - Type safety
 */

export interface MonitorDevice {
    id: string;
    name: string;
    is_default: boolean;
    width: number;
    height: number;
    x: number;
    y: number;
    scale_factor: number;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

export interface ValidationError {
    code: string;
    message: string;
    severity: "error";
    monitorId?: string;
}

export interface ValidationWarning {
    code: string;
    message: string;
    severity: "warning";
    monitorId?: string;
}

/**
 * Validates a list of monitors for structural integrity
 */
export function validateMonitors(
    monitors: MonitorDevice[]
): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Rule 1: At least one monitor must exist
    if (monitors.length === 0) {
        errors.push({
            code: "NO_MONITORS",
            message: "No monitors detected. Please check your display connections.",
            severity: "error",
        });
        return { valid: false, errors, warnings };
    }

    // Rule 2: All monitors must have valid dimensions
    monitors.forEach((monitor) => {
        if (monitor.width <= 0 || monitor.height <= 0) {
            errors.push({
                code: "INVALID_DIMENSIONS",
                message: `Monitor "${monitor.name}" has invalid dimensions: ${monitor.width}×${monitor.height}`,
                severity: "error",
                monitorId: monitor.id,
            });
        }

        if (monitor.width > 16384 || monitor.height > 16384) {
            warnings.push({
                code: "UNUSUALLY_LARGE",
                message: `Monitor "${monitor.name}" has unusually large dimensions: ${monitor.width}×${monitor.height}`,
                severity: "warning",
                monitorId: monitor.id,
            });
        }
    });

    // Rule 3: Scale factors must be positive
    monitors.forEach((monitor) => {
        if (monitor.scale_factor <= 0) {
            errors.push({
                code: "INVALID_SCALE",
                message: `Monitor "${monitor.name}" has invalid scale factor: ${monitor.scale_factor}`,
                severity: "error",
                monitorId: monitor.id,
            });
        }

        if (monitor.scale_factor > 4) {
            warnings.push({
                code: "UNUSUAL_SCALE",
                message: `Monitor "${monitor.name}" has unusually high scale factor: ${monitor.scale_factor}×`,
                severity: "warning",
                monitorId: monitor.id,
            });
        }
    });

    // Rule 4: Exactly one monitor should be marked as primary
    const primaryMonitors = monitors.filter((m) => m.is_default);
    if (primaryMonitors.length === 0) {
        warnings.push({
            code: "NO_PRIMARY",
            message: "No monitor is marked as primary. This may cause unexpected behavior.",
            severity: "warning",
        });
    } else if (primaryMonitors.length > 1) {
        errors.push({
            code: "MULTIPLE_PRIMARY",
            message: `${primaryMonitors.length} monitors are marked as primary. Only one should be primary.`,
            severity: "error",
        });
    }

    // Rule 5: Monitor IDs must be unique
    const ids = monitors.map((m) => m.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length > 0) {
        errors.push({
            code: "DUPLICATE_IDS",
            message: `Duplicate monitor IDs detected: ${duplicates.join(", ")}`,
            severity: "error",
        });
    }

    // Rule 6: Check for overlapping monitors (warning, not error)
    for (let i = 0; i < monitors.length; i++) {
        for (let j = i + 1; j < monitors.length; j++) {
            if (monitorsOverlap(monitors[i], monitors[j])) {
                warnings.push({
                    code: "MONITORS_OVERLAP",
                    message: `Monitors "${monitors[i].name}" and "${monitors[j].name}" appear to overlap. This may indicate a configuration issue.`,
                    severity: "warning",
                    monitorId: monitors[i].id,
                });
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Validates a monitor selection
 */
export function validateSelection(
    monitors: MonitorDevice[],
    selectedIds: string[],
    useAll: boolean
): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // First validate the monitors themselves
    const monitorValidation = validateMonitors(monitors);
    errors.push(...monitorValidation.errors);
    warnings.push(...monitorValidation.warnings);

    // If monitors are invalid, don't proceed with selection validation
    if (!monitorValidation.valid) {
        return { valid: false, errors, warnings };
    }

    // Rule 1: If not using all monitors, at least one must be selected
    if (!useAll && selectedIds.length === 0) {
        errors.push({
            code: "NO_SELECTION",
            message: "At least one monitor must be selected for recording.",
            severity: "error",
        });
    }

    // Rule 2: All selected IDs must correspond to actual monitors
    const validIds = new Set(monitors.map((m) => m.id));
    selectedIds.forEach((id) => {
        if (!validIds.has(id)) {
            errors.push({
                code: "INVALID_MONITOR_ID",
                message: `Selected monitor ID "${id}" does not exist.`,
                severity: "error",
                monitorId: id,
            });
        }
    });

    // Rule 3: If using all monitors, selection should include all monitors
    if (useAll && selectedIds.length !== monitors.length) {
        warnings.push({
            code: "INCONSISTENT_USE_ALL",
            message: `"Use All Monitors" is enabled but only ${selectedIds.length} of ${monitors.length} monitors are selected.`,
            severity: "warning",
        });
    }

    // Rule 4: Warn if only selecting very small monitors
    const selectedMonitors = monitors.filter((m) => selectedIds.includes(m.id));
    const allSmall = selectedMonitors.every(
        (m) => m.width < 1280 || m.height < 720
    );
    if (selectedMonitors.length > 0 && allSmall) {
        warnings.push({
            code: "SMALL_MONITORS_ONLY",
            message: "All selected monitors have low resolution. Recording quality may be limited.",
            severity: "warning",
        });
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Helper: Check if two monitors overlap in screen space
 */
function monitorsOverlap(m1: MonitorDevice, m2: MonitorDevice): boolean {
    const m1Right = m1.x + m1.width;
    const m1Bottom = m1.y + m1.height;
    const m2Right = m2.x + m2.width;
    const m2Bottom = m2.y + m2.height;

    // Check if rectangles overlap
    return !(
        m1Right <= m2.x ||
        m2Right <= m1.x ||
        m1Bottom <= m2.y ||
        m2Bottom <= m1.y
    );
}

/**
 * Get a human-readable summary of validation results
 */
export function getValidationSummary(result: ValidationResult): string {
    if (result.valid && result.warnings.length === 0) {
        return "✅ Configuration is valid";
    }

    if (result.valid && result.warnings.length > 0) {
        return `⚠️ Configuration is valid with ${result.warnings.length} warning(s)`;
    }

    return `❌ Configuration has ${result.errors.length} error(s)`;
}

/**
 * Attempt to auto-fix common validation issues
 */
export function autoFixConfiguration(
    monitors: MonitorDevice[],
    selectedIds: string[],
    useAll: boolean
): {
    monitors: MonitorDevice[];
    selectedIds: string[];
    useAll: boolean;
    fixed: boolean;
    changes: string[];
} {
    const changes: string[] = [];
    let fixedMonitors = [...monitors];
    let fixedSelection = [...selectedIds];
    let fixedUseAll = useAll;

    // Fix 1: If no monitors selected and not using all, enable "use all"
    if (!useAll && selectedIds.length === 0 && monitors.length > 0) {
        fixedUseAll = true;
        fixedSelection = monitors.map((m) => m.id);
        changes.push("Enabled 'Use All Monitors' because no monitors were selected");
    }

    // Fix 2: Remove invalid monitor IDs from selection
    const validIds = new Set(monitors.map((m) => m.id));
    const originalLength = fixedSelection.length;
    fixedSelection = fixedSelection.filter((id) => validIds.has(id));
    if (fixedSelection.length < originalLength) {
        changes.push(
            `Removed ${originalLength - fixedSelection.length} invalid monitor ID(s) from selection`
        );
    }

    // Fix 3: If "use all" is enabled, ensure all monitors are selected
    if (fixedUseAll && fixedSelection.length !== monitors.length) {
        fixedSelection = monitors.map((m) => m.id);
        changes.push("Updated selection to include all monitors");
    }

    // Fix 4: If no primary monitor, mark the first one as primary
    const hasPrimary = fixedMonitors.some((m) => m.is_default);
    if (!hasPrimary && fixedMonitors.length > 0) {
        fixedMonitors = fixedMonitors.map((m, i) => ({
            ...m,
            is_default: i === 0,
        }));
        changes.push(`Marked "${fixedMonitors[0].name}" as primary monitor`);
    }

    return {
        monitors: fixedMonitors,
        selectedIds: fixedSelection,
        useAll: fixedUseAll,
        fixed: changes.length > 0,
        changes,
    };
}
