'use client';
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '@/shared/lib/utils';
import { CalendarEvent, DayInfo } from '@/shared/types/calendar';
import { generateMonthDays, WEEKDAY_NAMES } from '@/shared/lib/calendar-utils';
import { EventCard } from './event-card';
import { Plus } from 'lucide-react';

// Abbreviated weekday names for mobile
const WEEKDAY_NAMES_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface CalendarMonthViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onAddEvent: (date: Date) => void;
}

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  selectedDate,
  events,
  onDateSelect,
  onEventClick,
  onAddEvent,
}) => {
  const days = generateMonthDays(selectedDate, events, selectedDate);
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className='flex flex-col h-full'>
      {/* Weekday Headers */}
      <div className='grid grid-cols-7 border-b border-border'>
        {WEEKDAY_NAMES.map((day, index) => (
          <div
            key={day}
            className='py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-muted-foreground'
          >
            {/* Show abbreviated on mobile, full on larger screens */}
            <span className='sm:hidden'>{WEEKDAY_NAMES_SHORT[index]}</span>
            <span className='hidden sm:inline'>{day}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className='flex-1 grid grid-rows-6 overflow-hidden'>
        {weeks.map((week, weekIndex) => (
          <motion.div
            key={`week-${weekIndex}-${format(selectedDate, 'yyyy-MM')}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: weekIndex * 0.05 }}
            className='grid grid-cols-7 border-b border-border last:border-b-0 min-h-0'
          >
            {week.map((day) => (
              <DayCell
                key={day.date.toISOString()}
                day={day}
                onSelect={() => onDateSelect(day.date)}
                onEventClick={onEventClick}
                onAddEvent={() => onAddEvent(day.date)}
              />
            ))}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

interface DayCellProps {
  day: DayInfo;
  onSelect: () => void;
  onEventClick: (event: CalendarEvent) => void;
  onAddEvent: () => void;
}

const DayCell: React.FC<DayCellProps> = ({
  day,
  onSelect,
  onEventClick,
  onAddEvent,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const maxVisibleEventsDesktop = 3;

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onSelect}
      className={cn(
        'relative min-h-[60px] sm:min-h-[100px] md:min-h-[120px] p-1 sm:p-2 border-r border-border last:border-r-0 cursor-pointer transition-colors overflow-hidden',
        !day.isCurrentMonth && 'bg-secondary/30',
        day.isSelected && 'bg-primary/10',
        'hover:bg-muted/30'
      )}
    >
      <div className='flex items-center justify-between mb-0.5 sm:mb-1'>
        <span
          className={cn(
            'flex items-center justify-center w-5 h-5 sm:w-7 sm:h-7 text-xs sm:text-sm font-medium rounded-full transition-colors',
            day.isToday && 'bg-primary text-primary-foreground',
            !day.isToday &&
              day.isSelected &&
              'bg-accent text-accent-foreground',
            !day.isCurrentMonth && 'text-muted-foreground'
          )}
        >
          {format(day.date, 'd')}
        </span>

        <AnimatePresence>
          {isHovered && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={(e) => {
                e.stopPropagation();
                onAddEvent();
              }}
              className='p-0.5 sm:p-1 rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors hidden sm:block'
            >
              <Plus className='w-3 h-3' />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile: Show dot indicators for events */}
      <div className='sm:hidden'>
        {day.events.length > 0 && (
          <div className='flex gap-0.5 flex-wrap mt-0.5'>
            {day.events.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  event.color === 'blue' && 'bg-blue-500',
                  event.color === 'green' && 'bg-green-500',
                  event.color === 'purple' && 'bg-purple-500',
                  event.color === 'orange' && 'bg-orange-500',
                  event.color === 'red' && 'bg-red-500',
                  event.color === 'teal' && 'bg-teal-500',
                  event.color === 'pink' && 'bg-pink-500',
                  event.color === 'yellow' && 'bg-yellow-500'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick(event);
                }}
              />
            ))}
            {day.events.length > 3 && (
              <span className='text-[8px] text-muted-foreground'>
                +{day.events.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Desktop: Show event cards */}
      <div className='hidden sm:block space-y-0.5 sm:space-y-1 overflow-hidden'>
        {day.events.slice(0, maxVisibleEventsDesktop).map((event) => (
          <EventCard
            key={event.id}
            event={event}
            compact
            onClick={() => onEventClick(event)}
          />
        ))}
        {day.events.length > maxVisibleEventsDesktop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='text-[10px] sm:text-xs text-muted-foreground font-medium pl-1 sm:pl-2'
          >
            +{day.events.length - maxVisibleEventsDesktop} more
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
