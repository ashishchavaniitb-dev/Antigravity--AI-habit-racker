# 📋 Product Design Document — Habit Tracker App

**Version:** 1.0  
**Date:** March 15, 2026  
**Status:** Draft  
**Author:** Antigravity AI (Google DeepMind)  
**Prepared for:** Ashish Chavan

---

## 1. Product Overview

### Vision
A clean, interactive habit tracker that helps users build and sustain daily routines through simple check-ins, motivating streaks, and lightweight progress insights.

### Problem Statement
Most people struggle to maintain new habits because tracking feels burdensome or overly complex. Existing apps are either too minimal (no motivation) or too feature-heavy (cognitive overload).

### Goal
Deliver a focused, delightful experience where tracking a habit takes **less than 5 seconds per day**.

---

## 2. Target Users

| Persona | Description |
|---|---|
| **The Beginner** | Someone starting a wellness routine (exercise, hydration, sleep) for the first time |
| **The Busy Professional** | Needs quick, frictionless check-ins throughout the day |
| **The Goal Setter** | Motivated by streaks, progress charts, and milestone rewards |

---

## 3. Core Features

### 3.1 Habit Management
- **Add a Habit** — Name, emoji icon, frequency (Daily / Weekdays / Custom days), and optional reminder time.
- **Edit / Archive / Delete** a habit at any time.
- Maximum **10 active habits** (keeps focus; expandable in future).

### 3.2 Daily Check-In
- Home screen shows today's habits as interactive cards.
- One-tap to mark a habit **complete** (card turns green with a satisfying animation).
- Undo support within the same day.

### 3.3 Streaks & Progress
- **Current streak** counter shown on each habit card.
- **Longest streak** badge for personal records.
- **Weekly heatmap** — a 7-day grid showing completion for each habit.

### 3.4 Dashboard / Insights
- **Completion rate** per habit (last 7 / 30 days).
- Overall **daily consistency score** (% of habits completed today).
- Simple bar chart or ring chart for weekly overview.

### 3.5 Reminders
- Optional push notifications per habit at a user-defined time.
- A single daily summary notification (optional) at a configurable time.

### 3.6 Onboarding
- 3-screen onboarding introducing core concepts (Add → Check-in → Streak).
- Skippable; pre-populated with 3 starter habit suggestions.

---

## 4. UI / UX Design Principles

| Principle | How it applies |
|---|---|
| **Minimal friction** | Home screen = today's habits. No deep navigation required. |
| **Positive reinforcement** | Animations, streak flames 🔥, and achievement badges on milestones. |
| **Clarity over features** | Each screen has one primary action. |
| **Accessible** | WCAG AA contrast ratios; tap targets ≥ 44px; supports system dark mode. |

### Color Palette (suggested)
- **Primary:** Indigo `#4F46E5`
- **Success:** Emerald `#10B981`
- **Warning / Streak:** Amber `#F59E0B`
- **Background (light):** Slate `#F8FAFC` | **(dark):** `#0F172A`

### Typography
- **Headings:** Inter Bold
- **Body:** Inter Regular
- **Numeric / Stats:** Inter Semibold

---

## 5. Information Architecture

```
App
├── Home (Today's Habits)
│   └── Habit Card (check-in, streak, quick edit)
├── Dashboard (Progress & Insights)
│   └── Per-habit detail view
├── Add / Edit Habit (modal / sheet)
└── Settings
    ├── Notifications
    ├── Theme (Light / Dark / System)
    └── Data (Export, Reset)
```

---

## 6. Data Model

### Habit
| Field | Type | Description |
|---|---|---|
| `id` | UUID | Unique identifier |
| `name` | String | Habit name (max 40 chars) |
| `emoji` | String | Icon (1 emoji character) |
| `frequency` | Enum | Daily / Weekdays / Custom |
| `customDays` | Array\<Int\> | [0–6] (0 = Sunday) |
| `reminderTime` | Time? | Optional local time |
| `createdAt` | Date | Creation timestamp |
| `archivedAt` | Date? | Nullable; set when archived |

### HabitLog
| Field | Type | Description |
|---|---|---|
| `id` | UUID | Unique identifier |
| `habitId` | UUID | FK → Habit |
| `date` | Date | Local calendar date |
| `completedAt` | DateTime | Timestamp of check-in |

---

## 7. Key User Flows

### Flow 1: First-Time User
1. Launch app → Onboarding (3 screens) → Home with starter habits pre-loaded.
2. User taps a habit card → marks complete → streak starts at 1.

### Flow 2: Daily Check-In (Returning User)
1. Open app (or tap notification) → Home screen.
2. Tap each completed habit → cards animate to done state.
3. All habits done → Celebration animation + daily score shown.

### Flow 3: Adding a New Habit
1. Tap **+** button on Home → Add Habit sheet slides up.
2. Enter name, pick emoji, set frequency, optionally set reminder.
3. Tap **Save** → habit appears on Home immediately.

---

## 8. Success Metrics

| Metric | Target (90-day) |
|---|---|
| Day-1 Retention | ≥ 60% |
| Day-7 Retention | ≥ 35% |
| Avg. daily check-ins per active user | ≥ 2 habits/day |
| Avg. streak length (active users) | ≥ 5 days |
| Crash-free sessions | ≥ 99.5% |

---

## 9. Out of Scope (v1)

- Social / sharing features
- Habit templates library
- Calendar integration
- Quantitative tracking (e.g., "drank 6 glasses")
- Subscription / monetization

---

## 10. Future Roadmap

| Phase | Feature |
|---|---|
| **v1.1** | Habit categories & tags |
| **v1.2** | Quantitative habits (count / duration) |
| **v2.0** | Social accountability partner |
| **v2.1** | AI-powered habit suggestions |
| **v3.0** | Apple Watch / Wear OS companion |

---

## 11. Open Questions

1. **Platforms:** Native iOS + Android, or cross-platform (React Native / Flutter) from day one?
2. **Backend:** Local-only storage (MVP) or cloud sync with accounts?
3. **Monetization model:** Free with premium tier, or one-time purchase?

---

*Document owner: Product Team · Next review: Sprint Planning*

---

## 📝 Credits

This product design document was researched, structured, and authored by **Antigravity AI**, an advanced agentic coding and product assistant by **Google DeepMind**.

| Role | Name |
|---|---|
| AI Author / Designer | Antigravity AI (Google DeepMind) |
| Product Owner | Ashish Chavan |
| Document Version | 1.0 — March 15, 2026 |

> *Generated with Antigravity — your AI pair programmer.*
