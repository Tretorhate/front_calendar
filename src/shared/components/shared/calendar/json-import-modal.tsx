'use client';import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileJson, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { CalendarEvent, ScheduleImport } from '@/shared/types/calendar';
import { generateEventId } from '@/shared/lib/calendar-utils';

interface JsonImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: ScheduleImport) => void;
}

interface RawEventData {
  id?: string;
  title?: string;
  name?: string;
  subject?: string;
  description?: string;
  desc?: string;
  notes?: string;
  startDate?: string;
  start?: string;
  startTime?: string;
  date?: string;
  endDate?: string;
  end?: string;
  endTime?: string;
  color?: string;
  location?: string;
  place?: string;
  room?: string;
  isAllDay?: boolean;
  allDay?: boolean;
  category?: string;
  type?: string;
  class?: string;
}

type ImportStatus = 'idle' | 'parsing' | 'success' | 'error';

export const JsonImportModal: React.FC<JsonImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [jsonText, setJsonText] = React.useState('');
  const [status, setStatus] = React.useState<ImportStatus>('idle');
  const [error, setError] = React.useState('');
  const [parsedCount, setParsedCount] = React.useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const validateAndParseJson = (text: string): ScheduleImport | null => {
    try {
      const data = JSON.parse(text);

      // Check if it's an array of events or wrapped in an object
      let events: CalendarEvent[] = [];

      if (Array.isArray(data)) {
        events = data;
      } else if (data.events && Array.isArray(data.events)) {
        events = data.events;
      } else if (data.schedule && Array.isArray(data.schedule)) {
        events = data.schedule;
      } else {
        throw new Error(
          "JSON must contain an array of events or an object with 'events' property"
        );
      }

      // Validate and transform events
      const validatedEvents: CalendarEvent[] = (events as RawEventData[]).map(
        (e: RawEventData, index: number) => {
          // Handle different date formats
          let startDate = e.startDate || e.start || e.startTime || e.date;
          let endDate = e.endDate || e.end || e.endTime || e.date;

          if (!startDate) {
            throw new Error(`Event at index ${index} is missing start date`);
          }

          // If only date is provided without time, add default times
          if (startDate && !startDate.includes('T')) {
            startDate = `${startDate}T09:00:00`;
          }
          if (endDate && !endDate.includes('T')) {
            endDate = `${endDate}T10:00:00`;
          }

          // If no end date, set it to start date + 1 hour
          if (!endDate) {
            const start = new Date(startDate);
            start.setHours(start.getHours() + 1);
            endDate = start.toISOString();
          }

          return {
            id: e.id || generateEventId(),
            title: e.title || e.name || e.subject || `Event ${index + 1}`,
            description: e.description || e.desc || e.notes || undefined,
            startDate,
            endDate,
            color: (e.color as CalendarEvent['color']) || 'blue',
            location: e.location || e.place || e.room || undefined,
            isAllDay: e.isAllDay || e.allDay || false,
            category: e.category || e.type || e.class || undefined,
          };
        }
      );

      return {
        events: validatedEvents,
        metadata: data.metadata || {
          source: 'JSON Import',
          importedAt: new Date().toISOString(),
        },
      };
    } catch (err) {
      throw err;
    }
  };

  const handleImport = () => {
    if (!jsonText.trim()) {
      setError('Please enter JSON data or upload a file');
      setStatus('error');
      return;
    }

    setStatus('parsing');
    setError('');

    try {
      const result = validateAndParseJson(jsonText);
      if (result) {
        setParsedCount(result.events.length);
        setStatus('success');
        setTimeout(() => {
          onImport(result);
          handleClose();
        }, 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse JSON');
      setStatus('error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setJsonText(text);
      setStatus('idle');
      setError('');
    };
    reader.onerror = () => {
      setError('Failed to read file');
      setStatus('error');
    };
    reader.readAsText(file);
  };

  const handleClose = () => {
    setJsonText('');
    setStatus('idle');
    setError('');
    setParsedCount(0);
    onClose();
  };

  const sampleJson = `{
  "events": [
    {
      "title": "Math Class",
      "startDate": "2025-01-15T09:00:00",
      "endDate": "2025-01-15T10:30:00",
      "color": "blue",
      "location": "Room 101",
      "category": "Class"
    },
    {
      "title": "Science Lab",
      "startDate": "2025-01-15T11:00:00",
      "endDate": "2025-01-15T12:30:00",
      "color": "green",
      "location": "Lab A",
      "category": "Lab"
    }
  ]
}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50'
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-card rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[90vh] flex flex-col'
          >
            {/* Header */}
            <div className='flex items-center justify-between px-6 py-4 border-b border-border shrink-0'>
              <div className='flex items-center gap-3'>
                <FileJson className='w-5 h-5 text-primary' />
                <h2 className='text-lg font-semibold text-foreground'>
                  Import Schedule from JSON
                </h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className='p-2 rounded-lg hover:bg-muted transition-colors'
              >
                <X className='w-5 h-5 text-muted-foreground' />
              </motion.button>
            </div>

            {/* Content */}
            <div className='p-6 space-y-4 overflow-y-auto flex-1'>
              {/* File Upload */}
              <div>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='.json'
                  onChange={handleFileUpload}
                  className='hidden'
                />
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => fileInputRef.current?.click()}
                  className='w-full flex items-center justify-center gap-3 px-4 py-6 border-2 border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-colors'
                >
                  <Upload className='w-6 h-6 text-muted-foreground' />
                  <div className='text-left'>
                    <div className='font-medium text-foreground'>
                      Upload JSON File
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Click to select a .json file
                    </div>
                  </div>
                </motion.button>
              </div>

              <div className='flex items-center gap-3'>
                <div className='flex-1 h-px bg-border' />
                <span className='text-xs text-muted-foreground'>
                  or paste JSON
                </span>
                <div className='flex-1 h-px bg-border' />
              </div>

              {/* JSON Text Area */}
              <div>
                <textarea
                  value={jsonText}
                  onChange={(e) => {
                    setJsonText(e.target.value);
                    setStatus('idle');
                    setError('');
                  }}
                  placeholder={sampleJson}
                  rows={12}
                  className='w-full px-4 py-3 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm resize-none'
                />
              </div>

              {/* Status Messages */}
              <AnimatePresence mode='wait'>
                {status === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className='flex items-center gap-2 px-4 py-3 bg-destructive/10 text-destructive rounded-lg'
                  >
                    <AlertCircle className='w-4 h-4 shrink-0' />
                    <span className='text-sm'>{error}</span>
                  </motion.div>
                )}
                {status === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className='flex items-center gap-2 px-4 py-3 bg-green-500/10 text-green-400 rounded-lg'
                  >
                    <CheckCircle2 className='w-4 h-4 shrink-0' />
                    <span className='text-sm'>
                      Successfully parsed {parsedCount} event
                      {parsedCount !== 1 ? 's' : ''}!
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sample Format Info */}
              <div className='p-4 bg-muted/30 rounded-xl'>
                <h4 className='text-sm font-medium text-foreground mb-2'>
                  Supported JSON Format
                </h4>
                <ul className='text-xs text-muted-foreground space-y-1'>
                  <li>
                    • Array of events or object with &quot;events&quot; property
                  </li>
                  <li>• Required fields: title, startDate (or date/start)</li>
                  <li>
                    • Optional fields: endDate, color, location, description,
                    category, isAllDay
                  </li>
                  <li>
                    • Date format: ISO 8601 (e.g.,
                    &quot;2025-01-15T09:00:00&quot;)
                  </li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className='flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0'>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
                className='px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors'
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleImport}
                disabled={status === 'parsing' || status === 'success'}
                className={cn(
                  'px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium transition-all',
                  status === 'parsing' && 'opacity-50 cursor-not-allowed',
                  status === 'success' && 'bg-green-500'
                )}
              >
                {status === 'parsing'
                  ? 'Parsing...'
                  : status === 'success'
                  ? 'Imported!'
                  : 'Import Events'}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
