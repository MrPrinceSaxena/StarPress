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
    contentService.getPages().then((data) => { setPages(data); setLoading(false); });
  }, []);

  const types = ['all', ...new Set(pages.map((p) => p.type))];

  const filtered = pages.filter((p) => {
    if (filter !== 'all' && p.type !== filter) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-[1400px]">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Content</h1>
          <p className="text-sm text-text-muted mt-0.5">Manage pages, blog posts, banners, and collections.</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-brand-yellow text-black hover:bg-[#FFE04D] transition-colors shadow-sm">
          <Plus size={14} /> Add Content
        </button>
      </div>

      <div className="bg-bg-surface border border-border-subtle rounded-xl">
        <div className="flex items-center gap-3 p-3 border-b border-border-subtle">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="text" placeholder="Search content…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full h-9 pl-9 pr-3 rounded-lg bg-white/[0.03] border border-border-subtle text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-yellow/30 transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-500 hover:text-white"><X size={14} /></button>}
          </div>
          <div className="flex items-center gap-1">
            {types.map((t) => (
              <button key={t} onClick={() => setFilter(t)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${filter === t ? 'bg-white/[0.08] text-white' : 'text-text-muted hover:text-white hover:bg-white/[0.04]'}`}>{t}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No content found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-border-subtle">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Title</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Type</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Author</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Views</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Updated</th>
              </tr></thead>
              <tbody>
                {filtered.map((page) => (
                  <tr key={page.id} className="border-b border-border-subtle/50 hover:bg-white/[0.02] transition-colors cursor-pointer">
                    <td className="px-4 py-3 text-sm font-medium text-white">{page.title}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-md bg-white/[0.04] text-[11px] font-medium text-text-secondary capitalize">{page.type}</span></td>
                    <td className="px-4 py-3"><StatusBadge status={page.status === 'published' ? 'published' : 'draft'} /></td>
                    <td className="px-4 py-3 text-xs text-text-muted">{page.author}</td>
                    <td className="px-4 py-3 text-xs text-text-secondary">{page.views.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-text-muted">{new Date(page.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
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
