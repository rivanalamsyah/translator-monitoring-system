import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AvatarImage } from './AvatarImage';
import { formatDuration } from '../../utils/formatters';
import {
  Trophy,
  Star,
  Award,
  Crown,
  Medal,
  Zap,
  Users,
  Flame,
  Calendar,
  Sparkles,
  BarChart,
  Grid,
  History,
  TrendingUp,
  Gift
} from 'lucide-react';

const BADGE_TIERS = [
  { key: 'beginner', label: 'Beginner', desc: '0 – 99 poin', min: 0, Icon: Star, color: 'text-slate-400 bg-slate-50 border-slate-200' },
  { key: 'active', label: 'Active', desc: '100 – 299 poin', min: 100, Icon: Flame, color: 'text-orange-500 bg-orange-50 border-orange-200' },
  { key: 'top10', label: 'Top 10', desc: 'Peringkat 4 – 10', min: 300, Icon: Trophy, color: 'text-indigo-500 bg-indigo-50 border-indigo-200' },
  { key: 'top3', label: 'Top 3', desc: 'Peringkat 1 – 3', min: 700, Icon: Crown, color: 'text-amber-500 bg-amber-50 border-amber-200' },
  { key: 'champion', label: 'Champion', desc: 'Juara Bulanan', min: 1200, Icon: Sparkles, color: 'text-pink-500 bg-pink-50 border-pink-200' },
  { key: 'legend', label: 'Legend', desc: 'Poin Ekstrem > 2000', min: 2000, Icon: Zap, color: 'text-purple-500 bg-purple-50 border-purple-200' }
];

function getBadge(points: number, rank: number) {
  if (points >= 2000) return BADGE_TIERS[5]; // Legend
  if (rank >= 1 && rank <= 3) return BADGE_TIERS[3]; // Top 3
  if (rank >= 4 && rank <= 10) return BADGE_TIERS[2]; // Top 10
  if (points >= 100) return BADGE_TIERS[1]; // Active
  return BADGE_TIERS[0]; // Beginner
}

export const LeaderboardView: React.FC = () => {
  const { translators, rewardPointHistory, tasks } = useApp();
  const [activeTab, setActiveTab] = useState<'current' | 'lifetime' | 'history' | 'badges'>('current');

  // Ranked translators based on total points
  const rankedAllTime = useMemo(() => {
    return [...translators].sort((a, b) => (b.points || 0) - (a.points || 0));
  }, [translators]);

  // Ranked translators based on current month points
  const rankedMonthly = useMemo(() => {
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    const monthlyPoints: Record<string, number> = {};

    translators.forEach((tr) => {
      monthlyPoints[tr.id] = 0;
    });

    rewardPointHistory.forEach((h) => {
      if (h.timestamp && h.timestamp.substring(0, 7) === currentMonth) {
        monthlyPoints[h.translatorId] = (monthlyPoints[h.translatorId] || 0) + (h.points || 0);
      }
    });

    return [...translators]
      .map((tr) => ({
        ...tr,
        points: monthlyPoints[tr.id] || 0
      }))
      .sort((a, b) => b.points - a.points);
  }, [translators, rewardPointHistory]);

  const currentRanked = activeTab === 'current' ? rankedMonthly : rankedAllTime;

  // Podium (Top 3)
  const top3 = useMemo(() => currentRanked.slice(0, 3), [currentRanked]);
  // Ranks 4+
  const ranksList = useMemo(() => currentRanked.slice(3), [currentRanked]);

  // Champions History Mock
  const championsHistory = [
    { period: 'Juli 2026', championName: 'Rina Selvia', points: 1450, pages: 120, avatar: 'avatar_female' },
    { period: 'Juni 2026', championName: 'Arif Hidayat', points: 1380, pages: 110, avatar: 'avatar_male' },
    { period: 'Mei 2026', championName: 'Rina Selvia', points: 1510, pages: 125, avatar: 'avatar_female' }
  ];

  return (
    <div className="space-y-6">
      {/* Upper header */}
      <div className="bg-white rounded-2xl p-6 border border-[#F3E8F4] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <span>Papan Peringkat & Gamifikasi</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Persaingan sehat untuk mengumpulkan poin reward dari penyelesaian tugas terjemahan secara akurat.
          </p>
        </div>

        {/* Tab filters */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-1 flex gap-1">
          {[
            { id: 'current', label: 'Bulan Ini' },
            { id: 'lifetime', label: 'Sepanjang Waktu' },
            { id: 'badges', label: 'Badge & Medali' },
            { id: 'history', label: 'Juara Bulanan' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-pink-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAMPILAN: BADGE & MEDALI ── */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BADGE_TIERS.map((tier) => {
            const Icon = tier.Icon;
            return (
              <div key={tier.key} className="bg-white rounded-2xl p-5 border border-[#F3E8F4] shadow-xs flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center border shrink-0 ${tier.color}`}>
                  <Icon className="h-6.5 w-6.5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800">{tier.label}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{tier.desc}</p>
                  <span className="inline-block mt-2 px-2 py-0.5 bg-slate-50 text-slate-500 text-[9px] font-bold rounded">
                    Tingkat Poin Masing-Masing
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAMPILAN: JUARA BULANAN ── */}
      {activeTab === 'history' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {championsHistory.map((champ) => (
            <div key={champ.period} className="bg-white rounded-2xl p-5 border border-[#F3E8F4] shadow-xs text-center space-y-3 relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-pink-500 text-white text-[8px] font-extrabold uppercase px-2.5 py-1 rounded-bl-xl tracking-wider">
                Monthly Champion
              </div>
              <div className="mx-auto h-16 w-16 rounded-full border-2 border-amber-400 flex items-center justify-center p-0.5 bg-amber-50">
                <Crown className="h-8 w-8 text-amber-500" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-800">{champ.championName}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Juara Periode: {champ.period}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-slate-50 pt-3">
                <div>
                  <span className="text-slate-400 block">Total Poin</span>
                  <span className="font-black text-pink-500 text-sm font-mono">{champ.points} Pt</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Volume Kerja</span>
                  <span className="font-bold text-slate-700 text-sm font-mono">{champ.pages} Hlm</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAMPILAN: PAPAN PERINGKAT KARTU (CURRENT/LIFETIME) ── */}
      {(activeTab === 'current' || activeTab === 'lifetime') && (
        <div className="space-y-6">
          {/* Top 3 Podium (Visual blocks) */}
          {top3.length > 0 && (
            <div className="flex flex-col md:flex-row items-end justify-center gap-6 pt-4">
              {/* Rank 2 Podium */}
              {top3[1] && (
                <div className="flex flex-col items-center gap-2 order-2 md:order-1 w-full md:w-48 bg-white border border-[#F3E8F4] rounded-2xl p-4 shadow-xs text-center relative">
                  <div className="absolute top-3 left-3 h-6 w-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
                    #2
                  </div>
                  <div className="relative mx-auto h-12 w-12 rounded-full border-2 border-slate-350">
                    <AvatarImage src={top3[1].avatar} name={top3[1].name} className="h-full w-full rounded-full object-cover" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1 mt-2">{top3[1].name}</h4>
                  <p className="text-[10px] font-black text-pink-500">{top3[1].points || 0} Poin</p>
                  <div className="mt-3 w-full bg-slate-50 rounded-xl p-2 text-[9px] text-slate-400 flex justify-around">
                    <span>{top3[1].completedJobsCount || 0} Task</span>
                    <span>•</span>
                    <span>Lv. {top3[1].level || 1}</span>
                  </div>
                </div>
              )}

              {/* Rank 1 Podium (Tallest) */}
              {top3[0] && (
                <div className="flex flex-col items-center gap-2 order-1 md:order-2 w-full md:w-52 bg-white border border-pink-200/80 rounded-2xl p-5 shadow-md text-center relative ring-4 ring-pink-100/50">
                  <Crown className="h-6 w-6 text-amber-500 absolute -top-4 left-1/2 -translate-x-1/2 drop-shadow-md" />
                  <div className="absolute top-3 left-3 h-6 w-6 rounded-full bg-amber-400 flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                    #1
                  </div>
                  <div className="relative mx-auto h-16 w-16 rounded-full border-3 border-amber-400 p-0.5 bg-amber-50">
                    <AvatarImage src={top3[0].avatar} name={top3[0].name} className="h-full w-full rounded-full object-cover" />
                  </div>
                  <h4 className="text-xs font-black text-slate-850 line-clamp-1 mt-2">{top3[0].name}</h4>
                  <p className="text-sm font-black text-pink-600">{top3[0].points || 0} Poin</p>
                  <div className="mt-3 w-full bg-pink-50/50 rounded-xl p-2 text-[9px] text-pink-500 font-bold flex justify-around border border-pink-100/30">
                    <span>{top3[0].completedJobsCount || 0} Task</span>
                    <span>•</span>
                    <span>Lv. {top3[0].level || 1}</span>
                  </div>
                </div>
              )}

              {/* Rank 3 Podium */}
              {top3[2] && (
                <div className="flex flex-col items-center gap-2 order-3 md:order-3 w-full md:w-48 bg-white border border-[#F3E8F4] rounded-2xl p-4 shadow-xs text-center relative">
                  <div className="absolute top-3 left-3 h-6 w-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
                    #3
                  </div>
                  <div className="relative mx-auto h-12 w-12 rounded-full border-2 border-amber-700/60">
                    <AvatarImage src={top3[2].avatar} name={top3[2].name} className="h-full w-full rounded-full object-cover" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1 mt-2">{top3[2].name}</h4>
                  <p className="text-[10px] font-black text-pink-500">{top3[2].points || 0} Poin</p>
                  <div className="mt-3 w-full bg-slate-50 rounded-xl p-2 text-[9px] text-slate-400 flex justify-around">
                    <span>{top3[2].completedJobsCount || 0} Task</span>
                    <span>•</span>
                    <span>Lv. {top3[2].level || 1}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ranks 4+ List layout as Cards */}
          <div className="space-y-3">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2">Daftar Peringkat</p>
            {ranksList.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">Penerjemah lain akan muncul di sini.</div>
            ) : (
              ranksList.map((tr, idx) => {
                const rankNum = idx + 4;
                const tier = getBadge(tr.points || 0, rankNum);
                const TierIcon = tier.Icon;
                const xpProgress = (tr.points || 0) % 100;

                return (
                  <div
                    key={tr.id}
                    className="bg-white rounded-2xl border border-[#F3E8F4] p-4.5 shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Rank Chip */}
                      <span className="font-extrabold font-mono text-slate-400 text-xs w-6 shrink-0 text-center">
                        #{rankNum}
                      </span>
                      {/* Avatar */}
                      <AvatarImage src={tr.avatar} name={tr.name} className="h-9 w-9 rounded-xl object-cover shrink-0" />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{tr.name}</h4>
                        <p className="text-[10px] text-slate-450 mt-0.5">
                          Level {tr.level || 1} • {tr.languages.join(', ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5 justify-between sm:justify-end">
                      {/* XP Progress indicator */}
                      <div className="hidden md:flex flex-col w-28 text-[9px] text-slate-400">
                        <div className="flex justify-between font-mono mb-1 font-bold">
                          <span>Level Progress</span>
                          <span>{xpProgress}/100 XP</span>
                        </div>
                        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-pink-500 rounded-full" style={{ width: `${xpProgress}%` }} />
                        </div>
                      </div>

                      {/* Tier Badge badge */}
                      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase shrink-0 ${tier.color}`}>
                        <TierIcon className="h-3 w-3" />
                        <span>{tier.label}</span>
                      </div>

                      {/* Points count */}
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-pink-600 block font-mono">{tr.points || 0} Pt</span>
                        <span className="text-[8px] text-slate-400 uppercase font-extrabold block tracking-wider">Score</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
