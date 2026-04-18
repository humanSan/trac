import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Task } from '../store/types';
import TaskRow from './TaskRow';
import AddTaskInline from './AddTaskInline';
import './StarLevelCard.css'; // Reusing styles from StarLevelCard

interface HabitCardProps {
  tasks: Task[];
  onAddTask: (text: string) => void;
  onEditTask: (task: Task) => void;
}

const HabitCard: React.FC<HabitCardProps> = ({ tasks, onAddTask, onEditTask }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;
  
  const { setNodeRef, isOver } = useDroppable({
    id: 'level-habit',
    data: { type: 'StarLevel', level: 'habit' }
  });

  return (
    <div className={`star-card-container ${isOver ? 'drag-over' : ''}`}>
      {/* Progress Bar Header */}
      <div 
        className="star-card-header habit"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div 
          className="star-card-progress" 
          style={{ width: `${progressPercent}%` }}
        />
        <div className="star-card-header-content">
          <div className="star-card-title">
            Habits 🔮
          </div>
          <div className="star-card-stats">
            {totalCount > 0 && <span className="fraction">{completedCount}/{totalCount}</span>}
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="star-card-body" ref={setNodeRef}>
              <SortableContext 
                items={tasks.map(t => t.id)} 
                strategy={verticalListSortingStrategy}
              >
                {tasks.map(task => (
                  <TaskRow 
                    key={task.id} 
                    task={task} 
                    onEdit={onEditTask} 
                  />
                ))}
              </SortableContext>
              
              {tasks.length === 0 && (
                <div className="empty-state">No habits due today.</div>
              )}
              
              <AddTaskInline 
                onAdd={onAddTask} 
                colorClass="habit" 
                placeholder="Add a one-off habit..."
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HabitCard;
