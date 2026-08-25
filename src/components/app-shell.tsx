"use client";

import Link from "next/link";
import Image from "next/image";
import { BarChart3, BookOpenCheck, CalendarDays, Home, MonitorPlay, PanelLeftClose, PanelLeftOpen, Tags } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SyncStatus } from "@/components/sync-status";
import { useAppStore } from "@/store/app-store";

const items = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/phrases", label: "Activités", icon: BookOpenCheck },
  { href: "/seances", label: "Séances", icon: CalendarDays },
  { href: "/progression", label: "Progression", icon: BarChart3 },
  { href: "/parametres/codes", label: "Codes", icon: Tags },
  { href: "/classe", label: "Ouvrir Classe", icon: MonitorPlay }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { hydrated } = useAppStore();
  const [sidebarHidden, setSidebarHidden] = useState(false);

  useEffect(() => {
    setSidebarHidden(window.localStorage.getItem("alinea-history-sidebar-hidden") === "true");
  }, []);

  function toggleSidebar() {
    setSidebarHidden((hidden) => {
      const next = !hidden;
      window.localStorage.setItem("alinea-history-sidebar-hidden", String(next));
      return next;
    });
  }

  if (!hydrated && pathname !== "/connexion") {
    return (
      <div className="app-loading-screen">
        <div className="app-loading-indicator" />
        <span>Chargement d’Alinéa - Activités d’histoire…</span>
      </div>
    );
  }

  if (pathname.startsWith("/presentation/") || pathname.startsWith("/portail") || pathname.startsWith("/classe")) {
    return <>{children}</>;
  }

  return (
    <div className={`app-shell ${sidebarHidden ? "sidebar-hidden" : ""}`}>
      <aside className="sidebar">
        <button type="button" className="sidebar-toggle" onClick={toggleSidebar} aria-label="Cacher la navigation">
          <PanelLeftClose size={18} />
        </button>
        <div className="brand">
          <Image className="brand-mark" src="/alinea-icon.svg" alt="" width={42} height={42} aria-hidden="true" />
          <div>
            <strong>Alinéa</strong>
            <span>Activités d’histoire</span>
          </div>
        </div>

        <nav aria-label="Navigation principale">
          {items.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link className={`nav-link ${active ? "active" : ""}`} href={href} key={href}>
                <Icon size={20} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <SyncStatus />
        </div>
      </aside>

      {sidebarHidden && (
        <button type="button" className="sidebar-restore" onClick={toggleSidebar} aria-label="Afficher la navigation">
          <PanelLeftOpen size={20} />
        </button>
      )}

      <div className="page-area">
        <header className="mobile-header">
          <strong>Activités d’histoire</strong>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
