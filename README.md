# ⏱️ YouTube Consumption Counter & Habit Tracker

<div align="center">

![Manifest V3](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-4F46E5?style=for-the-badge&logo=googlechrome&logoColor=white)
![Design System](https://img.shields.io/badge/Design_System-Grounded_Light-E11D48?style=for-the-badge&logo=figma&logoColor=white)
![Zero Trackers](https://img.shields.io/badge/Privacy-100%25_Local_Storage-059669?style=for-the-badge&logo=shield&logoColor=white)
![No Dependencies](https://img.shields.io/badge/Core-Vanilla_JS_%26_Canvas-0284C7?style=for-the-badge&logo=javascript&logoColor=white)

<br/>

**Transform invisible watch time into visual, mindful balance.**  
*Track active time on YouTube Videos vs. Shorts, monitor doomscrolling in real time, and reclaim your digital focus.*

---

</div>

> [!NOTE]
> **Author's Note**: This is just my idea. Everything in this project—including the architecture, code implementation, UI/UX design system, and extension packaging—was conceived, crafted, and built entirely by AI.

---

## 🎬 The Digital Dilemma: Deep Focus vs. Infinite Scroll

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │                           THE WATCH PARADOX                            │
  │                                                                        │
  │   🎬 LONG-FORM VIDEOS                     ⚡ YOUTUBE SHORTS            │
  │   Intentional • Deep Dives                Algorithmic • Hyper-stim     │
  │   Measured in Minutes & Lessons           Measured in Seconds & Skips  │
  │                                                                        │
  │       [ 1 hr documentary ]         VS.         [ 85 micro-shorts ]     │
  │          Clear Intent                             Lost Hours           │
  └────────────────────────────────────────────────────────────────────────┘
```

YouTube's interface treats all consumption the same. **YouTube Consumption Counter** separates the signal from the noise—distinguishing high-intent long-form viewing from passive short-form bingeing with sub-second accuracy.

---

## 🖥️ The UI / UX Experience

Designed around a **Grounded Light Design System**, the interface prioritizes high contrast, crisp porcelain surfaces, and monospace tabular numerals to eliminate visual clutter.

```
                                 THE 3 SURFACES
                                 
      ┌────────────────┐      ┌─────────────────┐      ┌──────────────────┐
      │   SURFACE 1    │      │    SURFACE 2    │      │    SURFACE 3     │
      │  FLOATING HUD  │ ───► │  TOOLBAR POPUP  │ ───► │ ANALYTICS HUB    │
      │   (On-Page)    │      │  (Quick Glance) │      │  (Full Command)  │
      └────────────────┘      └─────────────────┘      └──────────────────┘
```

---

### 1. 🎯 The Dynamic Capsule (Floating On-Page HUD)

A discreet, draggable glassmorphic pill that stays anchored directly on YouTube pages while you watch.

```
 ┌────────────────────────────────────────────────────────────────────────────┐
 │  🟢  [ 🎬 04:32 ]   VIDEOS 4 (48m)   │   SHORTS 16 (14m)   [ ⊞ ]  [ ⤢ ]   │
 └────────────────────────────────────────────────────────────────────────────┘
     ▲         ▲             ▲                     ▲            ▲      ▲
   Status   Live Item     Long-Form            Short-Form      Open  Collapse
   Pulse      Timer        Totals                Totals        Dash    Pill
```

* **Zero Distraction**: Double-click or click `[ ⤢ ]` to collapse into a micro status dot.
* **Persistent Accountability**: No close button (`×`) on the page—stays active until toggled off in settings or uninstalled.
* **Draggable Anywhere**: Reposition to any corner; coordinates persist across page navigations.
* **Smart Detection**: Stops counting automatically when video is paused or the tab loses focus.

---

### 2. 📊 The Bento-Grid Toolbar Menu (`popup.html`)

A modern Bento-box popup accessible directly from your browser toolbar.

```
 ┌──────────────────────────────────────────────┐
 │  (▶) YT COUNTER             ● MONITORING  ⊞  │
 ├──────────────────────────────────────────────┤
 │  TODAY'S ACTIVE WATCH TIME          MINDFUL  │
 │  1h 24m 18s                                  │
 ├──────────────────────┬───────────────────────┤
 │  🎬 VIDEOS       [5] │  ⚡ SHORTS       [24] │
 │  58m                 │  26m                  │
 │  Avg 11m / video     │  Avg 65s / short      │
 ├──────────────────────┴───────────────────────┤
 │  FORMAT SPLIT           69% Videos • 31% S   │
 │  [█████████████████████████░░░░░░░░░░░░]     │
 ├──────────────────────────────────────────────┤
 │  ⏱️ SHORTS DAILY BUDGET               26m/25m │
 │  [████████████████████████████████████] ⚠️   │
 ├──────────────┬───────────────┬───────────────┤
 │  ⏭️  42      │  🔍  7        │  🧭  12m      │
 │    Skips     │    Searches   │     Browse    │
 ├──────────────┴───────────────┴───────────────┤
 │  Floating HUD on YouTube              [ ON ] │
 ├──────────────────────────────────────────────┤
 │  [      OPEN DETAILED ANALYTICS HUB  ➔     ] │
 └──────────────────────────────────────────────┘
```

---

### 3. 📈 The Fullscreen Analytics Hub (`dashboard.html`)

A full-fledged analytical command center running locally in your browser.

```
┌──────────────┬──────────────────────────────────────────────────────────────┐
│  YT COUNTER  │  CONSUMPTION OVERVIEW             [Today][7D][30D][All] 💾 ↗ │
├──────────────┼──────────────────────────────────────────────────────────────┤
│  ⊞ Overview  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────┐ │
│  📈 Trends   │  │ TOTAL TIME   │ │ VIDEOS       │ │ SHORTS       │ │RATIO │ │
│  📋 History  │  │ 2h 45m       │ │ 1h 55m       │ │ 50m          │ │70/30 │ │
│  📥 Takeout  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────┘ │
│  ⚙️ Settings │                                                              │
│              │  ┌───────────────────────────────┐ ┌───────────────────────┐ │
│              │  │ DAILY CONSUMPTION (STACKED)   │ │ FORMAT DONUT          │ │
│              │  │  m                            │ │        ╭───╮          │ │
│              │  │ 90|        ▄█   █             │ │       │ 70% │  Videos │ │
│              │  │ 60|   █    ██   █             │ │        ╰───╯   Shorts │ │
│              │  │ 30|   █    ██   █             │ │                Browse │ │
│              │  │  0└───┴────┴────┴───────────  │ └───────────────────────┘ │
│              │  └───────────────────────────────┘                           │
│  ──────────  │  ┌───────────────────────────────┐ ┌───────────────────────┐ │
│  ● Monitored │  │ 24-HOUR ACTIVITY PROFILE      │ │ MINDFUL HABIT CHECK   │ │
│  Ready       │  │ Peak viewing: 8 PM - 10 PM    │ │ [=======·····] 65%    │ │
│  [⚡ Sample] │  └───────────────────────────────┘ └───────────────────────┘ │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

---

## 🎨 Color System & Visual Identity

The design system uses a grounded porcelain light palette with high-contrast functional accents:

| Token | Hex | Role | Visual Preview |
|:---|:---:|:---|:---:|
| **App Canvas** | `#F8FAFC` | Grounding & page background | ![#F8FAFC](https://placehold.co/18x18/F8FAFC/F8FAFC.png) |
| **Card Surface** | `#FFFFFF` | Elevated Bento card containers | ![#FFFFFF](https://placehold.co/18x18/FFFFFF/FFFFFF.png) |
| **Deep Carbon** | `#0F172A` | High-contrast headings & tabular digits | ![#0F172A](https://placehold.co/18x18/0F172A/0F172A.png) |
| **Grounded Indigo** | `#4F46E5` | Regular Videos & deep focus actions | ![#4F46E5](https://placehold.co/18x18/4F46E5/4F46E5.png) |
| **Crimson Rose** | `#E11D48` | YouTube Shorts & doomscroll budget | ![#E11D48](https://placehold.co/18x18/E11D48/E11D48.png) |
| **Emerald Mint** | `#059669` | Mindful status & positive wellness | ![#059669](https://placehold.co/18x18/059669/059669.png) |
| **Warm Amber** | `#D97706` | Approaching budget limit alert | ![#D97706](https://placehold.co/18x18/D97706/D97706.png) |

---

## ⚡ Feature Matrix

| Feature | Regular Video (🎬) | YouTube Shorts (⚡) | Home & Feeds (🧭) |
|:---|:---:|:---:|:---:|
| **Playback Qualification** | Active $\ge 5\text{s}$ | Active $\ge 4\text{s}$ | In-view scrolling |
| **Rapid Skip Tracking** | — | Skipped $< 4\text{s}$ | — |
| **Timer Precision** | 1000ms active tick | 1000ms active tick | 5000ms idle tick |
| **Tab Visibility Check** | Strict focus check | Strict focus check | Tab visible |
| **Audio-only Backgrounding** | Optional toggle | Optional toggle | — |
| **History Logging** | Title, Channel, Link | Title, Channel, Link | Timestamped duration |

---

## 🚀 Installation & Quick Start

```
                               3-STEP FAST SETUP
                               
    [ Step 1: Open ]           [ Step 2: Toggle ]           [ Step 3: Drop ]
   chrome://extensions        Developer Mode (ON)         Drop ZIP directly
```

### Option A: Direct Drag & Drop ZIP (No Unzipping Needed)
1. Open Google Chrome (or Edge, Brave, Opera, Arc).
2. Type **`chrome://extensions`** in your address bar.
3. In the top-right corner, switch **Developer mode** to **ON**.
4. **Drag and drop** [`youtube-consumption-counter.zip`](youtube-consumption-counter.zip) straight onto the browser window.
5. The extension installs instantly! Pin it to your toolbar.

### Option B: Load Unpacked Folder
1. Go to `chrome://extensions` with **Developer mode** enabled.
2. Click **"Load unpacked"** in the top-left.
3. Choose the root folder: `Consumption counter`.

---

## 📥 Data Privacy & Portability

* **100% Local Storage**: Your watch metrics never leave your computer. Zero external API calls, zero telemetry.
* **Google Takeout Importer**: Drag and drop your Google Takeout `watch-history.json` or `.html` to quantify years of past viewing history into instant visual analytics.
* **CSV Export**: Export your complete watch history into a clean `.csv` for Excel, Notion, or Google Sheets.
* **JSON Backup & Restore**: Full snapshots with one-click restoration.
* **Instant Demo Mode**: Click **"⚡ Load Sample Data"** in the dashboard to immediately test all charts and features with 30 days of synthetic data.

---

## 🏗️ Technical Architecture

Built purely with vanilla web standards for speed, security, and battery efficiency:

```text
Consumption counter/
│
├── manifest.json              # Chrome Manifest V3 configuration
├── background.js              # Service worker (alarms, badge indicators, limits)
├── content.js                 # Injected YouTube tracker & draggable HUD
├── content.css                # Grounded light theme HUD styles
│
├── popup.html                 # Bento-grid toolbar popup interface
├── popup.css                  # Popup light theme styling
├── popup.js                   # Live refresh engine & controls
│
├── dashboard.html             # Fullscreen analytics dashboard
├── dashboard.css              # Dashboard stylesheet & responsive grid
├── dashboard.js               # Canvas chart engines, filters & Takeout parser
├── index.html                 # Standalone web entry point
│
├── utils/
│   └── storage.js             # Unified storage, formatting & aggregation
├── icons/                     # Crisp PNG icons (16, 32, 48, 128 px, SVG)
│
├── package-extension.py       # POSIX-compliant ZIP packager script
└── youtube-consumption-counter.zip  # Ready-to-install bundle
```

---

## 🛠️ Modifying & Re-packaging

If you edit any code, re-build the ZIP bundle in one command:
```bash
python package-extension.py
```
This packages the archive using strict POSIX forward-slash headers for Chromium compliance.

---

<div align="center">

*Empowering intentional, mindful content consumption.*

</div>
