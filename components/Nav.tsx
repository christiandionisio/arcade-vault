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
    { href: "/", label: "BIBLIOTECA" },
    { href: "/hall", label: "SALÓN" },
  ];

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
          <span className="logo-text neon-cyan">ARCADE VAULT</span>
        </Link>

        <div className="links">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={pathname === l.href ? "active" : ""}>
              {l.label}
            </Link>
          ))}
        </div>

        <div className="spacer" />

        <div className="coin-counter">
          <div className="coin" />
          <span>00</span>
        </div>

        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }} className="auth-btn">
            <span className="pixel" style={{ fontSize: "9px", color: "var(--cyan)", letterSpacing: "0.1em" }}>
              {user.name}
            </span>
            <button className="btn ghost" style={{ padding: "8px 14px", fontSize: "9px" }} onClick={handleLogout}>
              SALIR
            </button>
          </div>
        ) : (
          <Link href="/auth" className="auth-btn">
            <span className="btn" style={{ padding: "10px 16px", fontSize: "9px" }}>INICIAR SESIÓN</span>
          </Link>
        )}

        <button
          className="hamburger btn ghost"
          style={{ padding: "8px 12px", fontSize: "11px" }}
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
        >
          ☰
        </button>
      </nav>

      <div className={`av-mobile-backdrop${open ? " open" : ""}`} onClick={() => setOpen(false)} />
      <div className={`av-mobile-panel${open ? " open" : ""}`}>
        <button
          className="btn ghost"
          style={{ alignSelf: "flex-end", padding: "8px 12px", fontSize: "11px", marginBottom: "8px" }}
          onClick={() => setOpen(false)}
        >
          ✕
        </button>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={pathname === l.href ? "active" : ""}
            onClick={() => setOpen(false)}
          >
            {l.label}
          </Link>
        ))}
        <div className="divider" />
        {user ? (
          <>
            <span className="pixel" style={{ fontSize: "9px", color: "var(--cyan)", padding: "14px 12px" }}>
              {user.name}
            </span>
            <button className="btn ghost" onClick={handleLogout} style={{ marginTop: "8px" }}>
              CERRAR SESIÓN
            </button>
          </>
        ) : (
          <Link href="/auth" className={pathname === "/auth" ? "active" : ""} onClick={() => setOpen(false)}>
            INICIAR SESIÓN
          </Link>
        )}
      </div>
    </>
  );
}
