'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { format, parseISO, isSameDay, getHours, getMinutes } from 'date-fns';
import { cn } from '@/shared/lib/utils';
import { CalendarEvent, EVENT_COLORS } from '@/shared/types/calendar';
import { generateTimeSlots } from '@/shared/lib/calendar-utils';

interface CalendarDayViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onAddEvent: (date: Date) => void;
}

export const CalendarDayView: React.FC<CalendarDayViewProps> = ({
  selectedDate,
  events,
  onEventClick,
  onAddEvent,
}) => {
  const timeSlots = generateTimeSlots();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const today = new Date();
  const isToday = isSameDay(selectedDate, today);

  const dayEvents = events.filter((event) => {
    const eventStart = parseISO(event.startDate);
    return isSameDay(eventStart, selectedDate);
  });

  const allDayEvents = dayEvents.filter((e) => e.isAllDay);
  const timedEvents = dayEvents.filter((e) => !e.isAllDay);

  // Scroll to current time on mount
  React.useEffect(() => {
    if (containerRef.current) {
      const currentHour = new Date().getHours();
      const scrollPosition = currentHour * 64 - 100; // Adjusted for mobile height
      containerRef.current.scrollTop = Math.max(0, scrollPosition);
    }
  }, []);

  const getEventsForHour = (hour: number) => {
    return timedEvents.filter((event) => {
      const eventStart = parseISO(event.startDate);
      const eventHour = getHours(eventStart);
      return eventHour === hour;
    });
  };

  const getEventPosition = (event: CalendarEvent) => {
    const start = parseISO(event.startDate);
    const end = parseISO(event.endDate);
    const startMinutes = getMinutes(start);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60);
    const top = (startMinutes / 60) * 100;
    const height = Math.max((duration / 60) * 100, 30);
    return { top: `${top}%`, height: `${Math.min(height, 300)}%` };
  };

  return (
    <div className='flex flex-col h-full'>
      {/* Day header */}
      <div className='flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-border bg-card'>
        <div className='flex items-center gap-2 sm:gap-4'>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              'flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl text-xl sm:text-2xl font-bold',
              isToday
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-foreground'
            )}
          >
            {format(selectedDate, 'd')}
          </motion.div>
          <div>
            <h2 className='text-base sm:text-xl font-semibold text-foreground'>
              {format(selectedDate, 'EEEE')}
            </h2>
            <p className='text-sm sm:text-base text-muted-foreground'>
              {format(selectedDate, 'MMMM yyyy')}
            </p>
          </div>
        </div>
        <div className='text-xs sm:text-sm text-muted-foreground'>
          {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* All day events */}
      {allDayEvents.length > 0 && (
        <div className='px-3 sm:px-6 py-2 sm:py-3 border-b border-border bg-secondary/30'>
          <div className='text-[10px] sm:text-xs font-medium text-muted-foreground mb-1.5 sm:mb-2'>
            ALL DAY
          </div>
          <div className='flex flex-wrap gap-1.5 sm:gap-2'>
            {allDayEvents.map((event) => {
              const colors = EVENT_COLORS[event.color];
              return (
                <motion.button
                  key={event.id}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onEventClick(event)}
                  className={cn(
                    'px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium border-l-2 sm:border-l-4',
                    colors.bg,
                    colors.border,
                    colors.text
                  )}
                >
                  {event.title}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Time grid */}
      <div ref={containerRef} className='flex-1 overflow-y-auto'>
        <div className='relative'>
          {/* Current time indicator */}
          {isToday && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              className='absolute left-0 right-0 z-10 pointer-events-none'
              style={{
                top: `${
                  today.getHours() * 64 + (today.getMinutes() / 60) * 64
                }px`,
              }}
            >
              <div className='flex items-center'>
                <div className='w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500' />
                <div className='flex-1 h-0.5 bg-red-500' />
              </div>
            </motion.div>
          )}

          {timeSlots.map((slot, index) => {
            const hourEvents = getEventsForHour(slot.hour);
            return (
              <motion.div
                key={slot.hour}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className='flex border-b border-border/30 h-[64px] sm:h-[80px] group'
              >
                <div className='w-14 sm:w-20 shrink-0 px-1.5 sm:px-3 py-1 sm:py-2 text-right text-[10px] sm:text-xs text-muted-foreground border-r border-border'>
                  {slot.label}
                </div>
                <div
                  className='flex-1 relative cursor-pointer'
                  onClick={() => {
                    const dateWithTime = new Date(selectedDate);
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
                        initial={{ opacity: 0, scale: 0.95, x: -10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        whileHover={{ scale: 1.01 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                        className={cn(
                          'absolute rounded-md sm:rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 cursor-pointer overflow-hidden border-l-2 sm:border-l-4 shadow-lg',
                          colors.bg,
                          colors.border
                        )}
                        style={{
                          top: pos.top,
                          height: pos.height,
                          minHeight: '32px',
                          left: `${4 + idx * 16}px`,
                          right: '4px',
                        }}
                      >
                        <div
                          className={cn('text-xs sm:text-sm font-semibold truncate', colors.text)}
                        >
                          {event.title}
                        </div>
                        <div className='text-[10px] sm:text-xs text-muted-foreground hidden sm:block'>
                          {format(parseISO(event.startDate), 'h:mm a')} -{' '}
                          {format(parseISO(event.endDate), 'h:mm a')}
                        </div>
                        <div className='text-[10px] text-muted-foreground sm:hidden'>
                          {format(parseISO(event.startDate), 'h:mm')}
                        </div>
                        {event.location && (
                          <div className='text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate hidden sm:block'>
                            📍 {event.location}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
