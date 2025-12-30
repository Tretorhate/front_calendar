"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { CalendarEvent, EVENT_COLORS } from "@/shared/types/calendar";
import { getEventTime } from "@/shared/lib/calendar-utils";
import { cn } from "@/shared/lib/utils";

interface EventCardProps {
  event: CalendarEvent;
  compact?: boolean;
  onClick?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  compact = false,
  onClick,
}) => {
  const colors = EVENT_COLORS[event.color];

  if (compact) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={cn(
          "w-full text-left px-2 py-1 rounded text-xs font-medium truncate border-l-2 transition-colors",
          colors.bg,
          colors.text,
          colors.border
        )}
      >
        {event.title}
      </motion.button>
    );
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-lg border-l-4 transition-all cursor-pointer",
        colors.bg,
        colors.border,
        "hover:shadow-lg hover:shadow-black/20"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className={cn("font-semibold text-sm truncate", colors.text)}>
            {event.title}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {getEventTime(event)}
          </p>
          {event.location && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              📍 {event.location}
            </p>
          )}
        </div>
        {event.category && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {event.category}
          </span>
        )}
      </div>
      {event.description && !compact && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
          {event.description}
        </p>
      )}
    </motion.button>
  );
};
