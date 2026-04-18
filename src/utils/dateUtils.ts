import { format, parseISO, addDays, subDays, startOfWeek, endOfWeek, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

export const getTodayStr = () => format(new Date(), 'yyyy-MM-dd');

export const formatDate = (dateStr: string, formatStr: string = 'MMM d, yyyy') => {
  return format(parseISO(dateStr), formatStr);
};

export const getNextDayStr = (dateStr: string) => {
  return format(addDays(parseISO(dateStr), 1), 'yyyy-MM-dd');
};

export const getPrevDayStr = (dateStr: string) => {
  return format(subDays(parseISO(dateStr), 1), 'yyyy-MM-dd');
};

export const isToday = (dateStr: string) => {
  return dateStr === getTodayStr();
};

export const getDaysAround = (centerDateStr: string, pastDays: number = 60, futureDays: number = 60) => {
  const centerDate = parseISO(centerDateStr);
  const start = subDays(centerDate, pastDays);
  const end = addDays(centerDate, futureDays);
  return eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'));
};

export const getDaysInWeek = (dateStr: string) => {
  const date = parseISO(dateStr);
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday start
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'));
};

export const getDaysInMonth = (dateStr: string) => {
  const date = parseISO(dateStr);
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'));
};

export const getLastNDays = (n: number) => {
  const today = new Date();
  const start = subDays(today, n - 1);
  return eachDayOfInterval({ start, end: today }).map(d => format(d, 'yyyy-MM-dd'));
};
