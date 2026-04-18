import React from 'react';
import { IonIcon } from '@ionic/react';
import { trophyOutline, timeOutline, giftOutline } from 'ionicons/icons';
import { Goal } from '../store/types';
import { useStore } from '../store/useStore';
import { differenceInDays, parseISO } from 'date-fns';
import './GoalCard.css';

interface GoalCardProps {
  goal: Goal;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal }) => {
  const state = useStore();
  const deleteGoal = useStore(state => state.deleteGoal);
  
  // Calculate current progress
  let currentVal = 0;
  const streaks = state.streaks;
  
  switch (goal.targetStat) {
    case 'day_streak':
      currentVal = streaks['overall']?.currentStreak || 0;
      break;
    case 'perfect_days':
      currentVal = streaks['perfect_days']?.currentStreak || 0;
      break;
    case 'best_streak':
      currentVal = streaks['overall']?.longestStreak || 0;
      break;
    case 'streak_power':
      currentVal = streaks['streak_power']?.currentStreak || 0;
      break;
    case 'tasks_completed':
      currentVal = Object.values(state.dayRecords).reduce((acc, r) => 
        acc + r.tasks.filter(t => t.completed).length, 0);
      break;
  }

  const progress = Math.min(100, (currentVal / goal.targetValue) * 100);
  const isComplete = progress >= 100;
  
  const daysLeft = differenceInDays(parseISO(goal.deadline), new Date());
  
  const getStatLabel = () => {
    switch (goal.targetStat) {
      case 'day_streak': return 'Day Streak';
      case 'perfect_days': return 'Perfect Days';
      case 'best_streak': return 'Best Streak';
      case 'streak_power': return 'Streak Power';
      case 'tasks_completed': return 'Tasks Done';
    }
  };

  return (
    <div className={`goal-card ${isComplete ? 'completed' : ''}`}>
      <div className="goal-header">
        <div className="goal-title">
          <IonIcon icon={trophyOutline} className="goal-icon" />
          <span>Current Goal: {getStatLabel()}</span>
        </div>
        <div className="goal-deadline">
          <IonIcon icon={timeOutline} />
          <span>{daysLeft < 0 ? 'Expired' : `${daysLeft}d left`}</span>
        </div>
      </div>

      <div className="goal-main">
        <div className="goal-target">
          <span className="current">{currentVal}</span>
          <span className="separator">/</span>
          <span className="target">{goal.targetValue}</span>
        </div>
        
        <div className="goal-progress-container">
          <div className="goal-progress-bar" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="goal-footer">
        <div className="goal-reward">
          <IonIcon icon={giftOutline} />
          <span>Reward: <strong>{goal.reward}</strong></span>
        </div>
        {isComplete ? (
          <button className="claim-btn" onClick={() => deleteGoal(goal.id)}>Claim! 🎉</button>
        ) : (
          <button className="abandon-btn" onClick={() => deleteGoal(goal.id)}>Give Up</button>
        )}
      </div>
    </div>
  );
};

export default GoalCard;
