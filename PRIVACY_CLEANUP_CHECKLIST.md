# 🔒 PRIVACY SETTINGS CLEANUP CHECKLIST

**Date:** 2025-12-26  
**Task:** Remove ALL Screenpipe entries from macOS privacy settings

---

## ✅ CHECKLIST - DO EACH STEP

### 1. Screen Recording
- [ ] Open **System Preferences** → **Security & Privacy** → **Screen Recording**
- [ ] Click 🔒 lock icon (enter password)
- [ ] Look for ALL entries with "screenpipe"
- [ ] Select each one and click **-** button to remove
- [ ] Common names to look for:
  - screenpipe
  - screenpipe-app  
  - screenpipe (debug)
  - screenpipe (release)
  - target/release/screenpipe-app
  - target/debug/screenpipe-app
  - Any path containing "screenpipe"
- [ ] Remove **ALL** of them (may be 10-20 entries!)

### 2. Microphone
- [ ] Click **Microphone** tab (same Security & Privacy window)
- [ ] Remove ALL screenpipe entries
- [ ] Check for multiple versions

### 3. Accessibility
- [ ] Click **Accessibility** tab
- [ ] Remove any screenpipe entries (if present)

### 4. Full Disk Access
- [ ] Click **Full Disk Access** tab
- [ ] Remove any screenpipe entries (if present)

### 5. Login Items
- [ ] Open **System Preferences** → **Users & Groups**
- [ ] Click **Login Items** tab
- [ ] Remove any screenpipe entries

### 6. Files & Folders (if on macOS Catalina+)
- [ ] Back to **Security & Privacy** → **Files & Folders**
- [ ] Remove any screenpipe entries

---

## 💡 TIPS

- **Look Carefully:** There might be duplicate entries that look identical
- **Scroll Down:** List might be long, scroll to see all entries
- **Unknown Paths:** Remove anything with screenpipe in the path
- **Be Thorough:** This prevents permission conflicts on fresh install

---

## 🚧 COMMON ENTRIES YOU'LL SEE

```
screenpipe                                    ← Remove
screenpipe-app                                ← Remove  
/path/to/screenpipe-git/.../screenpipe-app   ← Remove
/Applications/screenpipe.app                  ← Remove (if present)
screenpipe (3)                                ← Remove
screenpipe (4)                                ← Remove
... (and more)
```

---

## ✅ VERIFICATION

After cleaning:
- [ ] Screen Recording list has NO screenpipe entries
- [ ] Microphone list has NO screenpipe entries
- [ ] Accessibility list has NO screenpipe entries
- [ ] Login Items has NO screenpipe entries

---

## 📋 QUICK ACCESS

Run this to open Security & Privacy:
```bash
open "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture"
```

Or manually:
**System Preferences → Security & Privacy → Privacy tab**

---

## ⚠️ IMPORTANT

This MUST be done manually - macOS security prevents automated removal of privacy settings.

Take your time and be thorough - missing even one entry can cause permission issues!

---

## NEXT STEPS

After cleanup:
1. ✅ All privacy entries removed
2. ✅ Ready for fresh install
3. ✅ Install from DMG or app bundle
4. ✅ Grant permissions on first launch (clean slate!)

---

**Status:** ⏳ Awaiting manual cleanup

Once complete, you'll have a clean slate for the new deployment!

