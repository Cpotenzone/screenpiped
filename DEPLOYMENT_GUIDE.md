# 🚀 SCREENPIPE - CLEAN DEPLOYMENT GUIDE

**Version:** 0.44.4  
**Date:** 2025-12-26  
**Status:** ✅ **PRODUCTION READY**

---

## QUICK START

### 1. Clean Install
```bash
# From the screenpipe-git directory:
./cleanup.sh          # Clean everything
./build-release.sh    # Build deployment package
```

### 2. Manual Privacy Cleanup
**IMPORTANT:** Remove old Screen Recording permissions:
1. Open **System Preferences** → **Security & Privacy** → **Screen Recording**
2. Remove ALL Screenpipe entries (there may be ~20)
3. Open **System Preferences** → **Security & Privacy** → **Microphone**
4. Remove ALL Screenpipe entries

### 3. Install
Choose one:
- **DMG:** Double-click `screenpipe_0.44.4_aarch64.dmg`, drag to Applications
- **Direct:** `open screenpipe-app-tauri/src-tauri/target/release/bundle/macos/screenpipe.app`
- **Copy:** `cp -r screenpipe-app-tauri/src-tauri/target/release/bundle/macos/screenpipe.app /Applications/`

### 4. First Launch
1. Launch Screenpipe from Applications
2. Grant Screen Recording permission when prompted
3. Grant Microphone permission when prompted
4. App will start recording automatically

---

## WHAT'S INCLUDED

### Core Features ✅
- **Multi-Monitor Recording** - Records all configured screens
- **Audio Transcription** - Whisper Large V3 Turbo
- **OCR** - Apple Native engine
- **Search** - Full-text search across all content
- **Timeline** - Visual timeline of all activity
- **System Tray** - Background operation with tray icon

### All 17 Pipes Included ✅
**Core:**
- rewind (v0.1.16) - Timeline playback
- search (v0.1.44) - Full-text search
- obsidian (v0.1.29) - Obsidian export
- data-table (v0.1.13) - Data table view
- meeting (v0.1.5) - Meeting notes
- memories (v0.1.5) - Memory gallery

**Productivity:**
- notion (v0.1.16)
- assistant-ui (v0.2.37)
- identify-speakers (v0.1.3)
- screen-avatar (v0.1.27)

**Export:**
- discord-to-spreadsheet (v0.0.4)
- desktop-to-table (v0.1.15)
- reddit-auto-posts (v0.1.3)

**Examples:**
- pipe-for-loom
- pipe-simple-nextjs
- example-pipe
- hello-world-computer-use

---

## DEPLOYMENT ARTIFACTS

### Created Files
```
screenpipe-app-tauri/src-tauri/target/release/bundle/
├── dmg/
│   └── screenpipe_0.44.4_aarch64.dmg          # DMG installer
├── macos/
│   ├── screenpipe.app                          # App bundle
│   └── screenpipe.app.tar.gz                   # Update package
```

### Sizes (Approximate)
- **DMG:** ~500MB
- **App Bundle:** ~600MB
- **Update Package:** ~400MB

---

## CONFIGURATION

### Default Settings
- **Port:** 3030 (API server)
- **FPS:** 1 frame/second
- **OCR:** Apple Native
- **Audio:** Whisper Large V3 Turbo
- **Monitors:** All enabled by default
- **Storage:** `~/.screenpipe/data/`

### First Run Setup
1. **Monitors:** Select which screens to record
2. **Audio:** Choose input/output devices
3. **Ignored Windows:** Configure privacy filters
4. **Pipes:** Enable/disable specific pipes

---

## DATA STORAGE

### Locations
```
~/.screenpipe/
├── data/                    # Recordings
│   ├── monitor_*.mp4       # Video files
│   └── db.sqlite           # Search index
└── pipes/                   # Installed pipes
    ├── rewind/
    ├── search/
    └── ...
```

### Privacy
- **All local:** No data sent to cloud
- **Encrypted:** Database encrypted at rest
- **Configurable:** Ignore sensitive windows

---

## TROUBLESHOOTING

### App Won't Start
1. Check privacy permissions granted
2. Look in Console.app for errors
3. Try: `rm -rf ~/Library/Caches/screenpipe`

### Pipes Not Loading
```bash
# Reinstall pipes
cd screenpipe-git
./setup-all-pipes.sh
```

### High CPU Usage
- Reduce FPS in settings
- Disable unused pipes
- Limit number of monitored screens

### Screen Recording Permission
If prompted repeatedly:
1. Remove all Screenpipe entries from Privacy settings
2. Restart Mac
3. Launch app fresh

---

## UNINSTALL

### Complete Removal
```bash
# 1. Quit app
pkill -9 screenpipe-app

# 2. Remove app
rm -rf /Applications/screenpipe.app

# 3. Remove data
rm -rf ~/.screenpipe
rm -rf ~/Library/Application\ Support/screenpipe
rm -rf ~/Library/Caches/screenpipe

# 4. Remove from Privacy settings
# Manually remove from Screen Recording & Microphone
```

---

## CHANGELOG

### v0.44.4 (2025-12-26)
- ✅ All 17 pipes enabled and working
- ✅ Dynamic pipe version detection
- ✅ Simplified update checking
- ✅ Fixed tray icon issues
- ✅ Multi-monitor configuration
- ✅ Complete deployment package

---

## SUPPORT

### Logs
```bash
# View app logs
tail -f ~/Library/Logs/screenpipe/app.log

# View server logs
tail -f ~/Library/Logs/screenpipe/server.log
```

### Reset to Defaults
```bash
rm -rf ~/.screenpipe
# Relaunch app
```

---

## TECHNICAL DETAILS

### Architecture
- **Frontend:** Next.js + React + Tauri
- **Backend:** Rust + screenpipe-server
- **Database:** SQLite with FTS5
- **OCR:** Apple Vision Framework
- **Audio:** Whisper.cpp

### Requirements
- **macOS:** 11.0 or later (Big Sur+)
- **Processor:** Apple Silicon (M1/M2/M3)
- **RAM:** 8GB minimum, 16GB recommended
- **Storage:** 10GB+ free space

### Permissions Required
- **Screen Recording** - To capture screen
- **Microphone** - To record audio
- **Accessibility** - For window titles (optional)

---

## BUILD FROM SOURCE

### Requirements
- Rust 1.70+
- Node.js 18+
- Bun latest
- Xcode Command Line Tools

### Build Steps
```bash
git clone https://github.com/mediar-ai/screenpipe
cd screenpipe
./build-release.sh
```

---

## LICENSE

See LICENSE file in repository.

---

## CREDITS

Built with:
- Tauri - Desktop app framework
- screenpipe-server - Recording engine
- Whisper - Audio transcription
- Apple Vision - OCR

---

**Prepared by:** Antigravity AI  
**Date:** 2025-12-26  
**Classification:** Production Deployment Guide

