export type EventColor =
  | 'blue'
  | 'green'
  | 'purple'
  | 'orange'
  | 'red'
  | 'teal'
  | 'pink'
  | 'yellow';

export type ViewMode = 'month' | 'week' | 'day' | 'custom';

export interface CustomDateRange {
  startDate: Date;
  endDate: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  color: EventColor;
  location?: string;
  isAllDay?: boolean;
  recurrence?: RecurrenceRule;
  category?: string;
}

export type RecurrenceFrequency =
  | 'none'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'weekdays'
  | 'custom';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;
  endDate?: string;
  endType?: 'never' | 'on' | 'after';
  occurrences?: number;
  daysOfWeek?: number[]; // 0-6, Sunday to Saturday
}

export interface ScheduleImport {
  events: CalendarEvent[];
  metadata?: {
    source?: string;
    importedAt?: string;
    version?: string;
  };
}

export interface DayInfo {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEvent[];
}

export interface TimeSlot {
  hour: number;
  minute: number;
  events: CalendarEvent[];
}

export const EVENT_COLORS: Record<
  EventColor,
  { bg: string; text: string; border: string }
> = {
  blue: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    border: 'border-blue-500',
  },
  green: {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    border: 'border-green-500',
  },
  purple: {
    bg: 'bg-purple-500/20',
    text: 'text-purple-400',
    border: 'border-purple-500',
  },
  orange: {
    bg: 'bg-orange-500/20',
    text: 'text-orange-400',
    border: 'border-orange-500',
  },
  red: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500' },
  teal: {
    bg: 'bg-teal-500/20',
    text: 'text-teal-400',
    border: 'border-teal-500',
  },
  pink: {
    bg: 'bg-pink-500/20',
    text: 'text-pink-400',
    border: 'border-pink-500',
  },
  yellow: {
    bg: 'bg-yellow-500/20',
    text: 'text-yellow-400',
    border: 'border-yellow-500',
  },
};
