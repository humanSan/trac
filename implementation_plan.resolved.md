# Trac — Gamified Daily Todo List App

A progressive task management app built with **Ionic React** that gamifies daily productivity through a star-level system, Duolingo-inspired streaks, and habit tracking.

## Overview

The app divides each day into **3 progressive star levels** of tasks. Completing all tasks in Level 1 earns ⭐, Level 2 earns ⭐⭐, Level 3 earns ⭐⭐⭐. A 4th section holds **recurring habits** that can be dragged into daily levels. Streaks track consecutive days of hitting each star level, creating a Duolingo-like engagement loop.

---

## Proposed Changes

### 1. Project Setup

#### [NEW] Ionic React project scaffold
- Create using `npx.cmd -y @ionic/cli start trac blank --type=react --capacitor --no-git`
- Install additional dependencies:
  - `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` — drag-and-drop between star levels
  - `date-fns` — date manipulation
  - `uuid` + `@types/uuid` — unique IDs
  - `zustand` — lightweight state management (persisted to localStorage/Capacitor Storage)
  - `lucide-react` — icons
  - `framer-motion` — micro-animations and transitions

---

### 2. Architecture & Data Model

#### [NEW] `src/store/types.ts`
Core TypeScript interfaces:

```typescript
interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;      // ISO timestamp
  completedAt?: string;   // ISO timestamp
  assignedDate: string;   // YYYY-MM-DD
  starLevel: 1 | 2 | 3;
  sortOrder: number;
  habitId?: string;       // If spawned from a habit
  notes?: string;
}

interface Habit {
  id: string;
  name: string;
  icon: string;           // Lucide icon name
  color: string;          // Hex color
  interval: HabitInterval;
  intervalValue: number;  // e.g. 2 for "every 2 days"
  defaultStarLevel: 1 | 2 | 3;
  createdAt: string;
  archivedAt?: string;
}

type HabitInterval = 'daily' | 'every_n_days' | 'weekly' | 'monthly';

interface DayRecord {
  date: string;           // YYYY-MM-DD
  tasks: Task[];
  starLevel: 0 | 1 | 2 | 3;  // Highest completed level
  habitCompletions: Record<string, boolean>;  // habitId → done
}

interface Streak {
  type: 'star1' | 'star2' | 'star3' | 'habit';
  targetId?: string;      // habitId for habit streaks
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate?: string;
}
```

#### [NEW] `src/store/useStore.ts`
Zustand store with `persist` middleware (localStorage for web, Capacitor Preferences for native):
- **State slices**: tasks, habits, dayRecords, streaks, settings
- **Actions**: addTask, toggleTask, moveTask, reorderTasks, addHabit, completeHabit, calculateStreaks, getDayRecord
- Streak calculation logic: consecutive days where `starLevel >= threshold`

---

### 3. Theme & Design System

> **Design vibe: Fun, playful, and friendly** — Think Duolingo meets Finch. Bubbly shapes, bouncy micro-animations, warm colors, and a font that feels like a hug.

#### [NEW] `src/theme/variables.css`
Override Ionic CSS variables for a **fun, playful** aesthetic:
- **Font**: **Fredoka** from Google Fonts — a rounded, bubbly sans-serif that feels friendly and approachable. Used for headings, labels, streak numbers, and UI chrome. Body text uses Fredoka at lighter weights for readability.
- **Color palette**: Bright, saturated, joyful — inspired by Duolingo's green, Finch's pastels, and candy-land warmth
- **Shapes**: Extra-rounded corners (16–24px), pill-shaped buttons, soft blob-like card edges
- **Shadows**: Soft, colored shadows (e.g. green glow under star-1 cards) instead of gray drop shadows
- **Dark mode support** via `@media (prefers-color-scheme: dark)` — dark mode uses deep navy/purple backgrounds with the same vibrant accent colors

#### [NEW] `src/theme/global.css`
Global utility classes and animation keyframes:
- **Bouncy spring** animations on task completion (scale up → settle)
- **Confetti burst** on level completion
- **Wiggle** animation on streak badges
- **Pulse glow** on active streaks (colored halo that breathes)
- **Smooth slide-up** with slight overshoot for bottom sheets
- **Progress bar fill** with a subtle shimmer/shine sweep

**Color System:**
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--trac-primary` | `#FF6B6B` | `#FF7B7B` | Primary actions, FAB |
| `--trac-star-1` | `#58CC02` | `#6EE020` | Star level 1 (Duolingo green) |
| `--trac-star-2` | `#FFC800` | `#FFD630` | Star level 2 (sunny gold) |
| `--trac-star-3` | `#FF4B4B` | `#FF5B5B` | Star level 3 (fire red) |
| `--trac-habit` | `#A560FF` | `#B070FF` | Habit cards (playful purple) |
| `--trac-bg` | `#FFF8F0` | `#1A1A2E` | Page background (warm cream) |
| `--trac-card` | `#FFFFFF` | `#252540` | Card surfaces |
| `--trac-streak` | `#FFD700` | `#FFE040` | Streak badges (gold) |
| `--trac-success` | `#4ADE80` | `#5AEE90` | Celebrations, completions |
| `--trac-text` | `#2D2D3A` | `#F0F0F5` | Primary text |
| `--trac-text-soft` | `#8E8EA0` | `#9090A5` | Secondary/muted text |

**Typography:**
| Usage | Font | Weight | Size |
|-------|------|--------|------|
| Page titles | Fredoka | 600 (SemiBold) | 28px |
| Card headers ("Level 1") | Fredoka | 500 (Medium) | 20px |
| Streak numbers | Fredoka | 700 (Bold) | 36px |
| Task text | Fredoka | 400 (Regular) | 16px |
| Labels/captions | Fredoka | 400 (Regular) | 13px |
| Date selector | Fredoka | 500 (Medium) | 14px |

---

### 4. Pages & Navigation

#### [NEW] `src/App.tsx`
- `IonTabs` with two tabs:
  1. **Today** (`⚡` Zap icon) — Main daily task view
  2. **Progress** (`📊` BarChart icon) — Stats and streaks dashboard
- Custom floating tab bar styled as a rounded rectangle (matching the user's preferred style from past conversations)

---

### 5. Today Page

#### [NEW] `src/pages/TodayPage.tsx`
The main page, composed of these sub-components:

##### Scrollable Date Selector (top)
- Horizontal row of date pills, today centered
- 60 days past / 60 days future
- Active date highlighted with primary color + scale animation
- Shows day name abbreviation + date number
- Auto-scrolls to center today on mount

##### Star Level Cards (×3)
Each is a collapsible card (`<StarLevelCard>`):
- **Header**: "Level 1 ⭐", "Level 2 ⭐⭐", "Level 3 ⭐⭐⭐"
- **Progress bar background**: The header itself acts as a progress bar — fills left-to-right with the star level's color as tasks are checked off
- **Collapse/Expand**: Tap header to toggle, animated with `framer-motion`
- **Task list**: Each task is a draggable row with checkbox, text, and drag handle
- **Add task**: Inline "+" button at bottom of each card
- **Completion celebration**: When all tasks in a level are done → confetti burst + star animation

##### Habits Card
- 4th collapsible card with purple accent
- Shows habits due today (based on interval logic)
- Each habit has its own checkbox + icon
- Habits can be dragged FROM this card INTO star level cards (assigns to that day/level)

##### Drag & Drop
- Using `@dnd-kit/sortable` for within-list reordering
- Using `@dnd-kit/core` with multiple `SortableContext` containers for cross-level dragging
- Visual feedback: dragged item scales up, drop zone highlights

#### [NEW] `src/components/StarLevelCard.tsx`
Collapsible card with progress-bar header:
```
┌─────────────────────────────────┐
│ ████████░░░░░░  Level 1  ⭐  ▼ │  ← Progress fills bg
├─────────────────────────────────┤
│ ☐ Buy groceries          ⠿    │  ← Draggable task
│ ☐ Reply to emails        ⠿    │
│ ☑ Morning workout        ⠿    │
│                    [+ Add]     │
└─────────────────────────────────┘
```

#### [NEW] `src/components/HabitCard.tsx`
Similar to StarLevelCard but for habits section.

#### [NEW] `src/components/TaskRow.tsx`
Individual task item with:
- Checkbox (animated check mark)
- Task text (strikethrough when done)
- Drag handle (grip dots)
- Tap to open edit sheet

#### [NEW] `src/components/TaskEditSheet.tsx`
Bottom sheet (using `IonModal` with breakpoints) that slides up when clicking a task:
- Edit task text
- Change star level assignment (1/2/3)
- Change assigned date (date picker)
- Add notes
- Delete task
- Task metadata (created at, completed at)

#### [NEW] `src/components/DateSelector.tsx`
Horizontal scrollable date picker component.

---

### 6. Progress Page

#### [NEW] `src/pages/ProgressPage.tsx`

##### Top Stats Row
A horizontal row of 3 circular/radial stats at the very top:
1. **Stars Today**: A simple circular badge showing stars earned today (e.g., ⭐⭐⭐).
2. **This Week**: A radial progress bar showing `(Stars earned this week) / (Total possible stars up to today)`. Example: On Wednesday, total possible is 9. If you earned 7, it shows `7/9` and `77%` in the center. Clicking this opens a modal with a bar chart of the week's performance.
3. **This Month**: A radial progress bar showing `(Stars earned this month) / (Total possible stars up to today in the month)`. Clicking this opens a modal with a line plot or bar chart of the month's performance.

##### Summary Cards Row
- **Current Overall Streak** — big fire emoji + number
- **Best Streak** — trophy + number  
- **Total Tasks Completed** — target + number

##### Star Level Streaks
3 cards showing individual streaks for each star level:
- Level name + icon
- Current streak count (big number)
- Streak flame (lit/unlit based on active status)
- Mini calendar showing last 7 days (colored dots)

##### Habit Streaks
Grid of habit cards, each showing:
- Habit icon + name
- Current streak
- Completion rate (last 30 days)

##### Weekly Heatmap
A 7-column grid showing the last 4 weeks, with cells colored by star level achieved that day (0=gray, 1=green, 2=amber, 3=red).

##### Motivation Section
- Streak freeze concept (future: allow 1 missed day without breaking streak)
- "Perfect Week" badge when all 7 days hit ⭐⭐⭐

---

### 7. Additional Features

#### Gamification Elements
- **XP points**: Earn XP for completing tasks (Level 1 = 10xp, Level 2 = 25xp, Level 3 = 50xp)
- **Streak shields**: Visual indicator showing streak is active (Duolingo-style fire icon)
- **Daily star rating**: Each day gets 0-3 stars, shown in the date selector
- **Celebration animations**: Confetti on level completion, bigger celebration for all 3 levels

#### Smart Features
- **Rollover detection**: If you have unfinished tasks from yesterday, offer to move them to today
- **Habit auto-generation**: On each new day, habits that are due are automatically added to the habits section
- **Quick-add**: Long-press the "+" FAB to quickly add a task to Level 1

---

## File Structure

```
src/
├── App.tsx                          # Root: IonApp + IonTabs + routing
├── theme/
│   ├── variables.css                # Ionic CSS variable overrides
│   └── global.css                   # Global styles + animations
├── store/
│   ├── types.ts                     # TypeScript interfaces
│   └── useStore.ts                  # Zustand store + persistence
├── utils/
│   ├── streakEngine.ts              # Streak calculation logic
│   ├── dateUtils.ts                 # Date helpers
│   └── habitScheduler.ts           # Habit recurrence logic
├── pages/
│   ├── TodayPage.tsx                # Main daily view
│   └── ProgressPage.tsx             # Stats dashboard
├── components/
│   ├── DateSelector.tsx             # Horizontal date picker
│   ├── StarLevelCard.tsx            # Collapsible star-level task card
│   ├── HabitCard.tsx                # Habits section card
│   ├── TaskRow.tsx                  # Individual task item
│   ├── TaskEditSheet.tsx            # Bottom sheet task editor
│   ├── AddTaskInline.tsx            # Inline task creation
│   ├── AddHabitSheet.tsx            # Bottom sheet habit creator
│   ├── StreakBadge.tsx              # Streak count display
│   ├── CelebrationOverlay.tsx       # Confetti/celebration animations
│   ├── RadialProgress.tsx           # Radial progress bar for stats
│   └── ChartModal.tsx               # Modal for week/month charts
└── index.tsx                        # Entry point
```

---

## Open Questions

> [!IMPORTANT]
> **Tech stack confirmation**: You mentioned Ionic + React. I'll use **Ionic 8 + React 18** with **Capacitor** for native deployment. The web version will run directly in the browser via `ionic serve`. Shall I also set up Capacitor platforms (iOS/Android) now, or just the web shell?

> [!NOTE]
> **Data persistence**: For the initial build, I'll use `localStorage` (web) via Zustand's persist middleware. For native mobile, this can be swapped to Capacitor Preferences later. No backend/cloud sync for now.

---

## Verification Plan

### Automated Tests
- Run `ionic serve` (or `npm run dev`) and verify the app compiles without errors
- Browser-test all pages via the browser subagent

### Manual Verification
- Test drag-and-drop task reordering within and across star levels
- Test bottom-sheet task editor (tap task → edit → save)
- Test date selector navigation
- Test habit recurrence (create a daily habit, verify it appears each day)
- Test streak calculations (complete tasks across multiple days)
- Verify responsive layout on mobile viewport (375px) and desktop (1200px)
