'use client';import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarHeader } from './calendar-header';
import { CalendarMonthView } from './calendar-month-view';
import { CalendarWeekView } from './calendar-week-view';
import { CalendarDayView } from './calendar-day-view';
import { CalendarCustomView } from './calendar-custom-view';
import { CalendarSidebar } from './calendar-sidebar';
import { EventModal } from './event-modal';
import { JsonImportModal } from './json-import-modal';
import { useCalendarStore } from '@/shared/store/calendar';
import {
  CalendarEvent,
  ScheduleImport,
  CustomDateRange,
} from '@/shared/types/calendar';

interface CalendarProps {
  className?: string;
}

export const Calendar: React.FC<CalendarProps> = ({ className }) => {
  const {
    events,
    selectedDate,
    viewMode,
    customDateRange,
    isEventModalOpen,
    editingEvent,
    setSelectedDate,
    setViewMode,
    setCustomDateRange,
    addEvent,
    updateEvent,
    deleteEvent,
    openEventModal,
    closeEventModal,
    importEvents,
    exportEvents,
    clearAllEvents,
  } = useCalendarStore();

  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [defaultEventDate, setDefaultEventDate] = React.useState<
    Date | undefined
  >(undefined);

  // Close sidebar when clicking outside on mobile
  const handleCloseSidebar = React.useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);

    // If in custom view, exit to day view and clear custom range
    if (viewMode === 'custom') {
      setCustomDateRange(null);
      setViewMode('day');
    }
    // Close sidebar on mobile when a date is selected
    setIsSidebarOpen(false);
  };

  const handleAddEvent = (date?: Date) => {
    setDefaultEventDate(date || selectedDate || new Date());
    openEventModal();
    setIsSidebarOpen(false);
  };

  const handleEventClick = (event: CalendarEvent) => {
    openEventModal(event);
    setIsSidebarOpen(false);
  };

  const handleSaveEvent = (event: CalendarEvent) => {
    if (editingEvent) {
      updateEvent(event.id, event);
    } else {
      addEvent(event);
    }
  };

  const handleDeleteEvent = (id: string) => {
    deleteEvent(id);
  };

  const handleImport = (data: ScheduleImport) => {
    importEvents(data);
    setIsImportModalOpen(false);
  };

  const handleExport = () => {
    const data = exportEvents();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calendar-schedule-${
      new Date().toISOString().split('T')[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        'Are you sure you want to delete all events? This action cannot be undone.'
      )
    ) {
      clearAllEvents();
    }
  };

  const handleTodayClick = () => {
    const today = new Date();
    setSelectedDate(today);
    // Clear custom range when going to today
    setCustomDateRange(null);
    if (viewMode === 'custom') {
      setViewMode('month');
    }
  };

  const handleCustomRangeSelect = (range: CustomDateRange) => {
    setCustomDateRange(range);
    setViewMode('custom');
    setSelectedDate(range.startDate);
    setIsSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div
      className={`h-screen flex flex-col bg-background overflow-hidden ${
        className || ''
      }`}
    >
      {/* Header */}
      <CalendarHeader
        selectedDate={selectedDate}
        viewMode={viewMode}
        customDateRange={customDateRange}
        onDateChange={setSelectedDate}
        onViewModeChange={setViewMode}
        onTodayClick={handleTodayClick}
        onMenuClick={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Main Content */}
      <div className='flex-1 flex overflow-hidden relative'>
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseSidebar}
              className='fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden'
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <CalendarSidebar
          selectedDate={selectedDate}
          events={events}
          customDateRange={customDateRange}
          onDateSelect={handleDateSelect}
          onMonthChange={setSelectedDate}
          onCustomRangeSelect={handleCustomRangeSelect}
          onAddEvent={() => handleAddEvent()}
          onEventClick={handleEventClick}
          onImport={() => setIsImportModalOpen(true)}
          onExport={handleExport}
          onClearAll={handleClearAll}
          isOpen={isSidebarOpen}
          onClose={handleCloseSidebar}
        />

        {/* Calendar Views */}
        <main className='flex-1 overflow-hidden bg-background'>
          <AnimatePresence mode='wait'>
            {viewMode === 'month' && (
              <motion.div
                key='month'
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className='h-full'
              >
                <CalendarMonthView
                  selectedDate={selectedDate}
                  events={events}
                  onDateSelect={handleDateSelect}
                  onEventClick={handleEventClick}
                  onAddEvent={handleAddEvent}
                />
              </motion.div>
            )}

            {viewMode === 'week' && (
              <motion.div
                key='week'
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className='h-full'
              >
                <CalendarWeekView
                  selectedDate={selectedDate}
                  events={events}
                  onDateSelect={handleDateSelect}
                  onEventClick={handleEventClick}
                  onAddEvent={handleAddEvent}
                />
              </motion.div>
            )}

            {viewMode === 'day' && (
              <motion.div
                key='day'
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className='h-full'
              >
                <CalendarDayView
                  selectedDate={selectedDate}
                  events={events}
                  onEventClick={handleEventClick}
                  onAddEvent={handleAddEvent}
                />
              </motion.div>
            )}

            {viewMode === 'custom' && customDateRange && (
              <motion.div
                key='custom'
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className='h-full'
              >
                <CalendarCustomView
                  dateRange={customDateRange}
                  events={events}
                  onEventClick={handleEventClick}
                  onAddEvent={handleAddEvent}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Event Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        editingEvent={editingEvent}
        defaultDate={defaultEventDate}
        onClose={closeEventModal}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />

      {/* Import Modal */}
      <JsonImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
      />
    </div>
  );
};
