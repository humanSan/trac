import React from 'react';
import './RadialProgress.css';

interface RadialProgressProps {
  current: number;
  total: number;
  label: string;
  color: string;
  onClick?: () => void;
  size?: number;
}

const RadialProgress: React.FC<RadialProgressProps> = ({ current, total, label, color, onClick, size = 80 }) => {
  const percentage = total === 0 ? 0 : Math.round((current / total) * 100);
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div 
      className="radial-progress-container" 
      onClick={onClick}
      style={{ width: size }}
    >
      <div className="radial-svg-wrapper" style={{ width: size, height: size, position: 'relative' }}>
        <svg width={size} height={size} viewBox="0 0 80 80">
          {/* Background circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="transparent"
            stroke="var(--trac-border)"
            strokeWidth="6"
          />
          {/* Progress circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 40 40)"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="radial-content">
          <span className="radial-percent" style={{ fontSize: size * 0.2 }}>{percentage}%</span>
        </div>
      </div>
      <div className="radial-label">{label}</div>
    </div>
  );
};

export default RadialProgress;
