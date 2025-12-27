/**
 * Live Monitor Preview Module
 * 
 * Provides real-time preview of monitor content for the multi-monitor
 * configuration system. Shows users exactly what will be recorded.
 * 
 * Features:
 * - Real-time screen capture thumbnails
 * - Low-overhead preview (scaled down, low FPS)
 * - Privacy-aware (can be disabled)
 * - Automatic cleanup on unmount
 */

import { invoke } from "@tauri-apps/api/core";

export interface PreviewFrame {
    monitorId: string;
    imageData: string; // Base64 encoded image
    timestamp: number;
    width: number;
    height: number;
}

export interface PreviewOptions {
    targetWidth?: number; // Target width for preview (default: 320)
    targetHeight?: number; // Target height for preview (default: 180)
    fps?: number; // Frames per second (default: 2)
    quality?: number; // JPEG quality 0-100 (default: 60)
}

export class MonitorPreviewManager {
    private activeMonitors: Set<string> = new Set();
    private intervalIds: Map<string, number> = new Map();
    private callbacks: Map<string, (frame: PreviewFrame) => void> = new Map();
    private options: Required<PreviewOptions>;

    constructor(options: PreviewOptions = {}) {
        this.options = {
            targetWidth: options.targetWidth ?? 320,
            targetHeight: options.targetHeight ?? 180,
            fps: options.fps ?? 2,
            quality: options.quality ?? 60,
        };
    }

    /**
     * Start preview for a specific monitor
     */
    async startPreview(
        monitorId: string,
        callback: (frame: PreviewFrame) => void
    ): Promise<void> {
        if (this.activeMonitors.has(monitorId)) {
            console.warn(`Preview already active for monitor ${monitorId}`);
            return;
        }

        this.activeMonitors.add(monitorId);
        this.callbacks.set(monitorId, callback);

        // Calculate interval from FPS
        const intervalMs = 1000 / this.options.fps;

        // Start capture loop
        const intervalId = window.setInterval(async () => {
            try {
                const frame = await this.captureFrame(monitorId);
                const callback = this.callbacks.get(monitorId);
                if (callback && frame) {
                    callback(frame);
                }
            } catch (error) {
                console.error(`Failed to capture frame for monitor ${monitorId}:`, error);
            }
        }, intervalMs);

        this.intervalIds.set(monitorId, intervalId);
    }

    /**
     * Stop preview for a specific monitor
     */
    stopPreview(monitorId: string): void {
        const intervalId = this.intervalIds.get(monitorId);
        if (intervalId) {
            window.clearInterval(intervalId);
            this.intervalIds.delete(monitorId);
        }

        this.activeMonitors.delete(monitorId);
        this.callbacks.delete(monitorId);
    }

    /**
     * Stop all active previews
     */
    stopAll(): void {
        for (const monitorId of this.activeMonitors) {
            this.stopPreview(monitorId);
        }
    }

    /**
     * Capture a single frame from a monitor
     */
    private async captureFrame(monitorId: string): Promise<PreviewFrame | null> {
        try {
            // Call Tauri backend to capture screen
            const result = await invoke<{
                image_data: string;
                width: number;
                height: number;
            }>("capture_monitor_preview", {
                monitorId,
                targetWidth: this.options.targetWidth,
                targetHeight: this.options.targetHeight,
                quality: this.options.quality,
            });

            return {
                monitorId,
                imageData: result.image_data,
                timestamp: Date.now(),
                width: result.width,
                height: result.height,
            };
        } catch (error) {
            console.error(`Failed to capture monitor ${monitorId}:`, error);
            return null;
        }
    }

    /**
     * Update preview options
     */
    updateOptions(options: Partial<PreviewOptions>): void {
        const oldFps = this.options.fps;

        this.options = {
            ...this.options,
            ...options,
        };

        // If FPS changed, restart all active previews
        if (options.fps && options.fps !== oldFps) {
            const activeMonitors = Array.from(this.activeMonitors);
            const callbacks = new Map(this.callbacks);

            // Stop all
            this.stopAll();

            // Restart with new FPS
            activeMonitors.forEach((monitorId) => {
                const callback = callbacks.get(monitorId);
                if (callback) {
                    this.startPreview(monitorId, callback);
                }
            });
        }
    }

    /**
     * Get current options
     */
    getOptions(): Required<PreviewOptions> {
        return { ...this.options };
    }

    /**
     * Check if preview is active for a monitor
     */
    isActive(monitorId: string): boolean {
        return this.activeMonitors.has(monitorId);
    }

    /**
     * Get list of active monitor IDs
     */
    getActiveMonitors(): string[] {
        return Array.from(this.activeMonitors);
    }
}

/**
 * React hook for monitor preview
 */
export function useMonitorPreview(options?: PreviewOptions) {
    const [manager] = React.useState(() => new MonitorPreviewManager(options));
    const [frames, setFrames] = React.useState<Map<string, PreviewFrame>>(
        new Map()
    );

    React.useEffect(() => {
        return () => {
            // Cleanup on unmount
            manager.stopAll();
        };
    }, [manager]);

    const startPreview = React.useCallback(
        (monitorId: string) => {
            manager.startPreview(monitorId, (frame) => {
                setFrames((prev) => new Map(prev).set(monitorId, frame));
            });
        },
        [manager]
    );

    const stopPreview = React.useCallback(
        (monitorId: string) => {
            manager.stopPreview(monitorId);
            setFrames((prev) => {
                const next = new Map(prev);
                next.delete(monitorId);
                return next;
            });
        },
        [manager]
    );

    const stopAll = React.useCallback(() => {
        manager.stopAll();
        setFrames(new Map());
    }, [manager]);

    return {
        frames,
        startPreview,
        stopPreview,
        stopAll,
        isActive: (monitorId: string) => manager.isActive(monitorId),
    };
}

// Import React for the hook
import React from "react";
