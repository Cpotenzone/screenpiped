# 🎯 INTEGRATION ACTION PLAN
## Rewind + Pipes + Obsidian Multi-Monitor

**Objective:** Complete end-to-end multi-monitor integration  
**Timeline:** 10-15 hours  
**Status:** 🚀 **READY TO BEGIN**

---

## PHASE 1: REWIND MULTI-MONITOR TIMELINE
**Priority:** CRITICAL  
**Time:** 4-6 hours

### Task 1.1: Multi-Monitor Timeline Component
**File:** `screenpipe-app-tauri/components/rewind/multi-monitor-timeline.tsx`

```typescript
interface MultiMonitorTimelineProps {
  monitors: MonitorDevice[];
  selectedMonitors: string[];
  timeRange: { start: number; end: number };
  onTimeChange: (time: number) => void;
}

export function MultiMonitorTimeline(props: MultiMonitorTimelineProps) {
  // Stacked timeline - one row per monitor
  // Synchronized time cursor
  // Thumbnail previews
  // Event markers
}
```

### Task 1.2: Search Integration
**File:** `screenpipe-app-tauri/lib/api/search.ts`

```typescript
// Add monitor_id filter to search
export interface SearchParams {
  q: string;
  content_type?: 'ocr' | 'audio' | 'all';
  monitor_id?: string;  // NEW!
  start_time?: number;
  end_time?: number;
}
```

### Task 1.3: Timeline Data Fetching
**File:** `screenpipe-app-tauri/lib/hooks/use-timeline.ts`

```typescript
export function useTimeline(monitorIds: string[]) {
  // Fetch frames for each monitor
  // Group by timestamp
  // Return synchronized data
}
```

---

## PHASE 2: PIPES MULTI-MONITOR INTEGRATION
**Priority:** HIGH  
**Time:** 4-6 hours

### Task 2.1: Pipe Monitor Configuration
**File:** `screenpipe-app-tauri/components/pipe-config-monitor-select.tsx`

```typescript
interface PipeMonitorConfigProps {
  pipeId: string;
  availableMonitors: MonitorDevice[];
  onConfigChange: (config: PipeMonitorConfig) => void;
}

// Reuse MonitorArrangement component!
export function PipeMonitorConfig(props: PipeMonitorConfigProps) {
  return (
    <MonitorArrangement
      monitors={props.availableMonitors}
      selected={selectedMonitors}
      onSelect={handleMonitorSelect}
    />
  );
}
```

### Task 2.2: Pipe Data Routing
**File:** `screenpipe-server/src/pipe_manager.rs`

```rust
// Add monitor filtering to pipe execution
pub struct PipeConfig {
    pub monitor_ids: Option<Vec<String>>,  // NEW!
    // ... existing config
}

// Filter data by monitor before sending to pipe
fn filter_by_monitors(data: Vec<Frame>, monitor_ids: &[String]) -> Vec<Frame> {
    data.into_iter()
        .filter(|frame| monitor_ids.contains(&frame.monitor_id))
        .collect()
}
```

### Task 2.3: Pipe UI Integration
**File:** `screenpipe-app-tauri/components/pipe-store.tsx`

```typescript
// Add monitor selection to pipe configuration dialog
<Dialog>
  <DialogContent>
    <h3>Configure Pipe: {pipe.name}</h3>
    
    {/* Existing config */}
    <PipeConfigForm pipe={pipe} />
    
    {/* NEW: Monitor selection */}
    <PipeMonitorConfig
      pipeId={pipe.id}
      availableMonitors={monitors}
      onConfigChange={handleMonitorConfigChange}
    />
  </DialogContent>
</Dialog>
```

---

## PHASE 3: OBSIDIAN INTEGRATION
**Priority:** MEDIUM  
**Time:** 2-3 hours

### Task 3.1: Obsidian Pipe Enhancement
**File:** `pipes/obsidian-export/pipe.ts` (or create new)

```typescript
// Obsidian export pipe with multi-monitor support
export async function exportToObsidian(config: ObsidianConfig) {
  // 1. Search database with monitor filter
  const results = await searchScreenpipe({
    q: config.query,
    monitor_id: config.monitorId,  // NEW!
    start_time: config.startTime,
    end_time: config.endTime,
  });
  
  // 2. Format as Markdown with monitor context
  const markdown = formatAsMarkdown(results, {
    includeMonitorInfo: true,  // NEW!
  });
  
  // 3. Write to Obsidian vault
  await writeToObsidian(markdown, config.vaultPath);
}
```

### Task 3.2: Obsidian Daily Notes
**File:** `pipes/obsidian-export/daily-notes.ts`

```typescript
// Generate daily notes with multi-monitor sections
export function generateDailyNote(date: Date, monitors: MonitorDevice[]) {
  return `
# ${formatDate(date)}

${monitors.map(monitor => `
## ${monitor.name}

### Activity
${getActivityForMonitor(monitor.id, date)}

### Transcripts
${getTranscriptsForMonitor(monitor.id, date)}

### Screenshots
${getScreenshotsForMonitor(monitor.id, date)}
`).join('\n')}
  `;
}
```

---

## IMPLEMENTATION SEQUENCE

### Day 1: Rewind Foundation (4-6 hours)
```bash
# Morning
- Create multi-monitor-timeline.tsx
- Implement stacked timeline layout
- Add synchronized time cursor

# Afternoon
- Add thumbnail previews
- Implement search with monitor filter
- Test with real data
```

### Day 2: Pipes Integration (4-6 hours)
```bash
# Morning
- Create pipe-config-monitor-select.tsx
- Integrate MonitorArrangement component
- Add monitor config to pipe store

# Afternoon
- Update Rust pipe_manager.rs
- Add monitor filtering
- Test pipe execution with monitor filter
```

### Day 3: Obsidian + Polish (2-3 hours)
```bash
# Morning
- Create/enhance Obsidian pipe
- Add multi-monitor export
- Generate daily notes with monitor sections

# Afternoon
- End-to-end testing
- Documentation
- Bug fixes
```

---

## FILES TO CREATE/MODIFY

### New Files (Create)
1. `components/rewind/multi-monitor-timeline.tsx`
2. `components/pipe-config-monitor-select.tsx`
3. `lib/hooks/use-timeline.ts`
4. `lib/api/search.ts` (enhance existing)
5. `pipes/obsidian-export/pipe.ts` (or enhance existing)
6. `pipes/obsidian-export/daily-notes.ts`

### Modified Files (Update)
1. `components/pipe-store.tsx` - Add monitor config UI
2. `screenpipe-server/src/pipe_manager.rs` - Add monitor filtering
3. `screenpipe-server/src/server.rs` - Enhance search endpoint (if needed)

---

## REUSABLE COMPONENTS

We already built these - just import and use!

```typescript
// Monitor selection
import { MonitorArrangement } from '@/components/settings/monitor-arrangement';

// Smart defaults
import { getSmartMonitorDefaults } from '@/lib/monitor-smart-defaults';

// Profiles
import { getMonitorProfiles, applyProfile } from '@/lib/monitor-profiles';

// Validation
import { validateMonitors, validateSelection } from '@/lib/monitor-validation';

// Preview
import { useMonitorPreview } from '@/lib/monitor-preview';
```

**All the hard work is done - now we just connect the pieces!**

---

## SUCCESS CRITERIA

### Rewind ✅
- [ ] Can view timeline for all monitors simultaneously
- [ ] Can scrub through time with all monitors in sync
- [ ] Can search and filter by specific monitor
- [ ] Thumbnails show correct monitor content
- [ ] Performance is acceptable (< 100ms frame load)

### Pipes ✅
- [ ] Can configure which monitors a pipe processes
- [ ] Can see monitor selection in pipe config UI
- [ ] Pipe only receives data from selected monitors
- [ ] Can save/load monitor configuration
- [ ] Works with existing pipes without breaking them

### Obsidian ✅
- [ ] Can export data with monitor context
- [ ] Daily notes include per-monitor sections
- [ ] Monitor names appear in exported content
- [ ] Can filter export by specific monitors
- [ ] Markdown formatting is clean and readable

---

## TESTING PLAN

### Test 1: Rewind Timeline
```
1. Open Rewind
2. Select 2+ monitors
3. Verify timeline shows all monitors
4. Scrub through time
5. Verify all monitors update in sync
6. Search for text
7. Verify results show correct monitor
```

### Test 2: Pipe Configuration
```
1. Open Pipe Store
2. Select a pipe
3. Click "Configure"
4. Select specific monitors
5. Save configuration
6. Run pipe
7. Verify pipe only processes selected monitors
```

### Test 3: Obsidian Export
```
1. Configure Obsidian pipe
2. Select monitors to export
3. Set date range
4. Run export
5. Open Obsidian vault
6. Verify daily notes have monitor sections
7. Verify content is correct
```

---

## RISK MITIGATION

### Risk 1: Performance
**Issue:** Loading frames for multiple monitors could be slow  
**Mitigation:**
- Lazy load thumbnails
- Cache aggressively
- Use worker threads
- Progressive rendering

### Risk 2: Complexity
**Issue:** UI could become overwhelming  
**Mitigation:**
- Use existing MonitorArrangement component
- Progressive disclosure
- Smart defaults
- Clear visual hierarchy

### Risk 3: Breaking Changes
**Issue:** Could break existing pipes  
**Mitigation:**
- Make monitor config optional
- Default to "all monitors" if not specified
- Maintain backward compatibility
- Test with existing pipes

---

## READY TO BEGIN?

**Status:** ✅ All prerequisites complete  
**Foundation:** ✅ Multi-monitor system ready  
**Components:** ✅ Reusable components available  
**Documentation:** ✅ Comprehensive guides created  

**Estimated Time:** 10-15 hours  
**Complexity:** Medium (we have all the pieces)  
**Impact:** HIGH (completes the vision)

---

**Let's integrate Rewind, Pipes, and Obsidian with multi-monitor support!**

Ready to start with the Rewind timeline?

