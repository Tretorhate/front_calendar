'use client';
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, getDay } from 'date-fns';
import {
  X,
  Trash2,
  MapPin,
  AlignLeft,
  Tag,
  Palette,
  Clock,
  Repeat,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
  CalendarEvent,
  EventColor,
  RecurrenceRule,
  RecurrenceFrequency,
} from '@/shared/types/calendar';
import { generateEventId } from '@/shared/lib/calendar-utils';

interface EventModalProps {
  isOpen: boolean;
  editingEvent: CalendarEvent | null;
  defaultDate?: Date;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete?: (id: string) => void;
}

const colorOptions: EventColor[] = [
  'blue',
  'green',
  'purple',
  'orange',
  'red',
  'teal',
  'pink',
  'yellow',
];

const colorMap: Record<EventColor, string> = {
  blue: '#3b82f6',
  green: '#22c55e',
  purple: '#a855f7',
  orange: '#f97316',
  red: '#ef4444',
  teal: '#14b8a6',
  pink: '#ec4899',
  yellow: '#eab308',
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getRecurrenceLabel = (
  frequency: RecurrenceFrequency,
  startDate: string
): string => {
  if (!startDate) return 'Does not repeat';

  const date = new Date(startDate);
  const dayName = WEEKDAYS[getDay(date)];
  const dayOfMonth = date.getDate();

  switch (frequency) {
    case 'none':
      return 'Does not repeat';
    case 'daily':
      return 'Daily';
    case 'weekly':
      return `Weekly on ${dayName}`;
    case 'monthly':
      return `Monthly on day ${dayOfMonth}`;
    case 'yearly':
      return `Annually on ${format(date, 'MMM d')}`;
    case 'weekdays':
      return 'Every weekday (Mon-Fri)';
    case 'custom':
      return 'Custom...';
    default:
      return 'Does not repeat';
  }
};

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  editingEvent,
  defaultDate,
  onClose,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [color, setColor] = React.useState<EventColor>('blue');
  const [startDate, setStartDate] = React.useState('');
  const [startTime, setStartTime] = React.useState('09:00');
  const [endDate, setEndDate] = React.useState('');
  const [endTime, setEndTime] = React.useState('10:00');
  const [isAllDay, setIsAllDay] = React.useState(false);

  // Recurrence state
  const [recurrenceFrequency, setRecurrenceFrequency] =
    React.useState<RecurrenceFrequency>('none');
  const [recurrenceInterval, setRecurrenceInterval] = React.useState(1);
  const [recurrenceEndType, setRecurrenceEndType] = React.useState<
    'never' | 'on' | 'after'
  >('never');
  const [recurrenceEndDate, setRecurrenceEndDate] = React.useState('');
  const [recurrenceOccurrences, setRecurrenceOccurrences] = React.useState(10);
  const [customDaysOfWeek, setCustomDaysOfWeek] = React.useState<number[]>([]);
  const [showRecurrenceDropdown, setShowRecurrenceDropdown] =
    React.useState(false);
  const [showCustomRecurrence, setShowCustomRecurrence] = React.useState(false);

  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowRecurrenceDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setDescription(editingEvent.description || '');
      setLocation(editingEvent.location || '');
      setCategory(editingEvent.category || '');
      setColor(editingEvent.color);
      setIsAllDay(editingEvent.isAllDay || false);

      const start = parseISO(editingEvent.startDate);
      const end = parseISO(editingEvent.endDate);
      setStartDate(format(start, 'yyyy-MM-dd'));
      setStartTime(format(start, 'HH:mm'));
      setEndDate(format(end, 'yyyy-MM-dd'));
      setEndTime(format(end, 'HH:mm'));

      if (editingEvent.recurrence) {
        setRecurrenceFrequency(editingEvent.recurrence.frequency);
        setRecurrenceInterval(editingEvent.recurrence.interval || 1);
        setRecurrenceEndType(editingEvent.recurrence.endType || 'never');
        setRecurrenceEndDate(editingEvent.recurrence.endDate || '');
        setRecurrenceOccurrences(editingEvent.recurrence.occurrences || 10);
        setCustomDaysOfWeek(editingEvent.recurrence.daysOfWeek || []);
      } else {
        resetRecurrence();
      }
    } else if (defaultDate) {
      const dateStr = format(defaultDate, 'yyyy-MM-dd');
      setStartDate(dateStr);
      setEndDate(dateStr);
      setStartTime(format(defaultDate, 'HH:mm'));
      const endDateTime = new Date(defaultDate);
      endDateTime.setHours(defaultDate.getHours() + 1);
      setEndTime(format(endDateTime, 'HH:mm'));
      resetRecurrence();
    } else {
      // Reset form
      const today = new Date();
      setTitle('');
      setDescription('');
      setLocation('');
      setCategory('');
      setColor('blue');
      setStartDate(format(today, 'yyyy-MM-dd'));
      setStartTime('09:00');
      setEndDate(format(today, 'yyyy-MM-dd'));
      setEndTime('10:00');
      setIsAllDay(false);
      resetRecurrence();
    }
  }, [editingEvent, defaultDate, isOpen]);

  const resetRecurrence = () => {
    setRecurrenceFrequency('none');
    setRecurrenceInterval(1);
    setRecurrenceEndType('never');
    setRecurrenceEndDate('');
    setRecurrenceOccurrences(10);
    setCustomDaysOfWeek([]);
    setShowCustomRecurrence(false);
  };

  const resetForm = () => {
    const today = new Date();
    setTitle('');
    setDescription('');
    setLocation('');
    setCategory('');
    setColor('blue');
    setStartDate(format(today, 'yyyy-MM-dd'));
    setStartTime('09:00');
    setEndDate(format(today, 'yyyy-MM-dd'));
    setEndTime('10:00');
    setIsAllDay(false);
    resetRecurrence();
  };

  const handleRecurrenceSelect = (frequency: RecurrenceFrequency) => {
    if (frequency === 'custom') {
      setShowCustomRecurrence(true);
      setShowRecurrenceDropdown(false);
      // Set default to weekly with current day selected
      const dayOfWeek = startDate
        ? getDay(new Date(startDate))
        : getDay(new Date());
      setCustomDaysOfWeek([dayOfWeek]);
      setRecurrenceFrequency('weekly');
    } else {
      setRecurrenceFrequency(frequency);
      setShowRecurrenceDropdown(false);
      setShowCustomRecurrence(false);
      if (frequency === 'weekdays') {
        setCustomDaysOfWeek([1, 2, 3, 4, 5]);
      } else if (frequency === 'weekly') {
        const dayOfWeek = startDate
          ? getDay(new Date(startDate))
          : getDay(new Date());
        setCustomDaysOfWeek([dayOfWeek]);
      }
    }
  };

  const toggleDayOfWeek = (day: number) => {
    setCustomDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const startDateTime = isAllDay
      ? `${startDate}T00:00:00`
      : `${startDate}T${startTime}:00`;
    const endDateTime = isAllDay
      ? `${endDate}T23:59:59`
      : `${endDate}T${endTime}:00`;

    let recurrence: RecurrenceRule | undefined;
    if (recurrenceFrequency !== 'none') {
      recurrence = {
        frequency: recurrenceFrequency,
        interval: recurrenceInterval,
        endType: recurrenceEndType,
        ...(recurrenceEndType === 'on' && recurrenceEndDate
          ? { endDate: recurrenceEndDate }
          : {}),
        ...(recurrenceEndType === 'after'
          ? { occurrences: recurrenceOccurrences }
          : {}),
        ...(customDaysOfWeek.length > 0
          ? { daysOfWeek: customDaysOfWeek }
          : {}),
      };
    }

    const event: CalendarEvent = {
      id: editingEvent?.id || generateEventId(),
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      category: category.trim() || undefined,
      color,
      startDate: startDateTime,
      endDate: endDateTime,
      isAllDay,
      recurrence,
    };

    onSave(event);
    onClose();
    resetForm();
  };

  const handleDelete = () => {
    if (editingEvent && onDelete) {
      onDelete(editingEvent.id);
      onClose();
      resetForm();
    }
  };

  const recurrenceOptions: RecurrenceFrequency[] = [
    'none',
    'daily',
    'weekly',
    'monthly',
    'yearly',
    'weekdays',
    'custom',
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center'>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className='absolute inset-0 bg-black/60 backdrop-blur-sm'
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className='relative w-full h-[90vh] sm:h-auto sm:max-w-lg sm:max-h-[90vh] bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden sm:mx-4 flex flex-col'
          >
            {/* Header */}
            <div className='flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border shrink-0'>
              <h2 className='text-base sm:text-lg font-semibold text-foreground'>
                {editingEvent ? 'Edit Event' : 'New Event'}
              </h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className='p-2 rounded-lg hover:bg-muted transition-colors'
              >
                <X className='w-5 h-5 text-muted-foreground' />
              </motion.button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className='flex-1 p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto'
            >
              {/* Title */}
              <div>
                <input
                  type='text'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder='Add title'
                  required
                  autoFocus
                  className='w-full px-4 py-3 bg-transparent border-b-2 border-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-xl font-medium transition-colors'
                />
              </div>

              {/* Date and Time Section */}
              <div className='space-y-3'>
                <div className='flex items-start gap-2 sm:gap-3 text-muted-foreground'>
                  <Clock className='w-5 h-5 shrink-0 mt-1' />
                  <div className='flex-1 space-y-3'>
                    {/* All Day Toggle */}
                    <label className='flex items-center gap-2 cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={isAllDay}
                        onChange={(e) => setIsAllDay(e.target.checked)}
                        className='w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer'
                      />
                      <span className='text-sm text-foreground'>All day</span>
                    </label>

                    {/* Start Date/Time Row */}
                    <div className='space-y-2'>
                      <span className='text-xs text-muted-foreground font-medium'>
                        Start
                      </span>
                      <div className='grid grid-cols-1 min-[400px]:grid-cols-[1fr_auto] gap-2'>
                        <input
                          type='date'
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          required
                          className='w-full px-3 py-2.5 bg-secondary rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm'
                        />
                        {!isAllDay && (
                          <input
                            type='time'
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            required
                            className='w-full min-[400px]:w-28 px-3 py-2.5 bg-secondary rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm'
                          />
                        )}
                      </div>
                    </div>

                    {/* End Date/Time Row */}
                    <div className='space-y-2'>
                      <span className='text-xs text-muted-foreground font-medium'>
                        End
                      </span>
                      <div className='grid grid-cols-1 min-[400px]:grid-cols-[1fr_auto] gap-2'>
                        <input
                          type='date'
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          required
                          className='w-full px-3 py-2.5 bg-secondary rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm'
                        />
                        {!isAllDay && (
                          <input
                            type='time'
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            required
                            className='w-full min-[400px]:w-28 px-3 py-2.5 bg-secondary rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm'
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recurrence Section */}
              <div className='flex items-start gap-3'>
                <Repeat className='w-5 h-5 text-muted-foreground mt-2.5 shrink-0' />
                <div className='flex-1 space-y-3' ref={dropdownRef}>
                  {/* Recurrence Dropdown */}
                  <div className='relative'>
                    <button
                      type='button'
                      onClick={() =>
                        setShowRecurrenceDropdown(!showRecurrenceDropdown)
                      }
                      className='flex items-center justify-between w-full px-3 py-2 bg-secondary rounded-lg text-foreground text-sm hover:bg-muted transition-colors'
                    >
                      <span>
                        {getRecurrenceLabel(recurrenceFrequency, startDate)}
                      </span>
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 transition-transform',
                          showRecurrenceDropdown && 'rotate-180'
                        )}
                      />
                    </button>

                    <AnimatePresence>
                      {showRecurrenceDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className='absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-10 overflow-hidden'
                        >
                          {recurrenceOptions.map((freq) => (
                            <button
                              key={freq}
                              type='button'
                              onClick={() => handleRecurrenceSelect(freq)}
                              className={cn(
                                'w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors',
                                recurrenceFrequency === freq &&
                                  freq !== 'custom' &&
                                  'bg-primary/10 text-primary'
                              )}
                            >
                              {getRecurrenceLabel(freq, startDate)}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Custom Recurrence Options */}
                  <AnimatePresence>
                    {showCustomRecurrence && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className='space-y-3 p-3 bg-secondary/50 rounded-lg'
                      >
                        {/* Interval */}
                        <div className='flex items-center gap-2'>
                          <span className='text-sm text-muted-foreground'>
                            Repeat every
                          </span>
                          <input
                            type='number'
                            min={1}
                            max={99}
                            value={recurrenceInterval}
                            onChange={(e) =>
                              setRecurrenceInterval(
                                parseInt(e.target.value) || 1
                              )
                            }
                            className='w-16 px-2 py-1 bg-secondary rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary'
                          />
                          <select
                            value={recurrenceFrequency}
                            onChange={(e) =>
                              setRecurrenceFrequency(
                                e.target.value as RecurrenceFrequency
                              )
                            }
                            className='px-2 py-1 bg-secondary rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary'
                          >
                            <option value='daily'>day(s)</option>
                            <option value='weekly'>week(s)</option>
                            <option value='monthly'>month(s)</option>
                            <option value='yearly'>year(s)</option>
                          </select>
                        </div>

                        {/* Days of Week (for weekly) */}
                        {recurrenceFrequency === 'weekly' && (
                          <div className='space-y-2'>
                            <span className='text-sm text-muted-foreground'>
                              Repeat on
                            </span>
                            <div className='flex gap-1'>
                              {WEEKDAYS.map((day, index) => (
                                <button
                                  key={day}
                                  type='button'
                                  onClick={() => toggleDayOfWeek(index)}
                                  className={cn(
                                    'w-9 h-9 rounded-full text-xs font-medium transition-colors',
                                    customDaysOfWeek.includes(index)
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-secondary hover:bg-muted text-muted-foreground'
                                  )}
                                >
                                  {day.charAt(0)}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* End Type */}
                        <div className='space-y-2'>
                          <span className='text-sm text-muted-foreground'>
                            Ends
                          </span>
                          <div className='space-y-2'>
                            <label className='flex items-center gap-2 cursor-pointer'>
                              <input
                                type='radio'
                                checked={recurrenceEndType === 'never'}
                                onChange={() => setRecurrenceEndType('never')}
                                className='w-4 h-4 text-primary focus:ring-primary'
                              />
                              <span className='text-sm'>Never</span>
                            </label>
                            <label className='flex items-center gap-2 cursor-pointer'>
                              <input
                                type='radio'
                                checked={recurrenceEndType === 'on'}
                                onChange={() => setRecurrenceEndType('on')}
                                className='w-4 h-4 text-primary focus:ring-primary'
                              />
                              <span className='text-sm'>On</span>
                              {recurrenceEndType === 'on' && (
                                <input
                                  type='date'
                                  value={recurrenceEndDate}
                                  onChange={(e) =>
                                    setRecurrenceEndDate(e.target.value)
                                  }
                                  className='px-2 py-1 bg-secondary rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary'
                                />
                              )}
                            </label>
                            <label className='flex items-center gap-2 cursor-pointer'>
                              <input
                                type='radio'
                                checked={recurrenceEndType === 'after'}
                                onChange={() => setRecurrenceEndType('after')}
                                className='w-4 h-4 text-primary focus:ring-primary'
                              />
                              <span className='text-sm'>After</span>
                              {recurrenceEndType === 'after' && (
                                <>
                                  <input
                                    type='number'
                                    min={1}
                                    max={999}
                                    value={recurrenceOccurrences}
                                    onChange={(e) =>
                                      setRecurrenceOccurrences(
                                        parseInt(e.target.value) || 1
                                      )
                                    }
                                    className='w-16 px-2 py-1 bg-secondary rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary'
                                  />
                                  <span className='text-sm'>occurrences</span>
                                </>
                              )}
                            </label>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Location */}
              <div className='flex items-center gap-3'>
                <MapPin className='w-5 h-5 text-muted-foreground shrink-0' />
                <input
                  type='text'
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder='Add location'
                  className='flex-1 px-3 py-2 bg-secondary rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm'
                />
              </div>

              {/* Category */}
              <div className='flex items-center gap-3'>
                <Tag className='w-5 h-5 text-muted-foreground shrink-0' />
                <input
                  type='text'
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder='Add category (e.g., Work, Personal, School)'
                  className='flex-1 px-3 py-2 bg-secondary rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm'
                />
              </div>

              {/* Description */}
              <div className='flex items-start gap-3'>
                <AlignLeft className='w-5 h-5 text-muted-foreground mt-2.5 shrink-0' />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder='Add description'
                  rows={3}
                  className='flex-1 px-3 py-2 bg-secondary rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none'
                />
              </div>

              {/* Color */}
              <div className='flex items-center gap-3'>
                <Palette className='w-5 h-5 text-muted-foreground shrink-0' />
                <div className='flex gap-2 flex-wrap'>
                  {colorOptions.map((c) => (
                    <motion.button
                      key={c}
                      type='button'
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setColor(c)}
                      className={cn(
                        'w-7 h-7 rounded-full transition-all',
                        color === c
                          ? 'ring-2 ring-offset-2 ring-offset-card ring-foreground scale-110'
                          : 'opacity-60 hover:opacity-100'
                      )}
                      style={{ backgroundColor: colorMap[c] }}
                    />
                  ))}
                </div>
              </div>

              {/* Spacer for sticky footer */}
              <div className='h-20 sm:h-0' />
            </form>

            {/* Actions - Sticky at bottom on mobile */}
            <div className='shrink-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 p-4 sm:px-6 sm:py-4 border-t border-border bg-card'>
              {editingEvent && onDelete ? (
                <motion.button
                  type='button'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDelete}
                  className='flex items-center justify-center gap-2 px-4 py-3 sm:py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors'
                >
                  <Trash2 className='w-4 h-4' />
                  Delete
                </motion.button>
              ) : (
                <div className='hidden sm:block' />
              )}

              <div className='flex gap-2 sm:gap-3'>
                <motion.button
                  type='button'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className='flex-1 sm:flex-none px-4 py-3 sm:py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors'
                >
                  Cancel
                </motion.button>
                <motion.button
                  type='button'
                  onClick={handleSubmit}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className='flex-1 sm:flex-none px-6 py-3 sm:py-2 bg-primary text-primary-foreground rounded-lg font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-shadow'
                >
                  Save
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
