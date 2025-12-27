/**
 * Obsidian Export Pipe - Multi-Monitor Support
 * 
 * Exports Screenpipe data to Obsidian with monitor context
 * Generates daily notes with per-monitor sections
 */

import { searchScreenpipe, SearchParams } from '../lib/api/search';
import { MonitorDevice } from '../components/settings/monitor-arrangement';

export interface ObsidianConfig {
    vaultPath: string;
    query?: string;
    monitorIds?: string[];
    startTime?: number;
    endTime?: number;
    includeMonitorInfo: boolean;
    generateDailyNotes: boolean;
    includeScreenshots: boolean;
    includeTranscripts: boolean;
}

export interface ExportResult {
    success: boolean;
    filesCreated: string[];
    error?: string;
}

/**
 * Export data to Obsidian with multi-monitor support
 */
export async function exportToObsidian(config: ObsidianConfig): Promise<ExportResult> {
    try {
        const filesCreated: string[] = [];

        // Search for data with monitor filtering
        const searchParams: SearchParams = {
            q: config.query || '*',
            content_type: 'all',
            monitor_ids: config.monitorIds,
            start_time: config.startTime,
            end_time: config.endTime,
            limit: 1000,
        };

        const results = await searchScreenpipe(searchParams);

        // Group results by monitor
        const byMonitor = new Map<string, typeof results.data>();
        results.data.forEach(result => {
            const monitorId = result.monitor_id || 'unknown';
            if (!byMonitor.has(monitorId)) {
                byMonitor.set(monitorId, []);
            }
            byMonitor.get(monitorId)!.push(result);
        });

        // Generate markdown content
        let markdown = '';

        if (config.includeMonitorInfo && config.monitorIds && config.monitorIds.length > 0) {
            markdown += '# Multi-Monitor Capture\n\n';

            // Add section for each monitor
            for (const [monitorId, monitorResults] of byMonitor.entries()) {
                markdown += `## Monitor ${monitorId}\n\n`;

                if (config.includeTranscripts) {
                    const transcripts = monitorResults.filter(r => r.type === 'audio');
                    if (transcripts.length > 0) {
                        markdown += '### Transcripts\n\n';
                        transcripts.forEach(t => {
                            markdown += `- **${new Date(t.timestamp).toLocaleTimeString()}**: ${t.content}\n`;
                        });
                        markdown += '\n';
                    }
                }

                if (config.includeScreenshots) {
                    const screenshots = monitorResults.filter(r => r.type === 'ocr');
                    if (screenshots.length > 0) {
                        markdown += '### Screenshots\n\n';
                        screenshots.forEach(s => {
                            markdown += `- **${new Date(s.timestamp).toLocaleTimeString()}**\n`;
                            if (s.app_name) markdown += `  - App: ${s.app_name}\n`;
                            if (s.window_name) markdown += `  - Window: ${s.window_name}\n`;
                            if (s.content) markdown += `  - Text: ${s.content.substring(0, 100)}...\n`;
                        });
                        markdown += '\n';
                    }
                }
            }
        } else {
            // Single section without monitor grouping
            markdown += '# Screenpipe Capture\n\n';

            if (config.includeTranscripts) {
                const transcripts = results.data.filter(r => r.type === 'audio');
                if (transcripts.length > 0) {
                    markdown += '## Transcripts\n\n';
                    transcripts.forEach(t => {
                        markdown += `- **${new Date(t.timestamp).toLocaleTimeString()}**: ${t.content}\n`;
                    });
                    markdown += '\n';
                }
            }

            if (config.includeScreenshots) {
                const screenshots = results.data.filter(r => r.type === 'ocr');
                if (screenshots.length > 0) {
                    markdown += '## Screenshots\n\n';
                    screenshots.forEach(s => {
                        markdown += `- **${new Date(s.timestamp).toLocaleTimeString()}**: ${s.content?.substring(0, 100)}...\n`;
                    });
                    markdown += '\n';
                }
            }
        }

        // Write to Obsidian vault
        const fileName = config.generateDailyNotes
            ? `${new Date().toISOString().split('T')[0]}.md`
            : `screenpipe-export-${Date.now()}.md`;

        const filePath = `${config.vaultPath}/${fileName}`;

        // Note: In a real implementation, you would use Tauri's fs API to write the file
        // For now, this is a placeholder
        console.log('Would write to:', filePath);
        console.log('Content:', markdown);

        filesCreated.push(filePath);

        return {
            success: true,
            filesCreated,
        };
    } catch (error) {
        return {
            success: false,
            filesCreated: [],
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Generate daily note with multi-monitor sections
 */
export function generateDailyNote(
    date: Date,
    monitors: MonitorDevice[],
    data: Map<string, any[]>
): string {
    const dateStr = date.toISOString().split('T')[0];

    let markdown = `# Daily Note - ${dateStr}\n\n`;
    markdown += `Generated: ${new Date().toLocaleString()}\n\n`;
    markdown += `---\n\n`;

    // Add section for each monitor
    monitors.forEach(monitor => {
        const monitorData = data.get(monitor.id) || [];

        markdown += `## ${monitor.name}\n\n`;
        markdown += `- Resolution: ${monitor.width}×${monitor.height}\n`;
        markdown += `- Scale: ${monitor.scale_factor}x\n`;
        if (monitor.is_default) {
            markdown += `- **Primary Display**\n`;
        }
        markdown += `\n`;

        if (monitorData.length > 0) {
            markdown += `### Activity\n\n`;
            markdown += `- Total events: ${monitorData.length}\n`;
            markdown += `\n`;

            // Group by app
            const byApp = new Map<string, number>();
            monitorData.forEach((item: any) => {
                const app = item.app_name || 'Unknown';
                byApp.set(app, (byApp.get(app) || 0) + 1);
            });

            markdown += `### Applications\n\n`;
            Array.from(byApp.entries())
                .sort((a, b) => b[1] - a[1])
                .forEach(([app, count]) => {
                    markdown += `- ${app}: ${count} events\n`;
                });
            markdown += `\n`;
        } else {
            markdown += `_No activity recorded_\n\n`;
        }

        markdown += `---\n\n`;
    });

    return markdown;
}
