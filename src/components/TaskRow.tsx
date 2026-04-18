import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../store/types';
import { useStore } from '../store/useStore';
import { GripVertical } from 'lucide-react';
import './TaskRow.css';

interface TaskRowProps {
  task: Task;
  onEdit: (task: Task) => void;
}

const TaskRow: React.FC<TaskRowProps> = ({ task, onEdit }) => {
  const toggleTask = useStore(state => state.toggleTask);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: 'Task', task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTask(task.id, task.assignedDate);
  };

  const levelClass = task.starLevel === 'habit' ? 'habit' : `level-${task.starLevel}`;

  const streaks = useStore(state => state.streaks);
  const habitStreak = task.habitId ? streaks[`habit_${task.habitId}`] : null;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`task-row ${isDragging ? 'dragging' : ''}`}
      onClick={() => onEdit(task)}
    >
      <div 
        className={`trac-checkbox ${levelClass} ${task.completed ? 'checked' : ''}`}
        onClick={handleToggle}
      >
        {task.completed && (
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      
      <div className="task-content">
        <div className={`task-text ${task.completed ? 'completed' : ''}`}>
          {task.text}
        </div>
        {habitStreak && habitStreak.currentStreak > 0 && (
          <div className="habit-streak-tag">
             🔥 {habitStreak.currentStreak}
          </div>
        )}
      </div>
      
      <div 
        className="task-drag-handle" 
        {...attributes} 
        {...listeners}
        onClick={(e) => e.stopPropagation()} // Prevent opening edit sheet when starting drag
      >
        <GripVertical size={20} color="var(--trac-text-soft)" />
      </div>
    </div>
  );
};

export default TaskRow;
