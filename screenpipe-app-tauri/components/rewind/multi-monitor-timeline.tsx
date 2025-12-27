/**
 * Multi-Monitor Timeline Component
 * 
 * Displays a synchronized timeline view for all monitors with:
 * - Stacked layout (one row per monitor)
 * - Synchronized time cursor
 * - Thumbnail previews
 * - Event markers
 * - Per-monitor playback controls
 */

"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Monitor, Play, Pause, SkipBack, SkipForward, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MonitorDevice } from "../settings/monitor-arrangement";

export interface TimelineFrame {
    timestamp: number;
    thumbnail?: string; // base64 or URL
    text?: string; // OCR text
    appName?: string;
    windowName?: string;
}

export interface MonitorTimeline {
    monitorId: string;
    monitorName: string;
    frames: TimelineFrame[];
    visible: boolean;
    solo: boolean;
}

export interface MultiMonitorTimelineProps {
    monitors: MonitorDevice[];
    selectedMonitors: string[];
    timeRange: { start: number; end: number };
    currentTime: number;
    onTimeChange: (time: number) => void;
    onMonitorVisibilityChange?: (monitorId: string, visible: boolean) => void;
    onMonitorSoloChange?: (monitorId: string, solo: boolean) => void;
    className?: string;
}

export function MultiMonitorTimeline({
    monitors,
    selectedMonitors,
    timeRange,
    currentTime,
    onTimeChange,
    onMonitorVisibilityChange,
    onMonitorSoloChange,
    className,
}: MultiMonitorTimelineProps) {
    const [playing, setPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [monitorStates, setMonitorStates] = useState<Map<string, { visible: boolean; solo: boolean }>>(
        new Map(selectedMonitors.map(id => [id, { visible: true, solo: false }]))
    );

    // Calculate timeline duration
    const duration = useMemo(() => {
        return timeRange.end - timeRange.start;
    }, [timeRange]);

    // Calculate current position as percentage
    const currentPosition = useMemo(() => {
        if (duration === 0) return 0;
        return ((currentTime - timeRange.start) / duration) * 100;
    }, [currentTime, timeRange, duration]);

    // Playback loop
    useEffect(() => {
        if (!playing) return;

        const interval = setInterval(() => {
            const newTime = currentTime + (100 * playbackSpeed); // 100ms steps
            if (newTime >= timeRange.end) {
                setPlaying(false);
                onTimeChange(timeRange.start); // Loop back to start
            } else {
                onTimeChange(newTime);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [playing, currentTime, playbackSpeed, timeRange, onTimeChange]);

    // Handle timeline scrubbing
    const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        const newTime = timeRange.start + (duration * percentage);
        onTimeChange(Math.max(timeRange.start, Math.min(timeRange.end, newTime)));
    }, [timeRange, duration, onTimeChange]);

    // Toggle monitor visibility
    const toggleMonitorVisibility = useCallback((monitorId: string) => {
        setMonitorStates(prev => {
            const newStates = new Map(prev);
            const current = newStates.get(monitorId) || { visible: true, solo: false };
            const newState = { ...current, visible: !current.visible };
            newStates.set(monitorId, newState);
            onMonitorVisibilityChange?.(monitorId, newState.visible);
            return newStates;
        });
    }, [onMonitorVisibilityChange]);

    // Toggle monitor solo
    const toggleMonitorSolo = useCallback((monitorId: string) => {
        setMonitorStates(prev => {
            const newStates = new Map(prev);
            const current = newStates.get(monitorId) || { visible: true, solo: false };
            const newSolo = !current.solo;

            // If enabling solo, hide all others
            if (newSolo) {
                newStates.forEach((state, id) => {
                    if (id !== monitorId) {
                        newStates.set(id, { ...state, visible: false });
                    }
                });
            } else {
                // If disabling solo, show all
                newStates.forEach((state, id) => {
                    newStates.set(id, { ...state, visible: true });
                });
            }

            newStates.set(monitorId, { ...current, solo: newSolo });
            onMonitorSoloChange?.(monitorId, newSolo);
            return newStates;
        });
    }, [onMonitorSoloChange]);

    // Format time for display
    const formatTime = useCallback((timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    }, []);

    // Get visible monitors
    const visibleMonitors = useMemo(() => {
        return selectedMonitors.filter(id => {
            const state = monitorStates.get(id);
            return state?.visible !== false;
        });
    }, [selectedMonitors, monitorStates]);

    return (
        <div className={cn("space-y-4", className)}>
            {/* Playback Controls */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onTimeChange(Math.max(timeRange.start, currentTime - 5000))}
                    >
                        <SkipBack className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPlaying(!playing)}
                    >
                        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onTimeChange(Math.min(timeRange.end, currentTime + 5000))}
                    >
                        <SkipForward className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-2 ml-4">
                        <span className="text-sm text-muted-foreground">Speed:</span>
                        {[0.5, 1, 2, 4].map(speed => (
                            <Button
                                key={speed}
                                variant={playbackSpeed === speed ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPlaybackSpeed(speed)}
                            >
                                {speed}x
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-sm font-mono">
                        {formatTime(currentTime)} / {formatTime(timeRange.end)}
                    </span>
                    <Badge variant="secondary">
                        {visibleMonitors.length} of {selectedMonitors.length} monitors
                    </Badge>
                </div>
            </div>

            {/* Monitor Timelines */}
            <div className="space-y-2">
                {selectedMonitors.map(monitorId => {
                    const monitor = monitors.find(m => m.id === monitorId);
                    if (!monitor) return null;

                    const state = monitorStates.get(monitorId) || { visible: true, solo: false };

                    return (
                        <div
                            key={monitorId}
                            className={cn(
                                "border rounded-lg overflow-hidden transition-opacity",
                                !state.visible && "opacity-50"
                            )}
                        >
                            {/* Monitor Header */}
                            <div className="flex items-center justify-between p-2 bg-muted/50">
                                <div className="flex items-center gap-2">
                                    <Monitor className="h-4 w-4" />
                                    <span className="text-sm font-medium">{monitor.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                        {monitor.width}×{monitor.height}
                                    </Badge>
                                    {monitor.is_default && (
                                        <Badge variant="secondary" className="text-xs">Primary</Badge>
                                    )}
                                </div>

                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleMonitorSolo(monitorId)}
                                        className={cn("h-7 w-7 p-0", state.solo && "bg-primary text-primary-foreground")}
                                    >
                                        S
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleMonitorVisibility(monitorId)}
                                        className="h-7 w-7 p-0"
                                    >
                                        {state.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                                    </Button>
                                </div>
                            </div>

                            {/* Timeline Track */}
                            {state.visible && (
                                <div
                                    className="relative h-16 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={handleTimelineClick}
                                >
                                    {/* Time cursor */}
                                    <div
                                        className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
                                        style={{ left: `${currentPosition}%` }}
                                    />

                                    {/* Placeholder for frame thumbnails */}
                                    <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                                        Timeline frames will appear here
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Global Timeline Scrubber */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatTime(timeRange.start)}</span>
                    <span>{formatTime(timeRange.end)}</span>
                </div>
                <Slider
                    value={[currentPosition]}
                    onValueChange={([value]) => {
                        const newTime = timeRange.start + (duration * (value / 100));
                        onTimeChange(newTime);
                    }}
                    max={100}
                    step={0.1}
                    className="cursor-pointer"
                />
            </div>
        </div>
    );
}
