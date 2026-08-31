"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useUser } from "./UserProvider";

export default function Nav() {
  const { user, loading, logout } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const links = [
    { href: "/", label: "Inicio" },
    { href: "/games", label: "Biblioteca" },
    { href: "/hall", label: "Salón de la Fama" },
    { href: "/about", label: "Acerca de" },
  ];

  const isActive = (href: string) => {
    if (href === "/games")
      return pathname === "/games" || pathname.startsWith("/games/");
    if (href === "/") return pathname === "/";
    return pathname === href;
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    setDropdownOpen(false);
    setOpen(false);
    router.push("/");
    router.refresh();
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
            <Link
              key={l.href}
              href={l.href}
              className={isActive(l.href) ? "active" : ""}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="spacer" />

        <div className="coin-counter">
          <div className="coin" />
          <span>CRÉDITOS · 03</span>
        </div>

        {loading ? (
          <div className="nav-auth-skeleton" />
        ) : user ? (
          <div className="nav-dropdown" ref={dropdownRef}>
            <button
              className="btn ghost auth-btn nav-user-btn"
              onClick={() => setDropdownOpen((v) => !v)}
            >
              <img
                className="nav-avatar"
                src={
                  user.avatar_url ??
                  `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(user.email)}`
                }
                alt={user.display_name}
                width={28}
                height={28}
              />
              <span className="nav-username">{user.display_name}</span>
              <span>▾</span>
            </button>
            {dropdownOpen && (
              <div className="nav-dropdown-menu">
                <Link
                  href="/auth"
                  className="nav-dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  Perfil
                </Link>
                <button className="nav-dropdown-item" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
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

      <div
        className={`av-mobile-backdrop${open ? " open" : ""}`}
        onClick={() => setOpen(false)}
      />
      <aside className={`av-mobile-panel${open ? " open" : ""}`}>
        <div
          className="pixel neon-cyan"
          style={{ fontSize: 11, marginBottom: 16 }}
        >
          MENÚ
        </div>
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
        {user ? (
          <>
            <Link
              href="/auth"
              className={pathname === "/auth" ? "active" : ""}
              onClick={() => setOpen(false)}
            >
              Perfil
            </Link>
            <button
              className="btn ghost"
              style={{ textAlign: "left", fontSize: "10px", marginTop: "8px" }}
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          </>
        ) : (
          <Link
            href="/auth"
            className={pathname === "/auth" ? "active" : ""}
            onClick={() => setOpen(false)}
          >
            Iniciar Sesión
          </Link>
        )}
        <div style={{ flex: 1 }} />
        <div
          className="pixel"
          style={{
            fontSize: 9,
            color: "var(--ink-faint)",
            letterSpacing: "0.16em",
          }}
        >
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
