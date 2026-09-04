import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { toLocalDateString } from '../utils/dates';

export default function CustomDatePicker({ value, onChange, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse current value (YYYY-MM-DD) or default to today
  const initialDate = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewDate, setViewDate] = useState(initialDate);

  useEffect(() => {
    if (value) {
      setViewDate(new Date(value + 'T00:00:00'));
    }
  }, [value]);

  // Close popup on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (dayNum) => {
    const selected = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    onChange(selected);
    setIsOpen(false);
  };

  const handlePreset = (daysFromNow) => {
    const target = new Date();
    target.setDate(target.getDate() + daysFromNow);
    const selected = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
    onChange(selected);
    setViewDate(target);
    setIsOpen(false);
  };

  const formatDisplay = (dateStr) => {
    if (!dateStr) return 'Select date';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const todayStr = toLocalDateString();

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 text-xs font-extrabold border border-gray-200 dark:border-[#332352] bg-gray-50/50 dark:bg-[#120B1D] text-[#2B1B3D] dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FFC8DD] dark:focus:ring-[#FFAFCC] flex items-center justify-between transition cursor-pointer shadow-sm hover:border-[#CDB4DB] dark:hover:border-[#FFC8DD]"
      >
        <span className="flex items-center space-x-2 truncate">
          <CalendarIcon className="w-3.5 h-3.5 text-[#2B1B3D] dark:text-[#FFAFCC] shrink-0" />
          <span className="truncate">{formatDisplay(value)}</span>
        </span>
      </button>

      {/* Visual Interactive Calendar Popup - Perfectly Sized to fit Modal Padding */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 bg-white dark:bg-[#1E142D] border border-gray-200 dark:border-[#3E285C] rounded-3xl shadow-2xl overflow-hidden animate-scale-in p-3.5 w-[255px]">
          {/* Header Navigation */}
          <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 dark:border-[#332352]">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#332352] text-[#2B1B3D] dark:text-white transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-black text-[#2B1B3D] dark:text-white">
              {monthNames[month]} {year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#332352] text-[#2B1B3D] dark:text-white transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day Names Header */}
          <div className="grid grid-cols-7 gap-0.5 text-center py-1.5 font-black text-[9px] text-gray-400 dark:text-gray-400 uppercase">
            <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-7" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isSelected = value === dateStr;
              const isToday = todayStr === dateStr;

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`h-7 rounded-lg font-extrabold text-[11px] flex items-center justify-center transition ${
                    isSelected
                      ? 'bg-[#FFC8DD] text-[#2B1B3D] dark:bg-[#FFC8DD] dark:text-[#2B1B3D] shadow font-black scale-105'
                      : isToday
                      ? 'border border-[#2B1B3D] dark:border-[#FFAFCC] text-[#2B1B3D] dark:text-white bg-[#BDE0FE]/30 dark:bg-[#382550]'
                      : 'text-[#2B1B3D] dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#332352]'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Quick Preset Shortcut Pills */}
          <div className="pt-2.5 mt-2 border-t border-gray-100 dark:border-[#332352] grid grid-cols-2 gap-1 text-[10px] font-extrabold">
            <button
              type="button"
              onClick={() => handlePreset(0)}
              className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-[#120B1D] text-[#2B1B3D] dark:text-gray-300 hover:bg-[#FFC8DD] hover:text-[#2B1B3D] transition text-center"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handlePreset(1)}
              className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-[#120B1D] text-[#2B1B3D] dark:text-gray-300 hover:bg-[#FFC8DD] hover:text-[#2B1B3D] transition text-center"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => handlePreset(3)}
              className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-[#120B1D] text-[#2B1B3D] dark:text-gray-300 hover:bg-[#FFC8DD] hover:text-[#2B1B3D] transition text-center"
            >
              In 3 Days
            </button>
            <button
              type="button"
              onClick={() => handlePreset(7)}
              className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-[#120B1D] text-[#2B1B3D] dark:text-gray-300 hover:bg-[#FFC8DD] hover:text-[#2B1B3D] transition text-center"
            >
              Next Week
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
