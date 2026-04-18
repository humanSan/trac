import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Task, StarLevel } from '../store/types';
import TaskRow from './TaskRow';
import AddTaskInline from './AddTaskInline';
import './StarLevelCard.css';

interface StarLevelCardProps {
  level: StarLevel;
  tasks: Task[];
  onAddTask: (text: string) => void;
  onEditTask: (task: Task) => void;
}

const StarLevelCard: React.FC<StarLevelCardProps> = ({ level, tasks, onAddTask, onEditTask }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;
  
  const { setNodeRef, isOver } = useDroppable({
    id: `level-${level}`,
    data: { type: 'StarLevel', level }
  });

  const stars = Array(level).fill('⭐').join('');

  return (
    <div className={`star-card-container ${isOver ? 'drag-over' : ''}`}>
      {/* Progress Bar Header */}
      <div 
        className={`star-card-header level-${level}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div 
          className="star-card-progress" 
          style={{ width: `${progressPercent}%` }}
        />
        <div className="star-card-header-content">
          <div className="star-card-title">
            Tier {level} <span className="star-emojis">{stars}</span>
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
                <div className="empty-state">No tasks in this level yet.</div>
              )}
              
              <AddTaskInline 
                onAdd={onAddTask} 
                colorClass={`level-${level}`} 
                placeholder={`Add to Tier ${level}...`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StarLevelCard;
