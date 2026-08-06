import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, PauseCircle, Coffee, BookOpen, MessageSquare, AlertCircle } from 'lucide-react';

export const PauseReasonModal: React.FC = () => {
  const { activePauseAssignment, setActivePauseAssignment, pauseAssignmentTimer } = useApp();

  const [customReason, setCustomReason] = useState('');
  const [selectedQuickReason, setSelectedQuickReason] = useState('Istirahat / Makan siang');

  if (!activePauseAssignment) return null;

  const quickReasons = [
    { label: 'Istirahat / Makan siang', icon: Coffee },
    { label: 'Riset Terminologi & Kamus', icon: BookOpen },
    { label: 'Konsultasi / Klarifikasi Klien', icon: MessageSquare },
    { label: 'Jeda Sistem / Teknis', icon: AlertCircle },
  ];

  const handleConfirmPause = (e: React.FormEvent) => {
    e.preventDefault();
    const reason = customReason.trim() || selectedQuickReason;
    pauseAssignmentTimer(activePauseAssignment.id, reason);
    setActivePauseAssignment(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Sticky Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white shadow-md shadow-amber-500/10">
              <PauseCircle className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Jeda Pengukur Waktu Tugas</h2>
              <p className="text-xs text-slate-400">Tentukan alasan pencatatan waktu diam</p>
            </div>
          </div>
          <button
            onClick={() => setActivePauseAssignment(null)}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleConfirmPause} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-slate-700">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">Alasan Jeda Cepat:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickReasons.map((qr) => {
                  const Icon = qr.icon;
                  const isSel = selectedQuickReason === qr.label && !customReason;
                  return (
                    <button
                      key={qr.label}
                      type="button"
                      onClick={() => {
                        setSelectedQuickReason(qr.label);
                        setCustomReason('');
                      }}
                      className={`flex items-center gap-2 rounded-lg p-3 text-left border text-xs font-medium transition-all cursor-pointer ${
                        isSel
                          ? 'bg-amber-50 border-amber-500/50 text-amber-800 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/50'
                      }`}
                    >
                      <Icon className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>{qr.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Alasan Spesifik Lain (Opsional):</label>
              <input
                type="text"
                placeholder="contoh: Menghadiri rapat koordinasi tim..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-850 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="shrink-0 flex items-center justify-end gap-3 p-4 border-t border-slate-100 bg-slate-50/50">
            <button
              type="button"
              onClick={() => setActivePauseAssignment(null)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              Konfirmasi Jeda
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
