import React from 'react';
import { useApp } from '../../context/AppContext';
import { Clock, Play, Pause, Activity } from 'lucide-react';
import { formatClock, formatDuration } from '../../utils/formatters';
import { StatusBadge } from '../common/Badge';
import { AvatarImage } from '../common/AvatarImage';

export const TimerMonitoring: React.FC = () => {
  const { assignments, translators, timerLogs, pauseAssignmentTimer, resumeAssignmentTimer } = useApp();

  // Active timers: Working or Paused
  const activeTimerAssignments = assignments.filter(
    (a) => a.status === 'WORKING' || a.status === 'PAUSED' || a.status === 'REVISION' || a.status === 'WAITING_REVIEW'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Clock className="h-5 w-5 text-pink-600" />
            <span>Pusat Telemetri Pengukur Waktu Riil</span>
          </h2>
          <p className="text-xs text-slate-400">
            Pantau pengukur waktu kerja berjalan langsung, durasi jeda, alasan penangguhan, dan tenggat waktu para penerjemah
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs font-bold text-pink-600 bg-pink-50 px-3 py-1.5 rounded-lg border border-pink-100">
          <Activity className="h-4 w-4 animate-pulse text-pink-500" />
          <span>{activeTimerAssignments.length} Timer Aktif Berjalan</span>
        </div>
      </div>

      {/* Grid of Active Timer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeTimerAssignments.map((a) => {
          const tr = translators.find((t) => t.id === a.translatorId);

          return (
            <div
              key={a.id}
              className={`rounded-xl border p-5 shadow-xs space-y-4 transition-all bg-white ${
                a.status === 'WORKING'
                  ? 'border-pink-300'
                  : a.status === 'PAUSED'
                  ? 'border-amber-300'
                  : 'border-slate-200'
              }`}
            >
              {/* Translator info & status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <AvatarImage
                    src={tr?.avatar}
                    name={tr?.name}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-100"
                  />
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs">{tr?.name}</h3>
                    <p className="text-[10px] text-slate-400 font-mono">{a.code}</p>
                  </div>
                </div>
                <StatusBadge status={a.status} size="sm" />
              </div>

              {/* Document Title */}
              <div>
                <h4 className="font-bold text-slate-700 text-xs line-clamp-1">{a.title}</h4>
                <p className="text-[10px] text-slate-400">
                  {a.languageFrom} • {a.pageCount} halaman ({a.calculatedPoints} pt)
                </p>
              </div>

              {/* Big Digital Clock Box */}
              <div className="rounded-lg bg-slate-50 border border-slate-200/80 text-slate-800 p-4 text-center space-y-1">
                <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
                  {a.status === 'WORKING' ? 'Total Durasi Kerja' : 'Total Durasi Jeda'}
                </p>
                <div className="text-2xl font-black font-mono tracking-wider text-pink-600">
                  {formatClock(a.status === 'WORKING' ? a.totalWorkingSeconds : a.totalIdleSeconds)}
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 pt-1 font-mono">
                  <span>Kerja: {formatDuration(a.totalWorkingSeconds)}</span>
                  <span>Jeda: {formatDuration(a.totalIdleSeconds)}</span>
                </div>
              </div>

              {/* Pause reason notice if paused */}
              {a.status === 'PAUSED' && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-[11px] text-amber-800">
                  <span className="font-bold">Alasan Jeda: </span>
                  <span>
                    {timerLogs.find((log) => log.assignmentId === a.id && log.type === 'PAUSE')?.reason || 'Interval jeda tercatat'}
                  </span>
                </div>
              )}

              {/* Override Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-mono">Tenggat: {new Date(a.deadlineAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {a.status === 'WORKING' && (
                  <button
                    onClick={() => pauseAssignmentTimer(a.id, 'Jeda Manual Super Admin')}
                    className="flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Pause className="h-3 w-3" />
                    <span>Jeda Timer</span>
                  </button>
                )}
                {a.status === 'PAUSED' && (
                  <button
                    onClick={() => resumeAssignmentTimer(a.id)}
                    className="flex items-center gap-1 rounded-lg bg-pink-600 hover:bg-pink-700 text-white px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Play className="h-3 w-3" />
                    <span>Lanjutkan Timer</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
