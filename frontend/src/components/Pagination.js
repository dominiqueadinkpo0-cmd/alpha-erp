import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex items-center justify-between px-1 py-3">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Page <span className="font-medium text-gray-700 dark:text-gray-300">{currentPage}</span> of{' '}
        <span className="font-medium text-gray-700 dark:text-gray-300">{totalPages}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-200 dark:border-[#334155] hover:bg-gray-50 dark:hover:bg-[#334155] disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:text-gray-400"
        >
          <ChevronLeft size={16} />
        </button>
        {getPages().map((page, idx) =>
          page === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 dark:text-gray-500">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
                currentPage === page
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'border border-gray-200 dark:border-[#334155] hover:bg-gray-50 dark:hover:bg-[#334155] text-gray-700 dark:text-gray-300'
              }`}
            >
              {page}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-200 dark:border-[#334155] hover:bg-gray-50 dark:hover:bg-[#334155] disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:text-gray-400"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
