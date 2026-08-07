import React from 'react';
import { TranslatorStatus, AssignmentStatus, Priority } from '../../types';
import { getStatusTheme } from '../../utils/formatters';
import {
  AlertCircle,
  ArrowUp,
  Minus,
  ArrowDown,
  CircleCheck,
  BriefcaseBusiness,
  Coffee,
  WifiOff,
  UserCheck,
  Timer,
  CirclePause,
  CircleAlert,
  CheckCircle2,
  CircleX,
  Play,
  ClipboardList
} from 'lucide-react';

interface StatusBadgeProps {
  status: any;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

function getStatusIcon(status: any, sizeClass: string) {
  switch (status) {
    case 'FREE':
      return <CircleCheck className={sizeClass} />;
    case 'BUSY':
      return <BriefcaseBusiness className={sizeClass} />;
    case 'BREAK':
      return <Coffee className={sizeClass} />;
    case 'OFFLINE':
      return <WifiOff className={sizeClass} />;
    case 'ASSIGNED':
      return <UserCheck className={sizeClass} />;
    case 'WORKING':
      return <Timer className={sizeClass} />;
    case 'PAUSED':
      return <CirclePause className={sizeClass} />;
    case 'WAITING_REVIEW':
      return <CircleAlert className={sizeClass} />;
    case 'REVISION':
      return <CircleAlert className={sizeClass} />;
    case 'COMPLETED':
      return <CheckCircle2 className={sizeClass} />;
    case 'UNASSIGNED':
      return <ClipboardList className={sizeClass} />;
    case 'CANCELLED':
      return <CircleX className={sizeClass} />;
    default:
      return null;
  }
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', showDot = true }) => {
  const theme = getStatusTheme(status);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5 font-medium',
    lg: 'px-3 py-1.5 text-sm gap-2 font-semibold',
  };

  const iconSizes = {
    sm: 'h-3 w-3 shrink-0',
    md: 'h-3.5 w-3.5 shrink-0',
    lg: 'h-4 w-4 shrink-0',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border whitespace-nowrap transition-colors ${theme.bg} ${theme.text} ${theme.border} ${sizeClasses[size]}`}
    >
      {showDot && getStatusIcon(status, iconSizes[size])}
      <span>{theme.label}</span>
    </span>
  );
};

interface PriorityBadgeProps {
  priority: Priority;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const priorityLabels: Record<Priority, string> = {
    URGENT: 'Darurat',
    HIGH: 'Tinggi',
    MEDIUM: 'Sedang',
    LOW: 'Rendah',
  };

  const getPriorityConfig = (p: Priority) => {
    switch (p) {
      case 'URGENT':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200/60',
          icon: <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />,
        };
      case 'HIGH':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200/60',
          icon: <ArrowUp className="h-3.5 w-3.5 text-amber-500 shrink-0" />,
        };
      case 'MEDIUM':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200/60',
          icon: <Minus className="h-3.5 w-3.5 text-blue-500 shrink-0" />,
        };
      case 'LOW':
        return {
          bg: 'bg-slate-50 text-slate-600 border-slate-200/60',
          icon: <ArrowDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />,
        };
    }
  };

  const config = getPriorityConfig(priority);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md border whitespace-nowrap ${config.bg}`}
    >
      {config.icon}
      <span>{priorityLabels[priority] || priority}</span>
    </span>
  );
};
