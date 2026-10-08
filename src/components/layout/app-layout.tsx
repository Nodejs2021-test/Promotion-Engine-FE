import { BookOpenIcon, ChevronsUpDownIcon, HistoryIcon, LogOutIcon, MegaphoneIcon, PlugIcon, ShieldIcon, type LucideIcon } from 'lucide-react';
import { Suspense } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger, useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/features/auth/auth-context';
import { OrgLogo } from '@/components/shared/org-logo';
import { APP_NAME, useSetupStatus } from '@/lib/setup';
import { ThemeToggle } from './theme-toggle';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  permission?: string;
}

const NAV: { label: string; items: NavItem[] }[] = [
  { label: 'Rules plannings', items: [{ to: '/campaigns', label: 'Campaigns', icon: MegaphoneIcon }] },
  { label: 'Integration', items: [{ to: '/sales-orders', label: 'Sales Orders', icon: PlugIcon }] },
  {
    label: 'Admin',
    items: [
      { to: '/audit', label: 'Audit / History', icon: HistoryIcon },
      { to: '/admin', label: 'Administration', icon: ShieldIcon, permission: 'users:manage' },
    ],
  },
  { label: 'Help', items: [{ to: '/how-it-works', label: 'How It Works', icon: BookOpenIcon }] },
];

const initials = (name?: string) => (name || '?').split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

function NavLinks() {
  const { can } = useAuth();
  const { pathname } = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();
  const matches = (to: string) => (to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`));
  return (
    <>
      {NAV.map((group) => {
        const items = group.items.filter((i) => !i.permission || can(i.permission));
        if (!items.length) return null;
        return (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="label-mono h-7 px-3 text-[11px] text-sidebar-primary/75">{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {items.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={matches(item.to)} tooltip={item.label}
                      className="relative h-9 rounded-lg px-3 text-sm text-sidebar-foreground/80 transition-colors duration-200 before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-sidebar-primary before:opacity-0 before:transition-opacity hover:bg-white/6 hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-sidebar-accent-foreground data-[active=true]:before:opacity-100">
                      <NavLink to={item.to} onClick={() => isMobile && setOpenMobile(false)}>
                        <item.icon aria-hidden className="opacity-70 group-data-[active=true]/menu-button:text-sidebar-primary group-data-[active=true]/menu-button:opacity-100" />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        );
      })}
    </>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="rounded-xl border border-sidebar-border bg-white/4 hover:bg-white/8 data-[state=open]:bg-sidebar-accent">
              <Avatar className="size-8 rounded-lg ring-2 ring-sidebar-primary/60">
                <AvatarFallback className="bg-gold-gradient rounded-lg font-semibold text-[#2a1d05]">{initials(user?.full_name)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.full_name}</span>
                <span className="truncate text-xs text-sidebar-foreground/60">{user?.role_label || user?.role}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-(--radix-dropdown-menu-trigger-width) min-w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="text-sm font-medium">{user?.full_name}</div>
              <div className="text-xs text-muted-foreground">@{user?.username}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              <LogOutIcon /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export default function AppLayout() {
  const org = useSetupStatus().data?.organization_name;
  return (
    <SidebarProvider>
      <Sidebar collapsible="offcanvas">
        <SidebarHeader className="border-b border-sidebar-border px-4 pt-5 pb-4">
          <NavLink to="/sales-orders" className="block rounded-xl focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none" aria-label={`${org || APP_NAME} home`}>
            <span className="flex min-h-[54px] items-center justify-center rounded-xl bg-[#fbf8f1] px-3 py-2.5 text-[#1f2a24] shadow-[0_6px_20px_-6px_rgb(0_0_0/0.45)] ring-1 ring-sidebar-primary/40">
              <OrgLogo className="h-[30px]" />
            </span>
            <span className="label-mono mt-3 block text-center text-sidebar-primary">{APP_NAME}</span>
          </NavLink>
        </SidebarHeader>
        <SidebarContent className="gap-1 px-1 py-3">
          <NavLinks />
        </SidebarContent>
        <SidebarFooter>
          <UserMenu />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-brand/20 bg-background/85 px-4 backdrop-blur-md md:px-8">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>
        <div className="min-w-0 flex-1 px-4 py-5 md:px-8 md:py-7">
          <Suspense fallback={<div className="grid h-64 place-items-center"><Spinner className="size-6" /></div>}>
            <Outlet />
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
