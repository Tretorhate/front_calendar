'use client';import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format,
  parseISO,
  isToday,
  isTomorrow,
  isThisWeek,
  compareAsc,
} from 'date-fns';
import {
  Plus,
  Upload,
  Download,
  Trash2,
  CalendarDays,
  Clock,
  X,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { CalendarEvent, CustomDateRange } from '@/shared/types/calendar';
import { MiniCalendar } from './mini-calendar';
import { EventCard } from './event-card';

interface CalendarSidebarProps {
  selectedDate: Date;
  events: CalendarEvent[];
  customDateRange?: CustomDateRange | null;
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  onCustomRangeSelect?: (range: CustomDateRange) => void;
  onAddEvent: () => void;
  onEventClick: (event: CalendarEvent) => void;
  onImport: () => void;
  onExport: () => void;
  onClearAll: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  selectedDate,
  events,
  customDateRange,
  onDateSelect,
  onMonthChange,
  onCustomRangeSelect,
  onAddEvent,
  onEventClick,
  onImport,
  onExport,
  onClearAll,
  isOpen = false,
  onClose,
}) => {
  const upcomingEvents = React.useMemo(() => {
    const now = new Date();
    return events
      .filter((event) => parseISO(event.endDate) >= now)
      .sort((a, b) => compareAsc(parseISO(a.startDate), parseISO(b.startDate)))
      .slice(0, 5);
  }, [events]);

  const getEventTimeLabel = (event: CalendarEvent) => {
    const startDate = parseISO(event.startDate);
    if (isToday(startDate)) return 'Today';
    if (isTomorrow(startDate)) return 'Tomorrow';
    if (isThisWeek(startDate)) return format(startDate, 'EEEE');
    return format(startDate, 'MMM d');
  };

  return (
    <>
      {/* Desktop Sidebar - Always visible on lg+ */}
      <motion.aside
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className='hidden lg:flex w-80 border-r border-border bg-card/50 backdrop-blur-sm flex-col h-full'
      >
        <SidebarContent
          selectedDate={selectedDate}
          events={events}
          customDateRange={customDateRange}
          upcomingEvents={upcomingEvents}
          getEventTimeLabel={getEventTimeLabel}
          onDateSelect={onDateSelect}
          onMonthChange={onMonthChange}
          onCustomRangeSelect={onCustomRangeSelect}
          onAddEvent={onAddEvent}
          onEventClick={onEventClick}
          onImport={onImport}
          onExport={onExport}
          onClearAll={onClearAll}
        />
      </motion.aside>

      {/* Mobile Sidebar - Slide-out drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[320px]',
              'bg-card border-r border-border flex flex-col h-full',
              'lg:hidden shadow-2xl'
            )}
          >
            {/* Mobile Close Button */}
            <div className='flex items-center justify-between px-4 py-3 border-b border-border'>
              <div className='flex items-center gap-2'>
                <CalendarDays className='w-5 h-5 text-primary' />
                <span className='font-semibold text-foreground'>Menu</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className='p-2 rounded-lg hover:bg-muted transition-colors'
              >
                <X className='w-5 h-5 text-muted-foreground' />
              </motion.button>
            </div>

            <SidebarContent
              selectedDate={selectedDate}
              events={events}
              customDateRange={customDateRange}
              upcomingEvents={upcomingEvents}
              getEventTimeLabel={getEventTimeLabel}
              onDateSelect={onDateSelect}
              onMonthChange={onMonthChange}
              onCustomRangeSelect={onCustomRangeSelect}
              onAddEvent={onAddEvent}
              onEventClick={onEventClick}
              onImport={onImport}
              onExport={onExport}
              onClearAll={onClearAll}
            />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

interface SidebarContentProps {
  selectedDate: Date;
  events: CalendarEvent[];
  customDateRange?: CustomDateRange | null;
  upcomingEvents: CalendarEvent[];
  getEventTimeLabel: (event: CalendarEvent) => string;
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  onCustomRangeSelect?: (range: CustomDateRange) => void;
  onAddEvent: () => void;
  onEventClick: (event: CalendarEvent) => void;
  onImport: () => void;
  onExport: () => void;
  onClearAll: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  selectedDate,
  events,
  customDateRange,
  upcomingEvents,
  getEventTimeLabel,
  onDateSelect,
  onMonthChange,
  onCustomRangeSelect,
  onAddEvent,
  onEventClick,
  onImport,
  onExport,
  onClearAll,
}) => {
  return (
    <>
      {/* Add Event Button */}
      <div className='p-4'>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAddEvent}
          className='w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-shadow'
        >
          <Plus className='w-5 h-5' />
          Add Event
        </motion.button>
      </div>

      {/* Mini Calendar */}
      <div className='border-b border-border'>
        <MiniCalendar
          selectedDate={selectedDate}
          events={events}
          customDateRange={customDateRange}
          onDateSelect={onDateSelect}
          onMonthChange={onMonthChange}
          onCustomRangeSelect={onCustomRangeSelect}
        />
      </div>

      {/* Upcoming Events */}
      <div className='flex-1 overflow-y-auto p-4'>
        <div className='flex items-center gap-2 mb-4'>
          <CalendarDays className='w-4 h-4 text-primary' />
          <h3 className='text-sm font-semibold text-foreground'>
            Upcoming Events
          </h3>
        </div>

        <AnimatePresence mode='popLayout'>
          {upcomingEvents.length > 0 ? (
            <div className='space-y-3'>
              {upcomingEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className='text-[10px] text-muted-foreground font-medium mb-1 flex items-center gap-1'>
                    <Clock className='w-3 h-3' />
                    {getEventTimeLabel(event)}
                  </div>
                  <EventCard
                    event={event}
                    onClick={() => onEventClick(event)}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='text-center py-8'
            >
              <CalendarDays className='w-12 h-12 mx-auto text-muted-foreground/30 mb-3' />
              <p className='text-sm text-muted-foreground'>
                No upcoming events
              </p>
              <p className='text-xs text-muted-foreground/70 mt-1'>
                Click &quot;Add Event&quot; to create one
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Import/Export Actions */}
      <div className='p-4 border-t border-border space-y-2'>
        <div className='flex gap-2'>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onImport}
            className='flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors'
          >
            <Upload className='w-4 h-4' />
            Import
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onExport}
            className='flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors'
          >
            <Download className='w-4 h-4' />
            Export
          </motion.button>
        </div>
        {events.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClearAll}
            className='w-full flex items-center justify-center gap-2 px-3 py-2 bg-destructive/10 text-destructive rounded-lg text-sm font-medium hover:bg-destructive/20 transition-colors'
          >
            <Trash2 className='w-4 h-4' />
            Clear All Events
          </motion.button>
        )}
      </div>
    </>
  );
};
