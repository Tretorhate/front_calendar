'use client';
import * as React from 'react';
import { motion } from 'framer-motion';
import { format, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { cn } from '@/shared/lib/utils';
import {
  CalendarEvent,
  CustomDateRange,
  EVENT_COLORS,
} from '@/shared/types/calendar';
import {
  generateTimeSlots,
  expandRecurringEvents,
  sortEventsForDisplay,
} from '@/shared/lib/calendar-utils';
import { Plus } from 'lucide-react';

interface CalendarCustomViewProps {
  dateRange: CustomDateRange;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onAddEvent: (date: Date) => void;
}

export const CalendarCustomView: React.FC<CalendarCustomViewProps> = ({
  dateRange,
  events,
  onEventClick,
  onAddEvent,
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const timeSlots = generateTimeSlots();

  // Generate days for the custom range
  const days = eachDayOfInterval({
    start: dateRange.startDate,
    end: dateRange.endDate,
  });

  const dayCount = days.length;

  // Expand recurring events for this date range
  const expandedEvents = React.useMemo(() => {
    return expandRecurringEvents(
      events,
      dateRange.startDate,
      dateRange.endDate
    );
  }, [events, dateRange]);

  // Get events for a specific day
  const getEventsForDay = (day: Date): CalendarEvent[] => {
    const dayEvents = expandedEvents.filter((event) => {
      const eventStart = format(parseISO(event.startDate), 'yyyy-MM-dd');
      const eventEnd = format(parseISO(event.endDate), 'yyyy-MM-dd');
      const dayStr = format(day, 'yyyy-MM-dd');
      return dayStr >= eventStart && dayStr <= eventEnd;
    });
    return sortEventsForDisplay(dayEvents);
  };

  // Calculate event position and height - smaller on mobile
  const getEventStyle = (event: CalendarEvent) => {
    const start = parseISO(event.startDate);
    const end = parseISO(event.endDate);

    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const duration = endHour - startHour;

    // Use smaller slot height on mobile (40px vs 48px desktop)
    return {
      top: `calc(${startHour} * var(--slot-height))`,
      height: `calc(max(${duration}, 0.5) * var(--slot-height))`,
    };
  };

  // Scroll to current time on mount
  React.useEffect(() => {
    if (scrollRef.current) {
      const currentHour = new Date().getHours();
      // Adjust for mobile slot height
      const isMobile = window.innerWidth < 640;
      const slotHeight = isMobile ? 40 : 48;
      scrollRef.current.scrollTop = Math.max(0, (currentHour - 1) * slotHeight);
    }
  }, []);

  // Calculate column width based on number of days - more mobile-friendly
  const getColumnWidth = () => {
    // On mobile, use smaller widths
    if (dayCount === 1) return 'min-w-full sm:min-w-[300px]';
    if (dayCount === 2) return 'min-w-[50%] sm:min-w-[200px]';
    if (dayCount === 3) return 'min-w-[33.33%] sm:min-w-[180px]';
    if (dayCount <= 5) return 'min-w-[80px] sm:min-w-[140px]';
    if (dayCount <= 7) return 'min-w-[60px] sm:min-w-[120px]';
    return 'min-w-[50px] sm:min-w-[100px]';
  };

  return (
    <div
      className='flex flex-col h-full'
      style={
        {
          '--slot-height': '40px',
        } as React.CSSProperties
      }
    >
      {/* Range indicator */}
      <div className='px-2 sm:px-4 py-1.5 sm:py-2 bg-primary/10 border-b border-border'>
        <p className='text-xs sm:text-sm font-medium text-primary text-center'>
          {format(dateRange.startDate, 'MMM d')} –{' '}
          {format(dateRange.endDate, 'MMM d, yyyy')} ({dayCount} day
          {dayCount > 1 ? 's' : ''})
        </p>
      </div>

      {/* Time Grid with Header */}
      <div
        ref={scrollRef}
        className='flex-1 overflow-auto'
        style={
          {
            '--slot-height': 'clamp(36px, 8vw, 48px)',
          } as React.CSSProperties
        }
      >
        {/* Day Headers - sticky inside scroll container */}
        <div className='flex border-b border-border bg-card/50 sticky top-0 z-10'>
          <div className='w-10 sm:w-14 shrink-0 border-r border-border' />
          <div className='flex-1 flex'>
            {days.map((day, index) => {
              const isToday = isSameDay(day, new Date());
              return (
                <motion.div
                  key={day.toISOString()}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    'flex-1 py-1.5 sm:py-2 text-center border-r border-border last:border-r-0',
                    getColumnWidth()
                  )}
                >
                  <div
                    className={cn(
                      'text-[8px] sm:text-xs font-medium uppercase tracking-wide',
                      isToday ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {/* Show single letter on very small screens, full day on larger */}
                    <span className='sm:hidden'>{format(day, 'EEEEE')}</span>
                    <span className='hidden sm:inline'>
                      {format(day, 'EEE')}
                    </span>
                  </div>
                  <div
                    className={cn(
                      'text-sm sm:text-lg font-bold mt-0.5',
                      isToday
                        ? 'text-primary-foreground bg-primary rounded-full w-6 h-6 sm:w-8 sm:h-8 mx-auto flex items-center justify-center text-xs sm:text-base'
                        : 'text-foreground'
                    )}
                  >
                    {format(day, 'd')}
                  </div>
                  {/* Hide month on mobile when many days */}
                  <div
                    className={cn(
                      'text-[8px] sm:text-[10px] text-muted-foreground',
                      dayCount > 5 && 'hidden sm:block'
                    )}
                  >
                    {format(day, 'MMM')}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Time slots */}
        <div className='flex min-h-full'>
          {/* Time Column */}
          <div className='w-10 sm:w-14 shrink-0 border-r border-border bg-card/30'>
            {timeSlots.map((slot) => (
              <div
                key={slot.hour}
                className='border-b border-border/50 pr-0.5 sm:pr-2 text-right flex items-start justify-end'
                style={{ height: 'var(--slot-height)' }}
              >
                <span className='text-[8px] sm:text-[10px] text-muted-foreground leading-none mt-0.5'>
                  {/* Shorter format on mobile */}
                  <span className='sm:hidden'>
                    {slot.hour === 0
                      ? '12a'
                      : slot.hour < 12
                      ? `${slot.hour}a`
                      : slot.hour === 12
                      ? '12p'
                      : `${slot.hour - 12}p`}
                  </span>
                  <span className='hidden sm:inline'>{slot.label}</span>
                </span>
              </div>
            ))}
          </div>

          {/* Day Columns */}
          <div className='flex-1 flex'>
            {days.map((day) => {
              const dayEvents = getEventsForDay(day).filter((e) => !e.isAllDay);
              const allDayEvents = getEventsForDay(day).filter(
                (e) => e.isAllDay
              );

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'flex-1 relative border-r border-border last:border-r-0',
                    getColumnWidth()
                  )}
                >
                  {/* All-day events section */}
                  {allDayEvents.length > 0 && (
                    <div className='absolute top-0 left-0 right-0 bg-secondary/50 border-b border-border z-5 p-0.5 sm:p-1'>
                      {allDayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          onClick={() => onEventClick(event)}
                          className={cn(
                            'text-[7px] sm:text-[10px] px-0.5 sm:px-1 py-0.5 rounded truncate cursor-pointer mb-0.5',
                            EVENT_COLORS[event.color].bg,
                            EVENT_COLORS[event.color].text
                          )}
                        >
                          {event.title}
                        </div>
                      ))}
                      {allDayEvents.length > 2 && (
                        <div className='text-[7px] sm:text-[8px] text-muted-foreground'>
                          +{allDayEvents.length - 2}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Time slots */}
                  {timeSlots.map((slot) => (
                    <div
                      key={slot.hour}
                      className='border-b border-border/50 hover:bg-muted/30 transition-colors group relative'
                      style={{ height: 'var(--slot-height)' }}
                      onClick={() => {
                        const eventDate = new Date(day);
                        eventDate.setHours(slot.hour, 0, 0, 0);
                        onAddEvent(eventDate);
                      }}
                    >
                      <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                        <Plus className='w-3 h-3 text-muted-foreground' />
                      </div>
                    </div>
                  ))}

                  {/* Events */}
                  {dayEvents.map((event, eventIndex) => {
                    const style = getEventStyle(event);
                    const colors = EVENT_COLORS[event.color];

                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: eventIndex * 0.03 }}
                        onClick={() => onEventClick(event)}
                        className={cn(
                          'absolute left-0.5 right-0.5 rounded px-0.5 sm:px-1.5 py-0.5 cursor-pointer overflow-hidden',
                          'border-l-2 shadow-sm hover:shadow-md transition-shadow',
                          colors.bg,
                          colors.border
                        )}
                        style={style}
                      >
                        <div
                          className={cn(
                            'text-[8px] sm:text-[10px] font-medium truncate leading-tight',
                            colors.text
                          )}
                        >
                          {event.title}
                        </div>
                        {/* Hide time on mobile when many days */}
                        <div
                          className={cn(
                            'text-[7px] sm:text-[9px] text-muted-foreground truncate',
                            dayCount > 4 && 'hidden sm:block'
                          )}
                        >
                          {format(parseISO(event.startDate), 'h:mm a')}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
