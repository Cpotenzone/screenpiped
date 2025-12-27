/**
 * Timeline Data Hook
 * 
 * Fetches and manages timeline data for multi-monitor rewind
 */

import { useState, useEffect, useCallback } from 'react';
import { getFrames, getAudioTranscriptions } from '../api/search';
import { TimelineFrame, MonitorTimeline } from '@/components/rewind/multi-monitor-timeline';

export interface UseTimelineOptions {
    monitorIds: string[];
    timeRange: { start: number; end: number };
    refreshInterval?: number; // Auto-refresh interval in ms
}

export interface UseTimelineReturn {
    timelines: Map<string, MonitorTimeline>;
    loading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
}

export function useTimeline(options: UseTimelineOptions): UseTimelineReturn {
    const { monitorIds, timeRange, refreshInterval } = options;

    const [timelines, setTimelines] = useState<Map<string, MonitorTimeline>>(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Fetch timeline data
    const fetchTimelineData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch frames for all monitors
            const frames = await getFrames({
                start_time: timeRange.start,
                end_time: timeRange.end,
                monitor_ids: monitorIds,
                limit: 1000, // Adjust based on needs
            });

            // Fetch audio transcriptions
            const audio = await getAudioTranscriptions({
                start_time: timeRange.start,
                end_time: timeRange.end,
                limit: 1000,
            });

            // Group frames by monitor
            const timelineMap = new Map<string, MonitorTimeline>();

            monitorIds.forEach(monitorId => {
                // Get frames for this monitor
                const monitorFrames = frames
                    .filter((frame: any) => frame.monitor_id === monitorId)
                    .map((frame: any): TimelineFrame => ({
                        timestamp: new Date(frame.timestamp).getTime(),
                        thumbnail: frame.file_path,
                        text: frame.ocr_text,
                        appName: frame.app_name,
                        windowName: frame.window_name,
                    }))
                    .sort((a, b) => a.timestamp - b.timestamp);

                timelineMap.set(monitorId, {
                    monitorId,
                    monitorName: `Monitor ${monitorId}`,
                    frames: monitorFrames,
                    visible: true,
                    solo: false,
                });
            });

            setTimelines(timelineMap);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch timeline data'));
        } finally {
            setLoading(false);
        }
    }, [monitorIds, timeRange]);

    // Initial fetch
    useEffect(() => {
        fetchTimelineData();
    }, [fetchTimelineData]);

    // Auto-refresh if interval is set
    useEffect(() => {
        if (!refreshInterval) return;

        const interval = setInterval(() => {
            fetchTimelineData();
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [refreshInterval, fetchTimelineData]);

    return {
        timelines,
        loading,
        error,
        refresh: fetchTimelineData,
    };
}
