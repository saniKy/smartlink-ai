/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { apiClient } from '../../api/client.ts';
import type { LinkItem } from '@shared/types/link.ts';
import { 
  Link2, Copy, Check, Trash2, ExternalLink, ShieldCheck, 
  Plus, RefreshCw, AlertCircle, Edit3, Power, Clock, X, Save
} from 'lucide-react';

interface LinksManagerProps {
  currentUser: string;
}

export function LinksManager({ currentUser }: LinksManagerProps) {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  // Edit Link State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const loadLinks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getLinks();
      setLinks(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load links';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, [currentUser]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setSubmitting(true);
    setError(null);

    try {
      let isoExpiry: string | undefined = undefined;
      if (expiresAt) {
        isoExpiry = new Date(expiresAt).toISOString();
      }

      await apiClient.createLink({
        originalUrl: url,
        title: title || undefined,
        customCode: customCode || undefined,
        expiresAt: isoExpiry,
      });

      setUrl('');
      setTitle('');
      setCustomCode('');
      setExpiresAt('');
      await loadLinks();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create link';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (link: LinkItem) => {
    try {
      const updated = await apiClient.updateLink(link.id, {
        isEnabled: !link.isActive,
      });
      setLinks(prev => prev.map(l => l.id === link.id ? updated : l));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update link status';
      alert(msg);
    }
  };

  const startEditing = (link: LinkItem) => {
    setEditingId(link.id);
    setEditUrl(link.originalUrl);
    setEditTitle(link.title || '');
  };

  const handleSaveEdit = async (id: string) => {
    setSavingEdit(true);
    try {
      const updated = await apiClient.updateLink(id, {
        originalUrl: editUrl,
        title: editTitle,
      });
      setLinks(prev => prev.map(l => l.id === id ? updated : l));
      setEditingId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update destination';
      alert(msg);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this short link?')) return;
    try {
      await apiClient.deleteLink(id);
      setLinks(prev => prev.filter(l => l.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete link';
      alert(msg);
    }
  };

  const copyShortUrl = (shortUrl: string, id: string) => {
    navigator.clipboard.writeText(shortUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getLinkStatus = (link: LinkItem): { label: string; style: string } => {
    if (!link.isActive) {
      return { label: 'Disabled', style: 'bg-slate-100 text-slate-600 border-slate-200' };
    }
    if (link.expiresAt && new Date(link.expiresAt).getTime() <= Date.now()) {
      return { label: 'Expired', style: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    return { label: 'Active', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  return (
    <div className="space-y-6">
      {/* Shorten Form Card */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-indigo-600" />
              <span>Create Short Link</span>
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>Owner: <code className="font-mono text-slate-700">{currentUser}</code></span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Backend Token Verified</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-500 font-mono text-[11px]">Rate Limit: 10 links/min</span>
            </div>
          </div>

          <button
            onClick={loadLinks}
            disabled={loading}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            title="Refresh links"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Destination URL <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/long-page-url..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Custom Alias (Optional)
              </label>
              <input
                type="text"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                placeholder="e.g. docs-v2"
                pattern="^[a-zA-Z0-9_-]{3,32}$"
                title="3-32 characters: alphanumeric, hyphens, underscores"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Title / Label
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Expiry Date (Optional)
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-700"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-[11px] text-slate-500">
              Only HTTP and HTTPS URLs accepted. Collision detection strictly prevents alias duplication.
            </div>

            <button
              type="submit"
              disabled={submitting || !url}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{submitting ? 'Creating Link...' : 'Create SmartLink'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Links Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Your Short Links
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Edit destination URL, toggle activation status, or copy public redirect links
            </p>
          </div>
          <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
            {links.length} {links.length === 1 ? 'Link' : 'Links'}
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            Loading links from Express API...
          </div>
        ) : links.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 space-y-2">
            <p>No links found for this account.</p>
            <p className="text-[11px] text-slate-400">Use the form above to generate your first shortened link.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500">
                  <th className="py-3 px-6 font-medium">Short URL & Code</th>
                  <th className="py-3 px-4 font-medium">Destination URL</th>
                  <th className="py-3 px-4 font-medium text-right">Clicks</th>
                  <th className="py-3 px-4 font-medium text-center">Status</th>
                  <th className="py-3 px-4 font-medium text-center">Expiry</th>
                  <th className="py-3 px-6 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {links.map((link) => {
                  const status = getLinkStatus(link);
                  const isEditing = editingId === link.id;

                  return (
                    <tr key={link.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Short URL & Alias */}
                      <td className="py-3 px-6 font-mono font-medium text-indigo-600">
                        <div className="flex items-center gap-2">
                          <span>/s/{link.shortCode}</span>
                          <button
                            onClick={() => copyShortUrl(link.shortUrl, link.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                            title="Copy short URL"
                          >
                            {copiedId === link.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <a
                            href={`/s/${link.shortCode}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Test redirect in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        {link.title && !isEditing && (
                          <div className="text-[11px] text-slate-500 font-sans mt-0.5 truncate max-w-xs">
                            {link.title}
                          </div>
                        )}
                      </td>

                      {/* Destination URL (View or Edit) */}
                      <td className="py-3 px-4 font-mono text-slate-600 max-w-xs">
                        {isEditing ? (
                          <div className="space-y-1.5 py-1">
                            <input
                              type="url"
                              value={editUrl}
                              onChange={(e) => setEditUrl(e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-indigo-400 rounded font-mono"
                              placeholder="https://..."
                            />
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-sans"
                              placeholder="Title"
                            />
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleSaveEdit(link.id)}
                                disabled={savingEdit}
                                className="px-2 py-0.5 text-[11px] bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-1"
                              >
                                <Save className="w-3 h-3" />
                                <span>Save</span>
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-2 py-0.5 text-[11px] bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="truncate block" title={link.originalUrl}>
                            {link.originalUrl}
                          </span>
                        )}
                      </td>

                      {/* Clicks */}
                      <td className="py-3 px-4 font-mono text-right tabular-nums text-slate-900 font-medium">
                        {link.clickCount}
                      </td>

                      {/* Status & Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(link)}
                          className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${status.style}`}
                          title={`Click to ${link.isActive ? 'disable' : 'enable'}`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{status.label}</span>
                        </button>
                      </td>

                      {/* Expiry */}
                      <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-500">
                        {link.expiresAt ? (
                          <span title={new Date(link.expiresAt).toLocaleString()}>
                            {new Date(link.expiresAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">Never</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => startEditing(link)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                            title="Edit destination & title"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(link.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Delete link"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
