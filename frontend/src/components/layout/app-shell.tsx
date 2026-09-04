'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { useAuth } from '@/providers/auth-provider';
import { useTheme } from '@/providers/theme-provider';
import { LayoutDashboard, Building2, Bell, Users, Settings, Menu, X, LogOut, Search, ScrollText, Sun, Moon, ChevronDown, UserCircle, HelpCircle, PanelLeftClose, PanelLeftOpen, ChevronsLeft, Sparkles, Info, Boxes, Truck } from 'lucide-react';
import { DEPLOYMENT_LABEL } from '@/lib/app-meta';
import { roleColor, roleLabel } from '@/lib/roles';

/* ─────────────── nav config ─────────────── */

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'sales', 'designer', 'leadership'] },
  { label: 'Organization', href: '/organization', icon: Building2, roles: ['admin', 'manager', 'leadership'] },
  { label: 'Customers', href: '/customers', icon: Building2, roles: ['admin', 'manager', 'sales', 'leadership'] },
  { label: 'Suppliers', href: '/suppliers', icon: Truck, roles: ['admin', 'manager', 'leadership'] },
  { label: 'Items', href: '/items', icon: Boxes, roles: ['admin', 'manager', 'designer', 'leadership'] },
];

const adminItems = [
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: ScrollText },
];

const supportItems = [
  { label: 'Help & FAQ', href: '/help', icon: HelpCircle },
  { label: "What's New", href: '/about/release-notes', icon: Sparkles },
  { label: 'About', href: '/about', icon: Info },
];

const mobileNavItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'sales', 'designer', 'leadership'] },
  { label: 'Organization', href: '/organization', icon: Building2, roles: ['admin', 'manager', 'leadership'] },
  { label: 'Customers', href: '/customers', icon: Building2, roles: ['admin', 'manager', 'sales', 'leadership'] },
  { label: 'Suppliers', href: '/suppliers', icon: Truck, roles: ['admin', 'manager', 'leadership'] },
  { label: 'Items', href: '/items', icon: Boxes, roles: ['admin', 'manager', 'designer', 'leadership'] },
];

const themeOptions = [
  { value: 'light' as const, icon: Sun, label: 'Light' },
  { value: 'dark' as const, icon: Moon, label: 'Dark' },
];

/* ─────────────── helpers ─────────────── */

function initials(first = '', last = '') {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

function RoleChip({ role }: { role: string }) {
  return <span className={clsx('inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold capitalize', roleColor(role))}>{roleLabel(role)}</span>;
}

/* ─────────────── MachineIQ wordmark ─────────────── */

function Wordmark({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 shadow-sm">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="7" height="9" rx="1.5" />
          <rect x="15" y="3" width="7" height="5" rx="1.5" />
          <rect x="15" y="12" width="7" height="9" rx="1.5" />
          <rect x="2" y="16" width="7" height="5" rx="1.5" />
          <line x1="9" y1="7" x2="15" y2="7" />
          <line x1="9" y1="19" x2="15" y2="19" />
        </svg>
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <p className="text-[15px] font-bold tracking-tight text-fg leading-none">
            Machine<span className="text-brand-600">IQ</span>
          </p>
          <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-widest text-fg-muted">ERP Platform</p>
          <p className="mt-1 truncate font-mono text-[9px] text-fg-muted" title="Application version and deployed Git commit">{DEPLOYMENT_LABEL}</p>
        </div>
      )}
    </div>
  );
}

/* ─────────────── ProfileDropdown ─────────────── */

function ProfileDropdown({ user, theme, setTheme, logout, onClose }: { user: any; theme: string; setTheme: (t: any) => void; logout: () => void; onClose: () => void }) {
  return (
    <div className={clsx('absolute right-0 top-[calc(100%+8px)] z-[120] w-[300px] rounded-xl border border-border bg-surface shadow-xl', 'ring-1 ring-black/5 dark:ring-white/5')} style={{ animation: 'dropdown-in 120ms ease-out' }}>
      {/* User header */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white shadow">{initials(user?.firstName, user?.lastName)}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-fg">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="truncate text-xs text-fg-muted">{user?.email}</p>
            <div className="mt-1.5">
              <RoleChip role={user?.role ?? ''} />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border" />

      <div className="px-1.5 py-1.5">
        <p className="px-2.5 pb-1 pt-0.5 text-[10px] font-bold uppercase tracking-widest text-fg-muted">Account</p>
        {[
          { icon: UserCircle, label: 'My Profile', href: '/settings' },
          { icon: Settings, label: 'Account Settings', href: '/settings' },
        ].map(({ icon: Icon, label, href }) => (
          <Link key={label} href={href} onClick={onClose} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-fg-secondary transition-colors hover:bg-surface-secondary hover:text-fg">
            <Icon className="h-4 w-4 text-fg-tertiary" />
            {label}
          </Link>
        ))}
      </div>

      <div className="border-t border-border" />

      <div className="px-1.5 py-1.5">
        <p className="px-2.5 pb-2 pt-0.5 text-[10px] font-bold uppercase tracking-widest text-fg-muted">Appearance</p>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-secondary p-1">
          {themeOptions.map((opt) => (
            <button key={opt.value} onClick={() => setTheme(opt.value)} className={clsx('flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all duration-150', theme === opt.value ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg-secondary')}>
              <opt.icon className="h-3.5 w-3.5" />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border" />

      <div className="px-1.5 py-1.5">
        <div className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px] text-fg-muted">
          <span>MachineIQ</span>
          <span className="font-mono font-semibold text-fg-secondary">{DEPLOYMENT_LABEL}</span>
        </div>
      </div>

      <div className="border-t border-border" />

      <div className="px-1.5 py-1.5">
        <button
          onClick={() => {
            logout();
            onClose();
          }}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/20"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

/* ─────────────── NavLink (sidebar) ─────────────── */

function NavLink({ item, active, collapsed, onClick }: { item: { label: string; href: string; icon: React.ElementType }; active: boolean; collapsed: boolean; onClick?: () => void }) {
  return (
    <Link href={item.href} onClick={onClick} title={collapsed ? item.label : undefined} className={clsx('group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150', collapsed && 'justify-center px-2', active ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300' : 'text-fg-secondary hover:bg-surface-secondary hover:text-fg')}>
      {/* Active indicator pill */}
      {active && !collapsed && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-brand-600" />}
      <item.icon className={clsx('shrink-0 transition-colors', collapsed ? 'h-5 w-5' : 'h-[17px] w-[17px]', active ? 'text-brand-600 dark:text-brand-400' : 'text-fg-tertiary group-hover:text-fg-secondary')} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

/* ─────────────── AppShell ─────────────── */

export default function AppShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const isAdmin = user?.role === 'admin';
  const role = user?.role ?? '';
  const visibleNavItems = navItems.filter((item) => item.roles.includes(role));
  const visibleMobileNavItems = mobileNavItems.filter((item) => item.roles.includes(role));

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [profileOpen]);

  useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-dvh overflow-hidden bg-surface-secondary dark:bg-[#0b0f19]">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ══════════════════════════════════════
          SIDEBAR  — deep slate dark
      ══════════════════════════════════════ */}
      <aside className={clsx('flex flex-col bg-surface border-r border-border', 'transition-all duration-300 ease-in-out', 'fixed inset-y-0 left-0 z-50 w-[260px]', 'md:static md:z-auto', collapsed ? 'md:w-[68px]' : 'md:w-[240px]', sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0 md:shadow-none')}>
        {/* Brand */}
        <div className={clsx('flex h-[58px] shrink-0 items-center justify-between border-b border-border px-4', collapsed && 'md:justify-center md:px-2')}>
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <Wordmark collapsed={collapsed} />
          </Link>

          {/* Collapse toggle — desktop */}
          <button onClick={() => setCollapsed(!collapsed)} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="hidden md:flex items-center justify-center rounded-md p-1.5 text-fg-muted hover:bg-surface-secondary hover:text-fg transition-colors">
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>

          {/* Close — mobile */}
          <button onClick={() => setSidebarOpen(false)} className="flex rounded-md p-1.5 text-fg-muted hover:bg-surface-secondary hover:text-fg md:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-scroll flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {/* Core */}
          {!collapsed && <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-fg-muted">Core</p>}
          {visibleNavItems.map((item) => (
            <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} collapsed={collapsed} onClick={() => setSidebarOpen(false)} />
          ))}

          {/* Administration */}
          {isAdmin && (
            <div className="pt-5">
              {!collapsed && <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-fg-muted">Administration</p>}
              {collapsed && <div className="my-2 border-t border-border" />}
              {adminItems.map((item) => (
                <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} collapsed={collapsed} onClick={() => setSidebarOpen(false)} />
              ))}
            </div>
          )}

          {/* Support */}
          <div className="pt-5">
            {!collapsed && <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-fg-muted">Support</p>}
            {collapsed && <div className="my-2 border-t border-border" />}
            {supportItems.map((item) => (
              <NavLink key={item.href} item={item} active={pathname === item.href} collapsed={collapsed} onClick={() => setSidebarOpen(false)} />
            ))}
          </div>
        </nav>
      </aside>

      {/* ══════════════════════════════════════
          MAIN COLUMN
      ══════════════════════════════════════ */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="relative z-[100] flex h-[58px] shrink-0 items-center justify-between border-b border-border bg-surface/95 backdrop-blur-sm px-4 lg:px-5 shadow-sm">
          {/* Left */}
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile */}
            <button onClick={() => setSidebarOpen(true)} className="flex items-center justify-center rounded-md p-2 text-fg-muted hover:bg-surface-secondary hover:text-fg md:hidden">
              <Menu className="h-5 w-5" />
            </button>

            {/* Search bar — desktop */}
            <button className="hidden items-center gap-2 rounded-lg border border-border bg-surface-secondary/80 px-3 py-2 text-sm text-fg-muted transition-colors hover:border-border-strong hover:bg-surface-secondary lg:flex lg:w-60 xl:w-72">
              <Search className="h-3.5 w-3.5 shrink-0 text-fg-muted" />
              <span className="flex-1 text-left text-fg-muted">Search anything…</span>
              <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-bold text-fg-muted">⌘K</kbd>
            </button>

            {/* Search icon — tablet */}
            <button className="hidden items-center justify-center rounded-md p-2 text-fg-muted hover:bg-surface-secondary hover:text-fg md:flex lg:hidden">
              <Search className="h-[18px] w-[18px]" />
            </button>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5">
            {/* Notifications */}
            <Link href="/notifications" className="relative flex h-9 w-9 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-surface-secondary hover:text-fg-secondary">
              <Bell className="h-[18px] w-[18px]" />
            </Link>

            <div className="h-5 w-px bg-border mx-0.5" />

            {/* Profile trigger */}
            <div ref={profileRef} className="relative">
              <button onClick={() => setProfileOpen((o) => !o)} className={clsx('flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-all duration-150', profileOpen ? 'bg-surface-secondary shadow-sm ring-1 ring-border-strong' : 'hover:bg-surface-secondary')}>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-[11px] font-bold text-white shadow-sm">{initials(user?.firstName, user?.lastName)}</div>
                <div className="hidden text-left sm:block">
                  <p className="text-[13px] font-semibold text-fg leading-none">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="mt-0.5 text-[11px] text-fg-muted capitalize leading-none">{roleLabel(user?.role ?? '')}</p>
                </div>
                <ChevronDown className={clsx('hidden h-3.5 w-3.5 text-fg-muted transition-transform duration-150 sm:block', profileOpen && 'rotate-180')} />
              </button>

              {profileOpen && <ProfileDropdown user={user} theme={theme} setTheme={setTheme} logout={logout} onClose={() => setProfileOpen(false)} />}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="relative z-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-5 py-6 pb-24 md:px-6 md:py-7 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur-sm md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex h-[60px] items-stretch">
          {visibleMobileNavItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={clsx('flex flex-1 flex-col items-center justify-center gap-1 transition-colors duration-150', active ? 'text-brand-600' : 'text-fg-muted')}>
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
