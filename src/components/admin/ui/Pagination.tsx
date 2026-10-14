'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, total, pageSize, onPageChange }: PaginationProps) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  if (totalPages <= 1) return null;

  // Generate page numbers
  const pages: (number | 'ellipsis')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('ellipsis');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between px-2 py-3 border-t border-[#E5E7EB] bg-white">
      <span className="text-xs text-slate-500">
        Showing <span className="font-semibold text-slate-800">{start}–{end}</span> of{' '}
        <span className="font-semibold text-slate-800">{total}</span>
      </span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-xs"
          aria-label="Previous page"
        >
          <ChevronLeft size={15} />
        </button>
        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e-${i}`} className="px-1 text-slate-400 text-xs font-mono">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-[30px] h-7 px-2 rounded-lg text-xs font-semibold transition-all shadow-xs ${
                p === page
                  ? 'bg-[#F5A623] text-slate-950 border border-[#F5A623]'
                  : 'bg-white border border-[#E5E7EB] text-slate-700 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-xs"
          aria-label="Next page"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
