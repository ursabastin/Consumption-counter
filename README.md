# ⏱️ Multi-Platform Social Media & Video Consumption Counter

<div align="center">

![Manifest V3](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-4F46E5?style=for-the-badge&logo=googlechrome&logoColor=white)
![Platforms](https://img.shields.io/badge/Platforms-13_Networks-E11D48?style=for-the-badge&logo=youtube&logoColor=white)
![Design System](https://img.shields.io/badge/Design_System-Grounded_Light-0284C7?style=for-the-badge&logo=figma&logoColor=white)
![Zero Trackers](https://img.shields.io/badge/Privacy-100%25_Local_Storage-059669?style=for-the-badge&logo=shield&logoColor=white)
![No Dependencies](https://img.shields.io/badge/Core-Vanilla_JS_%26_Canvas-F59E0B?style=for-the-badge&logo=javascript&logoColor=white)

<br/>

**Transform invisible screen time into mindful balance across the entire social web.**  
*Track active time on YouTube, Instagram, TikTok, Reddit, Discord, X, WhatsApp, LinkedIn, Pinterest, Snapchat, Facebook, Telegram, and WeChat with sub-second precision.*

---

</div>

> [!NOTE]
> **Author's Note**: This is just my idea. Everything in this project—including the architecture, code implementation, UI/UX design system, and extension packaging—was conceived, crafted, and built entirely by AI.

---

## 🌐 The 13 Monitored Platforms

```
   ┌───────────────────────────────────────────────────────────────────────────────────┐
   │                          UNIFIED ATTENTION COMMAND CENTER                         │
   │                                                                                   │
   │   🎬 YouTube        📸 Instagram      ⚡ TikTok         🟠 Reddit     💬 Discord  │
   │   🐦 X (Twitter)    📱 WhatsApp       💼 LinkedIn       📌 Pinterest  👻 Snapchat │
   │   👥 Facebook       ✈️ Telegram       🟢 WeChat                                   │
   │                                                                                   │
   │      [ Deep Focus & Long-Form ]        VS.        [ Rapid Microcontent ]          │
   │      Documentaries, Chats, Threads                Reels, Shorts, TikToks, Snaps   │
   └───────────────────────────────────────────────────────────────────────────────────┘
```

Modern web platforms use addictive microcontent algorithms designed to keep you scrolling. **Social Media & Consumption Counter** tracks each platform with custom feature calculation, providing unified doomscroll budgets and deep focus metrics.

---

## 🔍 Custom Platform Calculation Matrix

Every platform is calculated specifically according to its interaction patterns:

| Platform | Domain Match | Deep Content | Rapid Microcontent | Custom Sub-Features Tracked |
|:---|:---|:---|:---|:---|
| **🎬 YouTube** | `*.youtube.com` | Regular Videos ($\ge 5\text{s}$) | YouTube Shorts | Skips ($<4\text{s}$), Browse, Searches |
| **📸 Instagram** | `*.instagram.com` | Feed Posts, Stories, DMs | Instagram Reels | Reels Stream vs Main Feed & Explore |
| **⚡ TikTok** | `*.tiktok.com` | Profile & Search | For You Stream | Continuous rapid microcontent stream |
| **🟠 Reddit** | `*.reddit.com` | Subreddit Posts & Wikis | Comment Debates | Post Reading vs Comment Threads |
| **💬 Discord** | `*.discord.com` | Server Channels & Text | Voice & Video Calls | Text Chat time vs Voice/Stage calls |
| **🐦 X / Twitter** | `*.x.com`, `*.twitter.com` | Bookmarks & Articles | Timeline Stream | Timeline scrolling vs Post engagements |
| **📱 WhatsApp** | `web.whatsapp.com` | Chat Discussions | Status Stories | Active typing & messaging sessions |
| **💼 LinkedIn** | `*.linkedin.com` | Articles & Job Boards | Feed Stream | Professional feed vs Direct InMail |
| **📌 Pinterest** | `*.pinterest.com` | Visual Boards | Pin Stream | Pin zooming vs Board curation |
| **👻 Snapchat** | `*.snapchat.com` | Snaps & Stories | Spotlight Stream | Spotlight Reels vs Chat & Stories |
| **👥 Facebook** | `*.facebook.com` | Groups & Feed Posts | Facebook Reels | Watch Reels vs Community Groups |
| **✈️ Telegram** | `web.telegram.org` | Group Discussions | Channels & Broadcasts | Channel reading vs Direct chats |
| **🟢 WeChat** | `*.wechat.com`, `wx.qq.com` | Group Chats | Moments Stream | Moments feed vs Chat sessions |

---

## 🖥️ The UI / UX Experience

Designed around a **Grounded Light Design System**, the interface prioritizes high contrast, crisp porcelain surfaces (`#F8FAFC` and `#FFFFFF`), and monospace tabular numerals to eliminate visual clutter.

```
                                 THE 3 SURFACES
                                 
      ┌────────────────┐      ┌─────────────────┐      ┌──────────────────┐
      │   SURFACE 1    │      │    SURFACE 2    │      │    SURFACE 3     │
      │  FLOATING HUD  │ ───► │  TOOLBAR POPUP  │ ───► │ ANALYTICS HUB    │
      │ (Adaptive Pill)│      │  (Bento Cards)  │      │  (Full Command)  │
      └────────────────┘      └─────────────────┘      └──────────────────┘
```

---

### 1. 🎯 The Dynamic Capsule (Floating On-Page HUD)

An adaptive, draggable glassmorphic pill that automatically morphs its branding and counters based on the active platform you are browsing:

```
 ┌────────────────────────────────────────────────────────────────────────────┐
 │  🟢  [ 📸 08:45 ]   TODAY 24m (📸 Instagram)   │   ALL SOCIAL: 1h 12m   [ ⊞ ] [ ⤢ ] │
 └────────────────────────────────────────────────────────────────────────────┘
     ▲         ▲                     ▲                          ▲           ▲     ▲
   Status   Active Item          This Platform              Total Social   Dash Collapse
   Pulse      Timer              Today's Time                Screen Time   Open   Pill
```

* **Dynamic Adaptation**: Automatically switches brand badge (🎬 YouTube, 📸 Instagram, ⚡ TikTok, 💬 Discord, etc.) and color accent when you change sites.
* **Dual Time Display**: Shows your active session on the current site alongside your unified cross-platform screen time.
* **Zero Distraction**: Double-click or click `[ ⤢ ]` to collapse into a micro status dot.
* **Persistent Accountability**: No accidental dismiss button (`×`) on the page—stays active until toggled off in settings or uninstalled.
* **Draggable Anywhere**: Reposition to any corner; coordinates persist across page navigations.
* **Smart Inactivity Detection**: Pauses automatically when tab loses focus or when media stops playing.

---

### 2. 📊 The Multi-Platform Toolbar Menu (`popup.html`)

A modern Bento-box popup accessible directly from your browser toolbar:

```
 ┌──────────────────────────────────────────────┐
 │  (▶) SOCIAL COUNTER         ● MONITORING  ⊞  │
 ├──────────────────────────────────────────────┤
 │  TOTAL SOCIAL SCREEN TIME            MINDFUL │
 │  2h 14m 32s                                  │
 ├──────────────────────────────────────────────┤
 │  ACTIVE PLATFORMS TODAY                      │
 │  [🎬 YouTube 54m]  [📸 Insta 32m]  [⚡ TT 24m]│
 │  [🟠 Reddit 18m]   [💬 Discord 6m]           │
 ├──────────────────────┬───────────────────────┤
 │  📚 DEEP FOCUS       │  ⚡ MICROCONTENT      │
 │  1h 18m              │  56m                  │
 │  Intentional reads   │  Shorts / Reels / FYP │
 ├──────────────────────┴───────────────────────┤
 │  ATTENTION BALANCE      58% Deep • 42% Micro │
 │  [█████████████████████░░░░░░░░░░░░░░░]      │
 ├──────────────────────────────────────────────┤
 │  ⏱️ MICROCONTENT DOOMSCROLL BUDGET    56m/25m │
 │  [████████████████████████████████████] ⚠️   │
 ├──────────────────────────────────────────────┤
 │  Floating HUD on Social Sites         [ ON ] │
 ├──────────────────────────────────────────────┤
 │  [      OPEN DETAILED ANALYTICS HUB  ➔     ] │
 └──────────────────────────────────────────────┘
```

---

### 3. 📈 The Fullscreen Analytics Hub (`dashboard.html`)

A full-fledged analytical command center running locally in your browser with multi-platform filtering:

```
┌──────────────┬──────────────────────────────────────────────────────────────┐
│ SOCIAL CTRL  │  CONSUMPTION OVERVIEW     [🌐 All Platforms ▼] [Today] 💾 ↗  │
├──────────────┼──────────────────────────────────────────────────────────────┤
│  ⊞ Overview  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────┐ │
│  📈 Trends   │  │ TOTAL SCREEN │ │ DEEP CONTENT │ │ MICROCONTENT │ │RATIO │ │
│  📋 Log      │  │ 3h 15m       │ │ 1h 55m       │ │ 1h 20m       │ │59/41 │ │
│  📥 Takeout  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────┘ │
│  ⚙️ Settings │                                                              │
│              │  ┌───────────────────────────────┐ ┌───────────────────────┐ │
│              │  │ DAILY CONSUMPTION (STACKED)   │ │ ATTENTION MARKET SHARE│ │
│              │  │  m                            │ │        ╭───╮          │ │
│              │  │ 90|        ▄█   █             │ │       │ 38% │ YouTube │ │
│              │  │ 60|   █    ██   █             │ │        ╰───╯  Insta   │ │
│              │  │ 30|   █    ██   █             │ │               TikTok  │ │
│              │  │  0└───┴────┴────┴───────────  │ │               Reddit  │ │
│              │  └───────────────────────────────┘ └───────────────────────┘ │
│              │  ┌───────────────────────────────┐ ┌───────────────────────┐ │
│              │  │ 24-HOUR HOURLY PROFILE        │ │ DOOMSCROLL BUDGET GAUGE││
│  ──────────  │  │ Peak usage: 7 PM - 10 PM      │ │ [=======·····] 65%    │ │
│  ● 13 Active │  └───────────────────────────────┘ └───────────────────────┘ │
│  [⚡ Sample] │                                                              │
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
| **Grounded Indigo** | `#4F46E5` | Deep content & primary focus | ![#4F46E5](https://placehold.co/18x18/4F46E5/4F46E5.png) |
| **Crimson Rose** | `#E11D48` | Microcontent & doomscroll alerts | ![#E11D48](https://placehold.co/18x18/E11D48/E11D48.png) |
| **Emerald Mint** | `#059669` | Mindful status & positive wellness | ![#059669](https://placehold.co/18x18/059669/059669.png) |
| **Warm Amber** | `#D97706` | Approaching budget limit warning | ![#D97706](https://placehold.co/18x18/D97706/D97706.png) |

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

* **100% Local Storage**: Your browsing and watch metrics never leave your computer. Zero external API calls, zero telemetry.
* **Google Takeout Importer**: Drag and drop your Google Takeout `watch-history.json` or `.html` to quantify years of past viewing history into instant visual analytics.
* **CSV Export**: Export your complete multi-platform activity log with timestamps into a clean `.csv` for Excel, Notion, or Google Sheets.
* **JSON Backup & Restore**: Full snapshots with one-click restoration.
* **Instant Demo Mode**: Click **"⚡ Load Sample Data"** in the dashboard to immediately test all charts, filters, and features with 30 days of synthetic multi-platform data.

---

## 🏗️ Technical Architecture

Built purely with vanilla web standards for speed, security, and battery efficiency:

```text
Consumption counter/
│
├── manifest.json              # Chrome Manifest V3 config (13 platform match patterns)
├── background.js              # Service worker (alarms, badge timer, notifications)
├── content.js                 # Universal content script & adaptive on-page HUD
├── content.css                # Grounded light theme HUD styles
│
├── popup.html                 # Bento-grid toolbar popup interface
├── popup.css                  # Popup light theme styling
├── popup.js                   # Multi-platform chip engine & doomscroll meter
│
├── dashboard.html             # Fullscreen analytics dashboard with platform dropdown
├── dashboard.css              # Dashboard stylesheet & responsive grid
├── dashboard.js               # Canvas chart engines, filters & Takeout parser
├── index.html                 # Standalone web entry point
│
├── utils/
│   └── storage.js             # Platform configs, storage & multi-network aggregation
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

*Empowering intentional, mindful digital life across the social web.*

</div>
