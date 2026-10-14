'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Plus, Eye, Edit3, ExternalLink, Search, X } from 'lucide-react';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import EmptyState from '@/components/admin/ui/EmptyState';
import { contentService } from '@/lib/admin/services';
import type { ContentPage } from '@/lib/admin/types';

export default function ContentManagementPage() {
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    contentService.getPages().then((data) => {
      setPages(data);
      setLoading(false);
    });
  }, []);

  const types = ['all', ...new Set(pages.map((p) => p.type))];

  const filtered = pages.filter((p) => {
    if (filter !== 'all' && p.type !== filter) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-[1400px] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Content</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage storefront pages, CMS articles, policy notices, and hero announcements.
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-semibold bg-[#F5A623] hover:bg-[#e0961e] text-black transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus size={15} /> Add Content
        </button>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm overflow-hidden">
        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 border-b border-[#E5E7EB] bg-white">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search content pages…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-9 rounded-xl bg-slate-50/70 border border-[#E5E7EB] text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623] transition-all shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {types.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors capitalize cursor-pointer ${
                  filter === t
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-3 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16">
            <EmptyState icon={FileText} title="No content found" description="Try refining your search keyword or active type filter." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-slate-50/70">
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Title</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Type</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Author</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Views</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-sm">
                {filtered.map((page) => (
                  <tr
                    key={page.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-3.5 text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {page.title}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 capitalize">
                        {page.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={page.status === 'published' ? 'published' : 'draft'} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 font-medium">{page.author}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-800 font-semibold font-mono">{page.views.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-medium">
                      {new Date(page.updatedAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
