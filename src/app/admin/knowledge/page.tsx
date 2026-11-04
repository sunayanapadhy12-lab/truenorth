'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  FileText,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Upload,
  Plus,
  Trash2,
  Search,
  Filter,
  ShieldAlert,
  Calendar,
  Palette,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Info,
  X,
  FileCode,
} from 'lucide-react';
import {
  GuidelineClause,
  TerminologyItem,
  ApprovedFact,
  ColorPaletteItem,
  User,
  ClauseCategory,
  Severity,
} from '@/lib/types';

export default function BrandKnowledgePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'clauses' | 'terms' | 'facts' | 'palette'>('clauses');

  // Data states
  const [clauses, setClauses] = useState<GuidelineClause[]>([]);
  const [terms, setTerms] = useState<TerminologyItem[]>([]);
  const [facts, setFacts] = useState<ApprovedFact[]>([]);
  const [palette, setPalette] = useState<ColorPaletteItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Expanded clauses
  const [expandedClauses, setExpandedClauses] = useState<Record<string, boolean>>({});

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<'file' | 'text'>('file');
  const [pastedText, setPastedText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<{
    fileName: string;
    clauses: GuidelineClause[];
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Add Term / Fact modals
  const [isAddTermOpen, setIsAddTermOpen] = useState(false);
  const [isAddFactOpen, setIsAddFactOpen] = useState(false);
  const [newTerm, setNewTerm] = useState({ term: '', preferredTerm: '', reason: '', isBanned: true });
  const [newFact, setNewFact] = useState({ id: '', statement: '', factValue: '', effectiveDate: '', expiryDate: '', sourceDoc: '' });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [userRes, clausesRes, termsRes, factsRes, paletteRes] = await Promise.all([
        fetch('/api/auth/me').then((r) => r.json()),
        fetch('/api/knowledge/clauses').then((r) => r.json()),
        fetch('/api/knowledge/terms').then((r) => r.json()),
        fetch('/api/knowledge/facts').then((r) => r.json()),
        fetch('/api/knowledge/palette').then((r) => r.json()),
      ]);

      if (userRes.user) setCurrentUser(userRes.user);
      if (clausesRes.clauses) setClauses(clausesRes.clauses);
      if (termsRes.terminology) setTerms(termsRes.terminology);
      if (factsRes.facts) setFacts(factsRes.facts);
      if (paletteRes.palette) setPalette(paletteRes.palette);
    } catch (err) {
      console.error('Error fetching brand knowledge:', err);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  // Toggle clause expand
  const toggleClause = (id: string) => {
    setExpandedClauses((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Delete clause
  const handleDeleteClause = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm(`Are you sure you want to delete clause ${id}?`)) return;
    try {
      const res = await fetch(`/api/knowledge/clauses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setClauses((prev) => prev.filter((c) => c.id !== id));
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete');
      }
    } catch {
      alert('Network error deleting clause');
    }
  };

  // Delete Term
  const handleDeleteTerm = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm('Are you sure you want to delete this term?')) return;
    try {
      const res = await fetch(`/api/knowledge/terms/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTerms((prev) => prev.filter((t) => t.id !== id));
      }
    } catch {
      alert('Network error');
    }
  };

  // Delete Fact
  const handleDeleteFact = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm('Are you sure you want to delete this fact?')) return;
    try {
      const res = await fetch(`/api/knowledge/facts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFacts((prev) => prev.filter((f) => f.id !== id));
      }
    } catch {
      alert('Network error');
    }
  };

  // Document Parse Action
  const handleParseDocument = async () => {
    setImportError(null);
    setIsParsing(true);
    try {
      let body: FormData | string;
      const headers: Record<string, string> = {};

      if (importMode === 'file') {
        if (!selectedFile) {
          setImportError('Please select a file to parse (PDF, DOCX, MD, or TXT).');
          setIsParsing(false);
          return;
        }

        // 5MB check on client as well
        if (selectedFile.size > 5 * 1024 * 1024) {
          setImportError('File exceeds 5MB limit. Please upload a smaller document.');
          setIsParsing(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);
        body = formData;
      } else {
        if (!pastedText.trim()) {
          setImportError('Please enter guideline text to parse.');
          setIsParsing(false);
          return;
        }
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({ text: pastedText });
      }

      const res = await fetch('/api/knowledge/parse-doc', {
        method: 'POST',
        headers,
        body,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to extract document');
      }

      setParsedPreview({
        fileName: data.fileName,
        clauses: data.clauses,
      });
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Unknown parse error');
    } finally {
      setIsParsing(false);
    }
  };

  // Save parsed clauses
  const handleSaveImportedClauses = async () => {
    if (!parsedPreview?.clauses) return;
    try {
      const res = await fetch('/api/knowledge/clauses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedPreview.clauses),
      });
      if (res.ok) {
        setClauses((prev) => [...prev, ...parsedPreview.clauses]);
        setIsImportModalOpen(false);
        setParsedPreview(null);
        setSelectedFile(null);
        setPastedText('');
      } else {
        const d = await res.json();
        setImportError(d.error || 'Failed to save imported clauses');
      }
    } catch {
      setImportError('Network error saving clauses');
    }
  };

  // Add Term Submit
  const handleAddTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/knowledge/terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTerm),
      });
      const data = await res.json();
      if (res.ok) {
        setTerms((prev) => [...prev, data.item]);
        setIsAddTermOpen(false);
        setNewTerm({ term: '', preferredTerm: '', reason: '', isBanned: true });
      } else {
        alert(data.error);
      }
    } catch {
      alert('Error creating term');
    }
  };

  // Add Fact Submit
  const handleAddFact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/knowledge/facts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFact),
      });
      const data = await res.json();
      if (res.ok) {
        setFacts((prev) => [...prev, data.fact]);
        setIsAddFactOpen(false);
        setNewFact({ id: '', statement: '', factValue: '', effectiveDate: '', expiryDate: '', sourceDoc: '' });
      } else {
        alert(data.error);
      }
    } catch {
      alert('Error creating fact');
    }
  };

  // Filtered clauses
  const filteredClauses = clauses.filter((c) => {
    const matchesSearch =
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.fullText.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getSeverityBadge = (sev: Severity) => {
    switch (sev) {
      case 'critical':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'info':
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getCategoryBadge = (cat: ClauseCategory) => {
    switch (cat) {
      case 'tone':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'terminology':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'claim':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'accessibility':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'visual':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'compliance':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cranberry-800 bg-cranberry-100 px-2 py-0.5 rounded-md border border-cranberry-200">
              Admin Governance Hub
            </span>
            <span className="text-xs text-slate-500 font-medium">Cranberry Labs Inc.</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
            Brand Knowledge & Grounding Truth
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            This repository contains the verified rules, terminology, approved facts, and color tokens that the Hybrid Review Engine evaluates drafts against.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin ? (
            <>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cranberry-700 hover:bg-cranberry-800 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Guidelines Document</span>
              </button>
            </>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-xs">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Read-Only ({currentUser?.role}) — Switch to Admin in header to edit</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mt-6 space-x-8">
        <button
          onClick={() => setActiveTab('clauses')}
          className={`pb-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'clauses'
              ? 'border-cranberry-700 text-cranberry-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Guideline Clauses ({clauses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('terms')}
          className={`pb-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'terms'
              ? 'border-cranberry-700 text-cranberry-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Terminology ({terms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('facts')}
          className={`pb-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'facts'
              ? 'border-cranberry-700 text-cranberry-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          <span>Approved Facts ({facts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('palette')}
          className={`pb-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'palette'
              ? 'border-cranberry-700 text-cranberry-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Color Palette ({palette.length})</span>
        </button>
      </div>

      {/* Tab 1: Guideline Clauses */}
      {activeTab === 'clauses' && (
        <div className="py-6 space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search clauses by keyword, ID, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cranberry-500/20"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none"
              >
                <option value="all">All Categories ({clauses.length})</option>
                <option value="tone">Tone</option>
                <option value="terminology">Terminology</option>
                <option value="claim">Claims & Guarantees</option>
                <option value="accessibility">Accessibility</option>
                <option value="visual">Visual & Assets</option>
                <option value="compliance">Compliance</option>
              </select>
            </div>
          </div>

          {/* Clauses List */}
          <div className="grid grid-cols-1 gap-3">
            {filteredClauses.map((clause) => {
              const isExpanded = Boolean(expandedClauses[clause.id]);
              return (
                <div
                  key={clause.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {clause.id}
                        </span>
                        <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getCategoryBadge(clause.category)}`}>
                          {clause.category}
                        </span>
                        <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getSeverityBadge(clause.severity)}`}>
                          {clause.severity}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900">{clause.title}</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{clause.summary}</p>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl leading-relaxed">
                          <strong className="block text-slate-800 text-[11px] uppercase tracking-wider mb-1">
                            Full Guideline Clause Text:
                          </strong>
                          {clause.fullText}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleClause(clause.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title={isExpanded ? 'Collapse' : 'Expand full text'}
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteClause(clause.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete clause"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredClauses.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
                No guideline clauses match your search or filter.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Terminology */}
      {activeTab === 'terms' && (
        <div className="py-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Deterministic banned terms, product-name casing standards, and DEI inclusive terminology rules.
            </p>
            {isAdmin && (
              <button
                onClick={() => setIsAddTermOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cranberry-700 text-white font-semibold text-xs hover:bg-cranberry-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Term</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-xs">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold">
                <tr>
                  <th className="px-4 py-3">Term / Pattern</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Preferred Term / Replacement</th>
                  <th className="px-4 py-3">Governance Reason</th>
                  <th className="px-4 py-3">Clause Reference</th>
                  {isAdmin && <th className="px-4 py-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {terms.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-900 font-mono">
                      {item.term}
                      {item.caseSensitive && (
                        <span className="ml-1.5 text-[10px] text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                          Case-Sensitive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {item.isBanned ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                          Banned
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Preferred
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-emerald-700">
                      {item.preferredTerm || '—'}
                    </td>
                    <td className="px-4 py-3 max-w-xs">{item.reason}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      {item.clauseId || '—'}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteTerm(item.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Approved Facts */}
      {activeTab === 'facts' && (
        <div className="py-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Ground truth for pricing, active metrics, SLA performance, and certifications. Red badges highlight expired facts for negative test cases.
            </p>
            {isAdmin && (
              <button
                onClick={() => setIsAddFactOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cranberry-700 text-white font-semibold text-xs hover:bg-cranberry-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Fact</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-xs">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold">
                <tr>
                  <th className="px-4 py-3">Fact ID</th>
                  <th className="px-4 py-3">Statement</th>
                  <th className="px-4 py-3">Approved Value</th>
                  <th className="px-4 py-3">Effective Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Source Document Citation</th>
                  {isAdmin && <th className="px-4 py-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {facts.map((fact) => {
                  const isExpired = fact.expiryDate && new Date(fact.expiryDate) < new Date();
                  return (
                    <tr key={fact.id} className={`hover:bg-slate-50/50 ${isExpired ? 'bg-amber-50/20' : ''}`}>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{fact.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{fact.statement}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{fact.factValue}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{fact.effectiveDate}</td>
                      <td className="px-4 py-3">
                        {isExpired ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                            Expired ({fact.expiryDate})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active & Valid
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{fact.sourceDoc}</td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteFact(fact.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Color Palette */}
      {activeTab === 'palette' && (
        <div className="py-6 space-y-4">
          <p className="text-xs text-slate-500">
            Brand color tokens with target WCAG contrast ratios against body backgrounds.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {palette.map((p) => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-xl border border-slate-200 shadow-inner shrink-0"
                  style={{ backgroundColor: p.hex }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{p.name}</h4>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {p.role}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-slate-700 font-semibold mt-0.5">{p.hex}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Min Contrast: <strong className="text-slate-800">{p.minContrastRatio}:1</strong>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-cranberry-700" />
                <h3 className="text-base font-bold text-slate-900">Import Brand Guidelines & Auto-Split</h3>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParsedPreview(null);
                  setImportError(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {importError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {!parsedPreview ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setImportMode('file')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-xl border ${
                      importMode === 'file'
                        ? 'bg-cranberry-50 text-cranberry-800 border-cranberry-300'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    Upload Document (PDF, DOCX, MD, TXT $\le$ 5MB)
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode('text')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-xl border ${
                      importMode === 'text'
                        ? 'bg-cranberry-50 text-cranberry-800 border-cranberry-300'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    Paste Text / Markdown
                  </button>
                </div>

                {importMode === 'file' ? (
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-cranberry-400 transition-colors">
                    <FileCode className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">
                      {selectedFile ? selectedFile.name : 'Choose a guideline document'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">PDF, Word (.docx), Markdown (.md), or Text (.txt) up to 5 MB</p>
                    <input
                      type="file"
                      accept=".pdf,.docx,.md,.txt"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="mt-3 text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border file:border-slate-300 file:bg-white file:text-xs file:font-semibold"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Paste Brand Guideline Content (Markdown headings or numbered clauses supported):
                    </label>
                    <textarea
                      rows={8}
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder="## Tone of Voice&#10;Never use hyperbolic hype...&#10;&#10;## Claim Verification&#10;All uptime statements must be backed by benchmark SLA..."
                      className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cranberry-500/20"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleParseDocument}
                    disabled={isParsing}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-cranberry-700 text-white hover:bg-cranberry-800 disabled:opacity-50"
                  >
                    {isParsing ? 'Analyzing Document & Splitting Clauses...' : 'Parse & Preview Clauses'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center justify-between">
                  <span>
                    Successfully extracted and split <strong>{parsedPreview.clauses.length} clause(s)</strong> from{' '}
                    <strong>{parsedPreview.fileName}</strong>.
                  </span>
                  <button
                    onClick={() => setParsedPreview(null)}
                    className="text-xs font-semibold text-emerald-800 underline"
                  >
                    Re-upload
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {parsedPreview.clauses.map((c) => (
                    <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-slate-800">{c.id}</span>
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-white border border-slate-200">
                          {c.category}
                        </span>
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-white border border-slate-200">
                          {c.severity}
                        </span>
                      </div>
                      <p className="font-bold text-slate-900">{c.title}</p>
                      <p className="text-slate-600 text-[11px] mt-0.5">{c.summary}</p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setParsedPreview(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSaveImportedClauses}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-cranberry-700 text-white hover:bg-cranberry-800"
                  >
                    Confirm & Save {parsedPreview.clauses.length} Clauses to Knowledge Base
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Term Modal */}
      {isAddTermOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleAddTerm} className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Add Terminology Rule</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Term / Pattern</label>
              <input
                required
                type="text"
                value={newTerm.term}
                onChange={(e) => setNewTerm({ ...newTerm, term: e.target.value })}
                placeholder="e.g. 100% secure"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Replacement</label>
              <input
                type="text"
                value={newTerm.preferredTerm}
                onChange={(e) => setNewTerm({ ...newTerm, preferredTerm: e.target.value })}
                placeholder="e.g. defense-in-depth security"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Governance Reason</label>
              <textarea
                required
                rows={2}
                value={newTerm.reason}
                onChange={(e) => setNewTerm({ ...newTerm, reason: e.target.value })}
                placeholder="Indicate why this term is governed"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddTermOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-cranberry-700 text-white"
              >
                Save Term
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Fact Modal */}
      {isAddFactOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleAddFact} className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Add Approved Fact</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fact ID</label>
              <input
                required
                type="text"
                value={newFact.id}
                onChange={(e) => setNewFact({ ...newFact, id: e.target.value })}
                placeholder="e.g. FACT-METRIC-01"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Statement</label>
              <input
                required
                type="text"
                value={newFact.statement}
                onChange={(e) => setNewFact({ ...newFact, statement: e.target.value })}
                placeholder="e.g. Global latency SLA"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Approved Value</label>
              <input
                required
                type="text"
                value={newFact.factValue}
                onChange={(e) => setNewFact({ ...newFact, factValue: e.target.value })}
                placeholder="e.g. 42ms"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Effective Date</label>
                <input
                  required
                  type="date"
                  value={newFact.effectiveDate}
                  onChange={(e) => setNewFact({ ...newFact, effectiveDate: e.target.value })}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date (Optional)</label>
                <input
                  type="date"
                  value={newFact.expiryDate}
                  onChange={(e) => setNewFact({ ...newFact, expiryDate: e.target.value })}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Source Document</label>
              <input
                required
                type="text"
                value={newFact.sourceDoc}
                onChange={(e) => setNewFact({ ...newFact, sourceDoc: e.target.value })}
                placeholder="e.g. Q2 2026 Audit Report"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddFactOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-cranberry-700 text-white"
              >
                Save Fact
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

