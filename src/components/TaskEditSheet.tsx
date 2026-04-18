import React, { useState, useEffect } from 'react';
import { IonModal, IonContent, IonButton, IonIcon } from '@ionic/react';
import { trashOutline, calendarOutline, starOutline } from 'ionicons/icons';
import { Task, StarLevel } from '../store/types';
import { useStore } from '../store/useStore';
import { format, parseISO } from 'date-fns';
import './TaskEditSheet.css';

interface TaskEditSheetProps {
  isOpen: boolean;
  task: Task | null;
  onDidDismiss: () => void;
}

const TaskEditSheet: React.FC<TaskEditSheetProps> = ({ isOpen, task, onDidDismiss }) => {
  const updateTask = useStore(state => state.updateTask);
  const deleteTask = useStore(state => state.deleteTask);
  
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [assignedDate, setAssignedDate] = useState('');
  const [starLevel, setStarLevel] = useState<StarLevel | 'habit'>(1);

  useEffect(() => {
    if (task) {
      setText(task.text);
      setNotes(task.notes || '');
      setAssignedDate(task.assignedDate);
      setStarLevel(task.starLevel);
    }
  }, [task]);

  if (!task) return null;

  const handleSave = () => {
    updateTask(task.id, {
      text,
      notes,
      assignedDate,
      starLevel
    });
    onDidDismiss();
  };

  const handleDelete = () => {
    deleteTask(task.id);
    onDidDismiss();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return format(parseISO(dateStr), 'MMM d, yyyy h:mm a');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onDidDismiss}
      initialBreakpoint={0.6}
      breakpoints={[0, 0.6, 0.9]}
      handle={true}
      className="task-edit-sheet"
    >
      <IonContent className="ion-padding custom-bottom-sheet">
        <div className="sheet-header">
          <h2>Edit Task</h2>
          <button className="save-btn" onClick={handleSave}>Save</button>
        </div>

        <div className="input-group">
          <input
            type="text"
            className="task-title-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Task title"
          />
        </div>

        <div className="input-group">
          <label>
            <IonIcon icon={starOutline} /> Tier
          </label>
          <div className="level-selector">
            {[1, 2, 3].map((lvl) => (
              <div 
                key={lvl}
                className={`level-pill level-${lvl} ${starLevel === lvl ? 'active' : ''}`}
                onClick={() => setStarLevel(lvl as StarLevel)}
              >
                Tier {lvl}
              </div>
            ))}
            {starLevel === 'habit' && (
              <div className="level-pill habit active">Habit</div>
            )}
          </div>
        </div>

        <div className="input-group">
          <label>
            <IonIcon icon={calendarOutline} /> Date
          </label>
          <input
            type="date"
            className="date-input"
            value={assignedDate}
            onChange={(e) => setAssignedDate(e.target.value)}
            onKeyDown={handleKeyDown}
            />
        </div>

        <div className="input-group">
          <label>Notes</label>
          <textarea
            className="notes-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add some details..."
            rows={3}
          />
        </div>

        <div className="metadata-section">
          <p>Created: {formatDate(task.createdAt)}</p>
          {task.completedAt && <p>Completed: {formatDate(task.completedAt)}</p>}
        </div>

        <IonButton 
          color="danger" 
          fill="clear" 
          expand="block" 
          className="delete-btn"
          onClick={handleDelete}
        >
          <IonIcon icon={trashOutline} slot="start" />
          Delete Task
        </IonButton>

        {/* Padding for safe area at bottom */}
        <div style={{ height: '40px' }} />
      </IonContent>
    </IonModal>
  );
};

export default TaskEditSheet;
