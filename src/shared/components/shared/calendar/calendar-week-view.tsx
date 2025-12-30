'use client';import * as React from 'react';
import { motion } from 'framer-motion';
import { format, parseISO, isSameDay, getHours, getMinutes } from 'date-fns';
import { cn } from '@/shared/lib/utils';
import { CalendarEvent } from '@/shared/types/calendar';
import {
  generateWeekDays,
  generateTimeSlots,
} from '@/shared/lib/calendar-utils';
import { EVENT_COLORS } from '@/shared/types/calendar';

interface CalendarWeekViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onAddEvent: (date: Date) => void;
}

export const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({
  selectedDate,
  events,
  onDateSelect,
  onEventClick,
  onAddEvent,
}) => {
  const days = generateWeekDays(selectedDate, events, selectedDate);
  const timeSlots = generateTimeSlots();
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Scrolls to current time on mount
  React.useEffect(() => {
    if (containerRef.current) {
      const currentHour = new Date().getHours();
      const scrollPosition = currentHour * 48 - 100; // Adjusted for smaller mobile height
      containerRef.current.scrollTop = Math.max(0, scrollPosition);
    }
  }, []);

  const getEventsForDayAndHour = (date: Date, hour: number) => {
    return events.filter((event) => {
      const eventStart = parseISO(event.startDate);
      const eventHour = getHours(eventStart);
      return isSameDay(eventStart, date) && eventHour === hour;
    });
  };

  const getEventPosition = (event: CalendarEvent) => {
    const start = parseISO(event.startDate);
    const end = parseISO(event.endDate);
    const startMinutes = getMinutes(start);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60);
    const top = (startMinutes / 60) * 100;
    const height = Math.max((duration / 60) * 100, 25);
    return { top: `${top}%`, height: `${Math.min(height, 200)}%` };
  };

  return (
    <div className='flex flex-col h-full'>
      {/* Time grid with header */}
      <div
        ref={containerRef}
        className='flex-1 overflow-y-auto overflow-x-hidden'
      >
        {/* Header with day names - sticky inside scroll container */}
        <div className='flex border-b border-border sticky top-0 bg-card z-10'>
          <div className='w-12 sm:w-16 md:w-20 shrink-0 border-r border-border' />
          {days.map((day) => (
            <motion.div
              key={day.date.toISOString()}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'flex-1 py-2 sm:py-3 text-center border-r border-border last:border-r-0 cursor-pointer transition-colors min-w-0',
                day.isToday && 'bg-primary/10',
                day.isSelected && 'bg-accent/10'
              )}
              onClick={() => onDateSelect(day.date)}
            >
              <div className='text-[10px] sm:text-xs text-muted-foreground'>
                {/* Single letter on mobile, abbreviated on larger screens */}
                <span className='sm:hidden'>{format(day.date, 'EEEEE')}</span>
                <span className='hidden sm:inline'>
                  {format(day.date, 'EEE')}
                </span>
              </div>
              <div
                className={cn(
                  'text-sm sm:text-lg font-semibold mt-0.5 sm:mt-1',
                  day.isToday && 'text-primary',
                  !day.isToday && 'text-foreground'
                )}
              >
                {format(day.date, 'd')}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Time slots */}
        <div className='relative min-w-0'>
          {timeSlots.map((slot) => (
            <div
              key={slot.hour}
              className='flex border-b border-border/50 h-[48px] sm:h-[60px]'
            >
              <div className='w-12 sm:w-16 md:w-20 shrink-0 border-r border-border px-1 sm:px-2 py-1 text-[10px] sm:text-xs text-muted-foreground'>
                {slot.label}
              </div>
              {days.map((day) => {
                const hourEvents = getEventsForDayAndHour(day.date, slot.hour);
                return (
                  <div
                    key={`${day.date.toISOString()}-${slot.hour}`}
                    className='flex-1 border-r border-border/50 last:border-r-0 relative group min-w-0'
                    onClick={() => {
                      const dateWithTime = new Date(day.date);
                      dateWithTime.setHours(slot.hour, 0, 0, 0);
                      onAddEvent(dateWithTime);
                    }}
                  >
                    <div className='absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity' />
                    {hourEvents.map((event, idx) => {
                      const pos = getEventPosition(event);
                      const colors = EVENT_COLORS[event.color];
                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.02, zIndex: 10 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(event);
                          }}
                          className={cn(
                            'absolute rounded-sm sm:rounded-md px-0.5 sm:px-2 py-0.5 sm:py-1 cursor-pointer overflow-hidden border-l-2',
                            colors.bg,
                            colors.border
                          )}
                          style={{
                            top: pos.top,
                            height: pos.height,
                            minHeight: '20px',
                            left: `${2 + idx * 4}px`,
                            right: '2px',
                          }}
                        >
                          <div
                            className={cn(
                              'text-[9px] sm:text-xs font-medium truncate',
                              colors.text
                            )}
                          >
                            {event.title}
                          </div>
                          <div className='text-[8px] sm:text-[10px] text-muted-foreground truncate hidden sm:block'>
                            {format(parseISO(event.startDate), 'h:mm a')}
                          </div>
                        </motion.div>
                      );
                    })}
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
