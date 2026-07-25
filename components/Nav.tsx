"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useUser } from "./UserProvider";

export default function Nav() {
  const { user, logout } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: "Inicio" },
    { href: "/games", label: "Biblioteca" },
    { href: "/hall", label: "Salón de la Fama" },
    { href: "/about", label: "Acerca de" },
  ];

  const isActive = (href: string) => {
    if (href === "/games") return pathname === "/games" || pathname.startsWith("/games/");
    if (href === "/") return pathname === "/";
    return pathname === href;
  };

  function handleLogout() {
    logout();
    setOpen(false);
    router.push("/");
  }

  return (
    <>
      <nav className="av-nav">
        <Link href="/" className="logo">
          <div className="logo-mark" />
          <div className="logo-text">
            <span className="neon-cyan">ARCADE </span>
            <span className="neon-magenta">VAULT</span>
          </div>
        </Link>

        <div className="links">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={isActive(l.href) ? "active" : ""}>
              {l.label}
            </Link>
          ))}
        </div>

        <div className="spacer" />

        <div className="coin-counter">
          <div className="coin" />
          <span>CRÉDITOS · 03</span>
        </div>

        {user ? (
          <button className="btn ghost auth-btn" onClick={handleLogout}>
            {user.name} ▾
          </button>
        ) : (
          <Link href="/auth" className="auth-btn">
            <button className="btn">Iniciar Sesión</button>
          </Link>
        )}

        <button
          className="btn ghost hamburger"
          onClick={() => setOpen(true)}
          aria-label="Menú"
        >
          ≡
        </button>
      </nav>

      <div className={`av-mobile-backdrop${open ? " open" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`av-mobile-panel${open ? " open" : ""}`}>
        <div className="pixel neon-cyan" style={{ fontSize: 11, marginBottom: 16 }}>MENÚ</div>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={isActive(l.href) ? "active" : ""}
            onClick={() => setOpen(false)}
          >
            {l.label}
          </Link>
        ))}
        <Link
          href="/auth"
          className={pathname === "/auth" ? "active" : ""}
          onClick={() => setOpen(false)}
        >
          {user ? "Cuenta" : "Iniciar Sesión"}
        </Link>
        <div style={{ flex: 1 }} />
        <div className="pixel" style={{ fontSize: 9, color: "var(--ink-faint)", letterSpacing: "0.16em" }}>
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
