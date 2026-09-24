# ⏱️ YouTube Consumption Counter & Habit Tracker

> [!NOTE]
> **Author's Note**: This is just my idea. Everything in this project—including the architecture, code implementation, UI design system, and extension packaging—was done entirely by AI.

A lightweight, privacy-friendly browser extension (Manifest V3) and comprehensive analytics hub built to monitor, quantify, and balance your YouTube consumption habits. It tracks active time spent on **Regular Videos** vs. **YouTube Shorts**, monitors doomscrolling patterns, logs feature usage, and visualizes viewing trends with a grounded, modern light-theme dashboard.

---

## 🚀 Quick Install (Chrome / Edge / Brave / Opera / Arc)

### Method 1: Direct ZIP Install (Fastest)
1. Open your Chromium browser and go to **`chrome://extensions`** (or `edge://extensions`).
2. In the top-right corner, toggle **Developer mode** to **ON**.
3. **Drag and drop** [`youtube-consumption-counter.zip`](youtube-consumption-counter.zip) directly into the `chrome://extensions` window.
4. The extension installs immediately. Pin it to your browser toolbar!

### Method 2: Load Unpacked Folder
1. Go to **`chrome://extensions`** and ensure **Developer mode** is **ON**.
2. Click the **Load unpacked** button in the top-left.
3. Select this folder: `Consumption counter`.
4. Done!

---

## ✨ Features & Capabilities

### 1. 🎬 Regular Videos vs. ⚡ YouTube Shorts Tracking
* **Active Watch Time**: Measures real playback time using HTML5 video state detection (tab focus, visibility, play/pause state). Paused videos or background tabs do not inflate watch time unless background audio tracking is explicitly enabled.
* **Smart View Counting**:
  * Regular videos watched for $\ge 5$ seconds are counted as viewed.
  * Shorts watched for $\ge 4$ seconds are counted as viewed.
  * Shorts skipped under 4 seconds are tracked separately under **Shorts Rapid Skips** (doomscroll indicator).
* **Format Ratio Split**: Visualizes your consumption ratio between deep, long-form content vs. short-form video.

### 2. 🧭 Feature Usage Metrics
* **Search Queries**: Automatically counts search queries executed on YouTube.
* **Home & Feed Browsing**: Measures time spent scrolling the homepage, subscriptions feed, and channel pages without an active video.
* **Comment Engagements**: Tracks comment writing and interactions.

### 3. 🎯 Floating Draggable On-Page HUD
* Injected directly into YouTube pages as an unobtrusive, grounded capsule.
* Displays live item duration and today's accumulated totals.
* **Draggable**: Drag the floating pill anywhere on your screen (position is remembered across sessions).
* **Persistent**: Does not have a close button on the HUD itself to prevent accidental dismissal; it stays active while on YouTube until toggled off in settings or removed from the extensions page.
* **Minimizable**: Double-click or click the minimize button to collapse into a compact badge.

### 4. 📊 Bento-Grid Toolbar Popup (`popup.html`)
Click the extension icon in your toolbar to view:
* Today's active watch time with a mindful status badge.
* Side-by-side comparison cards for Videos and Shorts with average durations.
* Precision-segmented format ratio track.
* Shorts daily budget progress bar with warning indicators.
* Fast toggle for the floating HUD overlay.
* One-click button to launch the full analytics dashboard.

### 5. 📈 Fullscreen Analytics Hub (`dashboard.html`)
Open via the extension popup, right-clicking the extension icon -> **Options**, or opening `dashboard.html` directly in your browser:
* **Time Range Filtering**: Filter metrics by **Today**, **Last 7 Days**, **Last 30 Days**, or **All Time**.
* **Interactive Canvas Charts**:
  * **Daily Consumption Trend**: Stacked bar chart showing Videos vs. Shorts watch time across days.
  * **Feature Split Donut**: Breakdown of Videos, Shorts, and Feed Browsing.
  * **24-Hour Profile**: Visualizes peak watch hours throughout the day.
  * **Mindful Habits Wellness Gauge**: Speedometer showing % of daily shorts budget used.
  * **Session Duration Distribution**: Bins your sittings into `< 1m`, `1-5m`, `5-15m`, `15-30m`, and `> 30m`.
* **Searchable Watch History Log**:
  * Filter and search watched items with format badges (🎬 / ⚡), channel names, durations, and direct YouTube links.
  * **Export to CSV**: Export your watch history into an Excel/Google Sheets compatible spreadsheet.
* **Google Takeout Importer**:
  * Drag and drop `watch-history.json` or `watch-history.html` from Google Takeout to parse and quantify historical viewing archives over months or years.
* **Backup & Restore**:
  * Download full database backups as JSON or restore anytime.
* **⚡ Sample Data Generator**:
  * Click **"Load Sample Data"** in the sidebar to populate 30 days of realistic watch patterns and preview all visualizations immediately.

---

## 🎨 UI Design System & Grounded Light Theme

The interface utilizes a **grounded white light design system**:
* **Canvas / Grounding**: Crisp off-white `#F8FAFC` and pure porcelain white `#FFFFFF`.
* **Card Surfaces**: Pure white cards with subtle, elevated drop-shadows (`0 1px 3px rgba(0, 0, 0, 0.05), 0 10px 25px -5px rgba(0, 0, 0, 0.04)`) and fine `#E2E8F0` borders.
* **Typography**: Deep carbon slate `#0F172A` for primary metrics/headings, `#334155` for body text, and `#64748B` for secondary labels.
* **Videos Accent**: Grounded Royal Indigo (`#4F46E5` / `#4338CA`) on soft `#EEF2FF`.
* **Shorts Accent**: Vibrant Crimson Rose (`#E11D48`) on soft `#FFE4E6`.
* **Tabular Numerals**: Built using monospace numerical tracking (`font-variant-numeric: tabular-nums`) so timer numbers remain steady and never jitter.

---

## 📁 Repository Structure

```text
Consumption counter/
├── manifest.json              # Chrome Manifest V3 configuration
├── background.js              # Service worker (alarms, badge updates, limits)
├── content.js                 # Injected YouTube tracker & draggable HUD
├── content.css                # Grounded light theme HUD styles
├── popup.html                 # Extension toolbar popup layout
├── popup.css                  # Grounded light theme popup styling
├── popup.js                   # Popup live refresh & controls
├── dashboard.html             # Fullscreen analytics dashboard
├── dashboard.css              # Grounded light theme dashboard stylesheet
├── dashboard.js               # Canvas chart engines, filters & Takeout parser
├── index.html                 # Standalone web entry point
├── package-extension.py       # POSIX-compliant ZIP packager script
├── package-extension.ps1      # PowerShell wrapper for packager
├── generate-png-icons.ps1     # Icon generator script
├── youtube-consumption-counter.zip  # Pre-packaged extension ready to install
├── utils/
│   └── storage.js             # Unified storage & calculation engine
└── icons/                     # Extension icons (16, 32, 48, 128 px, SVG)
```

---

## ⚙️ Settings & Customization
Under the **Limits & Settings** tab in the dashboard:
* **Daily Shorts Time Limit**: Default 25 mins (notifies you when reached).
* **Daily Total YouTube Limit**: Default 120 mins.
* **Break Reminder Frequency**: Prompts for mindful pauses every 30 mins.
* **Floating HUD Toggle**: Turn on/off on YouTube pages.
* **Track Background Audio**: Optional setting to count time even when YouTube tab is in the background.

---

## 🛠️ Building & Packaging

To re-package the extension after making any modifications:
```bash
python package-extension.py
```
This automatically bundles all necessary files with standard POSIX forward-slash headers into `youtube-consumption-counter.zip`.
