import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Activity, Search, ShieldCheck } from 'lucide-react';
import { formatDate, formatRelativeTime } from '../../utils/formatters';

export const ActivityLogsView: React.FC = () => {
  const { activityLogs } = useApp();
  const [query, setQuery] = useState('');

  const filtered = activityLogs.filter(
    (l) =>
      l.userName.toLowerCase().includes(query.toLowerCase()) ||
      l.action.toLowerCase().includes(query.toLowerCase()) ||
      l.details.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121214] rounded-xl p-6 border border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" />
            <span>Audit Trail & System Activity History</span>
          </h2>
          <p className="text-xs text-slate-400">Immutable record of all assignment events, status transitions, and timer triggers</p>
        </div>

        <div className="relative">
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search audit trail..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-lg border border-slate-800 bg-[#0C0C0E] pl-9 pr-3 py-2 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#121214] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0C0C0E] text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">Actor</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 px-4 text-center text-slate-500 font-sans text-xs">
                    No activity logs found.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="py-3 px-3 font-bold text-white font-sans text-xs">
                      {log.userName} ({log.userRole})
                    </td>
                    <td className="py-3 px-3 font-bold text-blue-400 font-sans text-xs">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-sans text-xs leading-relaxed">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
