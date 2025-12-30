'use client';
import * as React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  LayoutGrid,
  List,
  Clock,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/shared/lib/utils';
import { ViewMode, CustomDateRange } from '@/shared/types/calendar';
import { formatDateRange, navigateDate } from '@/shared/lib/calendar-utils';

interface CalendarHeaderProps {
  selectedDate: Date;
  viewMode: ViewMode;
  customDateRange?: CustomDateRange | null;
  onDateChange: (date: Date) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onTodayClick: () => void;
  onMenuClick?: () => void;
  isSidebarOpen?: boolean;
}

const viewModeOptions: {
  value: ViewMode;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: 'month', label: 'Month', icon: <LayoutGrid className='w-4 h-4' /> },
  { value: 'week', label: 'Week', icon: <List className='w-4 h-4' /> },
  { value: 'day', label: 'Day', icon: <Clock className='w-4 h-4' /> },
];

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  selectedDate,
  viewMode,
  customDateRange,
  onDateChange,
  onViewModeChange,
  onTodayClick,
  onMenuClick,
  isSidebarOpen,
}) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isCustomView = viewMode === 'custom';

  const handlePrev = () => {
    if (
      !isCustomView &&
      (viewMode === 'month' || viewMode === 'week' || viewMode === 'day')
    ) {
      onDateChange(navigateDate(selectedDate, viewMode, 'prev'));
    }
  };

  const handleNext = () => {
    if (
      !isCustomView &&
      (viewMode === 'month' || viewMode === 'week' || viewMode === 'day')
    ) {
      onDateChange(navigateDate(selectedDate, viewMode, 'next'));
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const getDisplayDateRange = () => {
    if (isCustomView && customDateRange) {
      const dayCount =
        Math.ceil(
          (customDateRange.endDate.getTime() -
            customDateRange.startDate.getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1;
      return `${format(customDateRange.startDate, 'MMM d')} - ${format(
        customDateRange.endDate,
        'MMM d, yyyy'
      )} (${dayCount} days)`;
    }
    // Only pass standard view modes to formatDateRange
    if (viewMode === 'month' || viewMode === 'week' || viewMode === 'day') {
      return formatDateRange(selectedDate, viewMode);
    }
    return format(selectedDate, 'MMMM yyyy');
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className='flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-border bg-card/50 backdrop-blur-sm gap-2'
    >
      <div className='flex items-center gap-2 sm:gap-4 min-w-0 flex-1'>
        {/* Mobile Menu Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onMenuClick}
          className='p-2 rounded-lg bg-secondary hover:bg-muted transition-colors lg:hidden'
        >
          {isSidebarOpen ? (
            <X className='w-5 h-5' />
          ) : (
            <Menu className='w-5 h-5' />
          )}
        </motion.button>

        <div className='hidden sm:flex items-center gap-2'>
          <CalendarIcon className='w-6 h-6 text-primary' />
          <h1 className='text-xl font-semibold text-foreground hidden md:block'>
            Calendar
          </h1>
        </div>

        <div className='flex items-center gap-1 sm:gap-2 sm:ml-4'>
          <motion.button
            whileHover={!isCustomView ? { scale: 1.05 } : undefined}
            whileTap={!isCustomView ? { scale: 0.95 } : undefined}
            onClick={handlePrev}
            disabled={isCustomView}
            className={cn(
              'p-1.5 sm:p-2 rounded-lg transition-colors',
              isCustomView
                ? 'bg-secondary/50 cursor-not-allowed opacity-50'
                : 'bg-secondary hover:bg-muted'
            )}
          >
            <ChevronLeft className='w-4 h-4 sm:w-5 sm:h-5' />
          </motion.button>

          <motion.button
            whileHover={!isCustomView ? { scale: 1.05 } : undefined}
            whileTap={!isCustomView ? { scale: 0.95 } : undefined}
            onClick={handleNext}
            disabled={isCustomView}
            className={cn(
              'p-1.5 sm:p-2 rounded-lg transition-colors',
              isCustomView
                ? 'bg-secondary/50 cursor-not-allowed opacity-50'
                : 'bg-secondary hover:bg-muted'
            )}
          >
            <ChevronRight className='w-4 h-4 sm:w-5 sm:h-5' />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onTodayClick}
            className='px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors'
          >
            Today
          </motion.button>
        </div>

        <motion.h2
          key={getDisplayDateRange()}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className='text-sm sm:text-lg font-medium text-foreground ml-1 sm:ml-4 truncate'
        >
          {getDisplayDateRange()}
        </motion.h2>
      </div>

      <div className='flex items-center gap-1 sm:gap-3 shrink-0'>
        {/* Theme Toggle */}
        {mounted && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className='p-2 sm:p-2.5 rounded-lg bg-secondary hover:bg-muted transition-colors'
            title={
              theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
            }
          >
            {theme === 'dark' ? (
              <Sun className='w-4 h-4 sm:w-5 sm:h-5 text-yellow-500' />
            ) : (
              <Moon className='w-4 h-4 sm:w-5 sm:h-5 text-slate-700' />
            )}
          </motion.button>
        )}

        {/* View Mode Buttons */}
        <div className='flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-secondary rounded-lg'>
          {viewModeOptions.map((option) => (
            <motion.button
              key={option.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onViewModeChange(option.value)}
              className={cn(
                'flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all',
                viewMode === option.value
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
              title={option.label}
            >
              {option.icon}
              <span className='hidden sm:inline'>{option.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.header>
  );
};
