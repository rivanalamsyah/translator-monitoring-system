import { TranslatorStatus, AssignmentStatus } from '../types';

export function formatDuration(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '00j 00m 00d';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);

  const pad = (num: number) => num.toString().padStart(2, '0');
  if (hrs > 0) {
    return `${pad(hrs)}j ${pad(mins)}m ${pad(secs)}d`;
  }
  return `${pad(mins)}m ${pad(secs)}d`;
}

export function formatClock(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00:00';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);

  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

export function formatDate(isoString?: string): string {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).replace('.', ':'); // normalize time separator to colon for Indonesia standard
}

export function formatRelativeTime(isoString?: string): string {
  if (!isoString) return '-';
  const now = new Date();
  const past = new Date(isoString);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins}m yang lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}j yang lalu`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}h yang lalu`;
}

export function getStatusTheme(status: TranslatorStatus | AssignmentStatus) {
  switch (status) {
    case 'FREE':
      return {
        bg: 'bg-pink-50',
        text: 'text-pink-750',
        border: 'border-pink-200/60',
        dot: 'bg-pink-500',
        label: 'FREE',
      };
    case 'BUSY':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200/60',
        dot: 'bg-emerald-500 animate-pulse',
        label: 'BUSY',
      };
    case 'BREAK':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200/60',
        dot: 'bg-amber-500 animate-pulse',
        label: 'BREAK',
      };
    case 'ASSIGNED':
      return {
        bg: 'bg-sky-50',
        text: 'text-sky-700',
        border: 'border-sky-200/60',
        dot: 'bg-sky-500',
        label: 'Ditugaskan',
      };
    case 'WORKING':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200/60',
        dot: 'bg-emerald-500 animate-pulse',
        label: 'Sedang Mengerjakan',
      };
    case 'PAUSED':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200/60',
        dot: 'bg-amber-500',
        label: 'Ditangguhkan',
      };
    case 'WAITING_REVIEW':
      return {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200/60',
        dot: 'bg-purple-500',
        label: 'Menunggu Tinjauan',
      };
    case 'REVISION':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200/60',
        dot: 'bg-rose-500 animate-ping',
        label: 'Revisi',
      };
    case 'COMPLETED':
      return {
        bg: 'bg-teal-50',
        text: 'text-teal-700',
        border: 'border-teal-200/60',
        dot: 'bg-teal-500',
        label: 'Selesai',
      };
    case 'OFFLINE':
      return {
        bg: 'bg-slate-50',
        text: 'text-slate-500',
        border: 'border-slate-200/60',
        dot: 'bg-slate-400',
        label: 'Offline',
      };
    case 'UNASSIGNED':
      return {
        bg: 'bg-slate-50',
        text: 'text-slate-500',
        border: 'border-slate-200/60',
        dot: 'bg-slate-400',
        label: 'Belum Ditugaskan',
      };
    case 'CANCELLED':
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200/60',
        dot: 'bg-red-500',
        label: 'Dibatalkan',
      };
    default:
      return {
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        border: 'border-slate-200',
        dot: 'bg-slate-400',
        label: status,
      };
  }
}

export function formatDocumentType(type: string): string {
  switch (type) {
    case 'Legal':
      return 'Hukum';
    case 'Financial':
      return 'Keuangan';
    case 'Medical':
      return 'Medis';
    case 'Technical':
      return 'Teknis';
    case 'Marketing':
      return 'Pemasaran';
    case 'Academic':
      return 'Akademik';
    case 'General':
      return 'Umum';
    default:
      return type;
  }
}
