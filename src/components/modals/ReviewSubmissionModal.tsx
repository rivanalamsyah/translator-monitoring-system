import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, CheckCircle, AlertTriangle, FileCheck } from 'lucide-react';
import { formatDuration } from '../../utils/formatters';

export const ReviewSubmissionModal: React.FC = () => {
  const {
    activeReviewAssignment,
    setActiveReviewAssignment,
    approveAssignment,
    requestRevision,
  } = useApp();

  const [revisionNotes, setRevisionNotes] = useState('');
  const [isRevisionMode, setIsRevisionMode] = useState(false);

  if (!activeReviewAssignment) return null;

  const handleApprove = () => {
    approveAssignment(activeReviewAssignment.id);
    setActiveReviewAssignment(null);
  };

  const handleSendRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionNotes.trim()) return;
    requestRevision(activeReviewAssignment.id, revisionNotes);
    setActiveReviewAssignment(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-600 text-white shadow-md shadow-pink-600/10">
              <FileCheck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Tinjau Hasil Terjemahan</h2>
              <p className="text-xs text-slate-400">
                {activeReviewAssignment.code} — {activeReviewAssignment.title}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveReviewAssignment(null)}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Details Body */}
        <div className="p-6 space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-400">Penerjemah:</span>
              <span className="font-bold text-slate-850">{activeReviewAssignment.translatorName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Pasangan Bahasa & Halaman:</span>
              <span className="font-semibold text-slate-750">
                {activeReviewAssignment.languageFrom} ({activeReviewAssignment.pageCount} halaman, {activeReviewAssignment.calculatedPoints} pt)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Waktu Kerja:</span>
              <span className="font-mono font-bold text-pink-600">
                {formatDuration(activeReviewAssignment.totalWorkingSeconds)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Waktu Diam / Jeda:</span>
              <span className="font-mono text-amber-600">
                {formatDuration(activeReviewAssignment.totalIdleSeconds)}
              </span>
            </div>
          </div>

          {/* Submitted Google Drive Link */}
          <div className="rounded-lg border border-pink-100 bg-pink-50/70 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <FileCheck className="h-5 w-5 text-pink-600 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-pink-700">Tautan Hasil Pekerjaan (Google Drive):</p>
                <p className="text-[10px] text-slate-500 truncate font-mono mt-0.5">{activeReviewAssignment.resultFileUrl || '-'}</p>
              </div>
            </div>
            {activeReviewAssignment.resultFileUrl && (
              <a
                href={activeReviewAssignment.resultFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 shrink-0 rounded-lg bg-pink-600 text-white px-3 py-1.5 text-xs font-bold hover:bg-pink-700 transition-colors shadow-md shadow-pink-600/10 cursor-pointer"
              >
                <span>Buka Dokumen</span>
              </a>
            )}
          </div>

          {/* Submission Notes */}
          {activeReviewAssignment.submissionNotes && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Catatan Pengiriman Penerjemah:</label>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-500 italic">
                "{activeReviewAssignment.submissionNotes}"
              </div>
            </div>
          )}

          {/* Revision Form Toggle */}
          {isRevisionMode ? (
            <form onSubmit={handleSendRevision} className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-rose-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-rose-500" />
                  Tentukan Catatan Umpan Balik Revisi *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Jelaskan dengan jelas bagian mana yang membutuhkan perbaikan..."
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  className="w-full rounded-lg border border-rose-200 bg-rose-50/20 p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRevisionMode(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 text-xs font-bold shadow-md shadow-rose-655/10 transition-colors cursor-pointer"
                >
                  Kirim Permintaan Revisi
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsRevisionMode(true)}
                className="flex items-center gap-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 px-4 py-2 text-xs font-bold transition-colors cursor-pointer"
              >
                <AlertTriangle className="h-4 w-4" />
                Minta Revisi
              </button>

              <button
                type="button"
                onClick={handleApprove}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 text-xs font-bold shadow-md shadow-emerald-600/10 transition-colors cursor-pointer"
              >
                <CheckCircle className="h-4 w-4" />
                Setujui & Selesaikan
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
