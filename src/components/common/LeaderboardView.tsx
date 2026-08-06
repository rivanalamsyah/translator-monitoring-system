import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AvatarImage } from './AvatarImage';
import { formatDuration } from '../../utils/formatters';
import {
  Trophy,
  Star,
  Award,
  TrendingUp,
  TrendingDown,
  Minus,
  Crown,
  Medal,
  Zap,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Gem,
  Layers,
  CircleDot,
  History,
  Users,
} from 'lucide-react';

// ── Badge definitions (icon-based, no emoji) ───────────────────────────────────
const BADGE_TIERS: {
  key: string;
  label: string;
  desc: string;
  minPoints: number;
  maxPoints: number | null;
  Icon: React.ElementType;
  iconColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  barColor: string;
}[] = [
    {
      key: 'pemula',
      label: 'Pemula',
      desc: '0 – 99 poin',
      minPoints: 0,
      maxPoints: 99,
      Icon: Star,
      iconColor: 'text-slate-400',
      badgeBg: 'bg-slate-50',
      badgeBorder: 'border-slate-250',
      badgeText: 'text-slate-600',
      barColor: 'bg-slate-400',
    },
    {
      key: 'berkembang',
      label: 'Berkembang',
      desc: '100 – 299 poin',
      minPoints: 100,
      maxPoints: 299,
      Icon: Award,
      iconColor: 'text-sky-600',
      badgeBg: 'bg-sky-50',
      badgeBorder: 'border-sky-250',
      badgeText: 'text-sky-700',
      barColor: 'bg-sky-500',
    },
    {
      key: 'profesional',
      label: 'Profesional',
      desc: '300 – 699 poin',
      minPoints: 300,
      maxPoints: 699,
      Icon: Medal,
      iconColor: 'text-amber-500',
      badgeBg: 'bg-amber-50',
      badgeBorder: 'border-amber-250',
      badgeText: 'text-amber-700',
      barColor: 'bg-amber-500',
    },
    {
      key: 'ahli',
      label: 'Ahli',
      desc: '700 – 1499 poin',
      minPoints: 700,
      maxPoints: 1499,
      Icon: ShieldCheck,
      iconColor: 'text-indigo-600',
      badgeBg: 'bg-indigo-50',
      badgeBorder: 'border-indigo-250',
      badgeText: 'text-indigo-700',
      barColor: 'bg-indigo-600',
    },
    {
      key: 'master',
      label: 'Master',
      desc: '1500+ poin',
      minPoints: 1500,
      maxPoints: null,
      Icon: Crown,
      iconColor: 'text-pink-600',
      badgeBg: 'bg-pink-50',
      badgeBorder: 'border-pink-250',
      badgeText: 'text-pink-700',
      barColor: 'bg-pink-600',
    },
  ];

function getBadgeTier(points: number) {
  for (let i = BADGE_TIERS.length - 1; i >= 0; i--) {
    if (points >= BADGE_TIERS[i].minPoints) return BADGE_TIERS[i];
  }
  return BADGE_TIERS[0];
}

function getLevelInfo(points: number) {
  const level = Math.floor(points / 100) + 1;
  const xp = points % 100;
  const nextLevelPoints = level * 100;
  return { level, xp, nextLevelPoints };
}

// ── Rank badge (rank number chips) ────────────────────────────────────────────
const RankChip: React.FC<{ rank: number }> = ({ rank }) => {
  if (rank === 1)
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400 shadow-sm">
        <Crown className="w-4 h-4 text-white" />
      </div>
    );
  if (rank === 2)
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-300">
        <Medal className="w-4 h-4 text-slate-600" />
      </div>
    );
  if (rank === 3)
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-600/80">
        <Medal className="w-4 h-4 text-white" />
      </div>
    );
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 border border-slate-200">
      <span className="text-xs font-bold text-slate-500">#{rank}</span>
    </div>
  );
};

// ── Trend Icon ─────────────────────────────────────────────────────────────────
const TrendBadge: React.FC<{ trend?: 'UP' | 'DOWN' | 'STABLE' }> = ({ trend }) => {
  if (trend === 'UP')
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
        <TrendingUp className="w-3 h-3" /> Naik
      </span>
    );
  if (trend === 'DOWN')
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
        <TrendingDown className="w-3 h-3" /> Turun
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-full">
      <Minus className="w-3 h-3" /> Stabil
    </span>
  );
};

// ── Inline Badge Icon ──────────────────────────────────────────────────────────
const TierIconBadge: React.FC<{ points: number; size?: 'sm' | 'md' }> = ({ points, size = 'sm' }) => {
  const tier = getBadgeTier(points);
  const { Icon } = tier;
  const s = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border p-0.5 ${tier.badgeBg} ${tier.badgeBorder}`}
      title={tier.label}
    >
      <Icon className={`${s} ${tier.iconColor}`} />
    </span>
  );
};

// ── Podium section ─────────────────────────────────────────────────────────────
const PodiumSection: React.FC<{ top3: any[] }> = ({ top3 }) => {
  const heights = [24, 20, 16]; // in rem/px units mapped to tailwind
  const heightClass = ['h-24', 'h-20', 'h-14'];
  // Order: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const podiumRanks = [2, 1, 3];
  const podiumColors = [
    { ring: 'ring-slate-300', pillar: 'bg-slate-100 border-slate-200', num: 'text-slate-400' },
    { ring: 'ring-amber-400', pillar: 'bg-amber-50  border-amber-200', num: 'text-amber-500' },
    { ring: 'ring-amber-700/70', pillar: 'bg-orange-50 border-orange-200', num: 'text-amber-700' },
  ];

  // Reorder display: idx0=rank2 idx1=rank1 idx2=rank3
  const displayItems = [
    { data: top3[1], rank: 2, colors: podiumColors[0], height: heightClass[0] },
    { data: top3[0], rank: 1, colors: podiumColors[1], height: heightClass[1] },
    { data: top3[2], rank: 3, colors: podiumColors[2], height: heightClass[2] },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Podium header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-pink-600" />
          Top 3 Penerjemah Terbaik
        </h3>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
          Real-time
        </span>
      </div>

      <div className="px-6 py-8">
        <div className="flex items-end justify-center gap-6">
          {displayItems.map(({ data, rank, colors, height }) => {
            if (!data) return null;
            const tier = getBadgeTier(data.points);
            const { TierIcon } = { TierIcon: tier.Icon };
            return (
              <div key={data.id} className={`flex flex-col items-center gap-3 ${rank === 1 ? '' : 'opacity-90'}`}>
                {/* Crown for rank 1 */}
                {rank === 1 && (
                  <Crown className="w-5 h-5 text-amber-400" />
                )}

                {/* Avatar */}
                <div className={`relative w-16 h-16 rounded-full ring-4 ${colors.ring} shadow-md`}>
                  <AvatarImage
                    src={data.avatar}
                    name={data.name}
                    gender={data.gender}
                    size={64}
                    className="w-full h-full rounded-full object-cover"
                  />
                  {/* Tier icon overlay */}
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${tier.badgeBg}`}>
                    <tier.Icon className={`w-3 h-3 ${tier.iconColor}`} />
                  </div>
                </div>

                {/* Name & points */}
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-800 max-w-[90px] truncate leading-tight">{data.name}</p>
                  <p className={`text-sm font-extrabold mt-0.5 ${rank === 1 ? 'text-amber-500' : 'text-slate-700'}`}>
                    {(data.points || 0).toLocaleString()}
                  </p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider">poin</p>
                  
                  {/* Aggregated stats for top 3 */}
                  <div className="text-[9px] text-slate-450 space-y-0.5 mt-2 leading-none border-t border-slate-100 pt-1.5 font-medium">
                    <p>{data.completedCount} task • {data.totalPages} hlm</p>
                    <p>Waktu: {formatDuration(data.totalWorkSecs)}</p>
                    <p>Rerata: {formatDuration(data.avgWorkSecsPerTask)}</p>
                  </div>
                </div>

                {/* Podium pillar */}
                <div className={`w-24 ${height} rounded-t-xl border ${colors.pillar} flex items-center justify-center`}>
                  <span className={`text-3xl font-black ${colors.num}`}>{rank}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── Point type config ──────────────────────────────────────────────────────────
const POINT_TYPE_CONFIG: Record<string, {
  label: string; Icon: React.ElementType;
  iconColor: string; bg: string; textColor: string;
}> = {
  BASE: { label: 'Poin Dasar', Icon: CheckCircle2, iconColor: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', textColor: 'text-emerald-700' },
  SPEED_BONUS: { label: 'Bonus Cepat', Icon: Zap, iconColor: 'text-sky-600', bg: 'bg-sky-50 border-sky-200', textColor: 'text-sky-700' },
  QUALITY_BONUS: { label: 'Bonus Kualitas', Icon: Star, iconColor: 'text-amber-500', bg: 'bg-amber-50 border-amber-200', textColor: 'text-amber-700' },
  LATE_PENALTY: { label: 'Penalti Telat', Icon: XCircle, iconColor: 'text-red-500', bg: 'bg-red-50 border-red-200', textColor: 'text-red-600' },
  REVISION_PENALTY: { label: 'Penalti Revisi', Icon: Clock, iconColor: 'text-orange-500', bg: 'bg-orange-50 border-orange-200', textColor: 'text-orange-600' },
};

// ── Main LeaderboardView ───────────────────────────────────────────────────────
export const LeaderboardView: React.FC = () => {
  const { translators, rewardPointHistory, claimableTasks } = useApp();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'badges' | 'history'>('leaderboard');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('CURRENT_MONTH');

  const ranked = useMemo(() => {
    const now = new Date();
    const currentMonth = now.toISOString().substring(0, 7); // "YYYY-MM"
    
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = lastMonthDate.toISOString().substring(0, 7);

    const statsMap: Record<string, {
      id: string;
      name: string;
      avatar: string;
      gender?: 'male' | 'female';
      points: number;
      completedCount: number;
      totalPages: number;
      totalWorkSecs: number;
      avgWorkSecsPerTask: number;
    }> = {};

    translators.forEach(tr => {
      statsMap[tr.id] = {
        id: tr.id,
        name: tr.name,
        avatar: tr.avatar || '',
        gender: (tr as any).gender,
        points: selectedPeriod === 'ALL_TIME' ? (tr.points || 0) : 0,
        completedCount: 0,
        totalPages: 0,
        totalWorkSecs: 0,
        avgWorkSecsPerTask: 0
      };
    });

    if (selectedPeriod !== 'ALL_TIME') {
      const targetMonth = selectedPeriod === 'CURRENT_MONTH' ? currentMonth : lastMonth;
      rewardPointHistory.forEach(historyItem => {
        if (!historyItem.timestamp) return;
        const itemMonth = historyItem.timestamp.substring(0, 7);
        if (itemMonth === targetMonth && statsMap[historyItem.translatorId]) {
          statsMap[historyItem.translatorId].points += historyItem.points || 0;
        }
      });
    }

    const targetMonth = selectedPeriod === 'ALL_TIME' 
      ? null 
      : (selectedPeriod === 'CURRENT_MONTH' ? currentMonth : lastMonth);

    claimableTasks.forEach(task => {
      if (task.status !== 'COMPLETED' || !task.claimedById) return;
      
      const trId = task.claimedById;
      if (!statsMap[trId]) return;

      if (targetMonth) {
        if (!task.completedAt) return;
        const compMonth = task.completedAt.substring(0, 7);
        if (compMonth !== targetMonth) return;
      }

      statsMap[trId].completedCount += 1;
      statsMap[trId].totalPages += task.pageCount || 0;
      statsMap[trId].totalWorkSecs += task.effectiveWorkSeconds || 0;
    });

    const list = Object.values(statsMap).map(tr => {
      const avg = tr.completedCount > 0 ? Math.round(tr.totalWorkSecs / tr.completedCount) : 0;
      return {
        ...tr,
        avgWorkSecsPerTask: avg
      };
    });

    return list.sort((a, b) => b.points - a.points || b.completedCount - a.completedCount);
  }, [translators, rewardPointHistory, claimableTasks, selectedPeriod]);

  const top3 = useMemo(() => ranked.slice(0, 3), [ranked]);

  const history = useMemo(
    () =>
      [...rewardPointHistory]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 50),
    [rewardPointHistory]
  );

  // Summary stats
  const totalPoints = translators.reduce((s, t) => s + (t.points || 0), 0);
  const avgPoints = translators.length ? Math.round(totalPoints / translators.length) : 0;
  const topPoints = ranked[0]?.points || 0;

  const tabs = [
    { id: 'leaderboard', label: 'Papan Peringkat', Icon: Trophy },
    { id: 'badges', label: 'Badge & Level', Icon: Award },
    { id: 'history', label: 'Riwayat Poin', Icon: History },
  ];

  return (
    <div className="space-y-6 pb-10">

      {/* ── Page Header (matches app style) ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-pink-600 via-pink-700 to-rose-600 text-white rounded-2xl p-6 shadow-md border border-pink-700/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-pink-100 uppercase tracking-wider">Sistem Gamifikasi</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-300" />
            Papan Peringkat Penerjemah
          </h1>
          <p className="text-xs text-pink-100/90 max-w-xl">
            Persaingan Reward Point antar penerjemah secara real-time. Selesaikan task lebih banyak, raih peringkat lebih tinggi.
          </p>
        </div>

        {/* Period Selector Dropdown */}
        <div className="shrink-0 flex items-center gap-2 bg-pink-850/40 border border-pink-500/30 px-3.5 py-1.5 rounded-xl">
          <span className="text-xs font-bold text-pink-100">Periode:</span>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-transparent text-xs font-extrabold text-white focus:outline-none cursor-pointer [&>option]:text-slate-800"
          >
            <option value="CURRENT_MONTH">Bulan Ini ({new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })})</option>
            <option value="LAST_MONTH">Bulan Lalu ({new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })})</option>
            <option value="ALL_TIME">Semua Waktu (Akumulatif)</option>
          </select>
        </div>
      </div>

      {/* ── Summary KPI Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Penerjemah', value: translators.length, sub: 'Terdaftar', Icon: Users, color: 'text-pink-600', iconBg: 'bg-pink-50' },
          { label: 'Total Poin Tersebar', value: totalPoints.toLocaleString(), sub: 'Reward Points', Icon: Star, color: 'text-amber-500', iconBg: 'bg-amber-50' },
          { label: 'Rata-rata Poin', value: avgPoints.toLocaleString(), sub: 'Per penerjemah', Icon: BarChart3, color: 'text-indigo-600', iconBg: 'bg-indigo-50' },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">{kpi.label}</span>
              <div className={`w-8 h-8 rounded-lg ${kpi.iconBg} flex items-center justify-center`}>
                <kpi.Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
            </div>
            <p className={`text-2xl font-black ${kpi.color} font-mono`}>{kpi.value}</p>
            <p className="text-[11px] text-slate-400">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Tab Navigation (same as app's filter style) ───────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-1 flex gap-1 w-fit">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${activeTab === id
                ? 'bg-pink-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: Papan Peringkat
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-5">
          {/* Podium */}
          {top3.length >= 1 && <PodiumSection top3={top3} />}

          {/* Full ranking table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-pink-600" />
                Peringkat Lengkap
              </h3>
              <span className="text-[10px] text-slate-400">{ranked.length} penerjemah</span>
            </div>

            {ranked.length === 0 ? (
              <div className="py-14 text-center">
                <Trophy className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-400">Belum ada data peringkat</p>
                <p className="text-xs text-slate-300 mt-1">Penerjemah akan muncul setelah task diselesaikan</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {ranked.map((tr, idx) => {
                  const rank = idx + 1;
                  const tier = getBadgeTier(tr.points);
                  const { level, xp } = getLevelInfo(tr.points);
                  const isTopThree = rank <= 3;

                  return (
                    <div
                      key={tr.id}
                      className={`flex items-center gap-4 px-6 py-3.5 transition-colors
                        ${isTopThree
                          ? 'bg-amber-50/40'
                          : 'hover:bg-slate-50'
                        }`}
                    >
                      {/* Rank chip */}
                      <RankChip rank={rank} />

                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <AvatarImage
                          src={tr.avatar}
                          name={tr.name}
                          gender={(tr as any).gender}
                          size={40}
                          className="w-10 h-10 rounded-full ring-2 ring-slate-200 object-cover"
                        />
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border border-white shadow-sm ${tier.badgeBg}`}>
                          <tier.Icon className={`w-2.5 h-2.5 ${tier.iconColor}`} />
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-slate-800 truncate">{tr.name}</p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${tier.badgeBg} ${tier.badgeBorder} ${tier.badgeText}`}>
                            Lv.{level} · {tier.label}
                          </span>
                          <span className="text-[10px] text-slate-450 font-medium">
                            ({tr.completedCount} task · {tr.totalPages} hlm · Waktu: {formatDuration(tr.totalWorkSecs)} · Rerata: {formatDuration(tr.avgWorkSecsPerTask)})
                          </span>
                          <TrendBadge trend={(tr as any).performanceTrend} />
                        </div>
                        {/* XP Progress bar */}
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${tier.barColor} rounded-full transition-all duration-700`}
                              style={{ width: `${xp}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0 font-mono">{xp}/100 XP</span>
                        </div>
                      </div>

                      {/* Points */}
                      <div className="text-right shrink-0">
                        <p className={`text-lg font-black font-mono ${isTopThree ? 'text-amber-600' : 'text-slate-800'}`}>
                          {tr.points.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">poin</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: Badge & Level
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'badges' && (
        <div className="space-y-5">
          {/* Badge tier reference */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Award className="w-4 h-4 text-pink-600" />
                Sistem Tingkatan Badge
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Kumpulkan Reward Point dari task yang diselesaikan untuk naik tingkatan badge.
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {BADGE_TIERS.map((tier) => {
                const holders = translators.filter((t) => getBadgeTier(t.points || 0).key === tier.key);
                const pct = translators.length ? Math.round((holders.length / translators.length) * 100) : 0;
                return (
                  <div key={tier.key} className="flex items-center gap-5 px-6 py-4 hover:bg-slate-50 transition-colors">
                    {/* Icon */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${tier.badgeBg} ${tier.badgeBorder}`}>
                      <tier.Icon className={`w-5 h-5 ${tier.iconColor}`} />
                    </div>

                    {/* Label + desc */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-bold ${tier.badgeText}`}>{tier.label}</p>
                        <span className="text-[10px] text-slate-400 font-mono">{tier.desc}</span>
                      </div>
                      {/* Distribution bar */}
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full ${tier.barColor} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">{pct}%</span>
                      </div>
                    </div>

                    {/* Holder count */}
                    <div className="text-right shrink-0">
                      <p className={`text-xl font-black font-mono ${tier.iconColor}`}>{holders.length}</p>
                      <p className="text-[10px] text-slate-400">penerjemah</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Per-translator badge detail */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-pink-600" />
                Badge & Kemajuan Penerjemah
              </h3>
            </div>
            {ranked.length === 0 ? (
              <div className="py-12 text-center">
                <Award className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Belum ada data penerjemah</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {ranked.map((tr, idx) => {
                  const tier = getBadgeTier(tr.points);
                  const { level, xp, nextLevelPoints } = getLevelInfo(tr.points);
                  const remaining = nextLevelPoints - tr.points;
                  return (
                    <div key={tr.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors">
                      {/* Rank number */}
                      <span className="w-6 text-xs font-bold text-slate-400 text-center shrink-0">#{idx + 1}</span>

                      {/* Avatar */}
                      <AvatarImage
                        src={tr.avatar}
                        name={tr.name}
                        gender={(tr as any).gender}
                        size={36}
                        className="w-9 h-9 rounded-full ring-2 ring-slate-200 shrink-0"
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-slate-800 truncate">{tr.name}</p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${tier.badgeBg} ${tier.badgeBorder} ${tier.badgeText} flex items-center gap-1`}>
                            <tier.Icon className="w-2.5 h-2.5" />
                            {tier.label}
                          </span>
                        </div>
                        {/* XP bar */}
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${tier.barColor} rounded-full transition-all duration-700`}
                              style={{ width: `${xp}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0">{xp}/100 XP</span>
                        </div>
                      </div>

                      {/* Level & remaining */}
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-slate-800 font-mono">Lv.{level}</p>
                        <p className="text-[10px] text-slate-400">{remaining} poin ke Lv.{level + 1}</p>
                      </div>

                      {/* Total points */}
                      <div className="text-right shrink-0 w-16">
                        <p className={`text-base font-extrabold font-mono ${tier.iconColor}`}>{tr.points}</p>
                        <p className="text-[9px] text-slate-400 uppercase tracking-wide">poin</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: Riwayat Poin
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div className="space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Transaksi', value: rewardPointHistory.length, Icon: History, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Total Poin Diberikan', value: rewardPointHistory.filter((h) => h.points > 0).reduce((s, h) => s + h.points, 0), Icon: ArrowUpRight, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Total Penalti', value: rewardPointHistory.filter((h) => h.points < 0).reduce((s, h) => s + h.points, 0), Icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">{s.label}</span>
                  <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                    <s.Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                </div>
                <p className={`text-2xl font-black font-mono ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* History table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <History className="w-4 h-4 text-pink-600" />
              <h3 className="text-sm font-bold text-slate-800">Riwayat Distribusi Poin (50 Terakhir)</h3>
            </div>

            {history.length === 0 ? (
              <div className="py-14 text-center">
                <History className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-400">Belum ada riwayat poin</p>
                <p className="text-xs text-slate-300 mt-1">
                  Poin akan muncul setelah task diselesaikan dan disetujui admin
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {history.map((h) => {
                  const tr = translators.find((t) => t.id === h.translatorId);
                  const cfg = POINT_TYPE_CONFIG[h.type] || POINT_TYPE_CONFIG.BASE;
                  const isBonus = h.points > 0;
                  return (
                    <div
                      key={h.id}
                      className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors"
                    >
                      {/* Type icon */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${cfg.bg}`}>
                        <cfg.Icon className={`w-4 h-4 ${cfg.iconColor}`} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{h.taskTitle}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <span className="font-medium text-slate-600">{tr?.name || 'Penerjemah'}</span>
                          <span>·</span>
                          <span>
                            {new Date(h.timestamp).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}{' '}
                            {new Date(h.timestamp).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </p>
                      </div>

                      {/* Type label */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${cfg.bg} ${cfg.textColor} hidden sm:inline-flex`}>
                        {cfg.label}
                      </span>

                      {/* Points */}
                      <div className="text-right shrink-0">
                        <p className={`text-base font-extrabold font-mono ${isBonus ? 'text-emerald-600' : 'text-red-500'}`}>
                          {isBonus ? '+' : ''}{h.points}
                        </p>
                        <p className="text-[9px] text-slate-400 uppercase tracking-wide">poin</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
