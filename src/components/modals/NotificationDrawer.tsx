import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Bell, Trash2, Info, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatters';

export const NotificationDrawer: React.FC = () => {
  const {
    isNotificationDrawerOpen,
    setIsNotificationDrawerOpen,
    notifications,
    markNotificationRead,
    clearAllNotifications,
  } = useApp();

  if (!isNotificationDrawerOpen) return null;

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'ALERT':
        return <ShieldAlert className="h-4 w-4 text-rose-500" />;
      default:
        return <Info className="h-4 w-4 text-pink-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-slate-50">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-pink-600" />
              <h2 className="text-sm font-bold text-slate-800">Notifikasi</h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearAllNotifications}
                title="Hapus Semua"
                className="rounded p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsNotificationDrawerOpen(false)}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="p-4 space-y-3 max-h-[calc(100vh-8rem)] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Tidak ada notifikasi saat ini.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markNotificationRead(notif.id)}
                  className={`rounded-lg p-3 border transition-all cursor-pointer ${
                    notif.read
                      ? 'bg-slate-50 border-slate-100 opacity-60'
                      : 'bg-white border-slate-200 shadow-xs hover:border-pink-500/20'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">{getNotifIcon(notif.type)}</div>
                    <div className="space-y-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-850 truncate">
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-center text-[10px] text-slate-400">
          Sinkronisasi Mesin Push & Firebase Cloud Messaging Aktif
        </div>
      </div>
    </div>
  );
};
