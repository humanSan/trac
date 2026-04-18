import React, { useState } from 'react';
import { IonModal, IonContent, IonButton, IonIcon } from '@ionic/react';
import { starOutline } from 'ionicons/icons';
import { HabitInterval, StarLevel } from '../store/types';
import { useStore } from '../store/useStore';
import * as LucideIcons from 'lucide-react';
import './TaskEditSheet.css'; // Reusing styles from TaskEditSheet
import './AddHabitSheet.css';

interface AddHabitSheetProps {
  isOpen: boolean;
  onDidDismiss: () => void;
}

const COMMON_ICONS = ['Dumbbell', 'BookOpen', 'Droplets', 'Moon', 'Sun', 'Heart', 'Brain', 'Coffee', 'Code'];
const COMMON_COLORS = ['#FF6B6B', '#58CC02', '#FFC800', '#A560FF', '#4ADE80', '#38BDF8', '#FB7185'];

const AddHabitSheet: React.FC<AddHabitSheetProps> = ({ isOpen, onDidDismiss }) => {
  const addHabit = useStore(state => state.addHabit);
  
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Heart');
  const [color, setColor] = useState('#A560FF');
  const [interval, setInterval] = useState<HabitInterval>('daily');
  const [intervalValue, setIntervalValue] = useState(1);
  const [defaultStarLevel, setDefaultStarLevel] = useState<StarLevel>(1);

  const handleSave = () => {
    if (!name.trim()) return;
    
    addHabit({
      name: name.trim(),
      icon,
      color,
      interval,
      intervalValue,
      defaultStarLevel
    });
    
    // Reset form
    setName('');
    setIcon('Heart');
    setColor('#A560FF');
    setInterval('daily');
    setIntervalValue(1);
    setDefaultStarLevel(1);
    
    onDidDismiss();
  };

  const renderIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent size={24} color={icon === iconName ? 'white' : 'var(--trac-text)'} /> : null;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onDidDismiss}
      initialBreakpoint={0.7}
      breakpoints={[0, 0.7, 0.9]}
      handle={true}
      className="task-edit-sheet"
    >
      <IonContent className="ion-padding custom-bottom-sheet">
        <div className="sheet-header">
          <h2>New Habit</h2>
          <button className="save-btn" onClick={handleSave} disabled={!name.trim()}>Save</button>
        </div>

        <div className="input-group">
          <input
            type="text"
            className="task-title-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Habit name (e.g. Read 10 pages)"
          />
        </div>

        <div className="input-group">
          <label>Icon</label>
          <div className="icon-selector">
            {COMMON_ICONS.map((i) => (
              <div 
                key={i}
                className={`icon-pill ${icon === i ? 'active' : ''}`}
                style={{ backgroundColor: icon === i ? color : 'var(--trac-card)' }}
                onClick={() => setIcon(i)}
              >
                {renderIcon(i)}
              </div>
            ))}
          </div>
        </div>

        <div className="input-group">
          <label>Color</label>
          <div className="color-selector">
            {COMMON_COLORS.map((c) => (
              <div 
                key={c}
                className={`color-dot ${color === c ? 'active' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        <div className="input-group">
          <label>Frequency</label>
          <div className="interval-selector">
            <select 
              className="interval-select"
              value={interval}
              onChange={(e) => setInterval(e.target.value as HabitInterval)}
            >
              <option value="daily">Daily</option>
              <option value="every_n_days">Every N Days</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            
            {interval === 'every_n_days' && (
              <input 
                type="number" 
                className="interval-value-input"
                min="2"
                max="30"
                value={intervalValue}
                onChange={(e) => setIntervalValue(parseInt(e.target.value) || 2)}
              />
            )}
          </div>
        </div>

        <div className="input-group">
          <label>
            <IonIcon icon={starOutline} /> Default Tier
          </label>
          <p className="caption">When dragged to a day, which tier should it default to?</p>
          <div className="level-selector">
            {[1, 2, 3].map((lvl) => (
              <div 
                key={lvl}
                className={`level-pill level-${lvl} ${defaultStarLevel === lvl ? 'active' : ''}`}
                onClick={() => setDefaultStarLevel(lvl as StarLevel)}
              >
                Tier {lvl}
              </div>
            ))}
          </div>
        </div>

        {/* Padding for safe area at bottom */}
        <div style={{ height: '40px' }} />
      </IonContent>
    </IonModal>
  );
};

export default AddHabitSheet;
