'use client';

/**
 * StockSearch (Autocomplete)
 * Searchable autocomplete dropdown for stock symbol selection.
 * Restricts input to valid fetched symbols only.
 */

import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, ArrowPathIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useSymbol } from '@/context/SymbolContext';
import { API_BASE, authFetch } from '@/lib/auth';

interface SearchResult {
  symbol: string;
  name: string;
}

interface StockSearchProps {
  /** Show popular symbol chips (default: true) */
  showChips?: boolean;
  /** Placeholder for the input */
  placeholder?: string;
  /** Callback after symbol is selected */
  onSelect?: (symbol: string) => void;
  /** Value override (controlled mode) */
  value?: string;
}

export default function StockSearch({
  showChips = true,
  placeholder = 'Search symbol… e.g. RELIANCE',
  onSelect,
  value
}: StockSearchProps) {
  const { symbol: globalSymbol, loading: globalLoading, fetchChart } = useSymbol();
  
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync external value
  useEffect(() => {
    if (value !== undefined) setQuery(value);
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchStocks = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const res = await fetch(`${API_BASE}/api/stocks/search?q=${encodeURIComponent(searchTerm)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setShowDropdown(true);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      searchStocks(val);
    }, 300);
  };

  const selectSymbol = async (sym: string) => {
    setQuery(sym);
    setShowDropdown(false);
    
    // If it's the global context StockSearch (no onSelect provided, or just in general)
    if (!onSelect) {
      await fetchChart(sym);
    } else {
      onSelect(sym);
    }
  };

  return (
    <div className="relative space-y-3" ref={dropdownRef}>
      {/* Input row */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.length > 0) setShowDropdown(true);
          }}
          placeholder={placeholder}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-10 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
        {isSearching && (
          <ArrowPathIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {showDropdown && query.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto top-[42px]">
          {results.length > 0 ? (
            <ul className="py-1">
              {results.map((r, i) => (
                <li
                  key={`${r.symbol}-${i}`}
                  onClick={() => selectSymbol(r.symbol)}
                  className="px-4 py-2 hover:bg-gray-700 cursor-pointer flex justify-between items-center group"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white group-hover:text-blue-400">
                      {r.symbol}
                    </span>
                    <span className="text-xs text-gray-400 truncate w-48">
                      {r.name}
                    </span>
                  </div>
                  {query === r.symbol && (
                    <CheckIcon className="h-4 w-4 text-blue-500" />
                  )}
                </li>
              ))}
            </ul>
          ) : !isSearching ? (
            <div className="px-4 py-3 text-sm text-gray-400 text-center">
              No results found for "{query}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
