"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import {
  ChevronsUpDown,
  Lock,
  LogOut,
  Menu,
  Monitor,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  UserRound,
  CornerDownLeft,
  Database,
} from "lucide-react";
import { NAV, allNavItems, type NavItem } from "./nav";
import { Kbd } from "@/components/ui/primitives";
import { RoleBadge } from "@/components/ui/status";
import type { Permission, Role } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/components/ui/use-local-storage";
import { FytMark, FytWordmark } from "@/components/brand/fyt";
import { solarIcon } from "@/components/icons/solar";
import { UiIcon } from "@/components/icons/ui-icon";
import { logout } from "@/app/(auth)/login/actions";

export interface ShellViewer {
  name: string;
  email: string;
  role: Role;
  permissions: Permission[];
}

export function AppShell({
  viewer,
  badges,
  demo,
  children,
}: {
  viewer: ShellViewer;
  badges: { bookingsAttention: number };
  demo: boolean;
  children: React.ReactNode;
}) {
  const [collapsedPref, setCollapsedPref] = useLocalStorage("tp-nav-collapsed", "0", ["0", "1"] as const);
  const collapsed = collapsedPref === "1";
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const pathname = usePathname();
  const toggleCollapsed = React.useCallback(() => setCollapsedPref(collapsed ? "0" : "1"), [collapsed, setCollapsedPref]);

  // Close the mobile menu after navigating.
  const [lastPath, setLastPath] = React.useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobileOpen(false);
  }

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        toggleCollapsed();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleCollapsed]);

  const perms = new Set(viewer.permissions);
  const current = allNavItems()
    .filter((i) => (i.href === "/" ? pathname === "/" : pathname === i.href || pathname.startsWith(i.href + "/")))
    .sort((a, b) => b.href.length - a.href.length)[0];

  const sidebar = (
    <Sidebar
      viewer={viewer}
      perms={perms}
      badges={badges}
      collapsed={collapsed}
      pathname={pathname}
      onToggle={toggleCollapsed}
      onSearch={() => setPaletteOpen(true)}
    />
  );

  return (
    <Tooltip.Provider delayDuration={250}>
      <div className="flex min-h-[100dvh] bg-paper">
        <div
          className={cn(
            "sticky top-0 hidden h-[100dvh] shrink-0 bg-[linear-gradient(180deg,var(--nav-bg),var(--nav-bg-2))] text-nav-ink transition-[width] duration-200 ease-[var(--ease-out-quart)] lg:block",
            collapsed ? "w-[64px]" : "w-[256px]",
          )}
        >
          {sidebar}
        </div>

        <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-[#0B1530]/40 data-[state=open]:animate-fade-in lg:hidden" />
            <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-[272px] bg-[linear-gradient(180deg,var(--nav-bg),var(--nav-bg-2))] text-nav-ink shadow-[var(--shadow-overlay)] data-[state=open]:animate-fade-in lg:hidden">
              <Dialog.Title className="sr-only">Navigation</Dialog.Title>
              <Dialog.Description className="sr-only">Console sections</Dialog.Description>
              <Sidebar
                viewer={viewer}
                perms={perms}
                badges={badges}
                collapsed={false}
                pathname={pathname}
                onSearch={() => {
                  setMobileOpen(false);
                  setPaletteOpen(true);
                }}
              />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur-[10px] backdrop-saturate-150 sm:px-6">
            <button
              onClick={() => setMobileOpen(true)}
              className={cn(iconBtn, "lg:hidden")}
              aria-label="Open navigation"
            >
              <Menu className="size-5" strokeWidth={1.5} />
            </button>
            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-meta text-ink-3">
              <span className="hidden truncate sm:inline">Console</span>
              <span className="hidden sm:inline" aria-hidden>
                /
              </span>
              <span className="truncate font-semibold text-ink">{current?.label ?? (pathname.startsWith("/credits") ? "Credits & licences" : "Profile")}</span>
            </nav>
            <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2">
              {demo ? (
                <span
                  title="Figures come from seeded demo records, not live Firebase data."
                  className="hidden h-7 items-center gap-1.5 rounded-full bg-info-soft px-2.5 text-caption font-medium text-on-info-soft md:inline-flex"
                >
                  <Database className="size-3.5" strokeWidth={1.75} aria-hidden />
                  Demo data
                </span>
              ) : null}
              <button
                onClick={() => setPaletteOpen(true)}
                className="group hidden h-[38px] max-w-[420px] flex-1 items-center gap-2 rounded-[10px] border border-line bg-paper px-3 text-meta text-ink-3 transition-[border-color,color,background-color] duration-150 ease-[var(--ease-out-quart)] hover:border-line-strong hover:text-ink-2 md:flex"
              >
                <UiIcon name="search" className="size-4 transition-colors duration-150 group-hover:text-ink-2" />
                Search pages and actions…
                <span className="ml-auto flex gap-1">
                  <Kbd>⌘</Kbd>
                  <Kbd>K</Kbd>
                </span>
              </button>
              <ThemeMenu />
              <AccountMenu viewer={viewer} />
            </div>
          </header>
          <main id="main" className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
            {/* Page enter (NXT dm-fade): replays on each route change. */}
            <div key={pathname} className="animate-page">
              {children}
            </div>
          </main>
        </div>

        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} perms={perms} />
      </div>
    </Tooltip.Provider>
  );
}

function Sidebar({
  viewer,
  perms,
  badges,
  collapsed,
  pathname,
  onToggle,
  onSearch,
}: {
  viewer: ShellViewer;
  perms: Set<Permission>;
  badges: { bookingsAttention: number };
  collapsed: boolean;
  pathname: string;
  onToggle?: () => void;
  onSearch: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 shrink-0 items-center gap-2.5 border-b border-nav-line", collapsed ? "justify-center px-0" : "px-4")}>
        <FytMark tone="onDark" className="h-[30px] w-auto shrink-0" />
        {!collapsed ? (
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <FytWordmark tone="onDark" className="h-[15px] w-auto" />
            <span className="inline-flex h-6 items-center rounded-full border border-white/16 bg-white/12 px-2.5 text-caption font-medium text-white">
              {viewer.role === "owner" ? "Owner" : viewer.role === "superadmin" ? "Super admin" : "Admin"}
            </span>
          </div>
        ) : null}
      </div>

      <nav aria-label="Console" className="nav-scroll flex-1 overflow-y-auto px-3 py-4">
        {collapsed ? null : (
          <button
            onClick={onSearch}
            className="mb-3 flex h-9 w-full items-center gap-2 rounded-[10px] bg-white/10 px-3 text-meta text-nav-ink transition-colors hover:bg-white/16 hover:text-white md:hidden"
          >
            <UiIcon name="search" className="size-4" /> Search
          </button>
        )}
        {NAV.map((group, gi) => {
          const items = group.items.filter((item) => {
            if (perms.has(item.permission)) return true;
            // show grantable-but-locked modules so admins know they exist
            const def = PERMISSIONS.find((p) => p.key === item.permission);
            return def?.minRole === "admin";
          });
          if (!items.length) return null;
          return (
            <div key={gi} className={cn(gi > 0 && "mt-4")}>
              {group.heading && !collapsed ? (
                <p className="mb-1.5 px-3 text-micro font-medium uppercase tracking-[0.1em] text-nav-ink-muted">{group.heading}</p>
              ) : gi > 0 && collapsed ? (
                <div className="mx-3 mb-2 border-t border-nav-line" />
              ) : null}
              <ul className="flex flex-col gap-0.5">
                {items.map((item) => (
                  <li key={item.href}>
                    <NavLink
                      item={item}
                      locked={!perms.has(item.permission)}
                      active={item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + "/")}
                      collapsed={collapsed}
                      badge={item.badgeKey ? badges[item.badgeKey] : undefined}
                    />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className={cn("border-t border-nav-line p-3", collapsed && "flex flex-col items-center gap-2")}>
        {!collapsed ? (
          <div className="mb-2 flex items-center gap-2.5 rounded-[10px] bg-white/8 px-2 py-2">
            <span
              aria-hidden
              className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-caption font-semibold text-[#1E4FB8]"
            >
              {initials(viewer.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-meta font-medium text-white">{viewer.name}</p>
              <RoleBadge role={viewer.role} onDark className="mt-1 h-5 px-2 text-caption" />
            </div>
          </div>
        ) : null}
        {onToggle ? (
          <button
            onClick={onToggle}
            className={cn(
              "flex h-9 items-center gap-2 rounded-[10px] border border-white/18 bg-white/12 text-meta text-white transition-[background-color,transform] duration-150 hover:-translate-y-px hover:bg-white/18",
              collapsed ? "w-9 justify-center" : "w-full px-3",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="size-4" strokeWidth={1.5} /> : <PanelLeftClose className="size-4" strokeWidth={1.5} />}
            {!collapsed ? (
              <>
                Collapse <span className="ml-auto flex gap-1"><NavKbd>⌘</NavKbd><NavKbd>\</NavKbd></span>
              </>
            ) : null}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function NavLink({
  item,
  active,
  locked,
  collapsed,
  badge,
}: {
  item: NavItem;
  active: boolean;
  locked: boolean;
  collapsed: boolean;
  badge?: number;
}) {
  const Icon = item.icon;
  const permLabel = PERMISSIONS.find((p) => p.key === item.permission)?.label;
  const inner = (
    <>
      <span className="relative">
        <Icon
          className={cn(
            "size-[18px] shrink-0 transition-[color,transform] duration-150 ease-[var(--ease-out-quart)]",
            active ? "text-current" : "text-current group-hover:scale-105",
          )}
          strokeWidth={1.6}
          aria-hidden
        />
        {collapsed && badge ? <span className="absolute -right-1 -top-1 size-2 rounded-full bg-[#7FD3FF] ring-2 ring-nav-bg" /> : null}
      </span>
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
      {!collapsed && locked ? <Lock className="ml-auto size-3.5 text-white/45" strokeWidth={1.75} aria-label="Locked" /> : null}
      {!collapsed && !locked && badge ? (
        <span
          className={cn(
            "num ml-auto min-w-6 rounded-full px-1.5 text-center text-caption font-medium leading-5",
            active ? "bg-nav-active-ink text-nav-active-bg" : "bg-white/18 text-white",
          )}
        >
          {badge}
        </span>
      ) : null}
    </>
  );
  const cls = cn(
    "group relative flex h-9 items-center gap-2.5 rounded-[10px] text-meta font-medium",
    "transition-[background-color,color,box-shadow] duration-150 ease-[var(--ease-out-quart)]",
    collapsed ? "w-10 justify-center mx-auto" : "px-3",
    // NXT: the active item is a white pill with blue text and a soft drop.
    active
      ? "bg-nav-active-bg font-semibold text-nav-active-ink shadow-[0_6px_16px_-8px_rgb(0_0_0/0.45)]"
      : "text-nav-ink hover:bg-nav-hover hover:text-white active:scale-[0.98]",
    locked && "text-white/45 hover:bg-transparent hover:text-white/45 active:scale-100",
  );

  const node = locked ? (
    <span className={cn(cls, "cursor-not-allowed")} aria-disabled>
      {inner}
    </span>
  ) : (
    <Link href={item.href} className={cls} aria-current={active ? "page" : undefined}>
      {inner}
    </Link>
  );

  if (!collapsed && !locked) return node;
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{node}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="right"
          sideOffset={8}
          className="z-50 max-w-[240px] rounded-[var(--radius-control)] border border-line bg-raised px-2.5 py-1.5 text-meta text-ink shadow-[var(--shadow-overlay)] data-[state=delayed-open]:animate-fade-in"
        >
          {locked ? (
            <>
              <span className="font-medium">{item.label} is locked.</span>{" "}
              <span className="text-ink-2">Needs the “{permLabel}” permission. Ask a super admin.</span>
            </>
          ) : (
            item.label
          )}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

const menuContent =
  "z-50 min-w-[200px] rounded-[var(--radius-panel)] border border-line bg-raised p-1 shadow-[var(--shadow-overlay)] data-[state=open]:animate-rise";
const menuItem =
  "flex h-9 cursor-pointer select-none items-center gap-2 rounded-[8px] px-2.5 text-meta text-ink outline-none data-[highlighted]:bg-sunken";

/* 38px topbar icon button: paper fill, hairline, 1px lift on hover. */
const iconBtn =
  "grid size-[38px] shrink-0 place-items-center rounded-[10px] border border-line bg-paper text-ink-2 " +
  "transition-[transform,border-color,color] duration-150 ease-[var(--ease-out-quart)] hover:-translate-y-px hover:border-ink/40 hover:text-ink";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function NavKbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] border border-white/20 bg-white/10 px-1 font-mono text-caption leading-none text-white/80">
      {children}
    </kbd>
  );
}

function ThemeMenu() {
  const [theme, choose] = useLocalStorage("tp-theme", "light", ["light", "dark", "system"] as const);
  // Sync the saved choice to the document (external system), following OS changes in "system".
  React.useEffect(() => {
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
    };
    apply();
    if (theme !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);
  const Icon = theme === "dark" ? Moon : theme === "system" ? Monitor : Sun;
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label="Theme"
        className={iconBtn}
      >
        <Icon className="size-[18px]" strokeWidth={1.5} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={6} className={menuContent}>
          {([
            ["light", "Light", Sun],
            ["dark", "Dark", Moon],
            ["system", "Match system", Monitor],
          ] as const).map(([k, label, I]) => (
            <DropdownMenu.Item key={k} className={menuItem} onSelect={() => choose(k)}>
              <I className="size-4 text-ink-2" strokeWidth={1.5} /> {label}
              {theme === k ? <span className="ml-auto size-1.5 rounded-full bg-accent" /> : null}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function AccountMenu({ viewer }: { viewer: ShellViewer }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-2.5 transition-[border-color,transform] duration-150 hover:-translate-y-px hover:border-ink/40">
        <span aria-hidden className="grid size-[30px] place-items-center rounded-full bg-accent text-caption font-semibold text-accent-ink">
          {initials(viewer.name)}
        </span>
        <span className="hidden min-w-0 text-left leading-tight sm:block">
          <span className="block max-w-[140px] truncate text-caption font-semibold text-ink">{viewer.name}</span>
          <span className="block text-caption text-ink-3">
            {viewer.role === "owner" ? "Owner" : viewer.role === "superadmin" ? "Super admin" : "Admin"}
          </span>
        </span>
        <ChevronsUpDown className="size-3.5 text-ink-3" strokeWidth={1.75} aria-hidden />
        <span className="sr-only">Account menu</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={8} className={cn(menuContent, "w-64 rounded-[14px]")}>
          <div className="px-2 py-2">
            <p className="truncate text-meta font-medium text-ink">{viewer.name}</p>
            <p className="num truncate text-caption text-ink-3">{viewer.email}</p>
            <RoleBadge role={viewer.role} className="mt-2" />
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <DropdownMenu.Item asChild className={menuItem}>
            <Link href="/profile">
              <UserRound className="size-4 text-ink-2" strokeWidth={1.5} /> Profile & security
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className={menuItem}>
            <Link href="/credits">
              <UiIcon name="certificate" className="size-4 text-ink-2" /> Credits & licences
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <DropdownMenu.Item className={cn(menuItem, "text-bad")} onSelect={() => void logout()}>
            <LogOut className="size-4" strokeWidth={1.5} /> Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function CommandPalette({
  open,
  onOpenChange,
  perms,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  perms: Set<Permission>;
}) {
  const router = useRouter();
  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };
  const pages = allNavItems().filter((i) => perms.has(i.permission));
  const actions: Array<{ label: string; href: string; perm: Permission; hint: string; icon: React.ElementType }> = [
    { label: "Review bookings that need action", href: "/bookings?view=attention", perm: "bookings", hint: "Bookings", icon: solarIcon("checklist-minimalistic-bold-duotone") },
    { label: "Add a course or project", href: "/courses?new=1", perm: "courses", hint: "Catalog", icon: solarIcon("document-add-bold-duotone") },
    { label: "Add an institute", href: "/institutes?new=1", perm: "institutes", hint: "Catalog", icon: solarIcon("buildings-2-bold-duotone") },
    { label: "Add a trainer, mentor or consultant", href: "/providers?new=1", perm: "providers", hint: "Catalog", icon: solarIcon("square-academic-cap-2-bold-duotone") },
    { label: "Send a broadcast", href: "/broadcasts?new=1", perm: "notifications", hint: "Audience", icon: solarIcon("plain-2-bold-duotone") },
    { label: "Invite an operator", href: "/team?invite=1", perm: "team", hint: "Team", icon: solarIcon("user-plus-rounded-bold-duotone") },
  ];
  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command palette"
      overlayClassName="fixed inset-0 z-40 bg-[#0B1530]/40 animate-fade-in"
      contentClassName="fixed left-1/2 top-[14vh] z-50 w-[calc(100%-2rem)] max-w-[560px] -translate-x-1/2 overflow-hidden rounded-[var(--radius-overlay)] border border-line bg-raised shadow-[var(--shadow-overlay)] animate-rise"
    >
      <div className="flex items-center gap-2.5 border-b border-line px-4">
        <UiIcon name="search" className="size-4 shrink-0 text-ink-3" />
        <Command.Input
          placeholder="Jump to a page or action"
          className="h-12 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-3"
        />
      </div>
      <Command.List className="max-h-[min(52vh,400px)] overflow-y-auto overscroll-contain p-1.5 [scrollbar-width:thin]">
        <Command.Empty className="flex flex-col items-center gap-1 px-3 py-10 text-center">
          <span className="text-meta font-medium text-ink">No match</span>
          <span className="text-meta text-ink-2">No page or action matches that.</span>
        </Command.Empty>
        <Command.Group heading="Pages" className={paletteGroup}>
          {pages.map((p) => (
            <Command.Item key={p.href} value={`page ${p.label}`} onSelect={() => go(p.href)} className={paletteItem}>
              <p.icon className={paletteIcon} strokeWidth={1.5} aria-hidden />
              {p.label}
              <CornerDownLeft className={paletteEnter} strokeWidth={1.75} aria-hidden />
            </Command.Item>
          ))}
        </Command.Group>
        <Command.Group heading="Actions" className={cn("mt-1", paletteGroup)}>
          {actions
            .filter((a) => perms.has(a.perm))
            .map((a) => (
              <Command.Item key={a.href} value={`action ${a.label}`} onSelect={() => go(a.href)} className={paletteItem}>
                <a.icon className={paletteIcon} strokeWidth={1.5} aria-hidden />
                <span className="truncate">{a.label}</span>
                <span className="ml-auto shrink-0 text-caption text-ink-3 group-data-[selected=true]:hidden">{a.hint}</span>
                <CornerDownLeft className={paletteEnter} strokeWidth={1.75} aria-hidden />
              </Command.Item>
            ))}
        </Command.Group>
      </Command.List>
      {/* The keys that drive the palette, where an operator can see them. */}
      <div className="flex items-center gap-4 border-t border-line bg-sunken/50 px-4 py-2 text-caption text-ink-3">
        <span className="flex items-center gap-1.5">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd> Move
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>↵</Kbd> Open
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <Kbd>Esc</Kbd> Close
        </span>
      </div>
    </Command.Dialog>
  );
}

const paletteGroup =
  "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-micro [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-ink-3";
const paletteItem =
  "group flex h-9 cursor-pointer select-none items-center gap-2.5 rounded-[8px] px-2.5 text-body text-ink " +
  "transition-colors duration-100 ease-[var(--ease-out-quart)] data-[selected=true]:bg-accent-soft";
const paletteIcon =
  "size-4 shrink-0 text-ink-3 transition-colors duration-100 group-data-[selected=true]:text-[var(--accent)]";
const paletteEnter =
  "ml-auto hidden size-3.5 shrink-0 text-ink-3 group-data-[selected=true]:block";
