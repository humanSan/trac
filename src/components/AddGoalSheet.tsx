import React, { useState } from 'react';
import { IonModal, IonContent, IonButton, IonIcon } from '@ionic/react';
import { flagOutline, trophyOutline } from 'ionicons/icons';
import { useStore } from '../store/useStore';
import { addDays, format } from 'date-fns';
import './TaskEditSheet.css'; // Reusing base sheet styles

interface AddGoalSheetProps {
  isOpen: boolean;
  onDidDismiss: () => void;
}

const STAT_OPTIONS = [
  { id: 'day_streak', label: 'Day Streak', icon: '🔥' },
  { id: 'perfect_days', label: 'Perfect Day Streak', icon: '💎' },
  { id: 'best_streak', label: 'Best Day Streak', icon: '🏆' },
  { id: 'streak_power', label: 'Streak Power', icon: '⚡' },
  { id: 'tasks_completed', label: 'Tasks Completed', icon: '✅' },
];

const AddGoalSheet: React.FC<AddGoalSheetProps> = ({ isOpen, onDidDismiss }) => {
  const addGoal = useStore(state => state.addGoal);
  
  const [targetStat, setTargetStat] = useState<any>('day_streak');
  const [targetValue, setTargetValue] = useState(7);
  const [intervalDays, setIntervalDays] = useState(7);
  const [reward, setReward] = useState('');

  const handleSave = () => {
    const deadline = format(addDays(new Date(), intervalDays), 'yyyy-MM-dd');
    
    addGoal({
      targetStat,
      targetValue,
      deadline,
      reward: reward.trim() || 'A nice treat!',
    });
    
    // Reset
    setTargetStat('day_streak');
    setTargetValue(7);
    setIntervalDays(7);
    setReward('');
    onDidDismiss();
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
          <h2>Set a New Goal 🎯</h2>
          <button className="save-btn" onClick={handleSave}>Create</button>
        </div>

        <div className="input-group">
          <label>Target Metric</label>
          <div className="stat-selector-grid">
            {STAT_OPTIONS.map((opt) => (
              <div 
                key={opt.id}
                className={`stat-opt ${targetStat === opt.id ? 'active' : ''}`}
                onClick={() => setTargetStat(opt.id)}
              >
                <span className="stat-opt-icon">{opt.icon}</span>
                <span className="stat-opt-label">{opt.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="input-row" style={{ display: 'flex', gap: '16px' }}>
          <div className="input-group" style={{ flex: 1 }}>
            <label>Target Value</label>
            <input 
              type="number" 
              className="number-input" 
              value={targetValue}
              onChange={(e) => setTargetValue(parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <label>Time Limit (Days)</label>
            <input 
              type="number" 
              className="number-input" 
              value={intervalDays}
              onChange={(e) => setIntervalDays(parseInt(e.target.value) || 1)}
            />
          </div>
        </div>

        <div className="input-group">
          <label>Reward 🎁</label>
          <input 
            type="text" 
            className="task-title-input" 
            placeholder="e.g. Go out for ice cream!"
            value={reward}
            onChange={(e) => setReward(e.target.value)}
          />
        </div>

        <div style={{ height: '40px' }} />
      </IonContent>
    </IonModal>
  );
};

export default AddGoalSheet;
