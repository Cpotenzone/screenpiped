"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, BookmarkPlus, Download, Upload, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { MonitorDevice } from "./monitor-arrangement";
import {
    getSmartMonitorDefaults,
    getLaptopExternalDefaults,
    estimatePerformance,
    type SmartDefaultResult,
} from "@/lib/monitor-smart-defaults";
import {
    BUILTIN_PROFILES,
    getRecommendedProfiles,
    applyProfile,
    createCustomProfile,
    type MonitorProfile,
} from "@/lib/monitor-profiles";

interface MonitorQuickActionsProps {
    monitors: MonitorDevice[];
    selected: string[];
    useAll: boolean;
    onApply: (selectedIds: string[], useAll: boolean) => void;
    className?: string;
}

/**
 * MonitorQuickActions Component
 * 
 * Provides:
 * - Smart default suggestions
 * - Quick profile switching
 * - Performance estimates
 * - Custom profile creation
 */
export function MonitorQuickActions({
    monitors,
    selected,
    useAll,
    onApply,
    className,
}: MonitorQuickActionsProps) {
    const [smartDefaults, setSmartDefaults] = useState<SmartDefaultResult | null>(
        null
    );
    const [recommendedProfiles, setRecommendedProfiles] = useState<
        MonitorProfile[]
    >([]);
    const [showCreateProfile, setShowCreateProfile] = useState(false);
    const [newProfileName, setNewProfileName] = useState("");
    const [newProfileDesc, setNewProfileDesc] = useState("");

    // Calculate smart defaults on mount and when monitors change
    useEffect(() => {
        if (monitors.length > 0) {
            const defaults = getLaptopExternalDefaults(monitors);
            setSmartDefaults(defaults);
            setRecommendedProfiles(getRecommendedProfiles(monitors));
        }
    }, [monitors]);

    // Get performance estimate for current selection
    const performanceEstimate = estimatePerformance(monitors, selected);

    const handleApplySmartDefaults = () => {
        if (smartDefaults) {
            onApply(smartDefaults.selectedIds, smartDefaults.useAll);
        }
    };

    const handleApplyProfile = (profile: MonitorProfile) => {
        const result = applyProfile(profile, monitors);
        onApply(result.selectedIds, result.useAll);
    };

    const handleCreateProfile = () => {
        if (newProfileName.trim()) {
            const profile = createCustomProfile(
                newProfileName,
                newProfileDesc,
                selected,
                monitors
            );
            // In a real app, this would save to localStorage or backend
            console.log("Created profile:", profile);
            setShowCreateProfile(false);
            setNewProfileName("");
            setNewProfileDesc("");
        }
    };

    if (monitors.length === 0) {
        return null;
    }

    return (
        <div className={cn("space-y-4", className)}>
            {/* Smart Defaults Card */}
            {smartDefaults && smartDefaults.confidence !== "low" && (
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <CardTitle className="text-sm">Smart Suggestion</CardTitle>
                            </div>
                            <Badge
                                variant={
                                    smartDefaults.confidence === "high" ? "default" : "secondary"
                                }
                                className="text-xs"
                            >
                                {smartDefaults.confidence} confidence
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            {smartDefaults.rationale}
                        </p>
                        <Button
                            size="sm"
                            onClick={handleApplySmartDefaults}
                            className="w-full"
                        >
                            Apply Suggestion
                        </Button>

                        {/* Alternative Options */}
                        {smartDefaults.alternativeOptions &&
                            smartDefaults.alternativeOptions.length > 0 && (
                                <div className="space-y-2 pt-2 border-t">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Other options:
                                    </p>
                                    {smartDefaults.alternativeOptions.map((option, idx) => (
                                        <Button
                                            key={idx}
                                            variant="outline"
                                            size="sm"
                                            className="w-full justify-start text-left h-auto py-2"
                                            onClick={() =>
                                                onApply(option.selectedIds, option.useAll)
                                            }
                                        >
                                            <div className="flex flex-col items-start gap-1">
                                                <span className="font-medium text-xs">
                                                    {option.label}
                                                </span>
                                                <span className="text-xs text-muted-foreground font-normal">
                                                    {option.description}
                                                </span>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            )}
                    </CardContent>
                </Card>
            )}

            {/* Quick Profiles */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Quick Profiles</CardTitle>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs text-xs">
                                        Quickly switch between common monitor configurations
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2">
                    {recommendedProfiles.map((profile) => (
                        <Button
                            key={profile.id}
                            variant="outline"
                            size="sm"
                            className="w-full justify-start h-auto py-2"
                            onClick={() => handleApplyProfile(profile)}
                        >
                            <div className="flex items-center gap-2 w-full">
                                <span className="text-base">{profile.icon}</span>
                                <div className="flex flex-col items-start gap-0.5 flex-1">
                                    <span className="font-medium text-xs">{profile.name}</span>
                                    <span className="text-xs text-muted-foreground font-normal">
                                        {profile.description}
                                    </span>
                                </div>
                            </div>
                        </Button>
                    ))}

                    {/* Save Current as Profile */}
                    <Dialog open={showCreateProfile} onOpenChange={setShowCreateProfile}>
                        <DialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start mt-2"
                            >
                                <BookmarkPlus className="h-4 w-4 mr-2" />
                                Save current as profile
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Custom Profile</DialogTitle>
                                <DialogDescription>
                                    Save your current monitor selection as a reusable profile
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="profile-name">Profile Name</Label>
                                    <Input
                                        id="profile-name"
                                        placeholder="e.g., Work Setup"
                                        value={newProfileName}
                                        onChange={(e) => setNewProfileName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="profile-desc">Description (optional)</Label>
                                    <Textarea
                                        id="profile-desc"
                                        placeholder="e.g., Primary monitor only for focused work"
                                        value={newProfileDesc}
                                        onChange={(e) => setNewProfileDesc(e.target.value)}
                                        rows={3}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleCreateProfile}
                                        disabled={!newProfileName.trim()}
                                        className="flex-1"
                                    >
                                        Create Profile
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowCreateProfile(false)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>

            {/* Performance Estimate */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Performance Estimate</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="space-y-1">
                            <p className="text-muted-foreground">Resolution</p>
                            <p className="font-medium">
                                {(performanceEstimate.pixelsPerFrame / 1_000_000).toFixed(1)}MP
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-muted-foreground">Est. FPS</p>
                            <p className="font-medium">{performanceEstimate.estimatedFPS}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-muted-foreground">Storage/hour</p>
                            <p className="font-medium">
                                {performanceEstimate.estimatedStoragePerHour}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-muted-foreground">Impact</p>
                            <Badge
                                variant={
                                    performanceEstimate.performanceImpact === "low"
                                        ? "default"
                                        : performanceEstimate.performanceImpact === "medium"
                                            ? "secondary"
                                            : "destructive"
                                }
                                className="text-xs"
                            >
                                {performanceEstimate.performanceImpact}
                            </Badge>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground pt-2 border-t">
                        {performanceEstimate.recommendation}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
