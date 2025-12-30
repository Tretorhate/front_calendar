'use client';import * as React from 'react';
import { motion } from 'framer-motion';
import {
  format,
  addMonths,
  subMonths,
  addDays,
  differenceInDays,
  isBefore,
  isAfter,
  isSameDay,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { CalendarEvent, CustomDateRange } from '@/shared/types/calendar';
import { generateMonthDays, WEEKDAY_NAMES } from '@/shared/lib/calendar-utils';

interface MiniCalendarProps {
  selectedDate: Date;
  events: CalendarEvent[];
  customDateRange?: CustomDateRange | null;
  onDateSelect: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
  onCustomRangeSelect?: (range: CustomDateRange) => void;
}

export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  selectedDate,
  events,
  customDateRange,
  onDateSelect,
  onMonthChange,
  onCustomRangeSelect,
}) => {
  const [viewDate, setViewDate] = React.useState(selectedDate);
  const [isDragging, setIsDragging] = React.useState(false);
  const [hasDragged, setHasDragged] = React.useState(false);
  const [dragStartDate, setDragStartDate] = React.useState<Date | null>(null);
  const [dragEndDate, setDragEndDate] = React.useState<Date | null>(null);

  // For double-click detection
  const lastClickTimeRef = React.useRef<number>(0);
  const lastClickDateRef = React.useRef<Date | null>(null);
  const DOUBLE_CLICK_DELAY = 300; // ms

  // Store the current range length (number of days - 1, so 0 means 1 day)
  const [rangeDays, setRangeDays] = React.useState<number>(0);

  const days = generateMonthDays(viewDate, events, selectedDate);

  React.useEffect(() => {
    setViewDate(selectedDate);
  }, [selectedDate]);

  // Sync rangeDays with customDateRange
  React.useEffect(() => {
    if (customDateRange) {
      const days = differenceInDays(
        customDateRange.endDate,
        customDateRange.startDate
      );
      setRangeDays(days);
    }
  }, [customDateRange]);

  // Get the current selection range (either from dragging or from customDateRange)
  const getSelectionRange = (): { start: Date; end: Date } | null => {
    if (isDragging && dragStartDate && dragEndDate) {
      const start = isBefore(dragStartDate, dragEndDate)
        ? dragStartDate
        : dragEndDate;
      const end = isAfter(dragStartDate, dragEndDate)
        ? dragStartDate
        : dragEndDate;
      return { start, end };
    }
    if (customDateRange) {
      return {
        start: customDateRange.startDate,
        end: customDateRange.endDate,
      };
    }
    return null;
  };

  const isDateInRange = (date: Date): boolean => {
    const range = getSelectionRange();
    if (!range) return false;
    return (
      (isAfter(date, range.start) || isSameDay(date, range.start)) &&
      (isBefore(date, range.end) || isSameDay(date, range.end))
    );
  };

  const isRangeStart = (date: Date): boolean => {
    const range = getSelectionRange();
    if (!range) return false;
    return isSameDay(date, range.start);
  };

  const isRangeEnd = (date: Date): boolean => {
    const range = getSelectionRange();
    if (!range) return false;
    return isSameDay(date, range.end);
  };

  const handleMouseDown = (date: Date, e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setHasDragged(false);
    setDragStartDate(date);
    setDragEndDate(date);
  };

  const handleMouseEnter = (date: Date) => {
    if (isDragging && dragStartDate) {
      // Check if we've actually moved to a different date
      if (!isSameDay(date, dragStartDate)) {
        setHasDragged(true);
      }
      setDragEndDate(date);
    }
  };

  const handleMouseUp = React.useCallback(() => {
    if (isDragging && dragStartDate && dragEndDate) {
      const start = isBefore(dragStartDate, dragEndDate)
        ? dragStartDate
        : dragEndDate;
      const end = isAfter(dragStartDate, dragEndDate)
        ? dragStartDate
        : dragEndDate;

      const now = Date.now();
      const isDoubleClick =
        lastClickDateRef.current &&
        isSameDay(start, lastClickDateRef.current) &&
        now - lastClickTimeRef.current < DOUBLE_CLICK_DELAY;

      if (hasDragged) {
        // User dragged to select multiple days - set the range
        const newRangeDays = differenceInDays(end, start);
        setRangeDays(newRangeDays);
        onCustomRangeSelect?.({ startDate: start, endDate: end });
        lastClickTimeRef.current = 0;
        lastClickDateRef.current = null;
      } else if (isDoubleClick) {
        // Double click - set range to just 1 day (exit custom view)
        setRangeDays(0);
        onDateSelect(start);
        lastClickTimeRef.current = 0;
        lastClickDateRef.current = null;
      } else {
        // Single click - move range to start from this date
        if (rangeDays > 0 || customDateRange) {
          // There's an existing multi-day range, shift it
          const currentRangeDays = customDateRange
            ? differenceInDays(
                customDateRange.endDate,
                customDateRange.startDate
              )
            : rangeDays;
          const newEndDate = addDays(start, currentRangeDays);
          onCustomRangeSelect?.({ startDate: start, endDate: newEndDate });
        } else {
          // No range, just select the day
          onDateSelect(start);
        }
        lastClickTimeRef.current = now;
        lastClickDateRef.current = start;
      }
    }
    setIsDragging(false);
    setHasDragged(false);
    setDragStartDate(null);
    setDragEndDate(null);
  }, [
    isDragging,
    hasDragged,
    dragStartDate,
    dragEndDate,
    rangeDays,
    customDateRange,
    onDateSelect,
    onCustomRangeSelect,
  ]);

  // Handle touch events for mobile
  const handleTouchStart = (date: Date, e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setHasDragged(false);
    setDragStartDate(date);
    setDragEndDate(date);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dateAttr = element?.getAttribute('data-date');

    if (dateAttr) {
      const date = new Date(dateAttr);
      if (dragStartDate && !isSameDay(date, dragStartDate)) {
        setHasDragged(true);
      }
      setDragEndDate(date);
    }
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  // Global mouse up listener to handle release outside calendar
  React.useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [isDragging, handleMouseUp]);

  const handleDateClick = (date: Date, isCurrentMonth: boolean) => {
    // If the date is from a different month, navigate to that month
    if (!isCurrentMonth) {
      const newViewDate = new Date(date.getFullYear(), date.getMonth(), 1);
      setViewDate(newViewDate);
      onMonthChange?.(newViewDate);
    }
  };

  return (
    <div className='p-4 select-none'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-sm font-semibold text-foreground'>
          {format(viewDate, 'MMMM yyyy')}
        </h3>
        <div className='flex items-center gap-1'>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              const newDate = subMonths(viewDate, 1);
              setViewDate(newDate);
              onMonthChange?.(newDate);
            }}
            className='p-1 rounded hover:bg-muted transition-colors'
          >
            <ChevronLeft className='w-4 h-4 text-muted-foreground' />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              const newDate = addMonths(viewDate, 1);
              setViewDate(newDate);
              onMonthChange?.(newDate);
            }}
            className='p-1 rounded hover:bg-muted transition-colors'
          >
            <ChevronRight className='w-4 h-4 text-muted-foreground' />
          </motion.button>
        </div>
      </div>

      {/* Hint text */}
      <p className='text-[9px] text-muted-foreground/70 text-center mb-2'>
        Drag to set range • Click to move • Double-click for 1 day
      </p>

      <div className='grid grid-cols-7 gap-1 mb-2'>
        {WEEKDAY_NAMES.map((day) => (
          <div
            key={day}
            className='text-[10px] font-medium text-muted-foreground text-center'
          >
            {day.charAt(0)}
          </div>
        ))}
      </div>

      <div
        className='grid grid-cols-7 gap-0.5'
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {days.map((day) => {
          const hasEvents = day.events.length > 0;
          const inRange = isDateInRange(day.date);
          const isStart = isRangeStart(day.date);
          const isEnd = isRangeEnd(day.date);

          return (
            <div
              key={day.date.toISOString()}
              data-date={day.date.toISOString()}
              onMouseDown={(e) => handleMouseDown(day.date, e)}
              onMouseEnter={() => handleMouseEnter(day.date)}
              onMouseUp={() => handleDateClick(day.date, day.isCurrentMonth)}
              onTouchStart={(e) => handleTouchStart(day.date, e)}
              className={cn(
                'relative w-7 h-7 text-xs flex items-center justify-center transition-colors cursor-pointer',
                // Range styling
                inRange && !isStart && !isEnd && 'bg-primary/20',
                isStart && isEnd && 'rounded-full bg-primary/30',
                isStart && !isEnd && 'rounded-l-full bg-primary/30',
                isEnd && !isStart && 'rounded-r-full bg-primary/30',
                // Normal day styling
                !inRange && !day.isCurrentMonth && 'text-muted-foreground/50',
                !inRange && day.isCurrentMonth && 'text-foreground',
                !inRange &&
                  day.isToday &&
                  'rounded-full bg-primary text-primary-foreground font-bold',
                !inRange &&
                  day.isSelected &&
                  !day.isToday &&
                  'rounded-full bg-accent text-accent-foreground',
                !inRange &&
                  !day.isToday &&
                  !day.isSelected &&
                  'hover:bg-muted rounded-full'
              )}
            >
              <span
                className={cn(
                  'relative z-10',
                  inRange && 'font-medium',
                  inRange && (isStart || isEnd) && 'text-primary-foreground'
                )}
              >
                {format(day.date, 'd')}
              </span>
              {hasEvents && !day.isToday && !inRange && (
                <span className='absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary' />
              )}
            </div>
          );
        })}
      </div>

      {/* Show selected range info - only show when there's an actual range or actively dragging multiple days */}
      {(customDateRange ||
        (isDragging && hasDragged && dragStartDate && dragEndDate)) && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className='mt-3 text-center'
        >
          <p className='text-xs text-primary font-medium'>
            {(() => {
              const range = getSelectionRange();
              if (!range) return null;
              const dayCount =
                Math.ceil(
                  (range.end.getTime() - range.start.getTime()) /
                    (1000 * 60 * 60 * 24)
                ) + 1;
              return `${format(range.start, 'MMM d')} - ${format(
                range.end,
                'MMM d'
              )} (${dayCount} day${dayCount > 1 ? 's' : ''})`;
            })()}
          </p>
        </motion.div>
      )}
    </div>
  );
};
