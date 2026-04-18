import React, { useEffect, useRef, useMemo } from 'react';
import { IonIcon } from '@ionic/react';
import { star } from 'ionicons/icons';
import { parseISO, format, startOfWeek, addDays } from 'date-fns';
import { useStore } from '../store/useStore';
import { isToday } from '../utils/dateUtils';
import './DateSelector.css';

interface DateSelectorProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onSelectDate }) => {
  // Generate a larger range of days (e.g., 1 year) aligned to week starts (Monday)
  const weeks = useMemo(() => {
    const today = new Date();
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
    const weekList = [];
    
    // Generate 26 weeks back and 26 weeks forward
    for (let i = -26; i <= 26; i++) {
      const weekStart = addDays(startOfCurrentWeek, i * 7);
      const daysInWeek = [];
      for (let j = 0; j < 7; j++) {
        daysInWeek.push(format(addDays(weekStart, j), 'yyyy-MM-dd'));
      }
      weekList.push(daysInWeek);
    }
    return weekList;
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const dayRecords = useStore(state => state.dayRecords);

  const performScroll = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollRef.current) {
      const selectedEl = scrollRef.current.querySelector('.date-item.selected') as HTMLElement;
      if (selectedEl) {
        const weekContainer = selectedEl.closest('.date-selector-week') as HTMLElement;
        if (weekContainer) {
          scrollRef.current.scrollTo({
            left: weekContainer.offsetLeft,
            behavior
          });
        }
      }
    }
  };

  useEffect(() => {
    // Perform initial scroll on mount
    const timer = setTimeout(() => performScroll('auto'), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Scroll when selected date changes
    performScroll('smooth');
  }, [selectedDate]);

  const selectedDateObj = useMemo(() => parseISO(selectedDate), [selectedDate]);
  const monthName = format(selectedDateObj, 'MMMM yyyy');

  return (
    <div className="date-selector-wrapper">
      <div className="date-selector-month">{monthName}</div>
      <div className="date-selector-container" ref={scrollRef}>
        <div className="date-selector-track">
          {weeks.map((week, weekIdx) => (
            <div key={`week-${weekIdx}`} className="date-selector-week">
              {week.map(dateStr => {
                const dateObj = parseISO(dateStr);
                const isSelected = dateStr === selectedDate;
                const isTodayDate = isToday(dateStr);
                const dayName = format(dateObj, 'EEE');
                const dayNum = format(dateObj, 'd');
                
                const record = dayRecords[dateStr];
                const starLevel = record ? record.starLevel : 0;

                return (
                  <div 
                    key={dateStr} 
                    className={`date-item ${isSelected ? 'selected' : ''} ${isTodayDate ? 'today' : ''}`}
                    onClick={() => onSelectDate(dateStr)}
                  >
                    <div className="date-day-name">{dayName}</div>
                    <div className="date-day-num">{dayNum}</div>
                    <div className="date-stars">
                      {starLevel >= 1 ? <IonIcon icon={star} className="star-icon level-1" /> : <div className="star-dot" />}
                      {starLevel >= 2 ? <IonIcon icon={star} className="star-icon level-2" /> : <div className="star-dot" />}
                      {starLevel >= 3 ? <IonIcon icon={star} className="star-icon level-3" /> : <div className="star-dot" />}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DateSelector;
