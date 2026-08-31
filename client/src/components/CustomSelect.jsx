import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({ value, onChange, options, placeholder = 'Select option', className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  const handleSelect = (optValue) => {
    onChange(optValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Select Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 text-xs font-extrabold border border-gray-200 dark:border-[#332352] bg-gray-50/50 dark:bg-[#120B1D] text-[#2B1B3D] dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FFC8DD] dark:focus:ring-[#FFAFCC] flex items-center justify-between transition cursor-pointer shadow-sm hover:border-[#CDB4DB] dark:hover:border-[#FFC8DD]"
      >
        <span className="truncate flex items-center space-x-2">
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#2B1B3D] dark:text-[#FFC8DD]' : ''}`} />
      </button>

      {/* Floating Custom Dropdown Popup Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-[#1E142D] border border-gray-200 dark:border-[#3E285C] rounded-2xl shadow-2xl overflow-hidden animate-scale-in py-1 max-h-60 overflow-y-auto">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`px-4 py-2.5 text-xs font-extrabold flex items-center justify-between cursor-pointer transition ${
                  isSelected
                    ? 'bg-[#FFC8DD] text-[#2B1B3D] dark:bg-[#382550] dark:text-white font-black'
                    : 'text-[#2B1B3D] dark:text-gray-200 hover:bg-[#FFC8DD]/30 dark:hover:bg-[#2A1A3F] hover:text-[#2B1B3D] dark:hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#2B1B3D] dark:text-[#FFAFCC] shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
