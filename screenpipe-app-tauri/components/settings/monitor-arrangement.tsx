"use client";

import React, { useMemo, useEffect, useState } from "react";
import { Monitor, Check, AlertTriangle, Info, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    validateMonitors,
    validateSelection,
    autoFixConfiguration,
    getValidationSummary,
    type ValidationResult,
} from "@/lib/monitor-validation";
import { useMonitorPreview } from "@/lib/monitor-preview";

/**
 * MonitorDevice interface matching the Rust MonitorData struct
 * with complete spatial information for accurate visual representation.
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

interface MonitorArrangementProps {
    monitors: MonitorDevice[];
    selected: string[];
    onSelect: (ids: string[]) => void;
    useAll: boolean;
    onUseAllChange: (useAll: boolean) => void;
    className?: string;
}

/**
 * Calculate the bounding box of all monitors to normalize positions
 * for visual representation. This ensures the arrangement fits nicely
 * in the available space regardless of actual screen positions.
 */
function calculateBounds(monitors: MonitorDevice[]) {
    if (monitors.length === 0) {
        return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    monitors.forEach((monitor) => {
        minX = Math.min(minX, monitor.x);
        minY = Math.min(minY, monitor.y);
        maxX = Math.max(maxX, monitor.x + monitor.width);
        maxY = Math.max(maxY, monitor.y + monitor.height);
    });

    return {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX,
        height: maxY - minY,
    };
}

/**
 * MonitorArrangement Component
 * 
 * Displays monitors in their actual physical arrangement with:
 * - Accurate spatial positioning
 * - Visual selection state
 * - Primary monitor indication
 * - Resolution and scale information
 * - "Use All Monitors" toggle
 * 
 * Design Philosophy:
 * - The visual representation is the source of truth
 * - No hidden state or surprises
 * - Immediate visual feedback
 * - Accessible via keyboard and screen readers
 */
export function MonitorArrangement({
    monitors,
    selected,
    onSelect,
    useAll,
    onUseAllChange,
    className,
}: MonitorArrangementProps) {
    // Live preview state
    const [previewEnabled, setPreviewEnabled] = useState(false);
    const { frames, startPreview, stopPreview, stopAll, isActive } = useMonitorPreview({
        targetWidth: 320,
        targetHeight: 180,
        fps: 2,
        quality: 60,
    });

    // Start/stop preview when enabled state changes
    useEffect(() => {
        if (previewEnabled) {
            selected.forEach((id) => {
                if (!isActive(id)) {
                    startPreview(id);
                }
            });
        } else {
            stopAll();
        }
    }, [previewEnabled, selected, startPreview, stopAll, isActive]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopAll();
        };
    }, [stopAll]);

    // Calculate normalized positions for visual display
    const { normalizedMonitors, containerAspect } = useMemo(() => {
        const bounds = calculateBounds(monitors);

        // Avoid division by zero
        if (bounds.width === 0 || bounds.height === 0) {
            return { normalizedMonitors: [], containerAspect: 16 / 9 };
        }

        // Scale factor to fit monitors in a reasonable display area
        // We'll use a max width of 600px and scale proportionally
        const maxDisplayWidth = 600;
        const scale = maxDisplayWidth / bounds.width;

        const normalized = monitors.map((monitor) => ({
            ...monitor,
            // Normalize positions relative to the bounding box
            displayX: (monitor.x - bounds.minX) * scale,
            displayY: (monitor.y - bounds.minY) * scale,
            displayWidth: monitor.width * scale,
            displayHeight: monitor.height * scale,
        }));

        return {
            normalizedMonitors: normalized,
            containerAspect: bounds.width / bounds.height,
        };
    }, [monitors]);

    const toggleMonitor = (id: string) => {
        if (useAll) {
            // If "use all" is enabled, disable it and select just this monitor
            onUseAllChange(false);
            onSelect([id]);
        } else {
            if (selected.includes(id)) {
                // Deselect - but prevent deselecting all monitors
                const newSelection = selected.filter((s) => s !== id);
                if (newSelection.length > 0) {
                    onSelect(newSelection);
                }
            } else {
                // Select
                onSelect([...selected, id]);
            }
        }
    };

    const handleUseAllChange = (checked: boolean) => {
        onUseAllChange(checked);
        if (checked) {
            // When enabling "use all", select all monitors
            onSelect(monitors.map((m) => m.id));
        }
    };

    // Validation: ensure at least one monitor is selected
    const hasValidSelection = useAll || selected.length > 0;

    return (
        <div className={cn("space-y-6", className)}>
            {/* Use All Monitors Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                <div className="space-y-1">
                    <h4 className="font-medium">Use All Monitors</h4>
                    <p className="text-sm text-muted-foreground">
                        Record from all connected displays automatically
                    </p>
                </div>
                <Switch
                    checked={useAll}
                    onCheckedChange={handleUseAllChange}
                    aria-label="Use all monitors"
                />
            </div>

            {/* Visual Monitor Arrangement */}
            {!useAll && monitors.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Select Monitors</h4>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPreviewEnabled(!previewEnabled)}
                                className="h-8"
                            >
                                {previewEnabled ? (
                                    <>
                                        <EyeOff className="h-3 w-3 mr-1" />
                                        Hide Preview
                                    </>
                                ) : (
                                    <>
                                        <Eye className="h-3 w-3 mr-1" />
                                        Show Preview
                                    </>
                                )}
                            </Button>
                            <span className="text-xs text-muted-foreground">
                                {selected.length} of {monitors.length} selected
                            </span>
                        </div>
                    </div>

                    {/* Arrangement Grid */}
                    <div
                        className="relative border rounded-lg bg-muted/30 p-8"
                        style={{
                            aspectRatio: containerAspect > 0 ? containerAspect : 16 / 9,
                            minHeight: "200px",
                        }}
                        role="group"
                        aria-label="Monitor arrangement"
                    >
                        {normalizedMonitors.map((monitor) => {
                            const isSelected = selected.includes(monitor.id);
                            const isPrimary = monitor.is_default;

                            return (
                                <button
                                    key={monitor.id}
                                    className={cn(
                                        "absolute flex flex-col items-center justify-center",
                                        "border-2 rounded-lg transition-all duration-200",
                                        "hover:shadow-lg hover:scale-105",
                                        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                        isSelected
                                            ? "border-primary bg-primary/10 shadow-md"
                                            : "border-border bg-background hover:border-primary/50"
                                    )}
                                    style={{
                                        left: `${monitor.displayX} px`,
                                        top: `${monitor.displayY} px`,
                                        width: `${monitor.displayWidth} px`,
                                        height: `${monitor.displayHeight} px`,
                                        minWidth: "120px",
                                        minHeight: "80px",
                                    }}
                                    onClick={() => toggleMonitor(monitor.id)}
                                    aria-pressed={isSelected}
                                    aria-label={`${monitor.name}, ${monitor.width}×${monitor.height}${isPrimary ? ", primary display" : ""}`}
                                >
                                    {/* Live Preview Overlay */}
                                    {previewEnabled && frames.has(monitor.id) && (
                                        <div className="absolute inset-0 rounded-lg overflow-hidden">
                                            <img
                                                src={frames.get(monitor.id)!.imageData}
                                                alt={`Preview of ${monitor.name}`}
                                                className="w-full h-full object-cover opacity-90"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        </div>
                                    )}

                                    {/* Content (overlays preview if active) */}
                                    <div className={cn(
                                        "relative z-10 flex flex-col items-center justify-center",
                                        previewEnabled && frames.has(monitor.id) && "text-white drop-shadow-lg"
                                    )}>
                                        {/* Monitor Icon */}
                                        <Monitor
                                            className={cn(
                                                "h-6 w-6 mb-2",
                                                previewEnabled && frames.has(monitor.id)
                                                    ? "text-white"
                                                    : isSelected
                                                        ? "text-primary"
                                                        : "text-muted-foreground"
                                            )}
                                        />

                                        {/* Monitor Name */}
                                        <div className="text-xs font-medium text-center px-2 line-clamp-1">
                                            {monitor.name}
                                        </div>

                                        {/* Resolution */}
                                        <div className="text-xs text-muted-foreground">
                                            {monitor.width}×{monitor.height}
                                        </div>

                                        {/* Badges */}
                                        <div className="flex gap-1 mt-1">
                                            {isPrimary && (
                                                <Badge variant="secondary" className="text-xs px-1 py-0">
                                                    Primary
                                                </Badge>
                                            )}
                                            {monitor.scale_factor !== 1.0 && (
                                                <Badge variant="outline" className="text-xs px-1 py-0">
                                                    {monitor.scale_factor}×
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Selection Indicator */}
                                        {isSelected && (
                                            <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
                                                <Check className="h-3 w-3" />
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Validation Warning */}
                    {!hasValidSelection && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <p className="text-sm text-destructive">
                                ⚠️ At least one monitor must be selected
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Summary */}
            <div className="p-3 bg-muted rounded-lg text-sm">
                {useAll ? (
                    <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>
                            Recording from <strong>all {monitors.length} monitors</strong>
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        {hasValidSelection ? (
                            <>
                                <Check className="h-4 w-4 text-green-600" />
                                <span>
                                    Recording from{" "}
                                    <strong>
                                        {selected.length} of {monitors.length} monitors
                                    </strong>
                                </span>
                            </>
                        ) : (
                            <>
                                <span className="text-destructive">
                                    ⚠️ No monitors selected
                                </span>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
