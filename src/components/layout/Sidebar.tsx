import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
  Package,
  LayoutDashboard,
  ClipboardList,
  Users,
  LogOut,
  ChevronLeft,
  Menu,
  Settings,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ThemeToggle } from '@/components/ThemeToggle';

const navItems = [
  {
    titleKey: 'nav.dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'staff'],
  },
  {
    titleKey: 'nav.inventory',
    href: '/inventory',
    icon: Package,
    roles: ['admin'],
  },
  {
    titleKey: 'nav.stock_entry',
    href: '/stock-entry',
    icon: ClipboardList,
    roles: ['admin', 'staff'],
  },
  {
    titleKey: 'nav.audit_history',
    href: '/audit-history',
    icon: FileText,
    roles: ['admin'],
  },
  {
    titleKey: 'nav.users',
    href: '/users',
    icon: Users,
    roles: ['admin'],
  },
  {
    titleKey: 'nav.settings',
    href: '/settings',
    icon: Settings,
    roles: ['admin', 'staff'],
  },
];

export default function Sidebar() {
  const { user, role, signOut } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(role || 'staff')
  );

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 md:hidden"
        onClick={() => setCollapsed(!collapsed)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Overlay for mobile */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300',
          collapsed ? '-translate-x-full md:translate-x-0 md:w-20' : 'w-64',
          'md:relative md:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
              <Package className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="text-lg font-semibold">EstoqueApp</span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="hidden h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent md:flex"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft
              className={cn(
                'h-4 w-4 transition-transform',
                collapsed && 'rotate-180'
              )}
            />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
                onClick={() => setCollapsed(true)}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{t(item.titleKey)}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Quick Settings (collapsed view) */}
        {!collapsed && (
          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center justify-center gap-2">
              <LanguageSelector variant="compact" />
              <ThemeToggle variant="compact" />
            </div>
          </div>
        )}

        {/* User info */}
        <div className="border-t border-sidebar-border p-4">
          <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium uppercase">
              {user?.email?.charAt(0) || 'U'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{user?.email}</p>
                <p className="text-xs text-sidebar-foreground/60 capitalize">
                  {role || t('common.loading')}
                </p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            className={cn(
              'mt-3 w-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              collapsed && 'px-0'
            )}
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">{t('nav.logout')}</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}
