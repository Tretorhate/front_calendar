import {  startOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  parseISO,
  setHours,
  setMinutes,
  addYears,
  getDay,
  isBefore,
  isAfter,
  differenceInDays,
} from 'date-fns';
import {
  CalendarEvent,
  DayInfo,
  RecurrenceRule,
} from '@/shared/types/calendar';

/**
 * Sort events for display in calendar cells:
 * 1. Multi-day events and all-day events first (at the top)
 * 2. Then single-day events sorted by start time
 */
export function sortEventsForDisplay(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    const aStart = parseISO(a.startDate);
    const aEnd = parseISO(a.endDate);
    const bStart = parseISO(b.startDate);
    const bEnd = parseISO(b.endDate);

    // Check if events span multiple days
    const aIsMultiDay =
      a.isAllDay || format(aStart, 'yyyy-MM-dd') !== format(aEnd, 'yyyy-MM-dd');
    const bIsMultiDay =
      b.isAllDay || format(bStart, 'yyyy-MM-dd') !== format(bEnd, 'yyyy-MM-dd');

    // Multi-day events come first
    if (aIsMultiDay && !bIsMultiDay) return -1;
    if (!aIsMultiDay && bIsMultiDay) return 1;

    // If both are multi-day or both are single-day, sort by start time
    return aStart.getTime() - bStart.getTime();
  });
}

/**
 * Expand recurring events into individual instances within a date range
 */
export function expandRecurringEvents(
  events: CalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date
): CalendarEvent[] {
  const expandedEvents: CalendarEvent[] = [];

  for (const event of events) {
    if (!event.recurrence || event.recurrence.frequency === 'none') {
      // Non-recurring event, add as-is
      expandedEvents.push(event);
      continue;
    }

    const recurrence = event.recurrence;
    const eventStart = parseISO(event.startDate);
    const eventEnd = parseISO(event.endDate);
    const eventDuration = differenceInDays(eventEnd, eventStart);

    // Determine the end of recurrence
    let recurrenceEnd: Date;
    if (recurrence.endType === 'on' && recurrence.endDate) {
      recurrenceEnd = parseISO(recurrence.endDate);
    } else if (recurrence.endType === 'after' && recurrence.occurrences) {
      // We'll count occurrences as we go
      recurrenceEnd = addYears(rangeEnd, 10); // Far future
    } else {
      // 'never' - limit to a reasonable range (2 years ahead)
      recurrenceEnd = addYears(rangeEnd, 2);
    }

    // Don't expand beyond the range we're looking at
    const effectiveEnd = isBefore(recurrenceEnd, rangeEnd)
      ? recurrenceEnd
      : rangeEnd;

    let currentDate = new Date(eventStart);
    let occurrenceCount = 0;
    const maxOccurrences = recurrence.occurrences || 365; // Limit iterations

    while (
      !isAfter(currentDate, effectiveEnd) &&
      occurrenceCount < maxOccurrences
    ) {
      // Check if this occurrence falls within our range
      const occurrenceEnd = addDays(currentDate, eventDuration);

      if (
        !isBefore(occurrenceEnd, rangeStart) &&
        !isAfter(currentDate, rangeEnd)
      ) {
        // Check if this day matches the recurrence pattern
        if (shouldOccurOnDate(currentDate, eventStart, recurrence)) {
          // Create a new event instance for this occurrence
          const instanceStart = new Date(currentDate);
          instanceStart.setHours(
            eventStart.getHours(),
            eventStart.getMinutes(),
            eventStart.getSeconds()
          );

          const instanceEnd = addDays(instanceStart, eventDuration);
          instanceEnd.setHours(
            eventEnd.getHours(),
            eventEnd.getMinutes(),
            eventEnd.getSeconds()
          );

          expandedEvents.push({
            ...event,
            id: `${event.id}_${format(currentDate, 'yyyy-MM-dd')}`,
            startDate: instanceStart.toISOString(),
            endDate: instanceEnd.toISOString(),
          });

          occurrenceCount++;

          // Check if we've reached the occurrence limit
          if (
            recurrence.endType === 'after' &&
            occurrenceCount >= maxOccurrences
          ) {
            break;
          }
        }
      }

      // Move to next potential occurrence
      currentDate = getNextOccurrenceDate(currentDate, recurrence);

      // Safety check to prevent infinite loops
      if (isAfter(currentDate, addYears(rangeEnd, 5))) {
        break;
      }
    }
  }

  return expandedEvents;
}

/**
 * Check if an event should occur on a specific date based on recurrence rules
 */
function shouldOccurOnDate(
  date: Date,
  originalStart: Date,
  recurrence: RecurrenceRule
): boolean {
  const dayOfWeek = getDay(date);

  switch (recurrence.frequency) {
    case 'daily':
      return true;

    case 'weekly':
      // Check if this day of week is in the selected days
      if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
        return recurrence.daysOfWeek.includes(dayOfWeek);
      }
      // Default: same day of week as original
      return dayOfWeek === getDay(originalStart);

    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;

    case 'monthly':
      return date.getDate() === originalStart.getDate();

    case 'yearly':
      return (
        date.getDate() === originalStart.getDate() &&
        date.getMonth() === originalStart.getMonth()
      );

    default:
      return false;
  }
}

/**
 * Get the next potential occurrence date based on recurrence interval
 */
function getNextOccurrenceDate(
  current: Date,
  recurrence: RecurrenceRule
): Date {
  const interval = recurrence.interval || 1;

  switch (recurrence.frequency) {
    case 'daily':
      return addDays(current, interval);

    case 'weekly':
      // For weekly with specific days, move one day at a time
      if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
        return addDays(current, 1);
      }
      return addWeeks(current, interval);

    case 'weekdays':
      // Move to next day, we'll filter in shouldOccurOnDate
      return addDays(current, 1);

    case 'monthly':
      return addMonths(current, interval);

    case 'yearly':
      return addYears(current, interval);

    default:
      return addDays(current, 1);
  }
}

export function generateMonthDays(
  date: Date,
  events: CalendarEvent[],
  selectedDate: Date | null
): DayInfo[] {
  const monthStart = startOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  // Always generate exactly 6 weeks (42 days) for consistent grid layout
  const calendarEnd = addDays(calendarStart, 41);

  // Expand recurring events for this date range
  const expandedEvents = expandRecurringEvents(
    events,
    calendarStart,
    calendarEnd
  );

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const today = new Date();

  return days.map((day) => {
    const dayEvents = expandedEvents.filter((event) => {
      const eventStart = format(parseISO(event.startDate), 'yyyy-MM-dd');
      const eventEnd = format(parseISO(event.endDate), 'yyyy-MM-dd');
      const dayStr = format(day, 'yyyy-MM-dd');
      return dayStr >= eventStart && dayStr <= eventEnd;
    });

    // Sort events: multi-day first, then by start time
    const sortedEvents = sortEventsForDisplay(dayEvents);

    return {
      date: day,
      isCurrentMonth: isSameMonth(day, date),
      isToday: isSameDay(day, today),
      isSelected: selectedDate ? isSameDay(day, selectedDate) : false,
      events: sortedEvents,
    };
  });
}

export function generateWeekDays(
  date: Date,
  events: CalendarEvent[],
  selectedDate: Date | null
): DayInfo[] {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 0 });

  // Expand recurring events for this date range
  const expandedEvents = expandRecurringEvents(events, weekStart, weekEnd);

  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const today = new Date();

  return days.map((day) => {
    const dayEvents = expandedEvents.filter((event) => {
      const eventStart = format(parseISO(event.startDate), 'yyyy-MM-dd');
      const eventEnd = format(parseISO(event.endDate), 'yyyy-MM-dd');
      const dayStr = format(day, 'yyyy-MM-dd');
      return dayStr >= eventStart && dayStr <= eventEnd;
    });

    // Sort events: multi-day first, then by start time
    const sortedEvents = sortEventsForDisplay(dayEvents);

    return {
      date: day,
      isCurrentMonth: true,
      isToday: isSameDay(day, today),
      isSelected: selectedDate ? isSameDay(day, selectedDate) : false,
      events: sortedEvents,
    };
  });
}

export function generateTimeSlots(): { hour: number; label: string }[] {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    slots.push({
      hour,
      label: `${displayHour}:00 ${period}`,
    });
  }
  return slots;
}

export function navigateDate(
  selectedDate: Date,
  viewMode: 'month' | 'week' | 'day',
  direction: 'prev' | 'next'
): Date {
  switch (viewMode) {
    case 'month':
      return direction === 'next'
        ? addMonths(selectedDate, 1)
        : subMonths(selectedDate, 1);
    case 'week':
      return direction === 'next'
        ? addWeeks(selectedDate, 1)
        : subWeeks(selectedDate, 1);
    case 'day':
      return direction === 'next'
        ? addDays(selectedDate, 1)
        : subDays(selectedDate, 1);
    default:
      return selectedDate;
  }
}

export function formatDateRange(
  date: Date,
  viewMode: 'month' | 'week' | 'day'
): string {
  switch (viewMode) {
    case 'month':
      return format(date, 'MMMM yyyy');
    case 'week': {
      const weekStart = startOfWeek(date, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(date, { weekStartsOn: 0 });
      if (format(weekStart, 'MMMM') === format(weekEnd, 'MMMM')) {
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'd, yyyy')}`;
      }
      return `${format(weekStart, 'MMM d')} - ${format(
        weekEnd,
        'MMM d, yyyy'
      )}`;
    }
    case 'day':
      return format(date, 'EEEE, MMMM d, yyyy');
    default:
      return '';
  }
}

export function getEventTime(event: CalendarEvent): string {
  if (event.isAllDay) return 'All day';

  const start = parseISO(event.startDate);
  const end = parseISO(event.endDate);

  return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
}

export function createDateWithTime(
  date: Date,
  hours: number,
  minutes: number = 0
): Date {
  return setMinutes(setHours(date, hours), minutes);
}

export function generateEventId(): string {
  return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAY_NAMES_FULL = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
