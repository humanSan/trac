import { DayRecord, Streak, TracState, Habit, StarLevel } from '../store/types';
import { getPrevDayStr, getTodayStr } from './dateUtils';
import { differenceInDays, parseISO } from 'date-fns';

const calculateContinuousStreak = (
  dayRecords: Record<string, DayRecord>,
  todayStr: string,
  condition: (record: DayRecord) => boolean
): { current: number, longest: number, lastCompleted?: string } => {
  let current = 0;
  let longest = 0;
  let lastCompleted: string | undefined = undefined;
  
  // Sort dates descending
  const dates = Object.keys(dayRecords).sort((a, b) => b.localeCompare(a));
  if (dates.length === 0) return { current, longest };

  let streakActive = true;
  let prevDate = todayStr;
  
  // Need to find the actual longest overall, so we iterate through all dates chronologically
  const chronologicalDates = [...dates].reverse();
  
  let tempCurrent = 0;
  
  for (const date of chronologicalDates) {
    const record = dayRecords[date];
    if (condition(record)) {
      tempCurrent++;
      if (tempCurrent > longest) longest = tempCurrent;
      lastCompleted = date;
    } else {
      tempCurrent = 0;
    }
  }

  // Calculate current streak (must be active up to today or yesterday)
  current = 0;
  let checkDate = todayStr;
  
  // Check today
  if (dayRecords[checkDate] && condition(dayRecords[checkDate])) {
    current++;
    checkDate = getPrevDayStr(checkDate);
  } else if (!dayRecords[checkDate] || !condition(dayRecords[checkDate])) {
    // If today is not completed, we check if yesterday was.
    // If yesterday was, the streak is technically still alive (user has today to complete it)
    checkDate = getPrevDayStr(checkDate);
  }

  // Count backwards continuously
  while (streakActive) {
    if (dayRecords[checkDate] && condition(dayRecords[checkDate])) {
      current++;
      checkDate = getPrevDayStr(checkDate);
    } else {
      streakActive = false;
    }
  }

  return { current, longest, lastCompleted };
};

export const updateAllStreaks = (
  dayRecords: Record<string, DayRecord>,
  habits: Record<string, Habit>,
  existingStreaks: Record<string, Streak> = {}
): Record<string, Streak> => {
  const todayStr = getTodayStr();
  const newStreaks: Record<string, Streak> = { ...(existingStreaks || {}) };

  const isLevelDone = (record: DayRecord, level: StarLevel) => {
    const levelTasks = record.tasks.filter(t => t.starLevel === level);
    return levelTasks.length > 0 && levelTasks.every(t => t.completed);
  };

  // 1. Overall Streak (At least 1 level completed)
  const overallStats = calculateContinuousStreak(dayRecords, todayStr, r => r.starLevel >= 1);
  newStreaks['overall'] = {
    type: 'overall',
    currentStreak: overallStats.current,
    longestStreak: Math.max(overallStats.longest, (existingStreaks || {})['overall']?.longestStreak || 0),
    lastCompletedDate: overallStats.lastCompleted
  };

  // 2. 1 Star Streak
  const star1Stats = calculateContinuousStreak(dayRecords, todayStr, r => r.starLevel >= 1);
  newStreaks['star1'] = {
    type: 'star1',
    currentStreak: star1Stats.current,
    longestStreak: Math.max(star1Stats.longest, (existingStreaks || {})['star1']?.longestStreak || 0),
    lastCompletedDate: star1Stats.lastCompleted
  };

  // 3. 2 Star Streak
  const star2Stats = calculateContinuousStreak(dayRecords, todayStr, r => r.starLevel >= 2);
  newStreaks['star2'] = {
    type: 'star2',
    currentStreak: star2Stats.current,
    longestStreak: Math.max(star2Stats.longest, (existingStreaks || {})['star2']?.longestStreak || 0),
    lastCompletedDate: star2Stats.lastCompleted
  };

  // 4. 3 Star Streak
  const star3Stats = calculateContinuousStreak(dayRecords, todayStr, r => r.starLevel >= 3);
  newStreaks['star3'] = {
    type: 'star3',
    currentStreak: star3Stats.current,
    longestStreak: Math.max(star3Stats.longest, (existingStreaks || {})['star3']?.longestStreak || 0),
    lastCompletedDate: star3Stats.lastCompleted
  };

  // 5. Habit Level Streak (All habits completed for the day)
  const allHabitsStats = calculateContinuousStreak(dayRecords, todayStr, r => {
    const habitTasks = r.tasks.filter(t => t.starLevel === 'habit');
    return habitTasks.length > 0 && habitTasks.every(t => t.completed);
  });
  newStreaks['all_habits'] = {
    type: 'habit',
    currentStreak: allHabitsStats.current,
    longestStreak: Math.max(allHabitsStats.longest, (existingStreaks || {})['all_habits']?.longestStreak || 0),
    lastCompletedDate: allHabitsStats.lastCompleted
  };

  // 6. Perfect Days Streak (3 Tiers + All Habits)
  const perfectDaysStats = calculateContinuousStreak(dayRecords, todayStr, r => {
    const allTiersDone = r.starLevel === 3;
    const habitTasks = r.tasks.filter(t => t.starLevel === 'habit');
    const allHabitsDone = habitTasks.length > 0 && habitTasks.every(t => t.completed);
    return allTiersDone && allHabitsDone;
  });
  newStreaks['perfect_days'] = {
    type: 'perfect_days',
    currentStreak: perfectDaysStats.current,
    longestStreak: Math.max(perfectDaysStats.longest, (existingStreaks || {})['perfect_days']?.longestStreak || 0),
    lastCompletedDate: perfectDaysStats.lastCompleted
  };

  // 7. Streak Power (Sum of 1-star, 2-star, 3-star, and habits streaks)
  const streakPowerValue = (newStreaks['star1']?.currentStreak || 0) + 
                           (newStreaks['star2']?.currentStreak || 0) + 
                           (newStreaks['star3']?.currentStreak || 0) + 
                           (newStreaks['all_habits']?.currentStreak || 0);
  
  newStreaks['streak_power'] = {
    type: 'streak_power',
    currentStreak: streakPowerValue,
    longestStreak: Math.max(streakPowerValue, (existingStreaks || {})['streak_power']?.longestStreak || 0),
  };

  // 8. Individual Habit Streaks
  Object.values(habits).forEach(habit => {
    const habitKey = `habit_${habit.id}`;
    const habitStats = calculateContinuousStreak(dayRecords, todayStr, r => r.habitCompletions[habit.id] === true);
    
    newStreaks[habitKey] = {
      type: 'habit',
      targetId: habit.id,
      currentStreak: habitStats.current,
      longestStreak: Math.max(habitStats.longest, (existingStreaks || {})[habitKey]?.longestStreak || 0),
      lastCompletedDate: habitStats.lastCompleted
    };
  });

  return newStreaks;
};
