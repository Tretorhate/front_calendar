import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  CalendarEvent,
  ViewMode,
  ScheduleImport,
  CustomDateRange,
} from '@/shared/types/calendar';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  parseISO,
  format,
} from 'date-fns';

interface CalendarState {
  events: CalendarEvent[];
  selectedDate: Date;
  viewMode: ViewMode;
  customDateRange: CustomDateRange | null;
  isEventModalOpen: boolean;
  editingEvent: CalendarEvent | null;

  // Actions
  setSelectedDate: (date: Date) => void;
  setViewMode: (mode: ViewMode) => void;
  setCustomDateRange: (range: CustomDateRange | null) => void;

  // Event CRUD
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;

  // Modal
  openEventModal: (event?: CalendarEvent) => void;
  closeEventModal: () => void;

  // Import/Export
  importEvents: (data: ScheduleImport) => void;
  exportEvents: () => ScheduleImport;
  clearAllEvents: () => void;

  // Getters
  getEventsForDate: (date: Date) => CalendarEvent[];
  getEventsForMonth: (date: Date) => CalendarEvent[];
  getEventsForWeek: (date: Date) => CalendarEvent[];
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      events: [],
      selectedDate: new Date(),
      viewMode: 'month',
      customDateRange: null,
      isEventModalOpen: false,
      editingEvent: null,

      setSelectedDate: (date) => set({ selectedDate: date }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setCustomDateRange: (range) => set({ customDateRange: range }),

      addEvent: (event) =>
        set((state) => ({
          events: [...state.events, event],
        })),

      updateEvent: (id, updatedEvent) =>
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id ? { ...event, ...updatedEvent } : event
          ),
        })),

      deleteEvent: (id) =>
        set((state) => ({
          events: state.events.filter((event) => event.id !== id),
        })),

      openEventModal: (event) =>
        set({
          isEventModalOpen: true,
          editingEvent: event || null,
        }),

      closeEventModal: () =>
        set({
          isEventModalOpen: false,
          editingEvent: null,
        }),

      importEvents: (data) => {
        const existingIds = new Set(get().events.map((e) => e.id));
        const newEvents = data.events.filter((e) => !existingIds.has(e.id));
        set((state) => ({
          events: [...state.events, ...newEvents],
        }));
      },

      exportEvents: () => ({
        events: get().events,
        metadata: {
          source: 'School Scheduling Calendar',
          importedAt: new Date().toISOString(),
          version: '1.0.0',
        },
      }),

      clearAllEvents: () => set({ events: [] }),

      getEventsForDate: (date) => {
        const events = get().events;
        const dateStr = format(date, 'yyyy-MM-dd');

        return events.filter((event) => {
          const eventStart = format(parseISO(event.startDate), 'yyyy-MM-dd');
          const eventEnd = format(parseISO(event.endDate), 'yyyy-MM-dd');
          return dateStr >= eventStart && dateStr <= eventEnd;
        });
      },

      getEventsForMonth: (date) => {
        const events = get().events;
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);

        return events.filter((event) => {
          const eventStart = parseISO(event.startDate);
          const eventEnd = parseISO(event.endDate);
          return (
            isWithinInterval(eventStart, {
              start: monthStart,
              end: monthEnd,
            }) ||
            isWithinInterval(eventEnd, { start: monthStart, end: monthEnd }) ||
            (eventStart <= monthStart && eventEnd >= monthEnd)
          );
        });
      },

      getEventsForWeek: (date) => {
        const events = get().events;
        const weekStart = startOfWeek(date, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(date, { weekStartsOn: 0 });

        return events.filter((event) => {
          const eventStart = parseISO(event.startDate);
          const eventEnd = parseISO(event.endDate);
          return (
            isWithinInterval(eventStart, { start: weekStart, end: weekEnd }) ||
            isWithinInterval(eventEnd, { start: weekStart, end: weekEnd }) ||
            (eventStart <= weekStart && eventEnd >= weekEnd)
          );
        });
      },
    }),
    {
      name: 'calendar-storage',
      partialize: (state) => ({ events: state.events }),
    }
  )
);
