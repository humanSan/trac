import React, { useState } from 'react';
import { IonPage, IonContent, IonIcon, IonButton } from '@ionic/react';
import { trophyOutline, flagOutline, downloadOutline, listOutline, moonOutline, sunnyOutline, settingsOutline } from 'ionicons/icons';
import { useStore } from '../store/useStore';
import { getTodayStr, getLastNDays } from '../utils/dateUtils';
import StreakBadge from '../components/StreakBadge';
import RadialProgress from '../components/RadialProgress';
import ChartModal from '../components/ChartModal';
import GoalCard from '../components/GoalCard';
import AddGoalSheet from '../components/AddGoalSheet';
import './ProgressPage.css';
import { parseISO, format, subDays, eachDayOfInterval } from 'date-fns';
import { useEffect } from 'react';
import { caretUp, caretDown, flameOutline } from 'ionicons/icons';

const ProgressPage: React.FC = () => {
  const state = useStore();
  const calculateStreaks = state.calculateStreaks;

  useEffect(() => {
    calculateStreaks();
  }, [calculateStreaks]);

  const streaks = state.streaks;
  const dayRecords = state.dayRecords;
  const goals = state.goals;

  const todayStr = getTodayStr();
  const yesterdayStr = format(subDays(parseISO(todayStr), 1), 'yyyy-MM-dd');

  const last7Days = getLastNDays(7);
  const last30Days = getLastNDays(30);

  // Rolling Window Helpers
  const getWindowStars = (endDate: string, size: number) => {
    const start = subDays(parseISO(endDate), size - 1);
    const interval = eachDayOfInterval({ start, end: parseISO(endDate) })
      .map(d => format(d, 'yyyy-MM-dd'));
    return interval.reduce((sum, d) => sum + (dayRecords[d]?.starLevel || 0), 0);
  };

  const get100Streak = (size: number) => {
    let streak = 0;
    let curr = todayStr;
    const maxSize = size * 3;

    while (true) {
      if (getWindowStars(curr, size) === maxSize) {
        streak++;
        curr = format(subDays(parseISO(curr), 1), 'yyyy-MM-dd');
      } else {
        break;
      }
    }
    return streak;
  };

  // Calculate Stats & Trends
  const starsToday = dayRecords[todayStr]?.starLevel || 0;
  const starsYesterday = dayRecords[yesterdayStr]?.starLevel || 0;

  const current7Stars = getWindowStars(todayStr, 7);
  const yesterday7Stars = getWindowStars(yesterdayStr, 7);
  const current7Pct = Math.round((current7Stars / 21) * 100);
  const yesterday7Pct = Math.round((yesterday7Stars / 21) * 100);

  const current30Stars = getWindowStars(todayStr, 30);
  const yesterday30Stars = getWindowStars(yesterdayStr, 30);
  const current30Pct = Math.round((current30Stars / 90) * 100);
  const yesterday30Pct = Math.round((yesterday30Stars / 90) * 100);

  const streak7 = get100Streak(7);
  const streak30 = get100Streak(30);

  // Chart State
  const [chartConfig, setChartConfig] = useState<{
    isOpen: boolean;
    title: string;
    data: number[];
    labels: string[];
  }>({ isOpen: false, title: '', data: [], labels: [] });

  // Goal State
  const [isGoalSheetOpen, setIsGoalSheetOpen] = useState(false);

  const activeGoal = Object.values(goals).find(g => g.status === 'active');

  const open7DayChart = () => {
    const data = last7Days.map(day => {
      const windowSum = getWindowStars(day, 7);
      return Math.round((windowSum / 21) * 100);
    });
    const labels = last7Days.map(day => format(parseISO(day), 'EE'));
    setChartConfig({ isOpen: true, title: '7-Day Rolling Avg (%)', data, labels });
  };

  const open30DayChart = () => {
    const data = last30Days.map(day => {
      const windowSum = getWindowStars(day, 30);
      return Math.round((windowSum / 90) * 100);
    });
    const labels = last30Days.map((day, i) => i % 5 === 0 ? format(parseISO(day), 'd MMM') : '');
    setChartConfig({ isOpen: true, title: '30-Day Rolling Avg (%)', data, labels });
  };

  const TrendIndicator = ({ current, prev, streak }: { current: number, prev: number, streak?: number }) => {
    if (current === 100 && streak && streak > 0) {
      return (
        <div className="trend-badge perfect">
          <IonIcon icon={flameOutline} />
          <span>{streak}</span>
        </div>
      );
    }
    if (current > prev) return <IonIcon icon={caretUp} className="trend-icon up" />;
    if (current < prev) return <IonIcon icon={caretDown} className="trend-icon down" />;
    return null;
  };

  const overallStreak = streaks['overall']?.currentStreak || 0;
  const bestStreak = streaks['overall']?.longestStreak || 0;
  const perfectStreak = streaks['perfect_days']?.currentStreak || 0;
  const streakPower = streaks['streak_power']?.currentStreak || 0;

  // Total completed tasks across all days
  const totalTasksCount = Object.values(dayRecords).reduce((acc, record) => {
    return acc + record.tasks.filter(t => t.completed).length;
  }, 0);

  const exportDataJSON = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trac-data-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = ['Date', 'Task', 'StarLevel', 'Completed', 'CompletedAt', 'HabitID'];
    const rows: (string | number | boolean)[][] = [];

    Object.values(dayRecords).forEach(record => {
      record.tasks.forEach(task => {
        rows.push([
          record.date,
          `"${task.text.replace(/"/g, '""')}"`,
          task.starLevel,
          task.completed,
          task.completedAt || '',
          task.habitId || ''
        ]);
      });
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trac-tasks-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <IonPage>
      <IonContent fullscreen className="trac-page">
        <div className="header-padding" />
        <h1 className="page-title text-h1" style={{ padding: '0 16px', margin: '16px 0' }}>
          Progress 📊
        </h1>

        <div className="radial-stats-row large">
          <div className="radial-item-wrapper">
            <RadialProgress 
              current={current7Stars} 
              total={21} 
              label="Last 7 Days" 
              color="var(--trac-star-1)"
              onClick={open7DayChart}
              size={140}
            />
            <div className="trend-pos radial">
              <TrendIndicator current={current7Pct} prev={yesterday7Pct} streak={streak7} />
            </div>
          </div>
          
          <div className="radial-item-wrapper">
            <RadialProgress 
              current={current30Stars} 
              total={90} 
              label="Last 30 Days" 
              color="var(--trac-habit)"
              onClick={open30DayChart}
              size={140}
            />
            <div className="trend-pos radial">
              <TrendIndicator current={current30Pct} prev={yesterday30Pct} streak={streak30} />
            </div>
          </div>
        </div>

        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-icon today">⭐</div>
            <div className="summary-value">{starsToday > 0 ? Array(starsToday).fill('⭐').join('') : '---'}</div>
            <div className="summary-label">Stars Today</div>
            <div className="trend-pos-card">
              <TrendIndicator current={starsToday} prev={starsYesterday} />
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon fire">🔥</div>
            <div className="summary-value">{overallStreak}</div>
            <div className="summary-label">Day Streak</div>
          </div>
          
          <div className="summary-card">
            <div className="summary-icon trophy">🏆</div>
            <div className="summary-value">{bestStreak}</div>
            <div className="summary-label">Best Streak</div>
          </div>

          <div className="summary-card">
            <div className="summary-icon perfect">💎</div>
            <div className="summary-value">{perfectStreak}</div>
            <div className="summary-label">Perfect Days</div>
          </div>

          <div className="summary-card">
            <div className="summary-icon power">⚡</div>
            <div className="summary-value">{streakPower}</div>
            <div className="summary-label">Streak Power</div>
          </div>

          <div className="summary-card">
            <div className="summary-icon done">✅</div>
            <div className="summary-value">{totalTasksCount}</div>
            <div className="summary-label">Total Done</div>
          </div>
        </div>

        {/* Goal Section */}
        <h2 className="section-title text-h2">Your Goal 🎯</h2>
        {activeGoal ? (
          <GoalCard goal={activeGoal} />
        ) : (
          <div className="no-goal-card" onClick={() => setIsGoalSheetOpen(true)}>
            <div className="no-goal-content">
              <h3>No active goal!</h3>
              <p>Set a target and earn a reward. 🎁</p>
              <IonButton fill="outline" color="primary" mode="ios">Set Goal</IonButton>
            </div>
          </div>
        )}

        <h2 className="section-title text-h2">Streaks</h2>
        <div className="streak-cards-column">
          <div className="streak-card level-1">
            <div className="streak-card-info">
              <h3>1 Star Day ⭐</h3>
              <p>At least one tier complete</p>
            </div>
            <StreakBadge streakKey="star1" size="large" />
          </div>

          <div className="streak-card level-2">
            <div className="streak-card-info">
              <h3>2 Star Day ⭐⭐</h3>
              <p>Two tiers complete</p>
            </div>
            <StreakBadge streakKey="star2" size="large" />
          </div>

          <div className="streak-card level-3">
            <div className="streak-card-info">
              <h3>3 Star Day ⭐⭐⭐</h3>
              <p>All tiers complete!</p>
            </div>
            <StreakBadge streakKey="star3" size="large" />
          </div>

          <div className="streak-card habits">
            <div className="streak-card-info">
              <h3>Habits 🔮</h3>
              <p>Consistency is key</p>
            </div>
            <StreakBadge streakKey="all_habits" size="large" />
          </div>
        </div>

        <h2 className="section-title text-h2">Settings</h2>
        <div className="theme-switcher" style={{ padding: '0 16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', background: 'var(--trac-bg)', padding: '4px', borderRadius: '12px' }}>
            <IonButton
              fill={state.theme === 'light' ? 'solid' : 'clear'}
              color={state.theme === 'light' ? 'primary' : 'medium'}
              style={{ flex: 1, margin: 0, '--border-radius': '8px', fontSize: '13px' }}
              onClick={() => state.setTheme('light')}
            >
              <IonIcon slot="start" icon={sunnyOutline} />
              Light
            </IonButton>
            <IonButton
              fill={state.theme === 'dark' ? 'solid' : 'clear'}
              color={state.theme === 'dark' ? 'primary' : 'medium'}
              style={{ flex: 1, margin: 0, '--border-radius': '8px', fontSize: '13px' }}
              onClick={() => state.setTheme('dark')}
            >
              <IonIcon slot="start" icon={moonOutline} />
              Dark
            </IonButton>
            <IonButton
              fill={state.theme === 'system' ? 'solid' : 'clear'}
              color={state.theme === 'system' ? 'primary' : 'medium'}
              style={{ flex: 1, margin: 0, '--border-radius': '8px', fontSize: '13px' }}
              onClick={() => state.setTheme('system')}
            >
              <IonIcon slot="start" icon={settingsOutline} />
              System
            </IonButton>
          </div>
        </div>

        <div className="export-section" style={{ padding: '0 16px 24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <IonButton fill="clear" color="medium" onClick={exportDataJSON} style={{ fontFamily: 'Fredoka, sans-serif' }}>
            <IonIcon slot="start" icon={downloadOutline} />
            Export Data (JSON)
          </IonButton>
          <IonButton fill="clear" color="medium" onClick={exportCSV} style={{ fontFamily: 'Fredoka, sans-serif' }}>
            <IonIcon slot="start" icon={listOutline} />
            Export Tasks (CSV)
          </IonButton>
        </div>

        <div style={{ height: '100px' }} />

        <ChartModal
          isOpen={chartConfig.isOpen}
          title={chartConfig.title}
          data={chartConfig.data}
          labels={chartConfig.labels}
          onClose={() => setChartConfig(prev => ({ ...prev, isOpen: false }))}
        />

        <AddGoalSheet
          isOpen={isGoalSheetOpen}
          onDidDismiss={() => setIsGoalSheetOpen(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default ProgressPage;
