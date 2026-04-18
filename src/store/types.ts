export type StarLevel = 1 | 2 | 3;
export type HabitInterval = 'daily' | 'every_n_days' | 'weekly' | 'monthly';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;      // ISO timestamp
  completedAt?: string;   // ISO timestamp
  assignedDate: string;   // YYYY-MM-DD
  starLevel: StarLevel | 'habit';
  sortOrder: number;
  habitId?: string;       // If spawned from a habit
  notes?: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;           // Lucide icon name
  color: string;          // Hex color
  interval: HabitInterval;
  intervalValue: number;  // e.g. 2 for "every 2 days"
  defaultStarLevel: StarLevel;
  createdAt: string;
  archivedAt?: string;
}

export interface DayRecord {
  date: string;           // YYYY-MM-DD
  tasks: Task[];
  starLevel: 0 | 1 | 2 | 3;  // Highest completed level
  habitCompletions: Record<string, boolean>;  // habitId → done
}

export interface Goal {
  id: string;
  targetStat: 'day_streak' | 'perfect_days' | 'best_streak' | 'streak_power' | 'tasks_completed';
  targetValue: number;
  deadline: string; // YYYY-MM-DD
  reward: string;
  createdAt: string;
  status: 'active' | 'completed' | 'failed';
}

export interface Streak {
  type: 'star1' | 'star2' | 'star3' | 'habit' | 'overall' | 'perfect_days' | 'streak_power';
  targetId?: string;      // habitId for habit streaks
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate?: string;
}

export interface TracState {
  tasks: Record<string, Task>; // Indexed by task ID
  habits: Record<string, Habit>; // Indexed by habit ID
  dayRecords: Record<string, DayRecord>; // Indexed by YYYY-MM-DD
  streaks: Record<string, Streak>;
  goals: Record<string, Goal>;
  theme: 'light' | 'dark' | 'system';
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  toggleTask: (id: string, date: string) => void;
  deleteTask: (id: string) => void;
  reorderTasks: (date: string, starLevel: StarLevel | 'habit', newOrder: string[]) => void;
  moveTask: (taskId: string, newDate: string, newStarLevel: StarLevel | 'habit', newSortOrder: number) => void;
  
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;

  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'status'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  
  calculateStreaks: () => void;
  generateHabitTasksForDate: (date: string) => void;
}
