import { Habit, Task } from '../store/types';
import { differenceInDays, parseISO } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export const isHabitDueOnDate = (habit: Habit, dateStr: string): boolean => {
  const habitStartDate = habit.createdAt.split('T')[0];
  if (habit.archivedAt && habit.archivedAt < dateStr) return false;
  if (dateStr < habitStartDate) return false;

  const diff = Math.abs(differenceInDays(parseISO(dateStr), parseISO(habit.createdAt)));

  switch (habit.interval) {
    case 'daily':
      return true;
    case 'every_n_days':
      return diff % habit.intervalValue === 0;
    case 'weekly':
      // Basic weekly check: same day of week as creation date
      return diff % 7 === 0;
    case 'monthly':
      // Simplified: true if the day number is the same or the last day of the month
      const createDate = parseISO(habit.createdAt);
      const checkDate = parseISO(dateStr);
      return createDate.getDate() === checkDate.getDate();
    default:
      return false;
  }
};

export const createTasksFromHabits = (
  habits: Record<string, Habit>,
  dateStr: string,
  existingTasksForDate: Task[]
): Task[] => {
  const newTasks: Task[] = [];
  
  // Find habits that are due today but don't have a task yet
  Object.values(habits).forEach(habit => {
    if (isHabitDueOnDate(habit, dateStr)) {
      // Check if a task already exists for this habit on this date
      const taskExists = existingTasksForDate.some(t => t.habitId === habit.id);
      
      if (!taskExists) {
        newTasks.push({
          id: uuidv4(),
          text: habit.name,
          completed: false,
          createdAt: new Date().toISOString(),
          assignedDate: dateStr,
          starLevel: 'habit', // Initially goes to the habits section
          sortOrder: 0, // Store will fix sort order on insert
          habitId: habit.id,
        });
      }
    }
  });

  return newTasks;
};
