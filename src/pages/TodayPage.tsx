import React, { useState, useEffect, useMemo } from 'react';
import { IonPage, IonContent, IonFab, IonFabButton, IonIcon } from '@ionic/react';
import { add } from 'ionicons/icons';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Task, StarLevel } from '../store/types';
import { useStore } from '../store/useStore';
import { getTodayStr } from '../utils/dateUtils';
import DateSelector from '../components/DateSelector';
import StarLevelCard from '../components/StarLevelCard';
import HabitCard from '../components/HabitCard';
import TaskRow from '../components/TaskRow';
import TaskEditSheet from '../components/TaskEditSheet';
import AddHabitSheet from '../components/AddHabitSheet';
import './TodayPage.css';

const TodayPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  
  // Modals state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false);

  // Store actions
  const dayRecords = useStore(state => state.dayRecords);
  const addTask = useStore(state => state.addTask);
  const moveTask = useStore(state => state.moveTask);
  const reorderTasks = useStore(state => state.reorderTasks);
  const calculateStreaks = useStore(state => state.calculateStreaks);
  const generateHabitTasksForDate = useStore(state => state.generateHabitTasksForDate);

  // Initialize data for selected date
  useEffect(() => {
    generateHabitTasksForDate(selectedDate);
    calculateStreaks();
  }, [selectedDate]);

  const record = dayRecords[selectedDate];
  const allTasks = record?.tasks || [];

  // Group tasks by level
  const tasksByLevel = useMemo(() => {
    const grouped = {
      1: [] as Task[],
      2: [] as Task[],
      3: [] as Task[],
      habit: [] as Task[],
    };
    allTasks.forEach(task => {
      grouped[task.starLevel as keyof typeof grouped].push(task);
    });
    // Sort each group
    Object.values(grouped).forEach(list => list.sort((a, b) => a.sortOrder - b.sortOrder));
    return grouped;
  }, [allTasks]);


  // Drag and Drop setup
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeTask = useMemo(() => allTasks.find(t => t.id === activeId), [activeId, allTasks]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeTask = allTasks.find(t => t.id === activeId);
    if (!activeTask) return;

    // Determine target container (level) and target index
    let targetLevel: StarLevel | 'habit';
    let targetIndex = 0;

    const overTask = allTasks.find(t => t.id === overId);
    if (overTask) {
      // Dropped onto another task
      targetLevel = overTask.starLevel;
      const targetList = tasksByLevel[targetLevel];
      targetIndex = targetList.findIndex(t => t.id === overId);
      
      // If moving within the same list, adjust index based on drag direction
      if (activeTask.starLevel === targetLevel) {
        const activeIndex = targetList.findIndex(t => t.id === activeId);
        // SortableContext handles the exact index calculation internally, 
        // but since we are updating state manually, we need to pass the new array order.
        
        const newArray = [...targetList];
        const [removed] = newArray.splice(activeIndex, 1);
        newArray.splice(targetIndex, 0, removed);
        
        reorderTasks(selectedDate, targetLevel, newArray.map(t => t.id));
        return;
      }
    } else if (overId.startsWith('level-')) {
      // Dropped onto empty container
      const levelStr = overId.split('-')[1];
      targetLevel = levelStr === 'habit' ? 'habit' : parseInt(levelStr) as StarLevel;
      targetIndex = tasksByLevel[targetLevel].length;
    } else {
      return;
    }

    // Move across levels
    moveTask(activeId, selectedDate, targetLevel, targetIndex);
  };

  const handleAddTask = (level: StarLevel | 'habit', text: string) => {
    addTask({
      text,
      assignedDate: selectedDate,
      starLevel: level,
      sortOrder: tasksByLevel[level].length
    });
  };

  return (
    <IonPage>
      <IonContent fullscreen className="trac-page">
        <div className="header-padding" />
        <h1 className="page-title text-h1" style={{ padding: '0 16px', margin: '16px 0' }}>
          Today ⚡
        </h1>

        <DateSelector 
          selectedDate={selectedDate} 
          onSelectDate={setSelectedDate} 
        />

        <div className="tasks-container">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <StarLevelCard 
              level={1} 
              tasks={tasksByLevel[1]} 
              onAddTask={(text) => handleAddTask(1, text)}
              onEditTask={setEditingTask}
            />
            
            <StarLevelCard 
              level={2} 
              tasks={tasksByLevel[2]} 
              onAddTask={(text) => handleAddTask(2, text)}
              onEditTask={setEditingTask}
            />
            
            <StarLevelCard 
              level={3} 
              tasks={tasksByLevel[3]} 
              onAddTask={(text) => handleAddTask(3, text)}
              onEditTask={setEditingTask}
            />
            
            <HabitCard 
              tasks={tasksByLevel['habit']} 
              onAddTask={(text) => handleAddTask('habit', text)}
              onEditTask={setEditingTask}
            />

            <DragOverlay>
              {activeTask ? <TaskRow task={activeTask} onEdit={() => {}} /> : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Fab for adding habits (or quick add) */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed" style={{ marginBottom: '80px', marginRight: '16px' }}>
          <IonFabButton onClick={() => setIsAddHabitOpen(true)} className="trac-fab">
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        {/* Safe area padding for bottom nav */}
        <div style={{ height: '100px' }} />

        {/* Modals */}
        <TaskEditSheet 
          isOpen={!!editingTask} 
          task={editingTask} 
          onDidDismiss={() => setEditingTask(null)} 
        />
        
        <AddHabitSheet 
          isOpen={isAddHabitOpen}
          onDidDismiss={() => setIsAddHabitOpen(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default TodayPage;
