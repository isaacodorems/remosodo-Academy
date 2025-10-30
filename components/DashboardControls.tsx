import React from 'react';

interface SortOption {
  value: string;
  label: string;
}

interface DashboardControlsProps {
  filterTerm: string;
  onFilterChange: (term: string) => void;
  sortOption: string;
  onSortChange: (option: string) => void;
  sortOptions: SortOption[];
}

const DashboardControls: React.FC<DashboardControlsProps> = ({
  filterTerm,
  onFilterChange,
  sortOption,
  onSortChange,
  sortOptions,
}) => {
  return (
    <div className="mb-4 flex flex-col sm:flex-row gap-4">
      <div className="relative flex-grow">
        <input
          type="text"
          placeholder="Filter by title..."
          value={filterTerm}
          onChange={(e) => onFilterChange(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 pl-10 pr-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <svg className="w-5 h-5 text-slate-400 absolute top-1/2 left-3 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
      </div>
      <div className="relative">
        <select
          value={sortOption}
          onChange={(e) => onSortChange(e.target.value)}
          className="appearance-none w-full sm:w-auto bg-slate-700 border border-slate-600 rounded-md py-2 pl-4 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
         <svg className="w-5 h-5 text-slate-400 absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
      </div>
    </div>
  );
};

export default DashboardControls;
