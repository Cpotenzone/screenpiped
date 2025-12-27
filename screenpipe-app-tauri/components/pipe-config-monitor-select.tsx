/**
 * Pipe Monitor Configuration Component
 * 
 * Allows users to select which monitors a pipe should process
 * Reuses the MonitorArrangement component for consistency
 */

"use client";

import React, { useState, useEffect } from "react";
import { MonitorArrangement, MonitorDevice } from "./settings/monitor-arrangement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export interface PipeMonitorConfig {
    enabled: boolean; // Whether monitor filtering is enabled
    mode: 'all' | 'specific' | 'profile';
    monitorIds: string[];
    profileId?: string;
}

export interface PipeMonitorConfigProps {
    pipeId: string;
    pipeName: string;
    availableMonitors: MonitorDevice[];
    currentConfig?: PipeMonitorConfig;
    onConfigChange: (config: PipeMonitorConfig) => void;
    className?: string;
}

export function PipeMonitorConfigComponent({
    pipeId,
    pipeName,
    availableMonitors,
    currentConfig,
    onConfigChange,
    className,
}: PipeMonitorConfigProps) {
    const [enabled, setEnabled] = useState(currentConfig?.enabled ?? false);
    const [selectedMonitors, setSelectedMonitors] = useState<string[]>(
        currentConfig?.monitorIds ?? availableMonitors.map(m => m.id)
    );
    const [useAll, setUseAll] = useState(
        currentConfig?.mode === 'all' || !currentConfig
    );

    // Update parent when config changes
    useEffect(() => {
        const config: PipeMonitorConfig = {
            enabled,
            mode: useAll ? 'all' : 'specific',
            monitorIds: useAll ? availableMonitors.map(m => m.id) : selectedMonitors,
        };
        onConfigChange(config);
    }, [enabled, useAll, selectedMonitors, availableMonitors, onConfigChange]);

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Monitor Selection</CardTitle>
                        <CardDescription>
                            Choose which monitors this pipe should process
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor={`pipe-monitor-enabled-${pipeId}`}>
                            Enable Filtering
                        </Label>
                        <Switch
                            id={`pipe-monitor-enabled-${pipeId}`}
                            checked={enabled}
                            onCheckedChange={setEnabled}
                        />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {!enabled && (
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            Monitor filtering is disabled. This pipe will process data from all monitors.
                        </AlertDescription>
                    </Alert>
                )}

                {enabled && (
                    <>
                        <div className="flex items-center justify-between">
                            <Label>Selected Monitors</Label>
                            <Badge variant="secondary">
                                {useAll ? 'All' : `${selectedMonitors.length} of ${availableMonitors.length}`}
                            </Badge>
                        </div>

                        <MonitorArrangement
                            monitors={availableMonitors}
                            selected={selectedMonitors}
                            onSelect={setSelectedMonitors}
                            useAll={useAll}
                            onUseAllChange={setUseAll}
                        />

                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                This pipe will only process data from the selected monitors.
                                {useAll && ' Currently set to process all monitors.'}
                            </AlertDescription>
                        </Alert>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
