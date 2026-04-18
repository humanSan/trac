import React from 'react';
import { Flame } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getTodayStr } from '../utils/dateUtils';
import './StreakBadge.css';

interface StreakBadgeProps {
  streakKey: string;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const StreakBadge: React.FC<StreakBadgeProps> = ({ streakKey, size = 'medium', showLabel = false }) => {
  const streaks = useStore(state => state.streaks);
  const streak = streaks[streakKey];
  
  if (!streak) return null;

  // A streak is "lit" (active today) if it was completed today
  // For MVP, we just show the flame if currentStreak > 0
  const isLit = streak.currentStreak > 0;
  
  // Size classes
  const sizeClass = `size-${size}`;
  const litClass = isLit ? 'lit animate-pulse-glow' : 'unlit';

  return (
    <div className={`streak-badge ${sizeClass} ${litClass}`}>
      <Flame 
        size={size === 'small' ? 16 : size === 'medium' ? 24 : 32} 
        color={isLit ? 'var(--trac-streak)' : 'var(--trac-border)'}
        fill={isLit ? 'var(--trac-streak)' : 'none'}
        className={isLit ? 'animate-wiggle' : ''}
      />
      <span className="streak-count">{streak.currentStreak}</span>
      {showLabel && <span className="streak-label">Day Streak</span>}
    </div>
  );
};

export default StreakBadge;
