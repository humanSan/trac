import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TracState, Task, Habit, DayRecord, StarLevel, Goal } from './types';
import { v4 as uuidv4 } from 'uuid';
import { getTodayStr } from '../utils/dateUtils';
import { updateAllStreaks } from '../utils/streakEngine';
import { createTasksFromHabits } from '../utils/habitScheduler';

export const useStore = create<TracState>()(
  persist(
    (set, get) => ({
      tasks: {},
      habits: {},
      dayRecords: {},
      streaks: {},
      goals: {},
      theme: 'system',

      setTheme: (theme) => set({ theme }),

      addGoal: (goalData) => {
        const id = uuidv4();
        const newGoal: Goal = {
          ...goalData,
          id,
          status: 'active',
          createdAt: new Date().toISOString()
        };
        set((state) => ({
          goals: { ...state.goals, [id]: newGoal }
        }));
      },

      updateGoal: (id, updates) => {
        set((state) => ({
          goals: { ...state.goals, [id]: { ...state.goals[id], ...updates } }
        }));
      },

      deleteGoal: (id) => {
        set((state) => {
          const { [id]: _, ...newGoals } = state.goals;
          return { goals: newGoals };
        });
      },

      addTask: (taskData) => {
        const id = uuidv4();
        const newTask: Task = {
          ...taskData,
          id,
          completed: false,
          createdAt: new Date().toISOString(),
        };

        set((state) => {
          const newTasks = { ...state.tasks, [id]: newTask };
          const date = taskData.assignedDate;
          
          // Ensure day record exists
          const dayRecord = state.dayRecords[date] || {
            date,
            tasks: [],
            starLevel: 0,
            habitCompletions: {}
          };
          
          const newDayRecords = {
            ...state.dayRecords,
            [date]: {
              ...dayRecord,
              tasks: [...dayRecord.tasks, newTask]
            }
          };

          return {
            tasks: newTasks,
            dayRecords: newDayRecords
          };
        });
      },

      updateTask: (id, updates) => {
        set((state) => {
          const task = state.tasks[id];
          if (!task) return state;

          const updatedTask = { ...task, ...updates };
          const newTasks = { ...state.tasks, [id]: updatedTask };
          
          // Update in dayRecord
          const date = task.assignedDate;
          const dayRecord = state.dayRecords[date];
          
          let newDayRecords = state.dayRecords;
          if (dayRecord) {
            newDayRecords = {
              ...state.dayRecords,
              [date]: {
                ...dayRecord,
                tasks: dayRecord.tasks.map(t => t.id === id ? updatedTask : t)
              }
            };
          }

          // If assignedDate changed, we need to move it between dayRecords
          if (updates.assignedDate && updates.assignedDate !== date) {
            const newDate = updates.assignedDate;
            const newDateRecord = state.dayRecords[newDate] || {
              date: newDate,
              tasks: [],
              starLevel: 0,
              habitCompletions: {}
            };
            
            newDayRecords = {
              ...newDayRecords,
              [date]: {
                ...dayRecord,
                tasks: dayRecord.tasks.filter(t => t.id !== id)
              },
              [newDate]: {
                ...newDateRecord,
                tasks: [...newDateRecord.tasks, updatedTask]
              }
            };
          }

          return {
            tasks: newTasks,
            dayRecords: newDayRecords
          };
        });
      },

      toggleTask: (id, date) => {
        set((state) => {
          const task = state.tasks[id];
          if (!task) return state;

          const isCompleted = !task.completed;
          const updatedTask: Task = {
            ...task,
            completed: isCompleted,
            completedAt: isCompleted ? new Date().toISOString() : undefined
          };

          const newTasks = { ...state.tasks, [id]: updatedTask };
          const dayRecord = state.dayRecords[date];
          
          if (!dayRecord) return { tasks: newTasks };

          const updatedDayTasks = dayRecord.tasks.map(t => t.id === id ? updatedTask : t);
          
          // Recalculate day's star level
          let newStarLevel: 0 | 1 | 2 | 3 = 0;
          const isLevelComplete = (level: StarLevel) => {
            const levelTasks = updatedDayTasks.filter(t => t.starLevel === level);
            return levelTasks.length > 0 && levelTasks.every(t => t.completed);
          };

          let stars = 0;
          if (isLevelComplete(1)) stars++;
          if (isLevelComplete(2)) stars++;
          if (isLevelComplete(3)) stars++;
          newStarLevel = stars as 0 | 1 | 2 | 3;

          // Track habit completions
          const newHabitCompletions = { ...dayRecord.habitCompletions };
          if (task.habitId) {
            newHabitCompletions[task.habitId] = isCompleted;
          }

          const newDayRecords = {
            ...state.dayRecords,
            [date]: {
              ...dayRecord,
              tasks: updatedDayTasks,
              starLevel: newStarLevel,
              habitCompletions: newHabitCompletions
            }
          };

          // Trigger streak recalculation after state update
          setTimeout(() => get().calculateStreaks(), 0);

          return {
            tasks: newTasks,
            dayRecords: newDayRecords
          };
        });
      },

      deleteTask: (id) => {
        set((state) => {
          const task = state.tasks[id];
          if (!task) return state;

          const { [id]: _, ...newTasks } = state.tasks;
          const date = task.assignedDate;
          const dayRecord = state.dayRecords[date];
          
          let newDayRecords = state.dayRecords;
          if (dayRecord) {
            newDayRecords = {
              ...state.dayRecords,
              [date]: {
                ...dayRecord,
                tasks: dayRecord.tasks.filter(t => t.id !== id)
              }
            };
          }

          return { tasks: newTasks, dayRecords: newDayRecords };
        });
      },

      reorderTasks: (date, starLevel, newOrder) => {
        set((state) => {
          const dayRecord = state.dayRecords[date];
          if (!dayRecord) return state;

          const newTasks = { ...state.tasks };
          const updatedDayTasks = [...dayRecord.tasks];

          // Update sortOrder for tasks in the affected level
          newOrder.forEach((taskId, index) => {
            const taskIndex = updatedDayTasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
              const updatedTask = { ...updatedDayTasks[taskIndex], sortOrder: index };
              updatedDayTasks[taskIndex] = updatedTask;
              newTasks[taskId] = updatedTask;
            }
          });

          return {
            tasks: newTasks,
            dayRecords: {
              ...state.dayRecords,
              [date]: { ...dayRecord, tasks: updatedDayTasks }
            }
          };
        });
      },

      moveTask: (taskId, newDate, newStarLevel, newSortOrder) => {
         set((state) => {
            const task = state.tasks[taskId];
            if (!task) return state;

            const oldDate = task.assignedDate;
            const updatedTask = { ...task, assignedDate: newDate, starLevel: newStarLevel, sortOrder: newSortOrder };
            const newTasks = { ...state.tasks, [taskId]: updatedTask };

            let newDayRecords = { ...state.dayRecords };

            // Remove from old date
            if (newDayRecords[oldDate]) {
                newDayRecords[oldDate] = {
                    ...newDayRecords[oldDate],
                    tasks: newDayRecords[oldDate].tasks.filter(t => t.id !== taskId)
                };
            }

            // Add to new date
            const newDateRecord = newDayRecords[newDate] || { date: newDate, tasks: [], starLevel: 0, habitCompletions: {} };
            
            // Adjust sort orders in the target level
            const targetTasks = newDateRecord.tasks.filter(t => t.starLevel === newStarLevel).sort((a,b) => a.sortOrder - b.sortOrder);
            
            // Insert at newSortOrder
            targetTasks.splice(newSortOrder, 0, updatedTask);
            
            // Reassign sort orders
            const reorderedTargetTasks = targetTasks.map((t, idx) => ({ ...t, sortOrder: idx }));
            
            // Combine with other levels' tasks
            const otherTasks = newDateRecord.tasks.filter(t => t.starLevel !== newStarLevel);
            
            newDayRecords[newDate] = {
                ...newDateRecord,
                tasks: [...otherTasks, ...reorderedTargetTasks]
            };
            
            // Update the main tasks dictionary with the reordered tasks as well
            reorderedTargetTasks.forEach(t => {
                newTasks[t.id] = t;
            });

            return { tasks: newTasks, dayRecords: newDayRecords };
         });
      },

      addHabit: (habitData) => {
        const id = uuidv4();
        const newHabit: Habit = {
          ...habitData,
          id,
          createdAt: new Date().toISOString()
        };

        set((state) => {
          const newHabits = { ...state.habits, [id]: newHabit };
          setTimeout(() => get().generateHabitTasksForDate(getTodayStr()), 0);
          return { habits: newHabits };
        });
      },

      updateHabit: (id, updates) => {
        set((state) => ({
          habits: { ...state.habits, [id]: { ...state.habits[id], ...updates } }
        }));
      },

      deleteHabit: (id) => {
        set((state) => {
          const { [id]: _, ...newHabits } = state.habits;
          // Soft delete to maintain streak history
          return { habits: newHabits };
        });
      },

      calculateStreaks: () => {
        const state = get();
        const newStreaks = updateAllStreaks(state.dayRecords, state.habits, state.streaks);
        set({ streaks: newStreaks });
      },

      generateHabitTasksForDate: (dateStr) => {
        set((state) => {
          const dayRecord = state.dayRecords[dateStr] || {
            date: dateStr,
            tasks: [],
            starLevel: 0,
            habitCompletions: {}
          };

          const newTasks = createTasksFromHabits(state.habits, dateStr, dayRecord.tasks);
          
          if (newTasks.length === 0) return state;

          // Add to tasks dictionary
          const updatedTasksDict = { ...state.tasks };
          newTasks.forEach(t => { updatedTasksDict[t.id] = t; });

          // Determine starting sort order for habits
          const existingHabitTasks = dayRecord.tasks.filter(t => t.starLevel === 'habit');
          let maxSortOrder = existingHabitTasks.length > 0 ? Math.max(...existingHabitTasks.map(t => t.sortOrder)) : -1;

          const tasksWithSortOrder = newTasks.map(t => ({
             ...t,
             sortOrder: ++maxSortOrder
          }));

           // Update tasks dictionary again with correct sortOrder
          tasksWithSortOrder.forEach(t => { updatedTasksDict[t.id] = t; });

          return {
            tasks: updatedTasksDict,
            dayRecords: {
              ...state.dayRecords,
              [dateStr]: {
                ...dayRecord,
                tasks: [...dayRecord.tasks, ...tasksWithSortOrder]
              }
            }
          };
        });
      }
    }),
    {
      name: 'trac-storage', // unique name for localStorage
    }
  )
);
