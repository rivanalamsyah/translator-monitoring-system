import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Users,
  FileText,
  Clock,
  BarChart3,
  Settings,
  CheckCircle2,
  User,
  PieChart,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Download,
  X,
  Trophy,
  Bell,
} from 'lucide-react';
import { AvatarImage } from './AvatarImage';
import logoImg from '../../assets/logo.png';

// ── Types ─────────────────────────────────────────────────────────────────────
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

// ── LocalStorage key ──────────────────────────────────────────────────────────
const SIDEBAR_STORAGE_KEY = 'tms_sidebar_state';

function getSavedSidebarState(): boolean {
  try {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (saved !== null) return JSON.parse(saved);
  } catch { /* ignore */ }
  return true; // default: expanded
}

// ── Tooltip wrapper ───────────────────────────────────────────────────────────
const Tooltip = ({ label, children }: { label: string; children: React.ReactNode; key?: React.Key }) => (
  <div className="relative group/tip">
    {children}
    <div
      className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[60]
        opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 delay-75"
      role="tooltip"
    >
      <div className="relative bg-slate-800 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
        {label}
        <span className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-slate-800" />
      </div>
    </div>
  </div>
);

// ── Main Sidebar component ────────────────────────────────────────────────────
export const Sidebar: React.FC = () => {
  const {
    currentRole,
    adminTab,
    setAdminTab,
    translatorTab,
    setTranslatorTab,
    currentTranslatorProfile,
    logout,
    setIsNotificationDrawerOpen,
    notifications,
  } = useApp();

  const [isExpanded, setIsExpanded] = useState<boolean>(getSavedSidebarState);

  // PWA install prompt
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installBannerDismissed, setInstallBannerDismissed] = useState(() => {
    try { return localStorage.getItem('tms_pwa_banner_dismissed') === 'true'; } catch { return false; }
  });

  // ── PWA: capture install prompt ──
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const installedHandler = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener('appinstalled', installedHandler);

    // Check if already running as standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setIsInstalled(true);
    }
  };

  const dismissInstallBanner = () => {
    setInstallBannerDismissed(true);
    try { localStorage.setItem('tms_pwa_banner_dismissed', 'true'); } catch { /* ignore */ }
  };

  const showInstallButton = !!installPrompt && !isInstalled && !installBannerDismissed;

  // ── Persist sidebar state ──
  useEffect(() => {
    try { localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(isExpanded)); } catch { /* ignore */ }
  }, [isExpanded]);

  // ── Nav items ──
  const adminNavItems: NavItem[] = [
    { id: 'dashboard',    label: 'Dashboard',             icon: LayoutDashboard },
    { id: 'assignments',  label: 'Task',                  icon: FileText        },
    { id: 'translators',  label: 'Translator',            icon: Users           },
    { id: 'leaderboard',  label: 'Leaderboard',           icon: Trophy          },
    { id: 'reports',      label: 'Laporan',               icon: BarChart3       },
    { id: 'settings',     label: 'Pengaturan',            icon: Settings        },
  ];

  const translatorNavItems: NavItem[] = [
    { id: 'dashboard',    label: 'Dashboard',                    icon: LayoutDashboard },
    { id: 'tasks',        label: 'Task',                         icon: FileText        },
    { id: 'leaderboard',  label: 'Leaderboard',                  icon: Trophy          },
    { id: 'profile',      label: 'Profil',                       icon: User            },
  ];

  const items      = currentRole === 'ADMIN' ? adminNavItems : translatorNavItems;
  const currentTab = currentRole === 'ADMIN' ? adminTab      : translatorTab;
  const setTab     = currentRole === 'ADMIN' ? setAdminTab   : setTranslatorTab;
  const isAdmin    = currentRole === 'ADMIN';
  const displayName = isAdmin ? 'Super Admin' : currentTranslatorProfile?.name;
  const displayRole = isAdmin
    ? 'Administrator Sistem'
    : `Penerjemah • ${currentTranslatorProfile?.languages?.join(', ')}`;

  const handleNavClick = (id: string) => { setTab(id); };

  // ── Shared sidebar inner content ──────────────────────────────────────────
  const SidebarInner = ({ collapsed }: { collapsed?: boolean }) => (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Logo */}
      <div className={`flex items-center shrink-0 border-b border-slate-100
        ${collapsed ? 'justify-center px-3 py-[14px]' : 'px-4 py-[14px] gap-2'}`}
      >
        <img
          src={logoImg}
          alt="Master Translate"
          className={`object-contain transition-all duration-300 ${collapsed ? 'h-7' : 'h-8'}`}
        />
        {!collapsed && (
          <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-auto hidden md:block">
            {isAdmin ? 'Admin' : 'Penerjemah'}
          </span>
        )}
      </div>

      {/* Profile card */}
      <div className={`shrink-0 border-b border-slate-100 ${collapsed ? 'px-2 py-2.5' : 'px-3 py-3'}`}>
        <div className={`rounded-xl bg-gradient-to-br from-pink-50 to-fuchsia-50
          border border-pink-100/70 ${collapsed ? 'p-2 flex justify-center' : 'p-3'}`}
        >
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
            <div className="relative shrink-0">
              <AvatarImage
                src={isAdmin ? undefined : currentTranslatorProfile?.avatar}
                name={isAdmin ? 'Admin' : currentTranslatorProfile?.name}
                gender={isAdmin ? 'male' : 'auto'}
                className="h-8 w-8 rounded-full object-cover ring-2 ring-pink-400/30"
              />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden min-w-0">
                <p className="truncate text-[12px] font-bold text-slate-800 leading-tight">{displayName}</p>
                <p className="truncate text-[10px] text-pink-500 mt-0.5 leading-tight font-medium">{displayRole}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nav section label */}
      {!collapsed && (
        <div className="px-5 pt-4 pb-1.5">
          <span className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
            {isAdmin ? 'Navigasi Utama' : 'Ruang Kerja'}
          </span>
        </div>
      )}
      {collapsed && <div className="py-2" />}

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-2" aria-label="Main navigation">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          const btn = (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
              className={`
                w-full flex items-center rounded-xl transition-all duration-150
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-1
                ${collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'}
                ${isActive
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-200'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }
              `}
            >
              <Icon className={`h-[18px] w-[18px] shrink-0 transition-colors
                ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`}
              />
              {!collapsed && (
                <span className={`text-[12px] font-semibold truncate ${isActive ? 'text-white' : ''}`}>
                  {item.label}
                </span>
              )}
            </button>
          );

          return collapsed
            ? <Tooltip key={item.id} label={item.label}>{btn}</Tooltip>
            : <div key={item.id}>{btn}</div>;
        })}
      </nav>

      {/* PWA Install Button */}
      {showInstallButton && (
        <div className={`shrink-0 border-t border-slate-100 pt-2 pb-1 ${collapsed ? 'px-2' : 'px-3'}`}>
          {collapsed ? (
            <Tooltip label="Install Aplikasi">
              <button
                onClick={handleInstall}
                aria-label="Install aplikasi"
                className="w-full flex justify-center items-center p-2.5 rounded-xl
                  bg-gradient-to-r from-violet-500 to-purple-500 text-white
                  shadow-md shadow-purple-200 hover:shadow-lg hover:shadow-purple-300
                  transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
              >
                <Download className="h-[18px] w-[18px]" />
              </button>
            </Tooltip>
          ) : (
            <div className="rounded-xl border border-purple-100 bg-gradient-to-br from-violet-50 to-purple-50 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wider">
                  Install Aplikasi
                </span>
                <button
                  onClick={dismissInstallBanner}
                  aria-label="Tutup"
                  className="text-purple-300 hover:text-purple-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mb-2.5 leading-relaxed">
                Install ke perangkat untuk akses cepat & mode offline.
              </p>
              <button
                onClick={handleInstall}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg
                  bg-gradient-to-r from-violet-500 to-purple-600 text-white text-[11px] font-bold
                  shadow-sm shadow-purple-200 hover:shadow-md hover:shadow-purple-300
                  transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
              >
                <Download className="h-3.5 w-3.5" />
                Install Sekarang
              </button>
            </div>
          )}
        </div>
      )}

      {/* Logout */}
      <div className={`shrink-0 border-t border-slate-100 py-2.5 px-2`}>
        {collapsed ? (
          <Tooltip label="Keluar Sesi">
            <button
              onClick={() => logout()}
              aria-label="Keluar Sesi"
              className="w-full flex justify-center items-center p-2.5 rounded-xl
                text-rose-500 hover:bg-rose-50 hover:text-rose-600
                transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </Tooltip>
        ) : (
          <button
            onClick={() => logout()}
            aria-label="Keluar Sesi"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
              text-rose-500 hover:bg-rose-50 hover:text-rose-600
              transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            <span className="text-[12px] font-semibold">Keluar Sesi</span>
          </button>
        )}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════════
          MOBILE: Sticky top bar — replaces floating button (no overlap issue)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14
        bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm
        flex items-center px-4 justify-between"
      >
        <img src={logoImg} alt="Master Translate" className="h-7 w-auto object-contain" />

        <div className="flex items-center gap-3.5">
          {/* Notification Button */}
          <button
            onClick={() => setIsNotificationDrawerOpen(true)}
            className="p-1 text-slate-500 hover:text-pink-600 transition-colors relative cursor-pointer"
            aria-label="Notifikasi"
          >
            <Bell className="h-4.5 w-4.5" />
            {notifications.filter((n) => !n.read).length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2 rounded-full bg-rose-500 ring-1 ring-white" />
            )}
          </button>

          {/* Settings Button (Admin Only) */}
          {isAdmin && (
            <button
              onClick={() => setAdminTab('settings')}
              className={`p-1 transition-colors cursor-pointer ${
                adminTab === 'settings' ? 'text-pink-600 font-bold' : 'text-slate-500 hover:text-pink-600'
              }`}
              aria-label="Pengaturan"
            >
              <Settings className="h-4.5 w-4.5" />
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={() => logout()}
            className="p-1 text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
            aria-label="Keluar Sesi"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          DESKTOP: Collapsible sidebar
          ═══════════════════════════════════════════════════════════════════════ */}
      <aside
        aria-label="Sidebar navigasi"
        aria-expanded={isExpanded}
        className={`
          hidden md:flex flex-col shrink-0
          bg-white border-r border-slate-200/80
          sticky top-0 h-screen
          transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          overflow-hidden
          ${isExpanded ? 'w-[240px]' : 'w-[68px]'}
        `}
        style={{ willChange: 'width' }}
      >
        <SidebarInner collapsed={!isExpanded} />

        {/* Desktop collapse/expand toggle — docked to right edge */}
        <button
          onClick={() => setIsExpanded(p => !p)}
          aria-label={isExpanded ? 'Ciutkan sidebar' : 'Perluas sidebar'}
          title={isExpanded ? 'Ciutkan sidebar' : 'Perluas sidebar'}
          className="absolute bottom-24 -right-3 z-10
            flex items-center justify-center h-6 w-6 rounded-full
            bg-white border border-slate-200 shadow-md
            text-slate-500 hover:text-pink-600 hover:border-pink-300 hover:bg-pink-50
            transition-all duration-200
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
        >
          {isExpanded
            ? <ChevronLeft className="h-3.5 w-3.5" />
            : <ChevronRight className="h-3.5 w-3.5" />
          }
        </button>
      </aside>
    </>
  );
};
