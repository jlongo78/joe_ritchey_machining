import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  List,
  LayoutGrid,
} from 'lucide-react';

interface ScheduleEvent {
  id: number;
  title: string;
  jobNumber?: string;
  customer: string;
  start: Date;
  end: Date;
  type: 'job' | 'appointment' | 'reminder';
  bay?: string;
  status: string;
}

const SchedulePage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock events for the current month
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      setEvents([
        {
          id: 1,
          title: '350 SBC Full Rebuild',
          jobNumber: 'JOB-2024-0156',
          customer: 'Performance Motors',
          start: new Date(year, month, 20, 8, 0),
          end: new Date(year, month, 28, 17, 0),
          type: 'job',
          bay: 'Bay 1',
          status: 'in_progress',
        },
        {
          id: 2,
          title: 'LS3 Dyno Tune',
          jobNumber: 'JOB-2024-0155',
          customer: 'Mike Johnson',
          start: new Date(year, month, 18, 9, 0),
          end: new Date(year, month, 24, 17, 0),
          type: 'job',
          bay: 'Dyno Room',
          status: 'quality_check',
        },
        {
          id: 3,
          title: 'Head Porting - BBC',
          jobNumber: 'JOB-2024-0154',
          customer: 'Track Day Garage',
          start: new Date(year, month, 19, 8, 0),
          end: new Date(year, month, 26, 17, 0),
          type: 'job',
          bay: 'Bay 2',
          status: 'in_progress',
        },
        {
          id: 4,
          title: 'Rotating Assembly Balance',
          jobNumber: 'JOB-2024-0153',
          customer: 'Robert Davis',
          start: new Date(year, month, 25, 8, 0),
          end: new Date(year, month, 28, 17, 0),
          type: 'job',
          bay: 'Bay 3',
          status: 'scheduled',
        },
        {
          id: 5,
          title: 'New Customer Consultation',
          customer: 'John Doe',
          start: new Date(year, month, 22, 14, 0),
          end: new Date(year, month, 22, 15, 0),
          type: 'appointment',
          status: 'scheduled',
        },
      ]);

      setIsLoading(false);
    };

    loadEvents();
  }, [currentDate]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty slots for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return date >= new Date(eventStart.toDateString()) && date <= new Date(eventEnd.toDateString());
    });
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const getEventColor = (event: ScheduleEvent) => {
    if (event.type === 'appointment') return 'bg-purple-500';
    if (event.type === 'reminder') return 'bg-amber-500';

    const statusColors: Record<string, string> = {
      scheduled: 'bg-blue-500',
      in_progress: 'bg-electric-500',
      quality_check: 'bg-purple-500',
      completed: 'bg-green-500',
      on_hold: 'bg-red-500',
    };
    return statusColors[event.status] || 'bg-chrome-500';
  };

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const today = new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Schedule</h1>
          <p className="text-chrome-400 mt-1">Manage appointments and job schedules</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-admin-bg-card border border-admin-border rounded-lg p-1 flex">
            <button
              onClick={() => setViewMode('month')}
              className={cn(
                'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                viewMode === 'month' ? 'bg-electric-500 text-white' : 'text-chrome-400 hover:text-white'
              )}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={cn(
                'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                viewMode === 'week' ? 'bg-electric-500 text-white' : 'text-chrome-400 hover:text-white'
              )}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={cn(
                'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                viewMode === 'day' ? 'bg-electric-500 text-white' : 'text-chrome-400 hover:text-white'
              )}
            >
              Day
            </button>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-electric-500 hover:bg-electric-600 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus size={18} />
            Add Event
          </button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-admin-bg-card border border-admin-border rounded-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 text-chrome-400 hover:text-white hover:bg-admin-bg-hover rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold text-white">{monthName}</h2>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 text-chrome-400 hover:text-white hover:bg-admin-bg-hover rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-electric-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-admin-border">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="px-2 py-3 text-center text-xs font-semibold text-chrome-400 uppercase">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {days.map((day, index) => {
                const dayEvents = day ? getEventsForDay(day) : [];
                const isToday = day && day.toDateString() === today.toDateString();
                const isCurrentMonth = day && day.getMonth() === currentDate.getMonth();

                return (
                  <div
                    key={index}
                    className={cn(
                      'min-h-[120px] border-b border-r border-admin-border p-2',
                      index % 7 === 0 && 'border-l',
                      !isCurrentMonth && 'bg-admin-bg/50'
                    )}
                  >
                    {day && (
                      <>
                        <div
                          className={cn(
                            'w-7 h-7 flex items-center justify-center rounded-full text-sm mb-1',
                            isToday
                              ? 'bg-electric-500 text-white font-bold'
                              : 'text-chrome-300'
                          )}
                        >
                          {day.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event) => (
                            <Link
                              key={event.id}
                              to={event.jobNumber ? `/admin/jobs/${event.id}` : '#'}
                              className={cn(
                                'block px-2 py-1 rounded text-xs text-white truncate hover:opacity-80 transition-opacity',
                                getEventColor(event)
                              )}
                              title={event.title}
                            >
                              {event.title}
                            </Link>
                          ))}
                          {dayEvents.length > 3 && (
                            <p className="px-2 text-xs text-chrome-500">
                              +{dayEvents.length - 3} more
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-sm text-chrome-400">Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-electric-500" />
          <span className="text-sm text-chrome-400">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-purple-500" />
          <span className="text-sm text-chrome-400">QC / Appointment</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-sm text-chrome-400">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-sm text-chrome-400">On Hold</span>
        </div>
      </div>
    </div>
  );
};

export default SchedulePage;
