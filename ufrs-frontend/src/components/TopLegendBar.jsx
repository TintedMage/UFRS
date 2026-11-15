import { useState, useRef, useEffect } from 'react';
import { Flame, ExternalLink, ChevronDown, Check } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

export default function TopLegendBar({
  isLeftCollapsed: propIsLeftCollapsed,
  onToggleLeftSidebar,
}) {
  const storeIsLeftCollapsed = useAppStore((state) => state.isLeftCollapsed);
  const storeToggleLeft = useAppStore((state) => state.toggleLeftSidebar);
  const activeView = useAppStore((state) => state.activeView) || 'harmonized';
  const setActiveView = useAppStore((state) => state.setActiveView);

  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isLeftCollapsed =
    propIsLeftCollapsed !== undefined ? propIsLeftCollapsed : storeIsLeftCollapsed;
  const handleToggleLeft = onToggleLeftSidebar || storeToggleLeft;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsViewDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const viewOptions = [
    { key: 'harmonized', label: 'Harmonised' },
    { key: 'comparison', label: 'Comparison' },
  ];

  const currentLabel =
    viewOptions.find((v) => v.key === activeView)?.label || 'Harmonised';

  return (
    <header className="flex h-10 w-full shrink-0 items-center justify-between border-b border-[#2f2f2f] bg-[#222222] px-3 text-[11px] select-none z-10 gap-3">
      {/* Left side: Flame button (no bg) + Title */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={handleToggleLeft}
          className="flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80"
          title={isLeftCollapsed ? 'Expand Sidebar (Left)' : 'Collapse Sidebar (Left)'}
          aria-label={isLeftCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-expanded={!isLeftCollapsed}
        >
          <Flame className="h-4 w-4 text-orange-500" />
        </button>

        {/* Header Title */}
        <div className="flex items-center gap-2 font-bold text-amber-400">
          <span>UFRS</span>
          <span className="hidden sm:inline text-zinc-500 font-normal">|</span>
          <span className="hidden sm:inline text-zinc-300 font-medium">
            Unified Fire Reconnaissance System
          </span>
        </div>
      </div>

      {/* Right side: Links + View Selector Dropdown */}
      <div className="flex items-center gap-3 shrink-0 text-zinc-400">
        <a
          href="/ufrs_harmonization_comparison.md"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 hover:text-amber-400 transition-colors"
          title="UFRS Harmonization Comparison"
        >
          <span>Comparison</span>
          <ExternalLink className="h-2.5 w-2.5 opacity-60" />
        </a>
        <span className="text-zinc-600">·</span>
        <a
          href="https://firms.modaps.eosdis.nasa.gov/api/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 hover:text-amber-400 transition-colors"
          title="NASA FIRMS API Reference"
        >
          <span>NASA FIRMS</span>
          <ExternalLink className="h-2.5 w-2.5 opacity-60" />
        </a>
        <span className="text-zinc-600">·</span>
        <a
          href="/NASASpaceApps2026_Sygnition%283%29.ipynb"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 hover:text-amber-400 transition-colors"
          title="NASA Space Apps Research Notebook"
        >
          <span>Notebook</span>
          <ExternalLink className="h-2.5 w-2.5 opacity-60" />
        </a>

        {/* View Switcher Dropdown (Matching screenshot: View: Harmonised v) */}
        <div className="relative ml-1" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsViewDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 rounded border border-[#3e3529] bg-[#161616] px-2.5 py-1 text-[11px] shadow-xs hover:border-amber-500/60 transition-colors cursor-pointer"
            title="Change View Mode"
            aria-haspopup="listbox"
            aria-expanded={isViewDropdownOpen}
          >
            <span className="text-zinc-400">View:</span>
            <span className="font-semibold text-amber-400">{currentLabel}</span>
            <ChevronDown
              className={`h-3 w-3 text-zinc-400 transition-transform ${
                isViewDropdownOpen ? 'rotate-180 text-amber-400' : ''
              }`}
            />
          </button>

          {isViewDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-32 rounded-md border border-[#3a3a3a] bg-[#1a1a1a] py-1 shadow-2xl z-50">
              {viewOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setActiveView(opt.key);
                    setIsViewDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-[11px] transition-colors cursor-pointer ${
                    activeView === opt.key
                      ? 'bg-amber-500/15 text-amber-400 font-semibold'
                      : 'text-zinc-300 hover:bg-[#252525] hover:text-white'
                  }`}
                >
                  <span>{opt.label}</span>
                  {activeView === opt.key && <Check className="h-3 w-3 text-amber-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
