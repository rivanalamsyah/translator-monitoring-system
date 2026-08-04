import React from 'react';
import { TranslatorStatus, AssignmentStatus, Priority } from '../../types';
import { getStatusTheme } from '../../utils/formatters';
import { AlertCircle, ArrowUp, Minus, ArrowDown } from 'lucide-react';

interface StatusBadgeProps {
  status: TranslatorStatus | AssignmentStatus;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', showDot = true }) => {
  const theme = getStatusTheme(status);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-1.5 font-medium',
    lg: 'px-3 py-1.5 text-sm gap-2 font-semibold',
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border whitespace-nowrap transition-colors ${theme.bg} ${theme.text} ${theme.border} ${sizeClasses[size]}`}
    >
      {showDot && <span className={`rounded-full ${theme.dot} ${dotSizes[size]}`} />}
      {theme.label}
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
