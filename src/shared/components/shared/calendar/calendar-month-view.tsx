'use client';
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '@/shared/lib/utils';
import { CalendarEvent, DayInfo } from '@/shared/types/calendar';
import { generateMonthDays, WEEKDAY_NAMES } from '@/shared/lib/calendar-utils';
import { EventCard } from './event-card';
import { Plus, X, CalendarDays, Edit } from 'lucide-react';

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
  const [showAllEvents, setShowAllEvents] = React.useState(false);
  const maxVisibleEventsDesktop = 2;
  const cellRef = React.useRef<HTMLDivElement>(null);

  const handleViewAllClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAllEvents(true);
  };

  return (
    <>
      <motion.div
        ref={cellRef}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={onSelect}
        className={cn(
          'relative min-h-[60px] sm:min-h-[100px] md:min-h-[120px] p-1 sm:p-2 border-r border-border last:border-r-0 cursor-pointer transition-colors flex flex-col',
          !day.isCurrentMonth && 'bg-secondary/30',
          day.isSelected && 'bg-primary/10',
          'hover:bg-muted/30'
        )}
      >
        <div className='flex items-center justify-between mb-0.5 sm:mb-1 shrink-0'>
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
        <div className='sm:hidden shrink-0'>
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

        {/* Desktop: Show event cards with proper overflow handling */}
        <div className='hidden sm:flex flex-col flex-1 min-h-0 overflow-hidden'>
          <div className='flex-1 overflow-y-auto space-y-0.5 sm:space-y-1'>
            {day.events.slice(0, maxVisibleEventsDesktop).map((event) => (
              <div
                key={event.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAllEvents(true);
                }}
              >
                <EventCard event={event} compact />
              </div>
            ))}
          </div>
          {day.events.length > maxVisibleEventsDesktop && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleViewAllClick}
              className='text-[10px] sm:text-xs text-primary font-medium hover:underline mt-0.5 shrink-0 text-center w-full'
            >
              +{day.events.length - maxVisibleEventsDesktop} more
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* View All Events Modal */}
      <AnimatePresence>
        {showAllEvents && (
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAllEvents(false)}
              className='absolute inset-0 bg-black/60 backdrop-blur-sm'
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className='relative w-full max-w-md bg-card rounded-xl shadow-2xl max-h-[80vh] flex flex-col'
            >
              <div className='flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border shrink-0'>
                <div className='flex items-center gap-2'>
                  <CalendarDays className='w-5 h-5 text-primary' />
                  <h3 className='text-lg font-semibold text-foreground'>
                    {format(day.date, 'EEEE, MMMM d, yyyy')}
                  </h3>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAllEvents(false)}
                  className='p-2 rounded-lg hover:bg-muted transition-colors'
                >
                  <X className='w-5 h-5 text-muted-foreground' />
                </motion.button>
              </div>
              <div className='flex-1 overflow-y-auto p-4 sm:p-6 space-y-3'>
                {day.events.length > 0 ? (
                  day.events.map((event) => (
                    <div key={event.id} className='relative group'>
                      <EventCard
                        event={event}
                        onClick={() => {
                          // Just show the modal, don't open event editor
                        }}
                      />
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAllEvents(false);
                          onEventClick(event);
                        }}
                        className='absolute top-2 right-2 p-1.5 bg-primary/90 text-primary-foreground rounded-lg shadow-lg hover:bg-primary z-10'
                        title='Edit Event'
                      >
                        <Edit className='w-3.5 h-3.5' />
                      </motion.button>
                    </div>
                  ))
                ) : (
                  <div className='text-center py-8'>
                    <CalendarDays className='w-12 h-12 mx-auto text-muted-foreground/30 mb-3' />
                    <p className='text-sm text-muted-foreground'>
                      No events on this day
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
