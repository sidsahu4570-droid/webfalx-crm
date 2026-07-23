import React, { useState, useRef, useEffect } from 'react';
import { City } from '../../types';
import { Search, MapPin, Check, ChevronDown, X } from 'lucide-react';

interface CityFilterDropdownProps {
  selectedCityIds: string[];
  setSelectedCityIds: (ids: string[]) => void;
  cities: City[];
}

export const CityFilterDropdown: React.FC<CityFilterDropdownProps> = ({
  selectedCityIds,
  setSelectedCityIds,
  cities
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleCity = (cityId: string) => {
    if (selectedCityIds.includes(cityId)) {
      setSelectedCityIds(selectedCityIds.filter(id => id !== cityId));
    } else {
      setSelectedCityIds([...selectedCityIds, cityId]);
    }
  };

  const handleSelectAll = () => {
    setSelectedCityIds(cities.map(c => c._id));
  };

  const handleClearAll = () => {
    setSelectedCityIds([]);
  };

  const filteredCities = cities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  // Display label on the button
  const getButtonLabel = () => {
    if (selectedCityIds.length === 0) return 'City: All Cities';
    if (selectedCityIds.length === 1) {
      const match = cities.find(c => c._id === selectedCityIds[0]);
      return match ? `City: ${match.name}` : 'City: 1 Selected';
    }
    return `City: ${selectedCityIds.length} Selected`;
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${
          selectedCityIds.length > 0
            ? 'bg-indigo-50/70 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/60 shadow-sm'
            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
      >
        <MapPin className="w-3.5 h-3.5" />
        <span>{getButtonLabel()}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-60 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg z-50 overflow-hidden animate-fadeIn">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cities..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Quick Actions */}
          <div className="px-3 py-1.5 bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 flex justify-between text-[10px] font-bold text-slate-500">
            <button type="button" onClick={handleSelectAll} className="hover:text-indigo-600">Select All</button>
            <button type="button" onClick={handleClearAll} className="hover:text-rose-500">Clear All</button>
          </div>

          {/* Cities List */}
          <div className="max-h-48 overflow-y-auto p-1.5 space-y-0.5">
            {filteredCities.length === 0 ? (
              <div className="p-3 text-center text-[10px] text-slate-400">No cities found</div>
            ) : (
              filteredCities.map((city) => {
                const isChecked = selectedCityIds.includes(city._id);
                return (
                  <button
                    key={city._id}
                    type="button"
                    onClick={() => toggleCity(city._id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors ${
                      isChecked
                        ? 'bg-indigo-50/30 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{city.name}</span>
                    {isChecked && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
