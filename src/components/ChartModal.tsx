import React from 'react';
import { IonModal, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton } from '@ionic/react';
import './ChartModal.css';

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: number[]; // Simple array of values (0-3 for stars)
  labels: string[]; // Labels for X axis (e.g. Mon, Tue)
}

const ChartModal: React.FC<ChartModalProps> = ({ isOpen, onClose, title, data, labels }) => {
  const chartHeight = 200;
  const chartWidth = 320;
  const padding = 20;
  
  // Determine scale based on data. 
  // If any value > 3 OR title suggests percentage, assume 0-100 scale.
  const isPercentage = data.some(v => v > 3) || title.includes('%') || title.includes('Rolling');
  const maxScale = isPercentage ? 100 : 3;

  const getX = (index: number) => padding + (index * (chartWidth - 2 * padding) / (data.length - 1 || 1));
  const getY = (value: number) => chartHeight - padding - (value / maxScale * (chartHeight - 2 * padding));

  const points = data.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
  const areaPoints = `${getX(0)},${chartHeight - padding} ${points} ${getX(data.length - 1)},${chartHeight - padding}`;
  
  const gridValues = isPercentage ? [0, 25, 50, 75, 100] : [0, 1, 2, 3];

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} breakpoints={[0, 0.6, 0.9]} initialBreakpoint={0.6}>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle style={{ fontFamily: 'Fredoka, sans-serif' }}>{title}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose} style={{ fontFamily: 'Fredoka, sans-serif' }}>Close</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding custom-chart-modal">
        <div className="chart-container" style={{ textAlign: 'center' }}>
          <svg width="100%" height={chartHeight + 40} viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--trac-primary)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--trac-primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {/* Grid lines */}
            {gridValues.map(v => (
              <line 
                key={v}
                x1={padding} 
                y1={getY(v)} 
                x2={chartWidth - padding} 
                y2={getY(v)} 
                stroke="var(--trac-border)" 
                strokeWidth="1" 
                strokeDasharray="4 4"
              />
            ))}

            {/* Area Fill */}
            <polygon points={areaPoints} fill="url(#chartGradient)" />

            {/* The Line */}
            <polyline
              points={points}
              fill="none"
              stroke="var(--trac-primary)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Dots */}
            {data.map((v, i) => (
              <circle
                key={i}
                cx={getX(i)}
                cy={getY(v)}
                r="4"
                fill="var(--trac-card)"
                stroke="var(--trac-primary)"
                strokeWidth="2"
              />
            ))}

            {/* Labels aligned perfectly */}
            {labels.map((l, i) => {
              // Only show labels based on density
              const showLabel = data.length <= 7 || i % 5 === 0 || i === data.length - 1;
              if (!showLabel || !l) return null;

              return (
                <text
                  key={i}
                  x={getX(i)}
                  y={chartHeight + 20}
                  textAnchor="middle"
                  fill="var(--trac-text-soft)"
                  style={{ fontSize: '11px', fontFamily: 'Fredoka, sans-serif' }}
                >
                  {l}
                </text>
              );
            })}
          </svg>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default ChartModal;
